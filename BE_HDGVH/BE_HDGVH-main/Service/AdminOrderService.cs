using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminOrderService(
    BeContext db,
    WarrantyProvisioningService warrantyProvisioning,
    AfterSalesQuantityService afterSalesQuantity,
    NotificationBusinessEmitter notificationEmitter) : IAdminOrderService
{
    public async Task<PagedResultDto<AdminOrderListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? orderStatus = null,
        string? paymentStatus = null,
        int? customerId = null,
        int? salesId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.Sales)
            .Include(o => o.Items)
            .AsQueryable();

        // Filter by OrderStatus
        if (!string.IsNullOrWhiteSpace(orderStatus))
        {
            query = query.Where(o => o.OrderStatus == orderStatus);
        }

        // Filter by PaymentStatus
        if (!string.IsNullOrWhiteSpace(paymentStatus))
        {
            query = query.Where(o => o.PaymentStatus == paymentStatus);
        }

        // Filter by CustomerId
        if (customerId.HasValue)
        {
            query = query.Where(o => o.CustomerId == customerId.Value);
        }

        // Filter by SalesId
        if (salesId.HasValue)
        {
            query = query.Where(o => o.SalesId == salesId.Value);
        }

        // Filter by date range
        if (fromDate.HasValue)
        {
            query = query.Where(o => o.CreatedAt >= fromDate.Value);
        }
        if (toDate.HasValue)
        {
            var endDate = toDate.Value.Date.AddDays(1);
            query = query.Where(o => o.CreatedAt < endDate);
        }

        // Search by OrderCode, CustomerName, Phone
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower().Trim();
            query = query.Where(o =>
                o.OrderCode.ToLower().Contains(searchLower) ||
                o.Customer.FullName.ToLower().Contains(searchLower) ||
                (o.Customer.Phone != null && o.Customer.Phone.Contains(searchLower)) ||
                (o.Customer.Email != null && o.Customer.Email.ToLower().Contains(searchLower)));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new AdminOrderListItemDto
            {
                Id = o.Id,
                OrderCode = o.OrderCode,
                CreatedAt = o.CreatedAt,
                OrderStatus = o.OrderStatus,
                PaymentStatus = o.PaymentStatus,
                PaymentMethod = o.PaymentMethod,
                LineCount = o.Items.Count,
                MerchandiseTotal = o.MerchandiseTotal,
                DiscountTotal = o.DiscountTotal,
                PayableTotal = o.PayableTotal,
                CustomerId = o.CustomerId,
                CustomerName = o.Customer.FullName,
                CustomerPhone = o.Customer.Phone,
                CustomerEmail = o.Customer.Email,
                CustomerType = o.Customer.CustomerType,
                SalesId = o.SalesId,
                SalesName = o.Sales != null ? o.Sales.FullName : null
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminOrderListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task EnsureOrderAccessibleBySalesAsync(int orderId, int salesUserId, CancellationToken cancellationToken = default)
    {
        var row = await db.CustomerOrders.AsNoTracking()
            .Where(o => o.Id == orderId)
            .Select(o => new { o.SalesId })
            .FirstOrDefaultAsync(cancellationToken);

        if (row == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {orderId}");

        if (!row.SalesId.HasValue || row.SalesId.Value != salesUserId)
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập đơn hàng này.");
    }

    public async Task<AdminOrderDetailDto> GetByIdAsync(
        int id,
        string? actorRole = null,
        CancellationToken cancellationToken = default)
    {
        var order = await GetOrderWithDetailsAsync(o => o.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {id}");

        var dto = MapToDetailDto(order);
        await EnrichDetailWorkflowAsync(dto, order.Id, actorRole, cancellationToken);
        await EnrichAfterSalesLineQuantitiesAsync(dto, order.Id, cancellationToken);
        return dto;
    }

    public async Task<AdminOrderDetailDto> GetByCodeAsync(
        string orderCode,
        string? actorRole = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(orderCode))
            throw new ArgumentException("Mã đơn hàng không được để trống");

        var codeLower = orderCode.Trim().ToLower();
        var order = await GetOrderWithDetailsAsync(o => o.OrderCode.ToLower() == codeLower, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {orderCode}");

        var dto = MapToDetailDto(order);
        await EnrichDetailWorkflowAsync(dto, order.Id, actorRole, cancellationToken);
        await EnrichAfterSalesLineQuantitiesAsync(dto, order.Id, cancellationToken);
        return dto;
    }

    public async Task<AdminOrderWorkflowDto> GetWorkflowAsync(
        int id,
        string? actorRole = null,
        CancellationToken cancellationToken = default)
    {
        var order = await db.CustomerOrders.AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.FulfillmentTickets)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {id}");

        return BuildWorkflowSnapshot(order, actorRole);
    }

    public async Task<AdminOrderDetailDto> CreateAsync(
        AdminOrderCreateDto dto,
        int? salesId,
        CancellationToken cancellationToken = default)
    {
        // Validate customer
        var customer = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == dto.CustomerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy khách hàng");

        // Validate shipping address
        var address = await db.CustomerAddresses.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == dto.ShippingAddressId && a.CustomerId == dto.CustomerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy địa chỉ giao hàng");

        // Validate sales (if provided)
        if (salesId.HasValue)
        {
            var salesExists = await db.AppUsers.AnyAsync(u => u.Id == salesId.Value, cancellationToken);
            if (!salesExists)
                throw new KeyNotFoundException("Không tìm thấy nhân viên bán hàng");
        }

        // Validate lines
        if (dto.Lines == null || dto.Lines.Count == 0)
            throw new ArgumentException("Đơn hàng phải có ít nhất 1 sản phẩm");

        var variantIds = dto.Lines.Select(l => l.VariantId).Distinct().ToList();
        var variants = await db.ProductVariants
            .Include(v => v.Product)
            .Where(v => variantIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        // Check inventory
        var invMap = await db.Inventories.AsNoTracking()
            .Where(i => variantIds.Contains(i.VariantId))
            .ToDictionaryAsync(i => i.VariantId, i => i.QuantityAvailable, cancellationToken);

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            decimal merchandise = 0;
            var orderLines = new List<(int VariantId, string Sku, decimal Price, int Qty, decimal SubTotal)>();

            foreach (var line in dto.Lines)
            {
                if (!variants.TryGetValue(line.VariantId, out var variant))
                    throw new InvalidOperationException($"Không tìm thấy sản phẩm với VariantId {line.VariantId}");

                if (!string.Equals(variant.Product.Status, ProductStatus.Active, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException($"Sản phẩm \"{variant.Product.Name}\" không còn bán");

                var avail = invMap.GetValueOrDefault(variant.Id, 0);
                if (line.Quantity > avail)
                    throw new InvalidOperationException($"Không đủ tồn cho SKU {variant.Sku} (còn {avail})");

                if (line.Quantity <= 0)
                    throw new ArgumentException($"Số lượng phải lớn hơn 0 cho SKU {variant.Sku}");

                var subTotal = variant.RetailPrice * line.Quantity;
                merchandise += subTotal;
                orderLines.Add((variant.Id, variant.Sku, variant.RetailPrice, line.Quantity, subTotal));
            }

            // Resolve voucher
            decimal discount = 0;
            Voucher? voucher = null;
            if (!string.IsNullOrWhiteSpace(dto.VoucherCode))
            {
                voucher = await db.Vouchers
                    .Include(v => v.Campaign)
                    .FirstOrDefaultAsync(v => v.Code.ToLower() == dto.VoucherCode.Trim().ToLower(), cancellationToken);

                if (voucher != null)
                {
                    var now = DateTime.UtcNow;
                    if (VoucherComputation.IsEligible(voucher, now, out _) &&
                        VoucherComputation.MeetsMinOrder(voucher, merchandise))
                    {
                        discount = VoucherComputation.ComputeDiscount(merchandise, voucher);
                        voucher.UsedCount++;
                    }
                }
            }

            var payable = Math.Max(0, merchandise - discount);

            // Generate order code
            var orderCode = await StoreOrderCodes.GenerateUniqueAsync(db.CustomerOrders, cancellationToken);

            var order = new CustomerOrder
            {
                OrderCode = orderCode,
                CustomerId = dto.CustomerId,
                SalesId = salesId,
                ShippingAddressId = dto.ShippingAddressId,
                PaymentMethod = dto.PaymentMethod.Trim(),
                PaymentStatus = PaymentStatuses.Unpaid,
                OrderStatus = OrderStatuses.Confirmed,
                VoucherId = voucher?.Id,
                CreatedAt = DateTime.UtcNow,
                MerchandiseTotal = merchandise,
                DiscountTotal = discount,
                PayableTotal = payable
            };

            await db.CustomerOrders.AddAsync(order, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            // Add order items
            foreach (var (variantId, sku, price, qty, subTotal) in orderLines)
            {
                await db.OrderItems.AddAsync(new OrderItem
                {
                    OrderId = order.Id,
                    VariantId = variantId,
                    SkuSnapshot = sku,
                    PriceSnapshot = price,
                    Quantity = qty,
                    SubTotal = subTotal
                }, cancellationToken);
            }

            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            await notificationEmitter.OnOrderCreatedAsync(order.Id, cancellationToken);

            return await GetByIdAsync(order.Id, cancellationToken: cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<AdminOrderDetailDto> UpdateStatusAsync(
        int id,
        AdminOrderUpdateStatusDto dto,
        int? actorUserId = null,
        string? actorRole = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Status))
            throw new ArgumentException("Trạng thái không được để trống");

        if (!OrderStatuses.IsValid(dto.Status))
            throw new ArgumentException($"Trạng thái '{dto.Status}' không hợp lệ");

        var order = await db.CustomerOrders
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {id}");

        var newStatus = OrderStatuses.All.First(s =>
            string.Equals(s, dto.Status, StringComparison.OrdinalIgnoreCase));

        OrderStatusAuthorization.ValidateOrderStatusUpdate(order, newStatus, actorRole, actorUserId);

        var fromStatus = order.OrderStatus;
        order.OrderStatus = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        await RecordOrderStatusHistoryAsync(
            order.Id,
            fromStatus,
            newStatus,
            dto.Note,
            "OrderManual",
            actorUserId,
            cancellationToken);

        await db.SaveChangesAsync(cancellationToken);

        if (string.Equals(newStatus, OrderStatuses.Delivered, StringComparison.OrdinalIgnoreCase))
            await warrantyProvisioning.EnsureWarrantyTicketForOrderAsync(order.Id, cancellationToken);

        await notificationEmitter.OnOrderStatusChangedAsync(id, fromStatus, newStatus, cancellationToken);

        return await GetByIdAsync(id, actorRole, cancellationToken);
    }

    public async Task<AdminOrderDetailDto> UpdatePaymentStatusAsync(
        int id,
        AdminOrderUpdatePaymentStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.PaymentStatus))
            throw new ArgumentException("Trạng thái thanh toán không được để trống");

        if (!PaymentStatuses.IsValid(dto.PaymentStatus))
            throw new ArgumentException($"Trạng thái thanh toán '{dto.PaymentStatus}' không hợp lệ");

        var order = await db.CustomerOrders.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {id}");

        var newStatus = PaymentStatuses.All.First(s =>
            string.Equals(s, dto.PaymentStatus, StringComparison.OrdinalIgnoreCase));

        if (!PaymentStatuses.CanTransition(order.PaymentStatus, newStatus))
            throw new InvalidOperationException(
                $"Không thể chuyển trạng thái thanh toán từ '{order.PaymentStatus}' sang '{newStatus}'");

        var fromOrderStatus = order.OrderStatus;
        order.PaymentStatus = newStatus;

        var orderStatusChanged = false;
        // Auto-confirm order when paid (if status is New or AwaitingPayment)
        if (newStatus == PaymentStatuses.Paid &&
            (order.OrderStatus == OrderStatuses.New || order.OrderStatus == OrderStatuses.AwaitingPayment))
        {
            order.OrderStatus = OrderStatuses.Confirmed;
            orderStatusChanged = true;
        }

        await db.SaveChangesAsync(cancellationToken);

        if (newStatus == PaymentStatuses.Paid)
        {
            await notificationEmitter.OnOrderPaidAsync(id, cancellationToken);
            if (orderStatusChanged)
                await notificationEmitter.OnOrderStatusChangedAsync(id, fromOrderStatus, OrderStatuses.Confirmed, cancellationToken);
        }

        return await GetByIdAsync(id, cancellationToken: cancellationToken);
    }

    public async Task<AdminOrderDetailDto> CancelAsync(
        int id,
        AdminOrderCancelDto dto,
        int? actorUserId = null,
        CancellationToken cancellationToken = default)
    {
        var order = await db.CustomerOrders
            .Include(o => o.FulfillmentTickets)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {id}");

        if (!OrderStatuses.CanCancel(order.OrderStatus))
            throw new InvalidOperationException(
                $"Không thể hủy đơn hàng ở trạng thái '{order.OrderStatus}'");

        var fromStatus = order.OrderStatus;
        order.OrderStatus = OrderStatuses.Cancelled;
        order.CancelReason = dto.CancelReason?.Trim();
        order.CancelledAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        foreach (var ticket in order.FulfillmentTickets.Where(t => OrderFulfillmentWorkflow.IsActiveFulfillmentStatus(t.Status)))
        {
            ticket.Status = FulfillmentStatuses.Cancelled;
            ticket.UpdatedAt = DateTime.UtcNow;
        }

        await RecordOrderStatusHistoryAsync(
            order.Id,
            fromStatus,
            OrderStatuses.Cancelled,
            order.CancelReason,
            "Cancel",
            actorUserId,
            cancellationToken);

        await db.SaveChangesAsync(cancellationToken);

        await notificationEmitter.OnOrderStatusChangedAsync(id, fromStatus, OrderStatuses.Cancelled, cancellationToken);

        return await GetByIdAsync(id, cancellationToken: cancellationToken);
    }

    public async Task<AdminOrderDetailDto> AssignSalesAsync(
        int id,
        AdminOrderAssignSalesDto dto,
        CancellationToken cancellationToken = default)
    {
        var order = await db.CustomerOrders.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {id}");

        var salesExists = await db.AppUsers.AnyAsync(u => u.Id == dto.SalesId, cancellationToken);
        if (!salesExists)
            throw new KeyNotFoundException("Không tìm thấy nhân viên bán hàng");

        order.SalesId = dto.SalesId;
        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken: cancellationToken);
    }

    private async Task<CustomerOrder?> GetOrderWithDetailsAsync(
        System.Linq.Expressions.Expression<Func<CustomerOrder, bool>> predicate,
        CancellationToken cancellationToken)
    {
        return await db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.ShippingAddress)
            .Include(o => o.Voucher)
            .Include(o => o.Sales)
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(predicate, cancellationToken);
    }

    private static AdminOrderDetailDto MapToDetailDto(CustomerOrder order)
    {
        return new AdminOrderDetailDto
        {
            Id = order.Id,
            OrderCode = order.OrderCode,
            CreatedAt = order.CreatedAt,
            OrderStatus = order.OrderStatus,
            PaymentStatus = order.PaymentStatus,
            PaymentMethod = order.PaymentMethod,
            MerchandiseTotal = order.MerchandiseTotal,
            DiscountTotal = order.DiscountTotal,
            PayableTotal = order.PayableTotal,
            QuoteId = order.QuoteId,
            ContractId = order.ContractId,
            PayOsPaymentLinkId = order.PayOsPaymentLinkId,
            PayOsCheckoutUrl = order.PayOsCheckoutUrl,
            PayOsLinkExpiresAt = order.PayOsLinkExpiresAt,
            UpdatedAt = order.UpdatedAt,
            CancelledAt = order.CancelledAt,
            CancelReason = order.CancelReason,
            Customer = new AdminOrderCustomerDto
            {
                Id = order.Customer.Id,
                FullName = order.Customer.FullName,
                Email = order.Customer.Email,
                Phone = order.Customer.Phone,
                CustomerType = order.Customer.CustomerType,
                CompanyName = order.Customer.CompanyName,
                TaxCode = order.Customer.TaxCode,
                DebtBalance = order.Customer.DebtBalance
            },
            ShippingAddress = order.ShippingAddress == null ? null : new AdminOrderAddressDto
            {
                Id = order.ShippingAddress.Id,
                ReceiverName = order.ShippingAddress.ReceiverName,
                ReceiverPhone = order.ShippingAddress.ReceiverPhone,
                AddressLine = order.ShippingAddress.AddressLine
            },
            Voucher = order.Voucher == null ? null : new AdminOrderVoucherDto
            {
                Id = order.Voucher.Id,
                Code = order.Voucher.Code,
                DiscountType = order.Voucher.DiscountType,
                DiscountValue = order.Voucher.DiscountValue
            },
            Sales = order.Sales == null ? null : new AdminOrderSalesDto
            {
                Id = order.Sales.Id,
                FullName = order.Sales.FullName,
                Email = order.Sales.Email,
                Phone = order.Sales.Phone
            },
            Lines = order.Items.OrderBy(i => i.Id).Select(i => new AdminOrderLineDto
            {
                Id = i.Id,
                VariantId = i.VariantId,
                SkuSnapshot = i.SkuSnapshot,
                Quantity = i.Quantity,
                PriceSnapshot = i.PriceSnapshot,
                SubTotal = i.SubTotal,
                CurrentSku = i.Variant.Sku,
                VariantName = i.Variant.VariantName,
                ProductName = i.Variant.Product.Name,
                ImageUrl = i.Variant.ImageUrl
            }).ToList()
        };
    }

    public async Task<AdminOrderTimelineDto> GetTimelineByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var orderId = await db.CustomerOrders.AsNoTracking()
            .Where(o => o.Id == id)
            .Select(o => (int?)o.Id)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {id}");

        return await BuildTimelineAsync(orderId, cancellationToken);
    }

    public async Task<AdminOrderTimelineDto> GetTimelineByCodeAsync(string orderCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(orderCode))
            throw new ArgumentException("Mã đơn hàng không được để trống");

        var codeLower = orderCode.Trim().ToLower();
        var orderId = await db.CustomerOrders.AsNoTracking()
            .Where(o => o.OrderCode.ToLower() == codeLower)
            .Select(o => (int?)o.Id)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {orderCode}");

        return await BuildTimelineAsync(orderId, cancellationToken);
    }

    private async Task<AdminOrderTimelineDto> BuildTimelineAsync(int orderId, CancellationToken cancellationToken)
    {
        var order = await db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.Sales)
            .Include(o => o.FulfillmentTickets).ThenInclude(f => f.AssignedWorker)
            .Include(o => o.Invoices).ThenInclude(i => i.TransferNotifications).ThenInclude(t => t.ProcessedByUser)
            .Include(o => o.Invoices).ThenInclude(i => i.PaymentTransactions)
            .Include(o => o.ReturnExchangeTickets)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {orderId}");

        var events = new List<AdminOrderTimelineEventDto>
        {
            new()
            {
                EventType = "Order",
                Status = "Created",
                Description = "Đơn hàng được tạo",
                Timestamp = order.CreatedAt,
                ActorName = order.Sales?.FullName
            }
        };

        var statusHistory = await db.OrderStatusHistories.AsNoTracking()
            .Where(h => h.OrderId == orderId)
            .OrderBy(h => h.CreatedAt)
            .ToListAsync(cancellationToken);

        foreach (var h in statusHistory)
        {
            events.Add(new AdminOrderTimelineEventDto
            {
                EventType = "Order",
                Status = h.ToStatus,
                Description = $"Đơn: {h.FromStatus} → {h.ToStatus}",
                Timestamp = h.CreatedAt,
                Notes = h.Note,
                ActorName = h.ActorUserId != null
                    ? await db.AppUsers.AsNoTracking()
                        .Where(u => u.Id == h.ActorUserId)
                        .Select(u => u.FullName)
                        .FirstOrDefaultAsync(cancellationToken)
                    : null
            });
        }

        foreach (var ticket in order.FulfillmentTickets.OrderBy(f => f.CreatedAt))
        {
            events.Add(new AdminOrderTimelineEventDto
            {
                EventType = "Fulfillment",
                Status = ticket.Status,
                Description = BuildFulfillmentDescription(ticket.Status, ticket.TicketType),
                Timestamp = ticket.UpdatedAt ?? ticket.CreatedAt,
                ReferenceId = ticket.Id,
                Notes = ticket.Notes,
                ActorName = ticket.AssignedWorker?.FullName
            });
        }

        var invoiceIds = order.Invoices.Select(i => i.Id).ToList();
        foreach (var invoice in order.Invoices.OrderBy(i => i.IssueDate))
        {
            events.Add(new AdminOrderTimelineEventDto
            {
                EventType = "Invoice",
                Status = invoice.Status,
                Description = $"Hóa đơn {invoice.InvoiceNumber} — {invoice.Status}",
                Timestamp = invoice.IssueDate,
                ReferenceId = invoice.Id,
                Notes = invoice.TotalAmount.HasValue ? $"Total: {invoice.TotalAmount.Value:N0}" : null
            });
        }

        var payments = await db.PaymentTransactions.AsNoTracking()
            .Where(p => p.InvoiceId != null && invoiceIds.Contains(p.InvoiceId.Value))
            .OrderBy(p => p.PaymentDate)
            .ToListAsync(cancellationToken);

        foreach (var payment in payments)
        {
            var isIncome = PaymentTransactionTypes.IsIncome(payment.TransactionType ?? string.Empty);
            events.Add(new AdminOrderTimelineEventDto
            {
                EventType = "Payment",
                Status = payment.TransactionType ?? "Payment",
                Description = isIncome
                    ? $"Ghi nhận thanh toán {payment.Amount:N0} ({payment.PaymentMethod})"
                    : $"Hoàn / điều chỉnh giảm {payment.Amount:N0} ({payment.PaymentMethod})",
                Timestamp = payment.PaymentDate,
                ReferenceId = payment.Id,
                Notes = payment.ReferenceCode
            });
        }

        var notifications = order.Invoices
            .SelectMany(i => i.TransferNotifications)
            .OrderBy(t => t.CreatedAt);
        foreach (var tn in notifications)
        {
            events.Add(new AdminOrderTimelineEventDto
            {
                EventType = "TransferNotification",
                Status = tn.Status,
                Description = $"Thông báo CK {tn.ReferenceCode} — {tn.Status}",
                Timestamp = tn.ProcessedAt ?? tn.CreatedAt,
                ReferenceId = tn.Id,
                Notes = tn.ProcessNote,
                ActorName = tn.ProcessedByUser?.FullName
            });
        }

        foreach (var ret in order.ReturnExchangeTickets.OrderBy(r => r.Id))
        {
            events.Add(new AdminOrderTimelineEventDto
            {
                EventType = "Return",
                Status = ret.Status,
                Description = $"Phiếu đổi/trả #{ret.Id} — {ret.Status}",
                Timestamp = ret.CreatedAt,
                ReferenceId = ret.Id
            });
        }

        return new AdminOrderTimelineDto
        {
            OrderId = order.Id,
            OrderCode = order.OrderCode,
            CurrentOrderStatus = order.OrderStatus,
            CurrentPaymentStatus = order.PaymentStatus,
            CreatedAt = order.CreatedAt,
            Events = events.OrderBy(e => e.Timestamp).ThenBy(e => e.EventType).ToList()
        };
    }

    private async Task EnrichDetailWorkflowAsync(
        AdminOrderDetailDto dto,
        int orderId,
        string? actorRole,
        CancellationToken cancellationToken)
    {
        dto.Workflow = await GetWorkflowAsync(orderId, actorRole, cancellationToken);
    }

    private async Task EnrichAfterSalesLineQuantitiesAsync(
        AdminOrderDetailDto dto,
        int orderId,
        CancellationToken cancellationToken)
    {
        var eligibility = await afterSalesQuantity.GetLineEligibilityForOrderAsync(orderId, cancellationToken);
        foreach (var line in dto.Lines)
        {
            if (eligibility.TryGetValue(line.Id, out var e))
            {
                line.ReturnableQuantity = e.Returnable;
                line.WarrantyClaimableQuantity = e.Claimable;
            }
        }
    }

    private static AdminOrderWorkflowDto BuildWorkflowSnapshot(CustomerOrder order, string? actorRole = null)
    {
        var hasActive = order.FulfillmentTickets.Any(t => OrderFulfillmentWorkflow.IsActiveFulfillmentStatus(t.Status));
        var canCreate = true;
        try
        {
            OrderFulfillmentWorkflow.ValidateOrderAllowsCreate(order);
            OrderFulfillmentWorkflow.ValidateNoActiveFulfillment(order.FulfillmentTickets);
        }
        catch (InvalidOperationException)
        {
            canCreate = false;
        }

        return new AdminOrderWorkflowDto
        {
            Warnings = OrderFulfillmentWorkflow.BuildOrderWarnings(order, order.Customer),
            AllowedOrderTransitions = OrderStatusAuthorization
                .GetAllowedOrderTransitionsForRole(order.OrderStatus, actorRole)
                .ToList(),
            HasActiveFulfillment = hasActive,
            CanCreateFulfillment = canCreate
        };
    }

    private async Task RecordOrderStatusHistoryAsync(
        int orderId,
        string fromStatus,
        string toStatus,
        string? note,
        string source,
        int? actorUserId,
        CancellationToken cancellationToken)
    {
        await db.OrderStatusHistories.AddAsync(new OrderStatusHistory
        {
            OrderId = orderId,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            Note = note,
            Source = source,
            ActorUserId = actorUserId,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);
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
}
