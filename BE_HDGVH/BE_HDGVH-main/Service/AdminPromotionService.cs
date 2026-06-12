using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.Promotion;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminPromotionService(
    IRepository<PromotionCampaign> campaignRepo,
    IRepository<Voucher> voucherRepo) : IAdminPromotionService
{
    public async Task<PagedResultDto<CampaignListItemDto>> GetCampaignsPagedAsync(
        int page,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = campaignRepo.Get().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(c => c.Status == status);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CampaignListItemDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                Status = c.Status,
                VoucherCount = c.Vouchers.Count
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<CampaignListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<CampaignDetailDto> GetCampaignByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var dto = await campaignRepo.Get()
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CampaignDetailDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                Status = c.Status,
                Vouchers = c.Vouchers.Select(v => new VoucherListItemDto
                {
                    Id = v.Id,
                    CampaignId = v.CampaignId,
                    CampaignName = c.Name,
                    Code = v.Code,
                    DiscountType = v.DiscountType,
                    DiscountValue = v.DiscountValue,
                    MinOrderValue = v.MinOrderValue,
                    MaxDiscountAmount = v.MaxDiscountAmount,
                    UsageLimit = v.UsageLimit,
                    UsedCount = v.UsedCount,
                    Status = v.Status
                }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy chiến dịch");

        return dto;
    }

    public async Task<CampaignDetailDto> CreateCampaignAsync(CampaignCreateDto dto, CancellationToken cancellationToken = default)
    {
        var status = string.IsNullOrWhiteSpace(dto.Status) ? CampaignStatuses.Active : dto.Status.Trim();

        if (!CampaignStatuses.IsValid(status))
            throw new InvalidOperationException($"Trạng thái không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", CampaignStatuses.All)}");

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.StartDate > dto.EndDate)
            throw new InvalidOperationException("Ngày bắt đầu không được sau ngày kết thúc");

        var entity = new PromotionCampaign
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Status = status
        };

        await campaignRepo.AddAsync(entity, cancellationToken);
        await campaignRepo.SaveChangesAsync(cancellationToken);

        return await GetCampaignByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<CampaignDetailDto> UpdateCampaignAsync(int id, CampaignUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await campaignRepo.Get()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy chiến dịch");

        if (!CampaignStatuses.IsValid(dto.Status))
            throw new InvalidOperationException($"Trạng thái không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", CampaignStatuses.All)}");

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.StartDate > dto.EndDate)
            throw new InvalidOperationException("Ngày bắt đầu không được sau ngày kết thúc");

        entity.Name = dto.Name.Trim();
        entity.Description = dto.Description?.Trim();
        entity.StartDate = dto.StartDate;
        entity.EndDate = dto.EndDate;
        entity.Status = dto.Status.Trim();

        campaignRepo.Update(entity);
        await campaignRepo.SaveChangesAsync(cancellationToken);

        return await GetCampaignByIdAsync(id, cancellationToken);
    }

    public async Task DeleteCampaignAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await campaignRepo.Get()
            .Include(c => c.Vouchers)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy chiến dịch");

        var hasUsedVouchers = entity.Vouchers.Any(v => v.UsedCount > 0);
        if (hasUsedVouchers)
            throw new InvalidOperationException("Không thể xóa chiến dịch có voucher đã được sử dụng");

        if (entity.Vouchers.Count > 0)
            voucherRepo.DeleteRange(entity.Vouchers);

        campaignRepo.Delete(entity);
        await campaignRepo.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedResultDto<VoucherListItemDto>> GetVouchersPagedAsync(
        int page,
        int pageSize,
        int? campaignId,
        string? status,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = voucherRepo.Get().AsNoTracking();

        if (campaignId.HasValue)
            query = query.Where(v => v.CampaignId == campaignId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(v => v.Status == status);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(v => v.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new VoucherListItemDto
            {
                Id = v.Id,
                CampaignId = v.CampaignId,
                CampaignName = v.Campaign.Name,
                Code = v.Code,
                DiscountType = v.DiscountType,
                DiscountValue = v.DiscountValue,
                MinOrderValue = v.MinOrderValue,
                MaxDiscountAmount = v.MaxDiscountAmount,
                UsageLimit = v.UsageLimit,
                UsedCount = v.UsedCount,
                Status = v.Status
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<VoucherListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<VoucherDetailDto> GetVoucherByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var dto = await voucherRepo.Get()
            .AsNoTracking()
            .Where(v => v.Id == id)
            .Select(v => new VoucherDetailDto
            {
                Id = v.Id,
                CampaignId = v.CampaignId,
                CampaignName = v.Campaign.Name,
                Code = v.Code,
                DiscountType = v.DiscountType,
                DiscountValue = v.DiscountValue,
                MinOrderValue = v.MinOrderValue,
                MaxDiscountAmount = v.MaxDiscountAmount,
                UsageLimit = v.UsageLimit,
                UsedCount = v.UsedCount,
                Status = v.Status
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy voucher");

        return dto;
    }

    public async Task<VoucherDetailDto> CreateVoucherAsync(VoucherCreateDto dto, CancellationToken cancellationToken = default)
    {
        var campaignExists = await campaignRepo.Get()
            .AnyAsync(c => c.Id == dto.CampaignId, cancellationToken);
        if (!campaignExists)
            throw new KeyNotFoundException("Không tìm thấy chiến dịch");

        if (!VoucherDiscountTypes.IsValid(dto.DiscountType))
            throw new InvalidOperationException($"Loại giảm giá không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", VoucherDiscountTypes.All)}");

        var status = string.IsNullOrWhiteSpace(dto.Status) ? VoucherStatuses.Active : dto.Status.Trim();
        if (!VoucherStatuses.IsValid(status))
            throw new InvalidOperationException($"Trạng thái không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", VoucherStatuses.All)}");

        var code = dto.Code.Trim().ToUpperInvariant();
        await EnsureCodeUniqueAsync(code, null, cancellationToken);

        ValidateDiscountValue(dto.DiscountType, dto.DiscountValue);

        var entity = new Voucher
        {
            CampaignId = dto.CampaignId,
            Code = code,
            DiscountType = dto.DiscountType.Trim(),
            DiscountValue = dto.DiscountValue,
            MinOrderValue = dto.MinOrderValue,
            MaxDiscountAmount = dto.MaxDiscountAmount,
            UsageLimit = dto.UsageLimit,
            UsedCount = 0,
            Status = status
        };

        await voucherRepo.AddAsync(entity, cancellationToken);
        await voucherRepo.SaveChangesAsync(cancellationToken);

        return await GetVoucherByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<VoucherDetailDto> UpdateVoucherAsync(int id, VoucherUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await voucherRepo.Get()
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy voucher");

        var campaignExists = await campaignRepo.Get()
            .AnyAsync(c => c.Id == dto.CampaignId, cancellationToken);
        if (!campaignExists)
            throw new KeyNotFoundException("Không tìm thấy chiến dịch");

        if (!VoucherDiscountTypes.IsValid(dto.DiscountType))
            throw new InvalidOperationException($"Loại giảm giá không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", VoucherDiscountTypes.All)}");

        if (!VoucherStatuses.IsValid(dto.Status))
            throw new InvalidOperationException($"Trạng thái không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", VoucherStatuses.All)}");

        var code = dto.Code.Trim().ToUpperInvariant();
        await EnsureCodeUniqueAsync(code, id, cancellationToken);

        ValidateDiscountValue(dto.DiscountType, dto.DiscountValue);

        entity.CampaignId = dto.CampaignId;
        entity.Code = code;
        entity.DiscountType = dto.DiscountType.Trim();
        entity.DiscountValue = dto.DiscountValue;
        entity.MinOrderValue = dto.MinOrderValue;
        entity.MaxDiscountAmount = dto.MaxDiscountAmount;
        entity.UsageLimit = dto.UsageLimit;
        entity.Status = dto.Status.Trim();

        voucherRepo.Update(entity);
        await voucherRepo.SaveChangesAsync(cancellationToken);

        return await GetVoucherByIdAsync(id, cancellationToken);
    }

    public async Task<VoucherDetailDto> UpdateVoucherStatusAsync(int id, VoucherStatusUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await voucherRepo.Get()
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy voucher");

        if (!VoucherStatuses.IsValid(dto.Status))
            throw new InvalidOperationException($"Trạng thái không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", VoucherStatuses.All)}");

        entity.Status = dto.Status.Trim();

        voucherRepo.Update(entity);
        await voucherRepo.SaveChangesAsync(cancellationToken);

        return await GetVoucherByIdAsync(id, cancellationToken);
    }

    private async Task EnsureCodeUniqueAsync(string code, int? exceptId, CancellationToken cancellationToken)
    {
        var q = voucherRepo.Get().Where(v => v.Code.ToUpper() == code.ToUpper());
        if (exceptId.HasValue)
            q = q.Where(v => v.Id != exceptId.Value);

        if (await q.AnyAsync(cancellationToken))
            throw new InvalidOperationException("Mã voucher đã tồn tại");
    }

    private static void ValidateDiscountValue(string discountType, decimal discountValue)
    {
        if (string.Equals(discountType, VoucherDiscountTypes.Percentage, StringComparison.OrdinalIgnoreCase))
        {
            if (discountValue < 0 || discountValue > 100)
                throw new InvalidOperationException("Phần trăm giảm giá phải từ 0 đến 100");
        }
        else if (discountValue < 0)
        {
            throw new InvalidOperationException("Giá trị giảm không được âm");
        }
    }
}
