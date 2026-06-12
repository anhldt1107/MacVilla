using BE_API.Dto.Common;
using BE_API.Dto.Promotion;

namespace BE_API.Service.IService;

public interface IAdminPromotionService
{
    Task<PagedResultDto<CampaignListItemDto>> GetCampaignsPagedAsync(
        int page,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default);

    Task<CampaignDetailDto> GetCampaignByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<CampaignDetailDto> CreateCampaignAsync(CampaignCreateDto dto, CancellationToken cancellationToken = default);

    Task<CampaignDetailDto> UpdateCampaignAsync(int id, CampaignUpdateDto dto, CancellationToken cancellationToken = default);

    Task DeleteCampaignAsync(int id, CancellationToken cancellationToken = default);

    Task<PagedResultDto<VoucherListItemDto>> GetVouchersPagedAsync(
        int page,
        int pageSize,
        int? campaignId,
        string? status,
        CancellationToken cancellationToken = default);

    Task<VoucherDetailDto> GetVoucherByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<VoucherDetailDto> CreateVoucherAsync(VoucherCreateDto dto, CancellationToken cancellationToken = default);

    Task<VoucherDetailDto> UpdateVoucherAsync(int id, VoucherUpdateDto dto, CancellationToken cancellationToken = default);

    Task<VoucherDetailDto> UpdateVoucherStatusAsync(int id, VoucherStatusUpdateDto dto, CancellationToken cancellationToken = default);
}
