using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminWarrantyService(
    BeContext db,
    WarrantyProvisioningService warrantyProvisioning,
    NotificationBusinessEmitter notificationEmitter) : IAdminWarrantyService
{
    public async Task<PagedResultDto<AdminWarrantyTicketListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        int? customerId = null,
        int? orderId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.WarrantyTickets
            .AsNoTracking()
            .Include(t => t.Customer)
            .Include(t => t.Order)
            .Include(t => t.Claims)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status == status);
        }

        if (customerId.HasValue)
        {
            query = query.Where(t => t.CustomerId == customerId.Value);
        }

        if (orderId.HasValue)
        {
            query = query.Where(t => t.OrderId == orderId.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(t => t.IssueDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            var endDate = toDate.Value.Date.AddDays(1);
            query = query.Where(t => t.IssueDate < endDate);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower().Trim();
            query = query.Where(t =>
                t.TicketNumber.ToLower().Contains(searchLower) ||
                t.Customer.FullName.ToLower().Contains(searchLower) ||
                (t.Customer.Phone != null && t.Customer.Phone.Contains(searchLower)) ||
                (t.Order != null && t.Order.OrderCode.ToLower().Contains(searchLower)));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(t => t.IssueDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new AdminWarrantyTicketListItemDto
            {
                Id = t.Id,
                TicketNumber = t.TicketNumber,
                IssueDate = t.IssueDate,
                ValidUntil = t.ValidUntil,
                Status = t.Status,
                ClaimCount = t.Claims.Count,
                PendingClaimCount = t.Claims.Count(c =>
                    c.Status == WarrantyClaimStatuses.PendingCheck ||
                    c.Status == WarrantyClaimStatuses.Checking ||
                    c.Status == WarrantyClaimStatuses.ConfirmedDefect ||
                    c.Status == WarrantyClaimStatuses.Repairing ||
                    c.Status == WarrantyClaimStatuses.WaitingPickup),
                CustomerId = t.CustomerId,
                CustomerName = t.Customer.FullName,
                CustomerPhone = t.Customer.Phone,
                CustomerEmail = t.Customer.Email,
                OrderId = t.OrderId,
                OrderCode = t.Order != null ? t.Order.OrderCode : null,
                ContractId = t.ContractId
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminWarrantyTicketListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResultDto<AdminWarrantyClaimListItemDto>> GetClaimsPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        bool onlyOpen = false,
        int? customerId = null,
        int? warrantyTicketId = null,
        int? orderId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.WarrantyClaims
            .AsNoTracking()
            .AsQueryable();

        if (onlyOpen)
        {
            query = query.Where(c =>
                c.Status != WarrantyClaimStatuses.Completed &&
                c.Status != WarrantyClaimStatuses.Rejected &&
                c.Status != WarrantyClaimStatuses.Cancelled);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var st = status.Trim();
            query = query.Where(c => c.Status.ToLower() == st.ToLower());
        }

        if (customerId.HasValue)
            query = query.Where(c => c.WarrantyTicket.CustomerId == customerId.Value);

        if (warrantyTicketId.HasValue)
            query = query.Where(c => c.WarrantyTicketId == warrantyTicketId.Value);

        if (orderId.HasValue)
            query = query.Where(c => c.WarrantyTicket.OrderId == orderId.Value);

        if (fromDate.HasValue)
            query = query.Where(c => c.CreatedAt >= fromDate.Value);

        if (toDate.HasValue)
        {
            var end = toDate.Value.Date.AddDays(1);
            query = query.Where(c => c.CreatedAt < end);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c =>
                c.WarrantyTicket.TicketNumber.ToLower().Contains(s) ||
                c.Variant.Sku.ToLower().Contains(s) ||
                (c.DefectDescription != null && c.DefectDescription.ToLower().Contains(s)) ||
                (c.WarrantyTicket.Order != null && c.WarrantyTicket.Order.OrderCode.ToLower().Contains(s)) ||
                c.WarrantyTicket.Customer.FullName.ToLower().Contains(s));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .ThenByDescending(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminWarrantyClaimListItemDto
            {
                Id = c.Id,
                WarrantyTicketId = c.WarrantyTicketId,
                TicketNumber = c.WarrantyTicket.TicketNumber,
                CustomerId = c.WarrantyTicket.CustomerId,
                CustomerName = c.WarrantyTicket.Customer.FullName,
                CustomerPhone = c.WarrantyTicket.Customer.Phone,
                OrderId = c.WarrantyTicket.OrderId,
                OrderCode = c.WarrantyTicket.Order != null ? c.WarrantyTicket.Order.OrderCode : null,
                OrderItemId = c.OrderItemId,
                VariantId = c.VariantId,
                LineValidUntil = c.OrderItemId.HasValue
                    ? c.WarrantyTicket.Lines
                        .Where(l => l.OrderItemId == c.OrderItemId.Value)
                        .Select(l => (DateTime?)l.ValidUntil)
                        .FirstOrDefault()
                    : null,
                Sku = c.Variant.Sku,
                VariantName = c.Variant.VariantName,
                ProductName = c.Variant.Product.Name,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                EstimatedCost = c.EstimatedCost,
                DefectDescription = c.DefectDescription
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminWarrantyClaimListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminWarrantyTicketDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var ticket = await GetTicketWithDetailsAsync(t => t.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu bảo hành với ID {id}");

        return MapToDetailDto(ticket);
    }

    public async Task<AdminWarrantyTicketDetailDto> GetByTicketNumberAsync(string ticketNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ticketNumber))
            throw new ArgumentException("Mã phiếu bảo hành không được để trống");

        var numberLower = ticketNumber.Trim().ToLower();
        var ticket = await GetTicketWithDetailsAsync(t => t.TicketNumber.ToLower() == numberLower, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu bảo hành với mã {ticketNumber}");

        return MapToDetailDto(ticket);
    }

    public async Task<AdminWarrantyTicketDetailDto> CreateAsync(
        AdminWarrantyTicketCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var customer = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == dto.CustomerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy khách hàng");

        if (dto.OrderId.HasValue)
        {
            var order = await db.CustomerOrders.AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == dto.OrderId.Value, cancellationToken)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng");

            if (order.CustomerId != dto.CustomerId)
                throw new InvalidOperationException("Đơn hàng không thuộc về khách hàng này");
        }

        if (dto.ContractId.HasValue)
        {
            var contract = await db.Contracts.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == dto.ContractId.Value, cancellationToken)
                ?? throw new KeyNotFoundException("Không tìm thấy hợp đồng");

            if (contract.CustomerId != dto.CustomerId)
                throw new InvalidOperationException("Hợp đồng không thuộc về khách hàng này");
        }

        if (dto.OrderId.HasValue)
        {
            var existing = await db.WarrantyTickets
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.OrderId == dto.OrderId.Value, cancellationToken);
            if (existing != null)
                return await GetByIdAsync(existing.Id, cancellationToken);

            await warrantyProvisioning.EnsureWarrantyTicketForOrderAsync(dto.OrderId.Value, cancellationToken);
            var provisioned = await db.WarrantyTickets
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.OrderId == dto.OrderId.Value, cancellationToken)
                ?? throw new InvalidOperationException("Không thể tạo phiếu bảo hành cho đơn hàng này.");
            return await GetByIdAsync(provisioned.Id, cancellationToken);
        }

        var ticketNumber = await WarrantyTicketCodes.GenerateUniqueAsync(db.WarrantyTickets, cancellationToken);
        var now = DateTime.UtcNow;

        var ticket = new WarrantyTicket
        {
            TicketNumber = ticketNumber,
            CustomerId = dto.CustomerId,
            OrderId = dto.OrderId,
            ContractId = dto.ContractId,
            IssueDate = now,
            ValidUntil = dto.ValidUntil ?? now.AddMonths(WarrantyCoverageRules.DefaultWarrantyMonths),
            Status = WarrantyTicketStatuses.Active
        };

        await db.WarrantyTickets.AddAsync(ticket, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(ticket.Id, cancellationToken);
    }

    public async Task<AdminWarrantyClaimDto> CreateClaimAsync(
        int ticketId,
        AdminWarrantyClaimCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await db.WarrantyTickets
            .Include(t => t.Lines)
            .Include(t => t.Claims)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu bảo hành với ID {ticketId}");

        var now = DateTime.UtcNow;
        var line = WarrantyCoverageRules.ResolveLineForClaim(
            ticket, dto.OrderItemId, dto.VariantId, now);

        WarrantyCoverageRules.EnsureNoActiveClaimForOrderItem(ticket.Claims, line.OrderItemId);

        var variant = await db.ProductVariants
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == line.VariantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy sản phẩm với VariantId {line.VariantId}");

        var claim = new WarrantyClaim
        {
            WarrantyTicketId = ticketId,
            OrderItemId = line.OrderItemId,
            VariantId = line.VariantId,
            DefectDescription = dto.DefectDescription,
            ImagesUrl = dto.ImagesUrl,
            EstimatedCost = dto.EstimatedCost,
            Note = dto.Note,
            Status = WarrantyClaimStatuses.PendingCheck,
            CreatedAt = now
        };

        await db.WarrantyClaims.AddAsync(claim, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnWarrantyClaimPendingAsync(claim.Id, cancellationToken);

        return await GetClaimByIdAsync(claim.Id, cancellationToken);
    }

    public async Task<AdminWarrantyClaimDto> UpdateClaimStatusAsync(
        int claimId,
        AdminWarrantyClaimUpdateStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Status))
            throw new ArgumentException("Trạng thái không được để trống");

        if (!WarrantyClaimStatuses.IsValid(dto.Status))
            throw new ArgumentException($"Trạng thái '{dto.Status}' không hợp lệ");

        var claim = await db.WarrantyClaims
            .Include(c => c.WarrantyTicket)
            .FirstOrDefaultAsync(c => c.Id == claimId, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy yêu cầu bảo hành với ID {claimId}");

        var newStatus = WarrantyClaimStatuses.All.First(s =>
            string.Equals(s, dto.Status, StringComparison.OrdinalIgnoreCase));

        if (!WarrantyClaimStatuses.CanTransition(claim.Status, newStatus))
            throw new InvalidOperationException(
                $"Không thể chuyển trạng thái từ '{claim.Status}' sang '{newStatus}'");

        claim.Status = newStatus;

        if (dto.EstimatedCost.HasValue)
        {
            claim.EstimatedCost = dto.EstimatedCost.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.Resolution))
        {
            claim.Resolution = dto.Resolution;
        }

        if (!string.IsNullOrWhiteSpace(dto.Note))
        {
            claim.Note = dto.Note;
        }

        if (newStatus == WarrantyClaimStatuses.Completed ||
            newStatus == WarrantyClaimStatuses.Rejected ||
            newStatus == WarrantyClaimStatuses.Cancelled)
        {
            claim.ResolvedDate = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);

        if (newStatus is WarrantyClaimStatuses.Completed or WarrantyClaimStatuses.Rejected or WarrantyClaimStatuses.Cancelled)
            await notificationEmitter.OnWarrantyClaimUpdatedAsync(claimId, cancellationToken);

        return await GetClaimByIdAsync(claimId, cancellationToken);
    }

    public async Task<AdminWarrantyClaimDto> GetClaimByIdAsync(int claimId, CancellationToken cancellationToken = default)
    {
        var claim = await db.WarrantyClaims
            .AsNoTracking()
            .Include(c => c.Variant)
                .ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(c => c.Id == claimId, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy yêu cầu bảo hành với ID {claimId}");

        return MapToClaimDto(claim, null);
    }

    private async Task<WarrantyTicket?> GetTicketWithDetailsAsync(
        System.Linq.Expressions.Expression<Func<WarrantyTicket, bool>> predicate,
        CancellationToken cancellationToken)
    {
        return await db.WarrantyTickets
            .AsNoTracking()
            .Include(t => t.Customer)
            .Include(t => t.Order)
            .Include(t => t.Contract)
            .Include(t => t.Lines)
                .ThenInclude(l => l.Variant)
                    .ThenInclude(v => v.Product)
            .Include(t => t.Claims)
                .ThenInclude(c => c.Variant)
                    .ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(predicate, cancellationToken);
    }

    private static AdminWarrantyTicketDetailDto MapToDetailDto(WarrantyTicket ticket)
    {
        var now = DateTime.UtcNow;
        return new AdminWarrantyTicketDetailDto
        {
            Id = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            IssueDate = ticket.IssueDate,
            ValidUntil = ticket.ValidUntil,
            Status = ticket.Status,
            Customer = new AdminWarrantyCustomerDto
            {
                Id = ticket.Customer.Id,
                FullName = ticket.Customer.FullName,
                Email = ticket.Customer.Email,
                Phone = ticket.Customer.Phone,
                CustomerType = ticket.Customer.CustomerType,
                CompanyName = ticket.Customer.CompanyName
            },
            Order = ticket.Order == null ? null : new AdminWarrantyOrderDto
            {
                Id = ticket.Order.Id,
                OrderCode = ticket.Order.OrderCode,
                CreatedAt = ticket.Order.CreatedAt,
                OrderStatus = ticket.Order.OrderStatus,
                PayableTotal = ticket.Order.PayableTotal
            },
            ContractId = ticket.ContractId,
            Contract = ticket.Contract == null ? null : new AdminWarrantyContractDto
            {
                Id = ticket.Contract.Id,
                ContractNumber = ticket.Contract.ContractNumber,
                Status = ticket.Contract.Status
            },
            Lines = ticket.Lines
                .OrderBy(l => l.Id)
                .Select(l => MapToLineDto(l, now, ticket.Claims))
                .ToList(),
            Claims = ticket.Claims.OrderByDescending(c => c.CreatedAt).Select(c => MapToClaimDto(c, ticket.Lines)).ToList()
        };
    }

    private static AdminWarrantyTicketLineDto MapToLineDto(
        WarrantyTicketLine line,
        DateTime now,
        IEnumerable<WarrantyClaim> claims)
    {
        var eligible = WarrantyCoverageRules.IsLineEligible(line, now);
        return new AdminWarrantyTicketLineDto
        {
            Id = line.Id,
            OrderItemId = line.OrderItemId,
            VariantId = line.VariantId,
            Sku = line.SkuSnapshot ?? line.Variant?.Sku ?? "",
            VariantName = line.Variant?.VariantName ?? "",
            ProductName = line.Variant?.Product?.Name ?? "",
            VariantImageUrl = line.Variant?.ImageUrl,
            ImageUrl = line.Variant?.Product?.ImageUrl,
            Quantity = line.Quantity,
            WarrantyPeriodMonths = line.WarrantyPeriodMonths,
            IssueDate = line.IssueDate,
            ValidUntil = line.ValidUntil,
            IsValid = eligible,
            DaysRemaining = WarrantyCoverageRules.DaysRemaining(line, now),
            ActiveClaimId = WarrantyCoverageRules.FindActiveClaimId(claims, line.OrderItemId)
        };
    }

    private static AdminWarrantyClaimDto MapToClaimDto(
        WarrantyClaim claim,
        IEnumerable<WarrantyTicketLine>? lines = null)
    {
        DateTime? lineValidUntil = null;
        if (claim.OrderItemId.HasValue && lines != null)
        {
            lineValidUntil = lines
                .FirstOrDefault(l => l.OrderItemId == claim.OrderItemId.Value)
                ?.ValidUntil;
        }

        return new AdminWarrantyClaimDto
        {
            Id = claim.Id,
            WarrantyTicketId = claim.WarrantyTicketId,
            OrderItemId = claim.OrderItemId,
            VariantId = claim.VariantId,
            LineValidUntil = lineValidUntil,
            Sku = claim.Variant.Sku,
            VariantName = claim.Variant.VariantName,
            ProductName = claim.Variant.Product.Name,
            ImageUrl = claim.Variant.ImageUrl,
            DefectDescription = claim.DefectDescription,
            ImagesUrl = claim.ImagesUrl,
            Status = claim.Status,
            EstimatedCost = claim.EstimatedCost,
            CreatedAt = claim.CreatedAt,
            ResolvedDate = claim.ResolvedDate,
            Resolution = claim.Resolution,
            Note = claim.Note
        };
    }
}
