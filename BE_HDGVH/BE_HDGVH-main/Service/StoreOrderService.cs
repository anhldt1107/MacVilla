using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class StoreOrderService(
    BeContext db,
    AfterSalesQuantityService afterSalesQuantity,
    NotificationBusinessEmitter notificationEmitter) : IStoreOrderService
{
    public async Task<StoreOrderPreviewResponseDto> PreviewAsync(
        int customerId,
        StoreOrderCheckoutDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        await ValidateShippingAddressOptionalAsync(customerId, dto.ShippingAddressId, cancellationToken);

        var (lines, merchandise) = await ResolveCartLinesStrictAsync(customerId, cancellationToken);
        var (discount, voucherId, voucherCode) = await ResolveVoucherAsync(dto.VoucherCode, merchandise, cancellationToken);

        return new StoreOrderPreviewResponseDto
        {
            Lines = lines,
            MerchandiseSubtotal = merchandise,
            DiscountAmount = discount,
            PayableTotal = Math.Max(0, merchandise - discount),
            VoucherId = voucherId,
            VoucherCode = voucherCode
        };
    }

    public async Task<StoreOrderDetailDto> CreateAsync(
        int customerId,
        StoreOrderCheckoutDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!dto.ShippingAddressId.HasValue)
            throw new ArgumentException("Vui lòng chọn địa chỉ giao hàng.");
        if (string.IsNullOrWhiteSpace(dto.PaymentMethod))
            throw new ArgumentException("Vui lòng chọn phương thức thanh toán.");

        await EnsureB2CAsync(customerId, cancellationToken);
        await ValidateShippingAddressRequiredAsync(customerId, dto.ShippingAddressId.Value, cancellationToken);

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var cart = await db.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.CustomerId == customerId, cancellationToken);

            if (cart is null || cart.Items.Count == 0)
                throw new InvalidOperationException("Giỏ hàng trống.");

            var variantIds = cart.Items.Select(i => i.VariantId).Distinct().ToList();
            var variants = await db.ProductVariants
                .Include(v => v.Product)
                .Where(v => variantIds.Contains(v.Id))
                .ToDictionaryAsync(v => v.Id, cancellationToken);

            var invMap = await db.Inventories.AsNoTracking()
                .Where(i => variantIds.Contains(i.VariantId))
                .ToDictionaryAsync(i => i.VariantId, i => i.QuantityAvailable, cancellationToken);

            decimal merchandise = 0;
            var previewLines = new List<StoreOrderPreviewLineDto>();
            foreach (var ci in cart.Items)
            {
                if (!variants.TryGetValue(ci.VariantId, out var v))
                    throw new InvalidOperationException("Có sản phẩm không còn tồn tại.");
                if (!string.Equals(v.Product.Status, ProductStatus.Active, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException($"Sản phẩm \"{v.Product.Name}\" không còn bán.");

                var avail = invMap.GetValueOrDefault(v.Id, 0);
                if (ci.Quantity > avail)
                    throw new InvalidOperationException($"Không đủ tồn cho SKU {v.Sku} (còn {avail}).");

                var unit = v.RetailPrice;
                var lineTot = unit * ci.Quantity;
                merchandise += lineTot;
                previewLines.Add(new StoreOrderPreviewLineDto
                {
                    VariantId = v.Id,
                    Sku = v.Sku,
                    ProductName = v.Product.Name,
                    VariantName = v.VariantName,
                    ImageUrl = v.ImageUrl,
                    Quantity = ci.Quantity,
                    UnitPrice = unit,
                    LineSubtotal = lineTot
                });
            }

            var (discount, voucherEntity) = await ResolveVoucherTrackedAsync(dto.VoucherCode, merchandise, cancellationToken);
            var payable = Math.Max(0, merchandise - discount);

            var orderCode = await StoreOrderCodes.GenerateUniqueAsync(db.CustomerOrders, cancellationToken);
            var order = new CustomerOrder
            {
                OrderCode = orderCode,
                CustomerId = customerId,
                ShippingAddressId = dto.ShippingAddressId,
                PaymentMethod = dto.PaymentMethod.Trim(),
                PaymentStatus = "Unpaid",
                OrderStatus = IsPayOsCheckoutMethod(dto.PaymentMethod) ? "AwaitingPayment" : "New",
                VoucherId = voucherEntity?.Id,
                CreatedAt = DateTime.UtcNow,
                MerchandiseTotal = merchandise,
                DiscountTotal = discount,
                PayableTotal = payable
            };

            await db.CustomerOrders.AddAsync(order, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            foreach (var pl in previewLines)
            {
                await db.OrderItems.AddAsync(
                    new OrderItem
                    {
                        OrderId = order.Id,
                        VariantId = pl.VariantId,
                        SkuSnapshot = pl.Sku,
                        PriceSnapshot = pl.UnitPrice,
                        Quantity = pl.Quantity,
                        SubTotal = pl.LineSubtotal
                    },
                    cancellationToken);
            }

            if (voucherEntity is not null)
                voucherEntity.UsedCount++;

            db.ShoppingCartItems.RemoveRange(cart.Items);
            cart.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            await notificationEmitter.OnOrderCreatedAsync(order.Id, cancellationToken);

            return await GetMyOrderByCodeAsync(customerId, order.OrderCode, cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<PagedResultDto<StoreOrderListItemDto>> ListMyOrdersAsync(
        int customerId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = db.CustomerOrders.AsNoTracking().Where(o => o.CustomerId == customerId);
        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new StoreOrderListItemDto
            {
                OrderCode = o.OrderCode,
                CreatedAt = o.CreatedAt,
                OrderStatus = o.OrderStatus,
                PaymentStatus = o.PaymentStatus,
                PaymentMethod = o.PaymentMethod,
                LineCount = o.Items.Count,
                TotalAmount = o.PayableTotal > 0 ? o.PayableTotal : o.Items.Sum(i => i.SubTotal) - o.DiscountTotal
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<StoreOrderListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<StoreOrderDetailDto> GetMyOrderByCodeAsync(
        int customerId,
        string orderCode,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        var key = orderCode.Trim();
        if (key.Length == 0)
            throw new ArgumentException("Thiếu mã đơn.");

        var order = await db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Product)
            .Include(o => o.ShippingAddress)
            .Include(o => o.Voucher)
            .FirstOrDefaultAsync(
                o => o.CustomerId == customerId && o.OrderCode.ToLower() == key.ToLowerInvariant(),
                cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng");

        var lineSum = order.Items.Sum(i => i.SubTotal);
        var merch = order.MerchandiseTotal > 0 ? order.MerchandiseTotal : lineSum;
        var disc = order.DiscountTotal;
        var pay = order.PayableTotal > 0 ? order.PayableTotal : Math.Max(0, lineSum - disc);

        var dto = new StoreOrderDetailDto
        {
            OrderCode = order.OrderCode,
            CreatedAt = order.CreatedAt,
            OrderStatus = order.OrderStatus,
            PaymentStatus = order.PaymentStatus,
            PaymentMethod = order.PaymentMethod,
            VoucherCode = order.Voucher?.Code,
            ShippingAddress = order.ShippingAddress is null
                ? null
                : new StoreOrderShippingAddressDto
                {
                    Id = order.ShippingAddress.Id,
                    ReceiverName = order.ShippingAddress.ReceiverName,
                    ReceiverPhone = order.ShippingAddress.ReceiverPhone,
                    AddressLine = order.ShippingAddress.AddressLine
                },
            Lines = order.Items
                .OrderBy(i => i.Id)
                .Select(i => new StoreOrderDetailLineDto
                {
                    Id = i.Id,
                    VariantId = i.VariantId,
                    ProductName = i.Variant != null ? i.Variant.Product?.Name : null,
                    VariantName = i.Variant?.VariantName,
                    VariantImageUrl = i.Variant?.ImageUrl,
                    ProductImageUrl = i.Variant?.Product?.ImageUrl,
                    SkuSnapshot = i.SkuSnapshot,
                    Quantity = i.Quantity,
                    UnitPrice = i.PriceSnapshot,
                    SubTotal = i.SubTotal
                })
                .ToList(),
            MerchandiseSubtotal = merch,
            DiscountAmount = disc,
            PayableTotal = pay
        };

        var eligibility = await afterSalesQuantity.GetLineEligibilityForOrderAsync(order.Id, cancellationToken);
        foreach (var line in dto.Lines)
        {
            if (eligibility.TryGetValue(line.Id, out var e))
            {
                line.ReturnableQuantity = e.Returnable;
                line.WarrantyClaimableQuantity = e.Claimable;
            }
        }

        return dto;
    }

    public async Task<StoreOrderTimelineDto> GetTimelineAsync(
        int customerId,
        string orderCode,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        if (string.IsNullOrWhiteSpace(orderCode))
            throw new ArgumentException("Thiếu mã đơn.");

        var key = orderCode.Trim().ToLowerInvariant();
        var order = await db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.FulfillmentTickets)
            .Include(o => o.Invoices).ThenInclude(i => i.PaymentTransactions)
            .Include(o => o.ReturnExchangeTickets)
            .FirstOrDefaultAsync(o => o.CustomerId == customerId && o.OrderCode.ToLower() == key, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng");

        var events = new List<StoreOrderTimelineEventDto>
        {
            new()
            {
                EventType = "Order",
                Status = "Created",
                Description = "Đơn hàng được tạo",
                Timestamp = order.CreatedAt
            }
        };

        if (!string.Equals(order.OrderStatus, OrderStatuses.New, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(order.OrderStatus, OrderStatuses.AwaitingPayment, StringComparison.OrdinalIgnoreCase))
        {
            events.Add(new StoreOrderTimelineEventDto
            {
                EventType = "Order",
                Status = order.OrderStatus,
                Description = $"Trạng thái đơn: {order.OrderStatus}",
                Timestamp = order.CreatedAt
            });
        }

        foreach (var ticket in order.FulfillmentTickets.OrderBy(t => t.CreatedAt))
        {
            events.Add(new StoreOrderTimelineEventDto
            {
                EventType = "Fulfillment",
                Status = ticket.Status,
                Description = BuildFulfillmentDescription(ticket.Status, ticket.TicketType),
                Timestamp = ticket.UpdatedAt ?? ticket.CreatedAt,
                ReferenceId = ticket.Id,
                Notes = ticket.Notes
            });
        }

        foreach (var invoice in order.Invoices.OrderBy(i => i.IssueDate))
        {
            events.Add(new StoreOrderTimelineEventDto
            {
                EventType = "Invoice",
                Status = invoice.Status,
                Description = $"Hóa đơn {invoice.InvoiceNumber} — {invoice.Status}",
                Timestamp = invoice.IssueDate,
                ReferenceId = invoice.Id,
                Notes = invoice.TotalAmount.HasValue ? $"Total: {invoice.TotalAmount.Value:N0}" : null
            });

            foreach (var payment in invoice.PaymentTransactions.OrderBy(p => p.PaymentDate))
            {
                var isIncome = PaymentTransactionTypes.IsIncome(payment.TransactionType ?? string.Empty);
                events.Add(new StoreOrderTimelineEventDto
                {
                    EventType = "Payment",
                    Status = payment.TransactionType ?? "Payment",
                    Description = isIncome
                        ? $"Ghi nhận thanh toán {payment.Amount:N0} ({payment.PaymentMethod})"
                        : $"Hoàn tiền {payment.Amount:N0} ({payment.PaymentMethod})",
                    Timestamp = payment.PaymentDate,
                    ReferenceId = payment.Id,
                    Notes = payment.ReferenceCode
                });
            }
        }

        foreach (var ret in order.ReturnExchangeTickets.OrderBy(r => r.Id))
        {
            events.Add(new StoreOrderTimelineEventDto
            {
                EventType = "Return",
                Status = ret.Status,
                Description = $"Phiếu đổi/trả #{ret.Id} — {ret.Status}",
                Timestamp = ret.CreatedAt,
                ReferenceId = ret.Id
            });
        }

        return new StoreOrderTimelineDto
        {
            OrderCode = order.OrderCode,
            CurrentOrderStatus = order.OrderStatus,
            CurrentPaymentStatus = order.PaymentStatus,
            CreatedAt = order.CreatedAt,
            Events = events.OrderBy(e => e.Timestamp).ThenBy(e => e.EventType).ToList()
        };
    }

    public async Task<StoreOrderDetailDto> CancelAsync(
        int customerId,
        string orderCode,
        StoreOrderCancelDto? dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        if (string.IsNullOrWhiteSpace(orderCode))
            throw new ArgumentException("Thiếu mã đơn.");

        var key = orderCode.Trim().ToLowerInvariant();
        var order = await db.CustomerOrders
            .FirstOrDefaultAsync(o => o.CustomerId == customerId && o.OrderCode.ToLower() == key, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng");

        if (!OrderStatuses.CanCancel(order.OrderStatus))
        {
            throw new InvalidOperationException(
                $"Không thể hủy đơn ở trạng thái '{order.OrderStatus}'.");
        }

        order.OrderStatus = OrderStatuses.Cancelled;
        await db.SaveChangesAsync(cancellationToken);

        return await GetMyOrderByCodeAsync(customerId, order.OrderCode, cancellationToken);
    }

    public async Task<StoreOrderReorderResponseDto> ReorderAsync(
        int customerId,
        string orderCode,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        if (string.IsNullOrWhiteSpace(orderCode))
            throw new ArgumentException("Thiếu mã đơn.");

        var key = orderCode.Trim().ToLowerInvariant();
        var order = await db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(o => o.CustomerId == customerId && o.OrderCode.ToLower() == key, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng");

        var cart = await db.ShoppingCarts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId, cancellationToken);

        if (cart is null)
        {
            cart = new ShoppingCart
            {
                CustomerId = customerId,
                UpdatedAt = DateTime.UtcNow
            };
            await db.ShoppingCarts.AddAsync(cart, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }

        var variantIds = order.Items.Select(i => i.VariantId).Distinct().ToList();
        var invMap = await db.Inventories.AsNoTracking()
            .Where(i => variantIds.Contains(i.VariantId))
            .ToDictionaryAsync(i => i.VariantId, i => i.QuantityAvailable, cancellationToken);

        var added = new List<StoreOrderReorderItemDto>();
        var skipped = new List<StoreOrderReorderSkippedDto>();

        foreach (var item in order.Items)
        {
            var variant = item.Variant;
            if (variant is null)
            {
                skipped.Add(new StoreOrderReorderSkippedDto
                {
                    VariantId = item.VariantId,
                    Sku = item.SkuSnapshot,
                    RequestedQuantity = item.Quantity,
                    Reason = "SKU không còn tồn tại"
                });
                continue;
            }

            if (!string.Equals(variant.Product.Status, ProductStatus.Active, StringComparison.OrdinalIgnoreCase))
            {
                skipped.Add(new StoreOrderReorderSkippedDto
                {
                    VariantId = item.VariantId,
                    Sku = variant.Sku,
                    RequestedQuantity = item.Quantity,
                    Reason = "Sản phẩm ngừng bán"
                });
                continue;
            }

            var available = invMap.GetValueOrDefault(item.VariantId, 0);
            if (available <= 0)
            {
                skipped.Add(new StoreOrderReorderSkippedDto
                {
                    VariantId = item.VariantId,
                    Sku = variant.Sku,
                    RequestedQuantity = item.Quantity,
                    Reason = "Hết tồn kho"
                });
                continue;
            }

            var qtyToAdd = Math.Min(item.Quantity, available);
            var existing = cart.Items.FirstOrDefault(ci => ci.VariantId == item.VariantId);
            if (existing is not null)
            {
                existing.Quantity += qtyToAdd;
            }
            else
            {
                cart.Items.Add(new ShoppingCartItem
                {
                    ShoppingCartId = cart.Id,
                    VariantId = item.VariantId,
                    Quantity = qtyToAdd
                });
            }

            added.Add(new StoreOrderReorderItemDto
            {
                VariantId = item.VariantId,
                Sku = variant.Sku,
                Quantity = qtyToAdd
            });

            if (qtyToAdd < item.Quantity)
            {
                skipped.Add(new StoreOrderReorderSkippedDto
                {
                    VariantId = item.VariantId,
                    Sku = variant.Sku,
                    RequestedQuantity = item.Quantity - qtyToAdd,
                    Reason = $"Chỉ còn {available} — đã thêm tối đa theo tồn"
                });
            }
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return new StoreOrderReorderResponseDto
        {
            AddedItems = added,
            SkippedItems = skipped,
            Message = added.Count > 0
                ? $"Đã thêm {added.Count} SKU vào giỏ"
                : "Không có sản phẩm nào được thêm vào giỏ (xem danh sách skipped)."
        };
    }

    private static string BuildFulfillmentDescription(string status, string? ticketType)
    {
        var typeDesc = ticketType switch
        {
            "Pickup" => "lấy hàng",
            "Pack" => "đóng gói",
            "Ship" => "giao vận",
            _ => "xuất kho"
        };

        return status switch
        {
            FulfillmentStatuses.Pending => $"Phiếu {typeDesc} đang chờ xử lý",
            FulfillmentStatuses.Picking => "Đang lấy hàng",
            FulfillmentStatuses.Packed => "Đã đóng gói",
            FulfillmentStatuses.Shipped => "Đã giao cho vận chuyển",
            FulfillmentStatuses.Cancelled => $"Phiếu {typeDesc} đã hủy",
            _ => $"Phiếu {typeDesc}: {status}"
        };
    }

    private async Task EnsureB2CAsync(int customerId, CancellationToken cancellationToken)
    {
        var ok = await db.Customers.AsNoTracking()
            .AnyAsync(c => c.Id == customerId && c.CustomerType == CustomerTypes.B2C, cancellationToken);
        if (!ok)
            throw new KeyNotFoundException("Không tìm thấy tài khoản");
    }

    private async Task ValidateShippingAddressOptionalAsync(
        int customerId,
        int? addressId,
        CancellationToken cancellationToken)
    {
        if (!addressId.HasValue)
            return;
        var ok = await db.CustomerAddresses.AsNoTracking()
            .AnyAsync(a => a.Id == addressId && a.CustomerId == customerId, cancellationToken);
        if (!ok)
            throw new KeyNotFoundException("Không tìm thấy địa chỉ giao hàng.");
    }

    private Task ValidateShippingAddressRequiredAsync(
        int customerId,
        int addressId,
        CancellationToken cancellationToken) =>
        ValidateShippingAddressOptionalAsync(customerId, addressId, cancellationToken);

    private async Task<(List<StoreOrderPreviewLineDto> Lines, decimal Merchandise)> ResolveCartLinesStrictAsync(
        int customerId,
        CancellationToken cancellationToken)
    {
        var cart = await db.ShoppingCarts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId, cancellationToken);

        if (cart is null || cart.Items.Count == 0)
            throw new InvalidOperationException("Giỏ hàng trống.");

        var variantIds = cart.Items.Select(i => i.VariantId).Distinct().ToList();
        var variants = await db.ProductVariants
            .Include(v => v.Product)
            .Where(v => variantIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        var invMap = await db.Inventories.AsNoTracking()
            .Where(i => variantIds.Contains(i.VariantId))
            .ToDictionaryAsync(i => i.VariantId, i => i.QuantityAvailable, cancellationToken);

        decimal merchandise = 0;
        var lines = new List<StoreOrderPreviewLineDto>();
        foreach (var ci in cart.Items.OrderBy(i => i.Id))
        {
            if (!variants.TryGetValue(ci.VariantId, out var v))
                throw new InvalidOperationException("Có sản phẩm không còn tồn tại.");
            if (!string.Equals(v.Product.Status, ProductStatus.Active, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Sản phẩm \"{v.Product.Name}\" không còn bán.");

            var avail = invMap.GetValueOrDefault(v.Id, 0);
            if (ci.Quantity > avail)
                throw new InvalidOperationException($"Không đủ tồn cho SKU {v.Sku} (còn {avail}).");

            var unit = v.RetailPrice;
            var lineTot = unit * ci.Quantity;
            merchandise += lineTot;
            lines.Add(new StoreOrderPreviewLineDto
            {
                VariantId = v.Id,
                Sku = v.Sku,
                ProductName = v.Product.Name,
                VariantName = v.VariantName,
                ImageUrl = v.ImageUrl,
                Quantity = ci.Quantity,
                UnitPrice = unit,
                LineSubtotal = lineTot
            });
        }

        return (lines, merchandise);
    }

    private async Task<(decimal Discount, int? VoucherId, string? VoucherCode)> ResolveVoucherAsync(
        string? code,
        decimal merchandise,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code))
            return (0, null, null);

        var c = code.Trim();
        var voucher = await db.Vouchers
            .AsNoTracking()
            .Include(v => v.Campaign)
            .FirstOrDefaultAsync(v => v.Code.ToLower() == c.ToLowerInvariant(), cancellationToken);

        if (voucher is null)
            throw new KeyNotFoundException("Không tìm thấy mã giảm giá.");

        var now = DateTime.UtcNow;
        if (!VoucherComputation.IsEligible(voucher, now, out var reason))
            throw new InvalidOperationException(reason);
        if (!VoucherComputation.MeetsMinOrder(voucher, merchandise))
            throw new InvalidOperationException(
                $"Đơn chưa đạt giá trị tối thiểu ({voucher.MinOrderValue:N0}) để dùng voucher.");

        var discount = VoucherComputation.ComputeDiscount(merchandise, voucher);
        return (discount, voucher.Id, voucher.Code);
    }

    private async Task<(decimal Discount, Voucher? Voucher)> ResolveVoucherTrackedAsync(
        string? code,
        decimal merchandise,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code))
            return (0, null);

        var c = code.Trim();
        var voucher = await db.Vouchers
            .Include(v => v.Campaign)
            .FirstOrDefaultAsync(v => v.Code.ToLower() == c.ToLowerInvariant(), cancellationToken);

        if (voucher is null)
            throw new KeyNotFoundException("Không tìm thấy mã giảm giá.");

        var now = DateTime.UtcNow;
        if (!VoucherComputation.IsEligible(voucher, now, out var reason))
            throw new InvalidOperationException(reason);
        if (!VoucherComputation.MeetsMinOrder(voucher, merchandise))
            throw new InvalidOperationException(
                $"Đơn chưa đạt giá trị tối thiểu ({voucher.MinOrderValue:N0}) để dùng voucher.");

        var discount = VoucherComputation.ComputeDiscount(merchandise, voucher);
        return (discount, voucher);
    }

    private static bool IsPayOsCheckoutMethod(string? paymentMethod)
    {
        if (string.IsNullOrWhiteSpace(paymentMethod))
            return false;
        var m = paymentMethod.Trim();
        return string.Equals(m, "PayOS", StringComparison.OrdinalIgnoreCase)
               || m.Contains("payos", StringComparison.OrdinalIgnoreCase);
    }
}
