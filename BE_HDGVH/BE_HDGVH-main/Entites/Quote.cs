namespace BE_API.Entities;

public class Quote : IEntity
{
    public int Id { get; set; }
    public string QuoteCode { get; set; } = null!;
    public int CustomerId { get; set; }
    public int? SalesId { get; set; }
    public int? ManagerId { get; set; }
    public decimal? TotalAmount { get; set; }
    public string? DiscountType { get; set; }
    public decimal? DiscountValue { get; set; }
    public decimal? FinalAmount { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTime CreatedAt { get; set; }

    /// <summary>Ngày hết hạn báo giá</summary>
    public DateTime? ValidUntil { get; set; }

    /// <summary>Ghi chú nội bộ</summary>
    public string? Notes { get; set; }

    /// <summary>Lý do từ chối (khi Manager reject)</summary>
    public string? RejectReason { get; set; }

    /// <summary>Ghi chú ban đầu từ khách khi yêu cầu báo giá</summary>
    public string? CustomerNotes { get; set; }

    /// <summary>Lý do khách từ chối báo giá (khi CustomerRejected)</summary>
    public string? CustomerRejectReason { get; set; }

    /// <summary>Nội dung counter-offer từ khách</summary>
    public string? CounterOfferMessage { get; set; }

    /// <summary>Thời điểm Manager duyệt</summary>
    public DateTime? ApprovedAt { get; set; }

    /// <summary>Thời điểm Manager từ chối</summary>
    public DateTime? RejectedAt { get; set; }

    /// <summary>Thời điểm khách chấp nhận</summary>
    public DateTime? CustomerAcceptedAt { get; set; }

    /// <summary>Thời điểm khách từ chối</summary>
    public DateTime? CustomerRejectedAt { get; set; }

    public Customer Customer { get; set; } = null!;
    public AppUser? Sales { get; set; }
    public AppUser? Manager { get; set; }
    public ICollection<QuoteItem> Items { get; set; } = new List<QuoteItem>();
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
    public ICollection<CustomerOrder> Orders { get; set; } = new List<CustomerOrder>();
}
