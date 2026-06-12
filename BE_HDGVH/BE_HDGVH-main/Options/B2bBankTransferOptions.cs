namespace BE_API.Options;

/// <summary>
/// Thông tin TK nhận chuyển khoản hiển thị cho cổng B2B (cấu hình không build lại FE).
/// </summary>
public class B2bBankTransferOptions
{
    public const string SectionName = "B2bBankTransfer";

    public string Beneficiary { get; set; } = string.Empty;

    public string AccountNumber { get; set; } = string.Empty;

    public string BankName { get; set; } = string.Empty;

    /// <summary>Tiền tố gợi ý nội dung CK (VD: THANHTOAN)</summary>
    public string TransferSyntaxPrefix { get; set; } = "THANHTOAN";
}
