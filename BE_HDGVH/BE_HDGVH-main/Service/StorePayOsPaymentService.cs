using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Options;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PayOS;
using PayOS.Exceptions;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;

namespace BE_API.Service;

public class StorePayOsPaymentService(
    BeContext db,
    PayOSClient payOsClient,
    IOptions<PayOsAppOptions> payOptions,
    NotificationBusinessEmitter notificationEmitter,
    ILogger<StorePayOsPaymentService> logger) : IStorePayOsPaymentService
{
    private const string PayOsCheckoutPathFormat = "https://pay.payos.vn/web/{0}";

    private readonly PayOsAppOptions _opt = payOptions.Value;

    public async Task<StorePayOsCreatePaymentResponseDto> CreatePaymentLinkAsync(
        int customerId,
        StorePayOsCreatePaymentDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.OrderCode))
            throw new ArgumentException("Thiếu mã đơn hàng.");

        if (!IsPayOsConfigured())
            throw new InvalidOperationException("Chưa cấu hình payOS (PayOs:ClientId, ApiKey, ChecksumKey).");

        var key = dto.OrderCode.Trim();
        var order = await db.CustomerOrders
            .FirstOrDefaultAsync(
                o => o.CustomerId == customerId && o.OrderCode.ToLower() == key.ToLowerInvariant(),
                cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

        var payOsOrderCode = StoreOrderCodes.TryParsePayOsOrderCode(order.OrderCode)
            ?? throw new InvalidOperationException("Mã đơn không hợp lệ cho payOS.");

        if (!IsPayOsPaymentMethod(order.PaymentMethod))
            throw new InvalidOperationException(
                "Đơn này không dùng thanh toán payOS. Hãy đặt paymentMethod = \"PayOS\" khi tạo đơn.");

        if (!string.Equals(order.PaymentStatus, "Unpaid", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Đơn đã thanh toán hoặc không còn chờ thanh toán.");

        var amountVnd = ToVndAmount(order.PayableTotal);
        if (amountVnd <= 0)
            throw new InvalidOperationException("Số tiền thanh toán không hợp lệ.");

        var returnUrl = FirstNonEmpty(dto.ReturnUrl, _opt.ReturnUrl);
        var cancelUrl = FirstNonEmpty(dto.CancelUrl, _opt.CancelUrl);
        if (string.IsNullOrWhiteSpace(returnUrl) || string.IsNullOrWhiteSpace(cancelUrl))
            throw new InvalidOperationException("Thiếu ReturnUrl hoặc CancelUrl (cấu hình PayOs hoặc gửi kèm body).");

        var now = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(order.PayOsCheckoutUrl)
            && order.PayOsLinkExpiresAt.HasValue
            && order.PayOsLinkExpiresAt.Value > now.AddMinutes(1))
        {
            return MapResponse(order, payOsOrderCode, amountVnd);
        }

        var lifetimeMin = Math.Clamp(_opt.LinkLifetimeMinutes, 5, 7 * 24 * 60);
        var expiredAtUnix = ToUnixSecondsLong(now.AddMinutes(lifetimeMin));

        var existingOnPayOs = await TryGetExistingPaymentLinkAsync(payOsOrderCode, cancellationToken);
        if (existingOnPayOs is not null && IsReusablePendingLink(existingOnPayOs))
        {
            ApplyPaymentLinkToOrder(order, existingOnPayOs, fallbackExpiredAtUnix: expiredAtUnix);
            await db.SaveChangesAsync(cancellationToken);
            return MapResponse(order, payOsOrderCode, amountVnd);
        }

        var description = StoreOrderCodes.BuildPayOsDescription(order.OrderCode);

        var request = new CreatePaymentLinkRequest
        {
            OrderCode = payOsOrderCode,
            Amount = amountVnd,
            Description = description,
            ReturnUrl = returnUrl.Trim(),
            CancelUrl = cancelUrl.Trim(),
            ExpiredAt = expiredAtUnix
        };

        CreatePaymentLinkResponse link;
        try
        {
            link = await payOsClient.PaymentRequests.CreateAsync(request);
        }
        catch (ApiException ex)
        {
            logger.LogWarning(ex, "payOS CreateAsync failed for order {OrderCode}: {Message}", order.OrderCode, ex.Message);
            var recovered = await TryGetExistingPaymentLinkAsync(payOsOrderCode, cancellationToken);
            if (recovered is null)
                throw;

            ApplyPaymentLinkToOrder(order, recovered, fallbackExpiredAtUnix: expiredAtUnix);
            await db.SaveChangesAsync(cancellationToken);
            return MapResponse(order, payOsOrderCode, amountVnd);
        }

        order.PayOsPaymentLinkId = link.PaymentLinkId;
        order.PayOsCheckoutUrl = link.CheckoutUrl;
        order.PayOsLinkExpiresAt = link.ExpiredAt.HasValue
            ? DateTime.UnixEpoch.AddSeconds(link.ExpiredAt.Value)
            : DateTime.UnixEpoch.AddSeconds(expiredAtUnix);
        await db.SaveChangesAsync(cancellationToken);

        return MapResponse(order, payOsOrderCode, amountVnd);
    }

    public async Task ProcessPayOsWebhookAsync(Webhook payload, CancellationToken cancellationToken = default)
    {
        WebhookData data;
        try
        {
            data = await payOsClient.Webhooks.VerifyAsync(payload);
        }
        catch (PayOSException ex)
        {
            logger.LogWarning(ex, "payOS webhook signature verification failed");
            throw;
        }

        if (!string.Equals(data.Code, "00", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogInformation("payOS webhook bỏ qua: data.Code = {Code}", data.Code);
            return;
        }

        if (data.OrderCode is < int.MinValue or > int.MaxValue)
            throw new InvalidOperationException("orderCode payOS không map được sang mã đơn nội bộ.");

        var payOsOrderCode = (int)data.OrderCode;
        var displayOrderCode = StoreOrderCodes.FormatFromPayOsOrderCode(payOsOrderCode);
        var orderExists = await db.CustomerOrders.AnyAsync(o => o.OrderCode == displayOrderCode, cancellationToken);
        if (!orderExists)
        {
            // payOS gửi payload mẫu (vd. orderCode 123) khi kiểm tra URL lúc đăng ký webhook — không có đơn tương ứng trong DB.
            // Phải trả 2xx sau khi verify chữ ký, nếu không payOS báo webhook không hoạt động.
            // https://payos.vn/docs/du-lieu-tra-ve/webhook/
            logger.LogInformation(
                "payOS webhook: chữ ký hợp lệ, không có đơn {OrderCode} — bỏ qua (thử URL / dữ liệu mẫu).",
                displayOrderCode);
            return;
        }

        await ApplyWebhookPaymentSuccessAsync(displayOrderCode, data.Amount, cancellationToken);
    }

    private async Task ApplyWebhookPaymentSuccessAsync(string displayOrderCode, long amountVnd, CancellationToken cancellationToken = default)
    {
        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var order = await db.CustomerOrders
                .FirstOrDefaultAsync(o => o.OrderCode == displayOrderCode, cancellationToken)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn tương ứng mã payOS.");

            if (string.Equals(order.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase))
            {
                await tx.CommitAsync(cancellationToken);
                return;
            }

            var expected = ToVndAmount(order.PayableTotal);
            if (expected != amountVnd)
            {
                logger.LogError(
                    "payOS webhook amount mismatch for order {OrderCode}: expected {Expected}, got {Got}",
                    order.OrderCode, expected, amountVnd);
                throw new InvalidOperationException("Số tiền webhook không khớp đơn hàng.");
            }

            var fromStatus = order.OrderStatus;
            var orderId = order.Id;
            order.PaymentStatus = "Paid";
            order.OrderStatus = OrderStatuses.Confirmed;
            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            await notificationEmitter.OnOrderPaidAsync(orderId, cancellationToken);
            await notificationEmitter.OnOrderStatusChangedAsync(orderId, fromStatus, OrderStatuses.Confirmed, cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<PaymentLink?> TryGetExistingPaymentLinkAsync(int payOsOrderCode, CancellationToken cancellationToken)
    {
        try
        {
            return await payOsClient.PaymentRequests.GetAsync(payOsOrderCode);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "payOS GetAsync failed for payOsOrderCode {PayOsOrderCode}", payOsOrderCode);
            return null;
        }
    }

    private static bool IsReusablePendingLink(PaymentLink link) =>
        link.Status == PaymentLinkStatus.Pending && !string.IsNullOrEmpty(link.Id);

    private static void ApplyPaymentLinkToOrder(CustomerOrder order, PaymentLink link, long? fallbackExpiredAtUnix)
    {
        order.PayOsPaymentLinkId = link.Id;
        order.PayOsCheckoutUrl = CheckoutUrlFromPaymentLinkId(link.Id);
        if (fallbackExpiredAtUnix.HasValue)
            order.PayOsLinkExpiresAt = DateTime.UnixEpoch.AddSeconds(fallbackExpiredAtUnix.Value);
    }

    private static string CheckoutUrlFromPaymentLinkId(string? paymentLinkId) =>
        string.IsNullOrEmpty(paymentLinkId)
            ? ""
            : string.Format(PayOsCheckoutPathFormat, paymentLinkId.Trim());

    private static StorePayOsCreatePaymentResponseDto MapResponse(CustomerOrder order, int payOsOrderCode, long amountVnd) =>
        new()
        {
            OrderCode = order.OrderCode,
            PayOsOrderCode = payOsOrderCode,
            Amount = amountVnd,
            CheckoutUrl = order.PayOsCheckoutUrl ?? "",
            PaymentLinkId = order.PayOsPaymentLinkId,
            LinkExpiresAtUtc = order.PayOsLinkExpiresAt
        };

    private bool IsPayOsConfigured()
    {
        if (!string.IsNullOrWhiteSpace(_opt.ClientId)
            && !string.IsNullOrWhiteSpace(_opt.ApiKey)
            && !string.IsNullOrWhiteSpace(_opt.ChecksumKey))
            return true;

        return !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("PAYOS_CLIENT_ID"))
               && !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("PAYOS_API_KEY"))
               && !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("PAYOS_CHECKSUM_KEY"));
    }

    private static bool IsPayOsPaymentMethod(string? method) =>
        string.Equals(method, "PayOS", StringComparison.OrdinalIgnoreCase)
        || (method is not null
            && (method.Contains("payos", StringComparison.OrdinalIgnoreCase)
                || method.Contains("pay os", StringComparison.OrdinalIgnoreCase)));

    private static string FirstNonEmpty(params string?[] values)
    {
        foreach (var v in values)
        {
            if (!string.IsNullOrWhiteSpace(v))
                return v.Trim();
        }

        return "";
    }

    private static long ToVndAmount(decimal payable) =>
        (long)Math.Round(Math.Max(0, payable), 0, MidpointRounding.AwayFromZero);

    private static long ToUnixSecondsLong(DateTime utc)
    {
        var sec = Math.Clamp((utc - DateTime.UnixEpoch).TotalSeconds, 0, int.MaxValue);
        return (long)sec;
    }
}
