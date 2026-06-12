using BE_API.Dto.Store;
using PayOS.Models.Webhooks;

namespace BE_API.Service.IService;

public interface IStorePayOsPaymentService
{
    Task<StorePayOsCreatePaymentResponseDto> CreatePaymentLinkAsync(
        int customerId,
        StorePayOsCreatePaymentDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>Xác minh chữ ký (SDK) và cập nhật đơn khi giao dịch thành công (data.Code = 00).</summary>
    Task ProcessPayOsWebhookAsync(Webhook payload, CancellationToken cancellationToken = default);
}
