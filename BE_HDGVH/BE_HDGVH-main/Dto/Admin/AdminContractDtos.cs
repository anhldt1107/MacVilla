namespace BE_API.Dto.Admin;

public class AdminContractCreateDto
{
    public int QuoteId { get; set; }

    /// <summary>true: gửi khách xác nhận (PendingConfirmation); false: lưu nháp nội bộ (Draft).</summary>
    public bool SendForCustomerConfirmation { get; set; }

    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public string? PaymentTerms { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? Notes { get; set; }
}

public class AdminContractUpdateDto
{
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public string? PaymentTerms { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? Notes { get; set; }
}

public class AdminContractCancelDto
{
    public string? Reason { get; set; }
}

public class AdminContractListItemDto
{
    public int Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int QuoteId { get; set; }
    public string QuoteCode { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminContractDetailDto
{
    public int Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int QuoteId { get; set; }
    public string QuoteCode { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime? SignedDate { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public string? PaymentTerms { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? Notes { get; set; }
    public DateTime? CustomerConfirmedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
