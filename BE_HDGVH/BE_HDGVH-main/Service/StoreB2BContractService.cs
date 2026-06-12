using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class StoreB2BContractService(BeContext db) : IStoreB2BContractService
{
    public async Task<PagedResultDto<StoreB2BContractListItemDto>> GetPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var visibleStatuses = ContractStatuses.VisibleToCustomer;
        var query = db.Contracts
            .AsNoTracking()
            .Include(c => c.Quote)
            .Include(c => c.Orders)
            .Where(c => c.CustomerId == customerId)
            .Where(c => visibleStatuses.Contains(c.Status))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(c => c.Status == status);
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new StoreB2BContractListItemDto
            {
                Id = c.Id,
                ContractNumber = c.ContractNumber,
                Status = c.Status,
                ValidFrom = c.ValidFrom,
                ValidTo = c.ValidTo,
                SignedDate = c.SignedDate,
                CreatedAt = c.CreatedAt,
                QuoteCode = c.Quote.QuoteCode,
                TotalAmount = c.Quote.FinalAmount,
                OrderCount = c.Orders.Count
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<StoreB2BContractListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<StoreB2BContractDetailDto> GetByContractNumberAsync(
        int customerId,
        string contractNumber,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(contractNumber))
            throw new ArgumentException("Mã hợp đồng không được để trống");

        var numberLower = contractNumber.Trim().ToLower();
        var contract = await GetContractWithDetailsAsync(
            c => c.ContractNumber.ToLower() == numberLower && c.CustomerId == customerId,
            cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hợp đồng với mã {contractNumber}");

        if (!ContractStatuses.IsVisibleToCustomer(contract.Status))
            throw new KeyNotFoundException($"Không tìm thấy hợp đồng với mã {contractNumber}");

        return MapToDetailDto(contract);
    }

    public async Task<StoreB2BContractDetailDto> ConfirmAsync(
        int customerId,
        int contractId,
        StoreB2BContractConfirmDto? dto = null,
        CancellationToken cancellationToken = default)
    {
        var contract = await db.Contracts
            .FirstOrDefaultAsync(c => c.Id == contractId && c.CustomerId == customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy hợp đồng");

        if (!ContractStatuses.CanCustomerConfirm(contract.Status))
            throw new InvalidOperationException($"Không thể xác nhận hợp đồng ở trạng thái '{contract.Status}'");

        if (contract.ValidTo.HasValue && contract.ValidTo.Value < DateTime.UtcNow)
            throw new InvalidOperationException("Hợp đồng đã hết hạn");

        contract.Status = ContractStatuses.Confirmed;
        contract.CustomerConfirmedAt = DateTime.UtcNow;
        contract.SignedDate ??= DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto?.Notes))
        {
            contract.Notes = string.IsNullOrWhiteSpace(contract.Notes)
                ? dto.Notes.Trim()
                : $"{contract.Notes}\n---\nKhách ghi chú: {dto.Notes.Trim()}";
        }

        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdInternalAsync(contractId, customerId, cancellationToken);
    }

    private async Task<StoreB2BContractDetailDto> GetByIdInternalAsync(
        int id,
        int customerId,
        CancellationToken cancellationToken)
    {
        var contract = await GetContractWithDetailsAsync(
            c => c.Id == id && c.CustomerId == customerId,
            cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy hợp đồng");

        return MapToDetailDto(contract);
    }

    private async Task<Contract?> GetContractWithDetailsAsync(
        System.Linq.Expressions.Expression<Func<Contract, bool>> predicate,
        CancellationToken cancellationToken)
    {
        return await db.Contracts
            .AsNoTracking()
            .Include(c => c.Quote)
                .ThenInclude(q => q.Items)
                    .ThenInclude(i => i.Variant)
                        .ThenInclude(v => v.Product)
            .Include(c => c.Orders)
            .FirstOrDefaultAsync(predicate, cancellationToken);
    }

    private static StoreB2BContractDetailDto MapToDetailDto(Contract contract)
    {
        return new StoreB2BContractDetailDto
        {
            Id = contract.Id,
            ContractNumber = contract.ContractNumber,
            Status = contract.Status,
            ValidFrom = contract.ValidFrom,
            ValidTo = contract.ValidTo,
            SignedDate = contract.SignedDate,
            CustomerConfirmedAt = contract.CustomerConfirmedAt,
            CreatedAt = contract.CreatedAt,
            PaymentTerms = contract.PaymentTerms,
            AttachmentUrl = contract.AttachmentUrl,
            Notes = contract.Notes,
            TotalAmount = contract.Quote == null
                ? null
                : contract.Quote.FinalAmount ?? contract.Quote.TotalAmount,
            Quote = contract.Quote == null ? null : new StoreB2BContractQuoteDto
            {
                Id = contract.Quote.Id,
                QuoteCode = contract.Quote.QuoteCode,
                TotalAmount = contract.Quote.TotalAmount,
                DiscountValue = contract.Quote.DiscountValue,
                DiscountType = contract.Quote.DiscountType,
                FinalAmount = contract.Quote.FinalAmount,
                ApprovedAt = contract.Quote.ApprovedAt,
                Items = contract.Quote.Items.OrderBy(i => i.Id).Select(i => new StoreB2BContractQuoteItemDto
                {
                    Id = i.Id,
                    VariantId = i.VariantId,
                    Sku = i.Variant.Sku,
                    ProductName = i.Variant.Product.Name,
                    VariantName = i.Variant.VariantName,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    SubTotal = i.SubTotal,
                    ImageUrl = FirstNonWhiteSpace(i.Variant.ImageUrl, i.Variant.Product.ImageUrl),
                    Dimensions = i.Variant.Dimensions,
                    Weight = i.Variant.Weight,
                    WarrantyPeriodMonths = i.Variant.Product.WarrantyPeriodMonths
                }).ToList()
            },
            Orders = contract.Orders.OrderByDescending(o => o.CreatedAt).Select(o => new StoreB2BContractOrderDto
            {
                Id = o.Id,
                OrderCode = o.OrderCode,
                Status = o.OrderStatus,
                PayableTotal = o.PayableTotal,
                CreatedAt = o.CreatedAt
            }).ToList()
        };
    }

    private static string? FirstNonWhiteSpace(params string?[] values)
    {
        foreach (var v in values)
        {
            if (!string.IsNullOrWhiteSpace(v))
                return v.Trim();
        }
        return null;
    }
}
