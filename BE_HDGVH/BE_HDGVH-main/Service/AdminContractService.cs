using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminContractService(BeContext db) : IAdminContractService
{
    private static readonly string[] BlockingStatusesForNewContract =
    [
        ContractStatuses.Draft,
        ContractStatuses.PendingConfirmation,
        ContractStatuses.Confirmed,
        ContractStatuses.Active
    ];

    public async Task<PagedResultDto<AdminContractListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        int? customerId = null,
        int? quoteId = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Contracts
            .AsNoTracking()
            .Include(c => c.Quote)
            .Include(c => c.Customer)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(c => c.Status == status);

        if (customerId.HasValue)
            query = query.Where(c => c.CustomerId == customerId.Value);

        if (quoteId.HasValue)
            query = query.Where(c => c.QuoteId == quoteId.Value);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminContractListItemDto
            {
                Id = c.Id,
                ContractNumber = c.ContractNumber,
                Status = c.Status,
                QuoteId = c.QuoteId,
                QuoteCode = c.Quote.QuoteCode,
                CustomerId = c.CustomerId,
                CustomerName = c.Customer.FullName,
                ValidFrom = c.ValidFrom,
                ValidTo = c.ValidTo,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminContractListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminContractDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var contract = await GetTrackedWithIncludesAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hợp đồng ID {id}");

        return MapDetail(contract);
    }

    public async Task<AdminContractDetailDto> GetByNumberAsync(string contractNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(contractNumber))
            throw new ArgumentException("Mã hợp đồng không được để trống");

        var n = contractNumber.Trim().ToLower();
        var contract = await db.Contracts
            .AsNoTracking()
            .Include(c => c.Quote)
            .Include(c => c.Customer)
            .FirstOrDefaultAsync(c => c.ContractNumber.ToLower() == n, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hợp đồng {contractNumber}");

        return MapDetail(contract);
    }

    public async Task<AdminContractDetailDto> CreateAsync(AdminContractCreateDto dto, CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes
            .Include(q => q.Customer)
            .FirstOrDefaultAsync(q => q.Id == dto.QuoteId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy báo giá");

        if (!string.Equals(quote.Customer.CustomerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Hợp đồng chỉ áp dụng cho khách B2B");

        if (quote.Status is not (QuoteStatuses.Approved or QuoteStatuses.CustomerAccepted))
            throw new InvalidOperationException(
                $"Chỉ tạo hợp đồng khi báo giá ở trạng thái {QuoteStatuses.Approved} hoặc {QuoteStatuses.CustomerAccepted} (hiện: {quote.Status})");

        var hasBlocking = await db.Contracts.AnyAsync(
            c => c.QuoteId == quote.Id && BlockingStatusesForNewContract.Contains(c.Status),
            cancellationToken);

        if (hasBlocking)
            throw new InvalidOperationException("Báo giá đã có hợp đồng đang mở (Draft / chờ khách / đã xác nhận / đang thực hiện).");

        var number = await ContractCodes.GenerateUniqueAsync(db.Contracts, cancellationToken);
        var status = dto.SendForCustomerConfirmation
            ? ContractStatuses.PendingConfirmation
            : ContractStatuses.Draft;

        var entity = new Contract
        {
            ContractNumber = number,
            QuoteId = quote.Id,
            CustomerId = quote.CustomerId,
            Status = status,
            ValidFrom = dto.ValidFrom,
            ValidTo = dto.ValidTo,
            PaymentTerms = string.IsNullOrWhiteSpace(dto.PaymentTerms) ? null : dto.PaymentTerms.Trim(),
            AttachmentUrl = string.IsNullOrWhiteSpace(dto.AttachmentUrl) ? null : dto.AttachmentUrl.Trim(),
            Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await db.Contracts.AddAsync(entity, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<AdminContractDetailDto> UpdateAsync(
        int id,
        AdminContractUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var contract = await GetTrackedWithIncludesAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hợp đồng ID {id}");

        if (contract.Status is not (ContractStatuses.Draft or ContractStatuses.PendingConfirmation))
            throw new InvalidOperationException($"Không sửa được hợp đồng ở trạng thái '{contract.Status}'");

        if (string.Equals(contract.Status, ContractStatuses.PendingConfirmation, StringComparison.OrdinalIgnoreCase) &&
            contract.CustomerConfirmedAt.HasValue)
            throw new InvalidOperationException("Khách đã xác nhận, không được sửa.");

        contract.ValidFrom = dto.ValidFrom;
        contract.ValidTo = dto.ValidTo;
        if (dto.PaymentTerms != null)
            contract.PaymentTerms = string.IsNullOrWhiteSpace(dto.PaymentTerms) ? null : dto.PaymentTerms.Trim();
        if (dto.AttachmentUrl != null)
            contract.AttachmentUrl = string.IsNullOrWhiteSpace(dto.AttachmentUrl) ? null : dto.AttachmentUrl.Trim();
        if (dto.Notes != null)
            contract.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();

        await db.SaveChangesAsync(cancellationToken);

        return MapDetail(contract);
    }

    public async Task<AdminContractDetailDto> SendForCustomerConfirmationAsync(int id, CancellationToken cancellationToken = default)
    {
        var contract = await GetTrackedWithIncludesAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hợp đồng ID {id}");

        if (!ContractStatuses.CanTransition(contract.Status, ContractStatuses.PendingConfirmation))
            throw new InvalidOperationException($"Không thể gửi khách xác nhận từ trạng thái '{contract.Status}'");

        contract.Status = ContractStatuses.PendingConfirmation;
        await db.SaveChangesAsync(cancellationToken);

        return MapDetail(contract);
    }

    public async Task<AdminContractDetailDto> CancelAsync(
        int id,
        AdminContractCancelDto dto,
        CancellationToken cancellationToken = default)
    {
        var contract = await GetTrackedWithIncludesAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hợp đồng ID {id}");

        if (!ContractStatuses.CanTransition(contract.Status, ContractStatuses.Cancelled))
            throw new InvalidOperationException($"Không thể hủy hợp đồng ở trạng thái '{contract.Status}'");

        contract.Status = ContractStatuses.Cancelled;
        var reason = string.IsNullOrWhiteSpace(dto.Reason) ? "Đã hủy" : dto.Reason.Trim();
        contract.Notes = string.IsNullOrWhiteSpace(contract.Notes)
            ? $"[Hủy] {reason}"
            : $"{contract.Notes}\n---\n[Hủy] {reason}";

        await db.SaveChangesAsync(cancellationToken);

        return MapDetail(contract);
    }

    private async Task<Contract?> GetTrackedWithIncludesAsync(int id, CancellationToken cancellationToken) =>
        await db.Contracts
            .Include(c => c.Quote)
            .Include(c => c.Customer)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    private static AdminContractDetailDto MapDetail(Contract c) => new()
    {
        Id = c.Id,
        ContractNumber = c.ContractNumber,
        Status = c.Status,
        QuoteId = c.QuoteId,
        QuoteCode = c.Quote.QuoteCode,
        CustomerId = c.CustomerId,
        CustomerName = c.Customer.FullName,
        SignedDate = c.SignedDate,
        ValidFrom = c.ValidFrom,
        ValidTo = c.ValidTo,
        PaymentTerms = c.PaymentTerms,
        AttachmentUrl = c.AttachmentUrl,
        Notes = c.Notes,
        CustomerConfirmedAt = c.CustomerConfirmedAt,
        CreatedAt = c.CreatedAt
    };
}
