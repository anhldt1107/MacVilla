using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Dto.InventoryTransaction;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminQuoteService(
    BeContext db,
    IAdminInventoryTransactionService inventoryTxService,
    NotificationBusinessEmitter notificationEmitter) : IAdminQuoteService
{
    public async Task<PagedResultDto<AdminQuoteListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        int? customerId = null,
        int? salesId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        string? salesListView = null,
        int? salesScopeUserId = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Quotes
            .AsNoTracking()
            .Include(q => q.Customer)
            .Include(q => q.Sales)
            .Include(q => q.Manager)
            .Include(q => q.Items)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(q => q.Status == status);
        }

        if (customerId.HasValue)
        {
            query = query.Where(q => q.CustomerId == customerId.Value);
        }

        if (salesScopeUserId.HasValue)
        {
            var callerId = salesScopeUserId.Value;
            var view = SalesQuoteListViews.Normalize(salesListView);
            query = view switch
            {
                SalesQuoteListViews.Mine => query.Where(q => q.SalesId == callerId),
                SalesQuoteListViews.Queue => query.Where(q =>
                    q.SalesId == null && q.Status == QuoteStatuses.Requested),
                _ => query.Where(q => q.SalesId == callerId || q.SalesId == null)
            };
        }
        else if (salesId.HasValue)
        {
            query = query.Where(q => q.SalesId == salesId.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(q => q.CreatedAt >= fromDate.Value);
        }
        if (toDate.HasValue)
        {
            var endDate = toDate.Value.Date.AddDays(1);
            query = query.Where(q => q.CreatedAt < endDate);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower().Trim();
            query = query.Where(q =>
                q.QuoteCode.ToLower().Contains(searchLower) ||
                q.Customer.FullName.ToLower().Contains(searchLower) ||
                (q.Customer.Phone != null && q.Customer.Phone.Contains(searchLower)) ||
                (q.Customer.CompanyName != null && q.Customer.CompanyName.ToLower().Contains(searchLower)) ||
                (q.Customer.TaxCode != null && q.Customer.TaxCode.Contains(searchLower)));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(q => q.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(q => new AdminQuoteListItemDto
            {
                Id = q.Id,
                QuoteCode = q.QuoteCode,
                CreatedAt = q.CreatedAt,
                Status = q.Status,
                LineCount = q.Items.Count,
                TotalAmount = q.TotalAmount,
                DiscountType = q.DiscountType,
                DiscountValue = q.DiscountValue,
                FinalAmount = q.FinalAmount,
                ValidUntil = q.ValidUntil,
                CustomerId = q.CustomerId,
                CustomerName = q.Customer.FullName,
                CustomerPhone = q.Customer.Phone,
                CustomerEmail = q.Customer.Email,
                CompanyName = q.Customer.CompanyName,
                TaxCode = q.Customer.TaxCode,
                SalesId = q.SalesId,
                SalesName = q.Sales != null ? q.Sales.FullName : null,
                ManagerId = q.ManagerId,
                ManagerName = q.Manager != null ? q.Manager.FullName : null
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminQuoteListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task EnsureQuoteAccessibleBySalesAsync(int quoteId, int salesUserId, CancellationToken cancellationToken = default)
    {
        var row = await db.Quotes.AsNoTracking()
            .Where(q => q.Id == quoteId)
            .Select(q => new { q.SalesId })
            .FirstOrDefaultAsync(cancellationToken);

        if (row == null)
            throw new KeyNotFoundException($"Không tìm thấy báo giá với ID {quoteId}");

        if (row.SalesId.HasValue && row.SalesId.Value != salesUserId)
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập báo giá này.");
    }

    public async Task<AdminQuoteDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var quote = await GetQuoteWithDetailsAsync(q => q.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy báo giá với ID {id}");

        return MapToDetailDto(quote);
    }

    public async Task<AdminQuoteDetailDto> GetByCodeAsync(string quoteCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(quoteCode))
            throw new ArgumentException("Mã báo giá không được để trống");

        var codeLower = quoteCode.Trim().ToLower();
        var quote = await GetQuoteWithDetailsAsync(q => q.QuoteCode.ToLower() == codeLower, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy báo giá với mã {quoteCode}");

        return MapToDetailDto(quote);
    }

    public async Task<AdminQuoteDetailDto> CreateAsync(
        AdminQuoteCreateDto dto,
        int salesId,
        CancellationToken cancellationToken = default)
    {
        var customer = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == dto.CustomerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy khách hàng");

        if (!string.Equals(customer.CustomerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Báo giá chỉ dành cho khách hàng B2B");

        var salesExists = await db.AppUsers.AnyAsync(u => u.Id == salesId, cancellationToken);
        if (!salesExists)
            throw new KeyNotFoundException("Không tìm thấy nhân viên bán hàng");

        if (dto.Lines == null || dto.Lines.Count == 0)
            throw new ArgumentException("Báo giá phải có ít nhất 1 sản phẩm");

        var variantIds = dto.Lines.Select(l => l.VariantId).Distinct().ToList();
        var variants = await db.ProductVariants
            .Include(v => v.Product)
            .Where(v => variantIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        if (dto.DiscountType != null &&
            dto.DiscountType != VoucherDiscountTypes.Percentage &&
            dto.DiscountType != VoucherDiscountTypes.FixedAmount)
        {
            throw new ArgumentException($"DiscountType phải là '{VoucherDiscountTypes.Percentage}' hoặc '{VoucherDiscountTypes.FixedAmount}'");
        }

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            decimal totalAmount = 0;
            var quoteLines = new List<(int VariantId, decimal UnitPrice, int Qty, decimal SubTotal)>();

            foreach (var line in dto.Lines)
            {
                if (!variants.TryGetValue(line.VariantId, out var variant))
                    throw new InvalidOperationException($"Không tìm thấy sản phẩm với VariantId {line.VariantId}");

                if (!string.Equals(variant.Product.Status, ProductStatus.Active, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException($"Sản phẩm \"{variant.Product.Name}\" không còn bán");

                if (line.Quantity <= 0)
                    throw new ArgumentException($"Số lượng phải lớn hơn 0 cho SKU {variant.Sku}");

                var unitPrice = line.UnitPrice ?? variant.RetailPrice;
                var subTotal = unitPrice * line.Quantity;
                totalAmount += subTotal;
                quoteLines.Add((variant.Id, unitPrice, line.Quantity, subTotal));
            }

            decimal discountAmount = 0;
            if (dto.DiscountValue.HasValue && dto.DiscountValue.Value > 0)
            {
                if (dto.DiscountType == VoucherDiscountTypes.Percentage)
                {
                    discountAmount = totalAmount * dto.DiscountValue.Value / 100;
                }
                else if (dto.DiscountType == VoucherDiscountTypes.FixedAmount)
                {
                    discountAmount = dto.DiscountValue.Value;
                }
            }

            var finalAmount = Math.Max(0, totalAmount - discountAmount);
            var quoteCode = await QuoteCodes.GenerateUniqueAsync(db.Quotes, cancellationToken);

            var quote = new Quote
            {
                QuoteCode = quoteCode,
                CustomerId = dto.CustomerId,
                SalesId = salesId,
                Status = QuoteStatuses.Draft,
                TotalAmount = totalAmount,
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                FinalAmount = finalAmount,
                ValidUntil = dto.ValidUntil,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            await db.Quotes.AddAsync(quote, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            foreach (var (variantId, unitPrice, qty, subTotal) in quoteLines)
            {
                await db.QuoteItems.AddAsync(new QuoteItem
                {
                    QuoteId = quote.Id,
                    VariantId = variantId,
                    Quantity = qty,
                    UnitPrice = unitPrice,
                    SubTotal = subTotal
                }, cancellationToken);
            }

            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return await GetByIdAsync(quote.Id, cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<AdminQuoteDetailDto> UpdateAsync(
        int id,
        AdminQuoteUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes
            .Include(q => q.Items)
            .FirstOrDefaultAsync(q => q.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy báo giá với ID {id}");

        if (!QuoteStatuses.CanEdit(quote.Status))
            throw new InvalidOperationException($"Không thể chỉnh sửa báo giá ở trạng thái '{quote.Status}'");

        if (dto.DiscountType != null &&
            dto.DiscountType != VoucherDiscountTypes.Percentage &&
            dto.DiscountType != VoucherDiscountTypes.FixedAmount)
        {
            throw new ArgumentException($"DiscountType phải là '{VoucherDiscountTypes.Percentage}' hoặc '{VoucherDiscountTypes.FixedAmount}'");
        }

        if (dto.Lines == null || dto.Lines.Count == 0)
            throw new ArgumentException("Báo giá phải có ít nhất 1 sản phẩm");

        var variantIds = dto.Lines.Select(l => l.VariantId).Distinct().ToList();
        var variants = await db.ProductVariants
            .Include(v => v.Product)
            .Where(v => variantIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            db.QuoteItems.RemoveRange(quote.Items);

            decimal totalAmount = 0;
            var newLines = new List<QuoteItem>();

            foreach (var line in dto.Lines)
            {
                if (!variants.TryGetValue(line.VariantId, out var variant))
                    throw new InvalidOperationException($"Không tìm thấy sản phẩm với VariantId {line.VariantId}");

                if (!string.Equals(variant.Product.Status, ProductStatus.Active, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException($"Sản phẩm \"{variant.Product.Name}\" không còn bán");

                if (line.Quantity <= 0)
                    throw new ArgumentException($"Số lượng phải lớn hơn 0 cho SKU {variant.Sku}");

                var unitPrice = line.UnitPrice ?? variant.RetailPrice;
                var subTotal = unitPrice * line.Quantity;
                totalAmount += subTotal;

                newLines.Add(new QuoteItem
                {
                    QuoteId = quote.Id,
                    VariantId = variant.Id,
                    Quantity = line.Quantity,
                    UnitPrice = unitPrice,
                    SubTotal = subTotal
                });
            }

            decimal discountAmount = 0;
            var discountType = dto.DiscountType ?? quote.DiscountType;
            var discountValue = dto.DiscountValue ?? quote.DiscountValue;

            if (discountValue.HasValue && discountValue.Value > 0)
            {
                if (discountType == VoucherDiscountTypes.Percentage)
                {
                    discountAmount = totalAmount * discountValue.Value / 100;
                }
                else if (discountType == VoucherDiscountTypes.FixedAmount)
                {
                    discountAmount = discountValue.Value;
                }
            }

            quote.TotalAmount = totalAmount;
            quote.DiscountType = discountType;
            quote.DiscountValue = discountValue;
            quote.FinalAmount = Math.Max(0, totalAmount - discountAmount);
            quote.ValidUntil = dto.ValidUntil ?? quote.ValidUntil;
            quote.Notes = dto.Notes ?? quote.Notes;

            await db.QuoteItems.AddRangeAsync(newLines, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return await GetByIdAsync(id, cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<AdminQuoteDetailDto> AssignToSalesAsync(int id, int salesId, CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy báo giá với ID {id}");

        if (!QuoteStatuses.CanTransition(quote.Status, QuoteStatuses.Draft))
            throw new InvalidOperationException($"Không thể tiếp nhận báo giá ở trạng thái '{quote.Status}'");

        var salesExists = await db.AppUsers.AnyAsync(u => u.Id == salesId, cancellationToken);
        if (!salesExists)
            throw new KeyNotFoundException("Không tìm thấy nhân viên bán hàng");

        quote.Status = QuoteStatuses.Draft;
        quote.SalesId = salesId;
        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminQuoteDetailDto> ReturnToDraftAsync(int id, int staffId, CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy báo giá với ID {id}");

        if (!QuoteStatuses.CanTransition(quote.Status, QuoteStatuses.Draft))
            throw new InvalidOperationException($"Không thể đưa báo giá về nháp từ trạng thái '{quote.Status}'");

        quote.Status = QuoteStatuses.Draft;

        if (!quote.SalesId.HasValue)
        {
            var staffExists = await db.AppUsers.AnyAsync(u => u.Id == staffId, cancellationToken);
            if (!staffExists)
                throw new KeyNotFoundException("Không tìm thấy nhân viên bán hàng");

            quote.SalesId = staffId;
        }

        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminQuoteDetailDto> SubmitAsync(int id, CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy báo giá với ID {id}");

        if (!QuoteStatuses.CanSubmit(quote.Status))
            throw new InvalidOperationException($"Không thể gửi duyệt báo giá ở trạng thái '{quote.Status}'");

        quote.Status = QuoteStatuses.PendingApproval;
        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnQuoteSubmittedForApprovalAsync(id, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminQuoteDetailDto> ApproveAsync(
        int id,
        int managerId,
        CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy báo giá với ID {id}");

        if (!QuoteStatuses.CanApprove(quote.Status))
            throw new InvalidOperationException($"Không thể duyệt báo giá ở trạng thái '{quote.Status}'");

        var managerExists = await db.AppUsers.AnyAsync(u => u.Id == managerId, cancellationToken);
        if (!managerExists)
            throw new KeyNotFoundException("Không tìm thấy manager");

        quote.Status = QuoteStatuses.Approved;
        quote.ManagerId = managerId;
        quote.ApprovedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnQuoteApprovedAsync(id, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminQuoteDetailDto> RejectAsync(
        int id,
        int managerId,
        AdminQuoteRejectDto dto,
        CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy báo giá với ID {id}");

        if (!QuoteStatuses.CanReject(quote.Status))
            throw new InvalidOperationException($"Không thể từ chối báo giá ở trạng thái '{quote.Status}'");

        var managerExists = await db.AppUsers.AnyAsync(u => u.Id == managerId, cancellationToken);
        if (!managerExists)
            throw new KeyNotFoundException("Không tìm thấy manager");

        quote.Status = QuoteStatuses.Rejected;
        quote.ManagerId = managerId;
        quote.RejectReason = dto.RejectReason;
        quote.RejectedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnQuoteRejectedAsync(id, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminOrderDetailDto> ConvertToOrderAsync(
        int id,
        int salesId,
        AdminQuoteConvertToOrderDto dto,
        CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes
            .Include(q => q.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(q => q.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy báo giá với ID {id}");

        if (!QuoteStatuses.CanConvert(quote.Status))
            throw new InvalidOperationException($"Không thể chuyển thành đơn hàng ở trạng thái '{quote.Status}'");

        if (quote.ValidUntil.HasValue && quote.ValidUntil.Value < DateTime.UtcNow)
            throw new InvalidOperationException("Báo giá đã hết hạn");

        var address = await db.CustomerAddresses.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == dto.ShippingAddressId && a.CustomerId == quote.CustomerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy địa chỉ giao hàng");

        Contract? contractEntity = null;
        if (dto.ContractId.HasValue)
        {
            contractEntity = await db.Contracts
                .FirstOrDefaultAsync(c => c.Id == dto.ContractId.Value, cancellationToken)
                ?? throw new KeyNotFoundException("Không tìm thấy hợp đồng");

            if (contractEntity.CustomerId != quote.CustomerId)
                throw new InvalidOperationException("Hợp đồng không thuộc khách của báo giá.");

            if (contractEntity.QuoteId != quote.Id)
                throw new InvalidOperationException("Hợp đồng không gắn với báo giá này.");

            if (!string.Equals(contractEntity.Status, ContractStatuses.Confirmed, StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(contractEntity.Status, ContractStatuses.Active, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Hợp đồng phải ở trạng thái Confirmed (khách đã xác nhận) hoặc Active.");
            }
        }

        var variantIds = quote.Items.Select(i => i.VariantId).ToList();
        var invMap = await db.Inventories.AsNoTracking()
            .Where(i => variantIds.Contains(i.VariantId))
            .ToDictionaryAsync(i => i.VariantId, i => i.QuantityAvailable, cancellationToken);

        foreach (var item in quote.Items)
        {
            var avail = invMap.GetValueOrDefault(item.VariantId, 0);
            if (item.Quantity > avail)
                throw new InvalidOperationException($"Không đủ tồn cho SKU {item.Variant.Sku} (còn {avail})");
        }

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var orderCode = await StoreOrderCodes.GenerateUniqueAsync(db.CustomerOrders, cancellationToken);

            var order = new CustomerOrder
            {
                OrderCode = orderCode,
                CustomerId = quote.CustomerId,
                QuoteId = quote.Id,
                ContractId = contractEntity?.Id,
                SalesId = salesId,
                ShippingAddressId = dto.ShippingAddressId,
                PaymentMethod = dto.PaymentMethod.Trim(),
                PaymentStatus = PaymentStatuses.Unpaid,
                OrderStatus = OrderStatuses.Confirmed,
                CreatedAt = DateTime.UtcNow,
                MerchandiseTotal = quote.TotalAmount ?? 0,
                DiscountTotal = (quote.TotalAmount ?? 0) - (quote.FinalAmount ?? 0),
                PayableTotal = quote.FinalAmount ?? 0
            };

            await db.CustomerOrders.AddAsync(order, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            foreach (var item in quote.Items)
            {
                await db.OrderItems.AddAsync(new OrderItem
                {
                    OrderId = order.Id,
                    VariantId = item.VariantId,
                    SkuSnapshot = item.Variant.Sku,
                    PriceSnapshot = item.UnitPrice,
                    Quantity = item.Quantity,
                    SubTotal = item.SubTotal
                }, cancellationToken);
            }

            quote.Status = QuoteStatuses.Converted;

            if (contractEntity != null &&
                ContractStatuses.CanTransition(contractEntity.Status, ContractStatuses.Active))
            {
                contractEntity.Status = ContractStatuses.Active;
            }

            await db.SaveChangesAsync(cancellationToken);
            await ReleaseInventoryReservationsForQuoteIfAnyAsync(quote.Id, salesId, cancellationToken);

            await tx.CommitAsync(cancellationToken);

            await notificationEmitter.OnOrderCreatedAsync(order.Id, cancellationToken);

            return await GetOrderDetailAsync(order.Id, cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<AdminQuoteDetailDto> ReserveInventoryAsync(
        int quoteId,
        int staffId,
        CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes
            .Include(q => q.Items)
            .FirstOrDefaultAsync(q => q.Id == quoteId, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy báo giá với ID {quoteId}");

        if (!string.Equals(quote.Status, QuoteStatuses.CustomerAccepted, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Chỉ giữ tồn khi báo giá ở trạng thái {QuoteStatuses.CustomerAccepted} (hiện: {quote.Status}).");
        }

        var refKey = quote.Id.ToString();
        var already = await db.InventoryTransactions.AnyAsync(
            t => t.ReferenceType == InventoryReferenceTypes.QuoteReservation &&
                 t.ReferenceId == refKey &&
                 t.TransactionType == TransactionTypes.Reserve,
            cancellationToken);

        if (already)
            throw new InvalidOperationException("Báo giá này đã được giữ tồn.");

        foreach (var item in quote.Items)
        {
            await inventoryTxService.CreateTransactionAsync(
                new InventoryTransactionCreateDto
                {
                    VariantId = item.VariantId,
                    TransactionType = TransactionTypes.Reserve,
                    Quantity = item.Quantity,
                    ReferenceType = InventoryReferenceTypes.QuoteReservation,
                    ReferenceId = refKey,
                    Notes = $"Giữ tồn báo giá {quote.QuoteCode}"
                },
                staffId,
                cancellationToken);
        }

        return await GetByIdAsync(quoteId, cancellationToken);
    }

    public async Task<AdminQuoteDetailDto> ReleaseInventoryReservationAsync(
        int quoteId,
        int staffId,
        CancellationToken cancellationToken = default)
    {
        await ReleaseInventoryReservationsForQuoteIfAnyAsync(quoteId, staffId, cancellationToken);
        return await GetByIdAsync(quoteId, cancellationToken);
    }

    private async Task ReleaseInventoryReservationsForQuoteIfAnyAsync(
        int quoteId,
        int staffId,
        CancellationToken cancellationToken)
    {
        var refKey = quoteId.ToString();
        var reserves = await db.InventoryTransactions
            .AsNoTracking()
            .Where(t =>
                t.ReferenceType == InventoryReferenceTypes.QuoteReservation &&
                t.ReferenceId == refKey &&
                t.TransactionType == TransactionTypes.Reserve)
            .ToListAsync(cancellationToken);

        foreach (var r in reserves)
        {
            await inventoryTxService.CreateTransactionAsync(
                new InventoryTransactionCreateDto
                {
                    VariantId = r.VariantId,
                    TransactionType = TransactionTypes.Release,
                    Quantity = r.Quantity,
                    ReferenceType = InventoryReferenceTypes.QuoteReservation,
                    ReferenceId = refKey,
                    Notes = $"Trả giữ tồn báo giá #{quoteId}"
                },
                staffId,
                cancellationToken);
        }
    }

    private async Task<Quote?> GetQuoteWithDetailsAsync(
        System.Linq.Expressions.Expression<Func<Quote, bool>> predicate,
        CancellationToken cancellationToken)
    {
        return await db.Quotes
            .AsNoTracking()
            .Include(q => q.Customer)
            .Include(q => q.Sales)
            .Include(q => q.Manager)
            .Include(q => q.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(predicate, cancellationToken);
    }

    private static AdminQuoteDetailDto MapToDetailDto(Quote quote)
    {
        return new AdminQuoteDetailDto
        {
            Id = quote.Id,
            QuoteCode = quote.QuoteCode,
            CreatedAt = quote.CreatedAt,
            Status = quote.Status,
            TotalAmount = quote.TotalAmount,
            DiscountType = quote.DiscountType,
            DiscountValue = quote.DiscountValue,
            FinalAmount = quote.FinalAmount,
            ValidUntil = quote.ValidUntil,
            Notes = quote.Notes,
            RejectReason = quote.RejectReason,
            ApprovedAt = quote.ApprovedAt,
            RejectedAt = quote.RejectedAt,
            CustomerNotes = quote.CustomerNotes,
            CounterOfferMessage = quote.CounterOfferMessage,
            CustomerRejectReason = quote.CustomerRejectReason,
            CustomerAcceptedAt = quote.CustomerAcceptedAt,
            CustomerRejectedAt = quote.CustomerRejectedAt,
            Customer = new AdminQuoteCustomerDto
            {
                Id = quote.Customer.Id,
                FullName = quote.Customer.FullName,
                Email = quote.Customer.Email,
                Phone = quote.Customer.Phone,
                CustomerType = quote.Customer.CustomerType,
                CompanyName = quote.Customer.CompanyName,
                TaxCode = quote.Customer.TaxCode,
                CompanyAddress = quote.Customer.CompanyAddress,
                DebtBalance = quote.Customer.DebtBalance
            },
            Sales = quote.Sales == null ? null : new AdminQuoteSalesDto
            {
                Id = quote.Sales.Id,
                FullName = quote.Sales.FullName,
                Email = quote.Sales.Email,
                Phone = quote.Sales.Phone
            },
            Manager = quote.Manager == null ? null : new AdminQuoteManagerDto
            {
                Id = quote.Manager.Id,
                FullName = quote.Manager.FullName,
                Email = quote.Manager.Email,
                Phone = quote.Manager.Phone
            },
            Lines = quote.Items.OrderBy(i => i.Id).Select(i => new AdminQuoteLineDto
            {
                Id = i.Id,
                VariantId = i.VariantId,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                SubTotal = i.SubTotal,
                CurrentSku = i.Variant.Sku,
                VariantName = i.Variant.VariantName,
                ProductName = i.Variant.Product.Name,
                ImageUrl = i.Variant.ImageUrl,
                CurrentRetailPrice = i.Variant.RetailPrice
            }).ToList()
        };
    }

    private async Task<AdminOrderDetailDto> GetOrderDetailAsync(int orderId, CancellationToken cancellationToken)
    {
        var order = await db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.ShippingAddress)
            .Include(o => o.Voucher)
            .Include(o => o.Sales)
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {orderId}");

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
}
