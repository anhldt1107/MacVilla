namespace BE_API.Domain;

/// <summary>
/// Trạng thái báo giá B2B
/// </summary>
public static class QuoteStatuses
{
    /// <summary>Khách B2B gửi yêu cầu báo giá, chờ Sales xử lý</summary>
    public const string Requested = "Requested";

    /// <summary>Nháp - Sales đang soạn báo giá</summary>
    public const string Draft = "Draft";

    /// <summary>Chờ duyệt - đã gửi Manager duyệt</summary>
    public const string PendingApproval = "PendingApproval";

    /// <summary>Đã duyệt - Manager đã approve (đã gửi cho khách)</summary>
    public const string Approved = "Approved";

    /// <summary>Bị từ chối - Manager reject</summary>
    public const string Rejected = "Rejected";

    /// <summary>Khách chấp nhận báo giá</summary>
    public const string CustomerAccepted = "CustomerAccepted";

    /// <summary>Khách từ chối báo giá</summary>
    public const string CustomerRejected = "CustomerRejected";

    /// <summary>Khách gửi phản hồi thương lượng (counter-offer)</summary>
    public const string CounterOffer = "CounterOffer";

    /// <summary>Đã chuyển thành đơn hàng</summary>
    public const string Converted = "Converted";

    /// <summary>Hết hạn báo giá</summary>
    public const string Expired = "Expired";

    public static readonly string[] All =
    [
        Requested,
        Draft,
        PendingApproval,
        Approved,
        Rejected,
        CustomerAccepted,
        CustomerRejected,
        CounterOffer,
        Converted,
        Expired
    ];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) &&
        All.Contains(status, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Kiểm tra chuyển trạng thái có hợp lệ không
    /// </summary>
    public static bool CanTransition(string from, string to)
    {
        if (string.Equals(from, to, StringComparison.OrdinalIgnoreCase))
            return false;

        return (from, to) switch
        {
            // Luồng từ yêu cầu khách B2B
            (Requested, Draft) => true,

            // Luồng Sales/Manager xử lý nội bộ
            (Draft, PendingApproval) => true,
            (Draft, Expired) => true,
            (PendingApproval, Approved) => true,
            (PendingApproval, Rejected) => true,
            (PendingApproval, Draft) => true,
            (Rejected, Draft) => true,

            // Luồng khách phản hồi
            (Approved, CustomerAccepted) => true,
            (Approved, CustomerRejected) => true,
            (Approved, CounterOffer) => true,
            (Approved, Expired) => true,

            // Luồng sau khi khách accept
            (CustomerAccepted, Converted) => true,

            // Luồng counter-offer có thể quay lại Draft để Sales chỉnh sửa
            (CounterOffer, Draft) => true,

            _ => false
        };
    }

    /// <summary>
    /// Có thể chỉnh sửa báo giá không (chỉ khi Draft)
    /// </summary>
    public static bool CanEdit(string status) =>
        string.Equals(status, Draft, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Có thể gửi duyệt không (chỉ khi Draft)
    /// </summary>
    public static bool CanSubmit(string status) =>
        string.Equals(status, Draft, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Có thể duyệt không (chỉ khi PendingApproval)
    /// </summary>
    public static bool CanApprove(string status) =>
        string.Equals(status, PendingApproval, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Có thể từ chối không (chỉ khi PendingApproval)
    /// </summary>
    public static bool CanReject(string status) =>
        string.Equals(status, PendingApproval, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Có thể chuyển thành đơn hàng không (chỉ khi CustomerAccepted)
    /// </summary>
    public static bool CanConvert(string status) =>
        string.Equals(status, CustomerAccepted, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Khách có thể chấp nhận báo giá không (chỉ khi Approved và chưa hết hạn)
    /// </summary>
    public static bool CanCustomerAccept(string status) =>
        string.Equals(status, Approved, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Khách có thể từ chối báo giá không (chỉ khi Approved)
    /// </summary>
    public static bool CanCustomerReject(string status) =>
        string.Equals(status, Approved, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Khách có thể gửi counter-offer không (chỉ khi Approved)
    /// </summary>
    public static bool CanCounterOffer(string status) =>
        string.Equals(status, Approved, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Trạng thái báo giá khách B2B được xem (danh sách + chi tiết): toàn bộ <see cref="All"/> — theo dõi cả chờ duyệt, từ chối, nháp nội bộ.
    /// </summary>
    public static readonly string[] VisibleToCustomer = All;

    public static bool IsVisibleToCustomer(string status) =>
        VisibleToCustomer.Contains(status, StringComparer.OrdinalIgnoreCase);
}
