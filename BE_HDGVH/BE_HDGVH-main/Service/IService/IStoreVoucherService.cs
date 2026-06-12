using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface IStoreVoucherService
{
    Task<StoreVoucherValidateResponseDto> ValidateAsync(
        StoreVoucherValidateRequestDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>Danh sách mã đang mở bán + cờ áp dụng được với tạm tính giỏ hiện tại.</summary>
    Task<StoreCartVouchersResponseDto> ListForCartAsync(
        int customerId,
        CancellationToken cancellationToken = default);
}
