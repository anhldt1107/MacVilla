namespace BE_API.Service.IService;

/// <summary>
/// Sau khi có giao dịch thanh toán hoàn/hoặc ghép với biên lai (PaymentTransaction có InvoiceId): tính lại trạng thái HĐ và đồng bộ PaymentStatus đơn hàng khi Invoice gắn OrderId.
/// </summary>
public interface IInvoiceAndOrderPaymentSyncService
{
    /// <param name="invoiceId">HĐ vừa ảnh hưởng; null hoặc không tìm thấy thì bỏ qua.</param>
    Task ApplyPaymentTransactionSideEffectsAsync(int? invoiceId, CancellationToken cancellationToken = default);
}
