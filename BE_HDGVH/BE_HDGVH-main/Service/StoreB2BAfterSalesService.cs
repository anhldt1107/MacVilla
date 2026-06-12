using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class StoreB2BAfterSalesService(
    BeContext db,
    WarrantyProvisioningService warrantyProvisioning,
    AfterSalesQuantityService afterSalesQuantity,
    NotificationBusinessEmitter notificationEmitter) : IStoreB2BAfterSalesService
{
    #region Warranty Tickets

    public async Task<PagedResultDto<StoreB2BWarrantyTicketListItemDto>> GetWarrantyTicketsPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.WarrantyTickets
            .AsNoTracking()
            .Include(t => t.Order)
            .Include(t => t.Contract)
            .Include(t => t.Claims)
            .Where(t => t.CustomerId == customerId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status == status);
        }

        var total = await query.CountAsync(cancellationToken);

        var tickets = await query
            .OrderByDescending(t => t.IssueDate)
            .ThenByDescending(t => t.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = tickets.Select(t => new StoreB2BWarrantyTicketListItemDto
        {
            Id = t.Id,
            TicketNumber = t.TicketNumber,
            IssueDate = t.IssueDate,
            ValidUntil = t.ValidUntil,
            Status = t.Status,
            ClaimCount = t.Claims.Count,
            PendingClaimCount = t.Claims.Count(c =>
                c.Status == WarrantyClaimStatuses.PendingCheck ||
                c.Status == WarrantyClaimStatuses.Checking),
            OrderId = t.OrderId,
            OrderCode = t.Order?.OrderCode,
            ContractId = t.ContractId,
            ContractNumber = t.Contract?.ContractNumber
        }).ToList();

        return new PagedResultDto<StoreB2BWarrantyTicketListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<StoreB2BWarrantyTicketDetailDto> GetWarrantyTicketByNumberAsync(
        int customerId,
        string ticketNumber,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        if (string.IsNullOrWhiteSpace(ticketNumber))
            throw new ArgumentException("Mã phiếu bảo hành không được để trống");

        var numberLower = ticketNumber.Trim().ToLower();
        var ticket = await db.WarrantyTickets
            .AsNoTracking()
            .Include(t => t.Order)
            .Include(t => t.Contract)
            .Include(t => t.Lines)
                .ThenInclude(l => l.Variant)
                    .ThenInclude(v => v.Product)
            .Include(t => t.Claims)
                .ThenInclude(c => c.Variant)
                    .ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(
                t => t.TicketNumber.ToLower() == numberLower && t.CustomerId == customerId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu bảo hành với mã {ticketNumber}");

        return MapToWarrantyDetailDto(ticket);
    }

    public async Task<StoreB2BWarrantyClaimResponseDto> CreateWarrantyClaimAsync(
        int customerId,
        StoreB2BWarrantyClaimCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        if (string.IsNullOrWhiteSpace(dto.DefectDescription))
            throw new ArgumentException("Vui lòng mô tả lỗi / vấn đề cần bảo hành");

        WarrantyTicket? ticket = null;

        if (dto.WarrantyTicketId.HasValue)
        {
            ticket = await db.WarrantyTickets
                .Include(t => t.Lines)
                .Include(t => t.Claims)
                .FirstOrDefaultAsync(t => t.Id == dto.WarrantyTicketId.Value && t.CustomerId == customerId, cancellationToken)
                ?? throw new KeyNotFoundException($"Không tìm thấy phiếu bảo hành với ID {dto.WarrantyTicketId}");
        }
        else if (dto.OrderId.HasValue)
        {
            _ = await db.CustomerOrders.AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == dto.OrderId.Value && o.CustomerId == customerId, cancellationToken)
                ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {dto.OrderId}");

            await warrantyProvisioning.EnsureWarrantyTicketForOrderAsync(dto.OrderId.Value, cancellationToken);

            ticket = await db.WarrantyTickets
                .Include(t => t.Lines)
                .Include(t => t.Claims)
                .FirstOrDefaultAsync(t => t.OrderId == dto.OrderId.Value && t.CustomerId == customerId, cancellationToken)
                ?? throw new InvalidOperationException("Không thể tạo phiếu bảo hành cho đơn hàng này.");
        }
        else
        {
            throw new ArgumentException("Vui lòng cung cấp ID phiếu bảo hành hoặc ID đơn hàng");
        }

        var now2 = DateTime.UtcNow;
        var line = WarrantyCoverageRules.ResolveLineForClaim(
            ticket, dto.OrderItemId, dto.VariantId, now2);

        WarrantyCoverageRules.EnsureNoActiveClaimForOrderItem(ticket.Claims, line.OrderItemId);

        var variant = await db.ProductVariants
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == line.VariantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy sản phẩm với VariantId {line.VariantId}");

        var claim = new WarrantyClaim
        {
            WarrantyTicketId = ticket.Id,
            OrderItemId = line.OrderItemId,
            VariantId = line.VariantId,
            DefectDescription = dto.DefectDescription.Trim(),
            ImagesUrl = dto.ImagesUrl?.Trim(),
            EstimatedCost = 0,
            Status = WarrantyClaimStatuses.PendingCheck,
            CreatedAt = now2
        };

        await db.WarrantyClaims.AddAsync(claim, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        await notificationEmitter.OnWarrantyClaimPendingAsync(claim.Id, cancellationToken);

        return new StoreB2BWarrantyClaimResponseDto
        {
            Id = claim.Id,
            WarrantyTicketId = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            OrderItemId = claim.OrderItemId,
            VariantId = claim.VariantId,
            Sku = variant.Sku,
            VariantName = variant.VariantName,
            DefectDescription = claim.DefectDescription,
            Status = claim.Status,
            CreatedAt = claim.CreatedAt,
            Message = "Yêu cầu bảo hành đã được ghi nhận. Bộ phận kỹ thuật sẽ kiểm tra và phản hồi sớm."
        };
    }

    #endregion

    #region Return/Exchange Tickets

    public async Task<PagedResultDto<StoreB2BReturnTicketListItemDto>> GetReturnTicketsPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status = null,
        string? type = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.ReturnExchangeTickets
            .AsNoTracking()
            .Include(t => t.Order)
            .Include(t => t.Items)
            .Where(t => t.CustomerId == customerId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(t => t.Type == type);
        }

        var total = await query.CountAsync(cancellationToken);

        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .ThenByDescending(t => t.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = tickets.Select(t => new StoreB2BReturnTicketListItemDto
        {
            Id = t.Id,
            TicketNumber = t.TicketNumber,
            Type = t.Type,
            Status = t.Status,
            Reason = t.Reason,
            RefundAmount = t.RefundAmount,
            ItemCount = t.Items.Count,
            CreatedAt = t.CreatedAt,
            ApprovedAt = t.ApprovedAt,
            CompletedAt = t.CompletedAt,
            OrderId = t.OrderId,
            OrderCode = t.Order.OrderCode
        }).ToList();

        return new PagedResultDto<StoreB2BReturnTicketListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<StoreB2BReturnTicketDetailDto> GetReturnTicketByNumberAsync(
        int customerId,
        string ticketNumber,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        if (string.IsNullOrWhiteSpace(ticketNumber))
            throw new ArgumentException("Mã phiếu đổi/trả không được để trống");

        var numberLower = ticketNumber.Trim().ToLower();
        var ticket = await db.ReturnExchangeTickets
            .AsNoTracking()
            .Include(t => t.Order)
            .Include(t => t.Items)
                .ThenInclude(i => i.VariantReturned)
                    .ThenInclude(v => v.Product)
            .Include(t => t.Items)
                .ThenInclude(i => i.VariantExchanged)
                    .ThenInclude(v => v!.Product)
            .FirstOrDefaultAsync(
                t => t.TicketNumber.ToLower() == numberLower && t.CustomerId == customerId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu đổi/trả với mã {ticketNumber}");

        return MapToReturnDetailDto(ticket);
    }

    public async Task<StoreB2BReturnCreateResponseDto> CreateReturnRequestAsync(
        int customerId,
        StoreB2BReturnCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new ArgumentException("Vui lòng nhập lý do đổi/trả hàng");

        if (dto.Items == null || dto.Items.Count == 0)
            throw new ArgumentException("Vui lòng chọn ít nhất một sản phẩm cần đổi/trả");

        var validTypes = new[] { "Return", "Exchange" };
        if (!validTypes.Contains(dto.Type, StringComparer.OrdinalIgnoreCase))
            throw new ArgumentException("Loại phiếu không hợp lệ. Chọn 'Return' hoặc 'Exchange'");

        var order = await db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.CustomerId == customerId, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID {dto.OrderId}");

        if (order.OrderStatus != "Delivered" && order.OrderStatus != "Completed")
            throw new InvalidOperationException("Chỉ có thể đổi/trả hàng với đơn hàng đã giao/hoàn thành");

        foreach (var item in dto.Items)
        {
            if (item.OrderItemId <= 0)
                throw new ArgumentException("orderItemId là bắt buộc cho mỗi dòng đổi/trả");

            var orderItem = order.Items.FirstOrDefault(i => i.Id == item.OrderItemId)
                ?? throw new ArgumentException($"Dòng đơn {item.OrderItemId} không thuộc đơn hàng này");

            if (item.VariantIdReturned > 0 && item.VariantIdReturned != orderItem.VariantId)
                throw new ArgumentException($"variantIdReturned không khớp với dòng đơn {item.OrderItemId}");

            await afterSalesQuantity.ValidateReturnItemAsync(orderItem, item.Quantity, cancellationToken);

            if (dto.Type.Equals("Exchange", StringComparison.OrdinalIgnoreCase) && item.VariantIdExchanged.HasValue)
            {
                var exchangeVariant = await db.ProductVariants.AsNoTracking()
                    .FirstOrDefaultAsync(v => v.Id == item.VariantIdExchanged.Value, cancellationToken);
                if (exchangeVariant == null)
                    throw new ArgumentException($"Không tìm thấy sản phẩm đổi sang với VariantId {item.VariantIdExchanged}");
            }
        }

        var ticketNumber = await ReturnTicketCodes.GenerateUniqueAsync(db.ReturnExchangeTickets, cancellationToken);
        var now = DateTime.UtcNow;

        var ticket = new ReturnExchangeTicket
        {
            TicketNumber = ticketNumber,
            OrderId = dto.OrderId,
            CustomerId = customerId,
            Type = dto.Type,
            Reason = dto.Reason.Trim(),
            CustomerNote = dto.CustomerNote?.Trim(),
            Status = ReturnTicketStatuses.Requested,
            RefundAmount = 0,
            CreatedAt = now
        };

        await db.ReturnExchangeTickets.AddAsync(ticket, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        foreach (var item in dto.Items)
        {
            var orderItem = order.Items.First(i => i.Id == item.OrderItemId);
            var returnItem = new ReturnItem
            {
                TicketId = ticket.Id,
                OrderItemId = orderItem.Id,
                VariantIdReturned = orderItem.VariantId,
                VariantIdExchanged = item.VariantIdExchanged,
                Quantity = item.Quantity
            };
            await db.ReturnItems.AddAsync(returnItem, cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnReturnPendingApprovalAsync(ticket.Id, cancellationToken);

        return new StoreB2BReturnCreateResponseDto
        {
            Id = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            Type = ticket.Type,
            Status = ticket.Status,
            CreatedAt = ticket.CreatedAt,
            ItemCount = dto.Items.Count,
            Message = "Yêu cầu đổi/trả hàng đã được ghi nhận. Nhân viên sẽ xem xét và phản hồi sớm."
        };
    }

    public async Task<StoreB2BReturnTicketDetailDto> CancelReturnRequestAsync(
        int customerId,
        string ticketNumber,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        if (string.IsNullOrWhiteSpace(ticketNumber))
            throw new ArgumentException("Mã phiếu đổi/trả không được để trống");

        var numberLower = ticketNumber.Trim().ToLower();
        var ticket = await db.ReturnExchangeTickets
            .FirstOrDefaultAsync(
                t => t.TicketNumber.ToLower() == numberLower && t.CustomerId == customerId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu đổi/trả với mã {ticketNumber}");

        if (ticket.Status != ReturnTicketStatuses.Requested &&
            ticket.Status != ReturnTicketStatuses.PendingApproval)
            throw new InvalidOperationException("Chỉ có thể hủy yêu cầu đang chờ xử lý");

        ticket.Status = ReturnTicketStatuses.Cancelled;
        await db.SaveChangesAsync(cancellationToken);

        return await GetReturnTicketByNumberAsync(customerId, ticket.TicketNumber, cancellationToken);
    }

    #endregion

    #region Private Helpers

    private async Task<Customer> EnsureB2BCustomerAsync(int customerId, CancellationToken cancellationToken)
    {
        // Dùng chung cho B2B & B2C (route /api/store/me/* share service với /api/store/b2b/*).
        var customer = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

        if (customer == null)
            throw new KeyNotFoundException("Không tìm thấy tài khoản khách hàng");

        return customer;
    }

    private static StoreB2BWarrantyTicketDetailDto MapToWarrantyDetailDto(WarrantyTicket ticket)
    {
        var now = DateTime.UtcNow;
        var lines = ticket.Lines?.ToList() ?? [];
        var claims = ticket.Claims?.ToList() ?? [];
        var hasLines = lines.Count > 0;
        var anyLineValid = hasLines && lines.Any(l => WarrantyCoverageRules.IsLineEligible(l, now));
        var isValid = ticket.Status == WarrantyTicketStatuses.Active
                      && (hasLines ? anyLineValid : (!ticket.ValidUntil.HasValue || ticket.ValidUntil.Value >= now));
        int? daysRemaining = hasLines
            ? lines
                .Where(l => WarrantyCoverageRules.IsLineEligible(l, now))
                .Select(l => WarrantyCoverageRules.DaysRemaining(l, now))
                .Max()
            : ticket.ValidUntil.HasValue
                ? (int)(ticket.ValidUntil.Value.Date - now.Date).TotalDays
                : null;

        return new StoreB2BWarrantyTicketDetailDto
        {
            Id = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            IssueDate = ticket.IssueDate,
            ValidUntil = ticket.ValidUntil,
            Status = ticket.Status,
            IsValid = isValid,
            DaysRemaining = daysRemaining,
            Order = ticket.Order == null ? null : new StoreB2BWarrantyOrderDto
            {
                Id = ticket.Order.Id,
                OrderCode = ticket.Order.OrderCode,
                CreatedAt = ticket.Order.CreatedAt
            },
            Contract = ticket.Contract == null ? null : new StoreB2BWarrantyContractDto
            {
                Id = ticket.Contract.Id,
                ContractNumber = ticket.Contract.ContractNumber
            },
            Lines = lines
                .OrderBy(l => l.Id)
                .Select(l => new StoreB2BWarrantyTicketLineDto
                {
                    Id = l.Id,
                    OrderItemId = l.OrderItemId,
                    VariantId = l.VariantId,
                    Sku = l.SkuSnapshot ?? l.Variant?.Sku ?? "",
                    VariantName = l.Variant?.VariantName ?? "",
                    ProductName = l.Variant?.Product?.Name ?? "",
                    VariantImageUrl = l.Variant?.ImageUrl,
                    ImageUrl = l.Variant?.Product?.ImageUrl,
                    Quantity = l.Quantity,
                    WarrantyPeriodMonths = l.WarrantyPeriodMonths,
                    IssueDate = l.IssueDate,
                    ValidUntil = l.ValidUntil,
                    IsValid = WarrantyCoverageRules.IsLineEligible(l, now),
                    DaysRemaining = WarrantyCoverageRules.DaysRemaining(l, now),
                    ActiveClaimId = WarrantyCoverageRules.FindActiveClaimId(claims, l.OrderItemId)
                })
                .ToList(),
            Claims = claims
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new StoreB2BWarrantyClaimDto
                {
                    Id = c.Id,
                    OrderItemId = c.OrderItemId,
                    VariantId = c.VariantId,
                    Sku = c.Variant?.Sku ?? "",
                    VariantName = c.Variant?.VariantName ?? "",
                    ProductName = c.Variant?.Product?.Name ?? "",
                    VariantImageUrl = c.Variant?.ImageUrl,
                    ImageUrl = c.Variant?.Product?.ImageUrl,
                    DefectDescription = c.DefectDescription,
                    ImagesUrl = c.ImagesUrl,
                    Status = c.Status,
                    CreatedAt = c.CreatedAt,
                    ResolvedDate = c.ResolvedDate,
                    Resolution = c.Resolution
                }).ToList()
        };
    }

    private static StoreB2BReturnTicketDetailDto MapToReturnDetailDto(ReturnExchangeTicket ticket)
    {
        return new StoreB2BReturnTicketDetailDto
        {
            Id = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            Type = ticket.Type,
            Status = ticket.Status,
            Reason = ticket.Reason,
            CustomerNote = ticket.CustomerNote,
            RefundAmount = ticket.RefundAmount,
            CreatedAt = ticket.CreatedAt,
            ApprovedAt = ticket.ApprovedAt,
            CompletedAt = ticket.CompletedAt,
            Order = new StoreB2BReturnOrderDto
            {
                Id = ticket.Order.Id,
                OrderCode = ticket.Order.OrderCode,
                CreatedAt = ticket.Order.CreatedAt,
                OrderStatus = ticket.Order.OrderStatus ?? "",
                PayableTotal = ticket.Order.PayableTotal
            },
            Items = ticket.Items.Select(i => new StoreB2BReturnItemDto
            {
                Id = i.Id,
                OrderItemId = i.OrderItemId,
                VariantIdReturned = i.VariantIdReturned,
                SkuReturned = i.VariantReturned.Sku,
                VariantNameReturned = i.VariantReturned.VariantName,
                ProductNameReturned = i.VariantReturned.Product?.Name ?? "",
                ImageUrlReturned = i.VariantReturned.Product?.ImageUrl,
                VariantIdExchanged = i.VariantIdExchanged,
                SkuExchanged = i.VariantExchanged?.Sku,
                VariantNameExchanged = i.VariantExchanged?.VariantName,
                ProductNameExchanged = i.VariantExchanged?.Product?.Name,
                ImageUrlExchanged = i.VariantExchanged?.Product?.ImageUrl,
                Quantity = i.Quantity
            }).ToList()
        };
    }

    #endregion
}
