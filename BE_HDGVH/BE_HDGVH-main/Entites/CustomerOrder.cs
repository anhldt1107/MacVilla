namespace BE_API.Entities;

/// <summary>
/// Maps to SQL table [Order].
/// </summary>
public class CustomerOrder : IEntity
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = null!;
    public int CustomerId { get; set; }
    public int? QuoteId { get; set; }
    public int? ContractId { get; set; }
    public int? SalesId { get; set; }
    public int? VoucherId { get; set; }
    public string? PaymentMethod { get; set; }
    public string PaymentStatus { get; set; } = "Unpaid";
    public string OrderStatus { get; set; } = "New";
    public int? ShippingAddressId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelReason { get; set; }

    /// <summary>Tổng tiền hàng (trước giảm giá đơn).</summary>
    public decimal MerchandiseTotal { get; set; }

    /// <summary>Giảm giá voucher (đơn cấp).</summary>
    public decimal DiscountTotal { get; set; }

    /// <summary>Tổng thanh toán = MerchandiseTotal - DiscountTotal.</summary>
    public decimal PayableTotal { get; set; }

    /// <summary>Mã link thanh toán payOS (paymentLinkId).</summary>
    public string? PayOsPaymentLinkId { get; set; }

    /// <summary>URL thanh toán payOS cho đơn này.</summary>
    public string? PayOsCheckoutUrl { get; set; }

    /// <summary>Hết hạn link (UTC), để idempotent P1.</summary>
    public DateTime? PayOsLinkExpiresAt { get; set; }

    public Customer Customer { get; set; } = null!;
    public Quote? Quote { get; set; }
    public Contract? Contract { get; set; }
    public AppUser? Sales { get; set; }
    public Voucher? Voucher { get; set; }
    public CustomerAddress? ShippingAddress { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<FulfillmentTicket> FulfillmentTickets { get; set; } = new List<FulfillmentTicket>();
    public ICollection<WarrantyTicket> WarrantyTickets { get; set; } = new List<WarrantyTicket>();
    public ICollection<ReturnExchangeTicket> ReturnExchangeTickets { get; set; } = new List<ReturnExchangeTicket>();
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
}
