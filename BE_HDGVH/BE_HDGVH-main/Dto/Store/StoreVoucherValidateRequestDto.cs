using System.ComponentModel.DataAnnotations;

namespace BE_API.Dto.Store;

public class StoreVoucherValidateRequestDto
{
    [Required(ErrorMessage = "Mã voucher là bắt buộc.")]
    [MaxLength(450)]
    public string Code { get; set; } = string.Empty;

    /// <summary>Tạm tính giỏ (sau giảm SP nếu có); bỏ qua thì chỉ kiểm tra mã hợp lệ, không trả số tiền giảm.</summary>
    public decimal? SubTotal { get; set; }
}
