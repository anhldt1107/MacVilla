namespace BE_API.Entities;

public class ReturnExchangeTicket : IEntity
{
    public int Id { get; set; }
    
    /// <summary>Mã phiếu đổi/trả: RTN{yyyyMMdd}{sequence}</summary>
    public string TicketNumber { get; set; } = null!;
    
    public int OrderId { get; set; }
    public int CustomerId { get; set; }
    
    /// <summary>Loại: Return (trả hàng) hoặc Exchange (đổi hàng)</summary>
    public string Type { get; set; } = "Return";
    
    /// <summary>Lý do đổi/trả</summary>
    public string? Reason { get; set; }
    
    /// <summary>Ghi chú của khách hàng</summary>
    public string? CustomerNote { get; set; }
    
    /// <summary>Ghi chú nội bộ</summary>
    public string? InternalNote { get; set; }
    
    public int? ManagerIdApproved { get; set; }
    
    /// <summary>ID nhân viên kho xử lý</summary>
    public int? StockManagerId { get; set; }
    
    public string Status { get; set; } = "Requested";
    
    /// <summary>Tổng tiền hoàn lại (cho Return)</summary>
    public decimal RefundAmount { get; set; }
    
    /// <summary>Ngày tạo phiếu</summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>Ngày duyệt (approve/reject)</summary>
    public DateTime? ApprovedAt { get; set; }
    
    /// <summary>Ngày hoàn thành</summary>
    public DateTime? CompletedAt { get; set; }

    public CustomerOrder Order { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
    public AppUser? ManagerApproved { get; set; }
    public AppUser? StockManager { get; set; }
    public ICollection<ReturnItem> Items { get; set; } = new List<ReturnItem>();
}
