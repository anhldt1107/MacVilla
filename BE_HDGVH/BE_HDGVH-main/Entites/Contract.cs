namespace BE_API.Entities;

public class Contract : IEntity
{
    public int Id { get; set; }
    public string ContractNumber { get; set; } = null!;
    public int QuoteId { get; set; }
    public int CustomerId { get; set; }
    public DateTime? SignedDate { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public string? PaymentTerms { get; set; }
    public string? AttachmentUrl { get; set; }
    public string Status { get; set; } = "Draft";

    /// <summary>Thời điểm khách xác nhận hợp đồng</summary>
    public DateTime? CustomerConfirmedAt { get; set; }

    /// <summary>Ghi chú điều khoản bổ sung</summary>
    public string? Notes { get; set; }

    /// <summary>Thời điểm tạo hợp đồng</summary>
    public DateTime CreatedAt { get; set; }

    public Quote Quote { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
    public ICollection<CustomerOrder> Orders { get; set; } = new List<CustomerOrder>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<WarrantyTicket> WarrantyTickets { get; set; } = new List<WarrantyTicket>();
}
