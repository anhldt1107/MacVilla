using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminInvoiceService(BeContext db, NotificationBusinessEmitter notificationEmitter) : IAdminInvoiceService
{
    public async Task<PagedResultDto<AdminInvoiceListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        int? customerId = null,
        int? orderId = null,
        DateTime? fromDueDate = null,
        DateTime? toDueDate = null,
        DateTime? fromIssueDate = null,
        DateTime? toIssueDate = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.Order)
            .Include(i => i.PaymentTransactions)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(i => i.Status == status);
        }

        if (customerId.HasValue)
        {
            query = query.Where(i => i.CustomerId == customerId.Value);
        }

        if (orderId.HasValue)
        {
            query = query.Where(i => i.OrderId == orderId.Value);
        }

        if (fromDueDate.HasValue)
        {
            query = query.Where(i => i.DueDate >= fromDueDate.Value);
        }
        if (toDueDate.HasValue)
        {
            var endDate = toDueDate.Value.Date.AddDays(1);
            query = query.Where(i => i.DueDate < endDate);
        }

        if (fromIssueDate.HasValue)
        {
            query = query.Where(i => i.IssueDate >= fromIssueDate.Value);
        }
        if (toIssueDate.HasValue)
        {
            var endDate = toIssueDate.Value.Date.AddDays(1);
            query = query.Where(i => i.IssueDate < endDate);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower().Trim();
            query = query.Where(i =>
                i.InvoiceNumber.ToLower().Contains(searchLower) ||
                i.Customer.FullName.ToLower().Contains(searchLower) ||
                (i.Customer.Phone != null && i.Customer.Phone.Contains(searchLower)) ||
                (i.Customer.CompanyName != null && i.Customer.CompanyName.ToLower().Contains(searchLower)) ||
                (i.Customer.TaxCode != null && i.Customer.TaxCode.Contains(searchLower)) ||
                (i.Order != null && i.Order.OrderCode.ToLower().Contains(searchLower)));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(i => i.IssueDate)
            .ThenByDescending(i => i.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new AdminInvoiceListItemDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                IssueDate = i.IssueDate,
                DueDate = i.DueDate,
                Status = i.Status,
                SubTotal = i.SubTotal,
                TaxAmount = i.TaxAmount,
                TotalAmount = i.TotalAmount,
                PaidAmount = i.PaymentTransactions
                    .Where(pt => pt.TransactionType == PaymentTransactionTypes.Payment ||
                                 pt.TransactionType == PaymentTransactionTypes.AdjustmentIncrease)
                    .Sum(pt => pt.Amount) -
                    i.PaymentTransactions
                    .Where(pt => pt.TransactionType == PaymentTransactionTypes.Refund ||
                                 pt.TransactionType == PaymentTransactionTypes.AdjustmentDecrease)
                    .Sum(pt => pt.Amount),
                RemainingAmount = (i.TotalAmount ?? 0) -
                    (i.PaymentTransactions
                        .Where(pt => pt.TransactionType == PaymentTransactionTypes.Payment ||
                                     pt.TransactionType == PaymentTransactionTypes.AdjustmentIncrease)
                        .Sum(pt => pt.Amount) -
                     i.PaymentTransactions
                        .Where(pt => pt.TransactionType == PaymentTransactionTypes.Refund ||
                                     pt.TransactionType == PaymentTransactionTypes.AdjustmentDecrease)
                        .Sum(pt => pt.Amount)),
                CustomerId = i.CustomerId,
                CustomerName = i.Customer.FullName,
                CustomerPhone = i.Customer.Phone,
                CustomerEmail = i.Customer.Email,
                CompanyName = i.Customer.CompanyName,
                TaxCode = i.Customer.TaxCode,
                OrderId = i.OrderId,
                OrderCode = i.Order != null ? i.Order.OrderCode : null,
                ContractId = i.ContractId
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminInvoiceListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminInvoiceDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var invoice = await GetInvoiceWithDetailsAsync(i => i.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hóa đơn với ID {id}");

        return MapToDetailDto(invoice);
    }

    public async Task<AdminInvoiceDetailDto> GetByNumberAsync(string invoiceNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(invoiceNumber))
            throw new ArgumentException("Số hóa đơn không được để trống");

        var numberLower = invoiceNumber.Trim().ToLower();
        var invoice = await GetInvoiceWithDetailsAsync(i => i.InvoiceNumber.ToLower() == numberLower, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hóa đơn với số {invoiceNumber}");

        return MapToDetailDto(invoice);
    }

    public async Task<AdminInvoiceDetailDto> CreateAsync(
        AdminInvoiceCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var customer = await db.Customers
            .FirstOrDefaultAsync(c => c.Id == dto.CustomerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy khách hàng");

        if (dto.OrderId.HasValue)
        {
            var orderExists = await db.CustomerOrders.AnyAsync(
                o => o.Id == dto.OrderId.Value && o.CustomerId == dto.CustomerId,
                cancellationToken);
            if (!orderExists)
                throw new InvalidOperationException("Đơn hàng không tồn tại hoặc không thuộc về khách hàng này");
        }

        if (dto.ContractId.HasValue)
        {
            var contractExists = await db.Contracts.AnyAsync(
                c => c.Id == dto.ContractId.Value && c.CustomerId == dto.CustomerId,
                cancellationToken);
            if (!contractExists)
                throw new InvalidOperationException("Hợp đồng không tồn tại hoặc không thuộc về khách hàng này");
        }

        if (dto.SubTotal < 0)
            throw new ArgumentException("Tiền trước thuế không được âm");

        var taxAmount = dto.TaxAmount ?? dto.SubTotal * 0.1m;
        var totalAmount = dto.SubTotal + taxAmount;

        var invoiceNumber = await GenerateInvoiceNumberAsync(cancellationToken);

        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            CustomerId = dto.CustomerId,
            OrderId = dto.OrderId,
            ContractId = dto.ContractId,
            TaxCode = dto.TaxCode ?? customer.TaxCode,
            CompanyName = dto.CompanyName ?? customer.CompanyName,
            BillingAddress = dto.BillingAddress ?? customer.CompanyAddress,
            SubTotal = dto.SubTotal,
            TaxAmount = taxAmount,
            TotalAmount = totalAmount,
            IssueDate = DateTime.UtcNow,
            DueDate = dto.DueDate,
            Status = InvoiceStatuses.Unpaid
        };

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await db.Invoices.AddAsync(invoice, cancellationToken);

            if (string.Equals(customer.CustomerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase))
            {
                customer.DebtBalance += totalAmount;
            }

            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
            await notificationEmitter.OnInvoiceIssuedAsync(invoice.Id, cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }

        return await GetByIdAsync(invoice.Id, cancellationToken);
    }

    public async Task<AdminInvoiceDetailDto> UpdateAsync(
        int id,
        AdminInvoiceUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var invoice = await db.Invoices.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hóa đơn với ID {id}");

        if (!InvoiceStatuses.CanEdit(invoice.Status))
            throw new InvalidOperationException($"Không thể chỉnh sửa hóa đơn ở trạng thái '{invoice.Status}'");

        if (dto.TaxCode != null)
            invoice.TaxCode = dto.TaxCode;

        if (dto.CompanyName != null)
            invoice.CompanyName = dto.CompanyName;

        if (dto.BillingAddress != null)
            invoice.BillingAddress = dto.BillingAddress;

        if (dto.DueDate.HasValue)
            invoice.DueDate = dto.DueDate;

        if (dto.PdfUrl != null)
            invoice.PdfUrl = dto.PdfUrl;

        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminInvoiceDetailDto> CancelAsync(
        int id,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var invoice = await db.Invoices
            .Include(i => i.PaymentTransactions)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hóa đơn với ID {id}");

        if (!InvoiceStatuses.CanCancel(invoice.Status))
            throw new InvalidOperationException($"Không thể hủy hóa đơn ở trạng thái '{invoice.Status}'");

        var paidAmount = InvoicePaymentBalance.GetGrossReceived(invoice.PaymentTransactions);

        if (paidAmount > 0)
            throw new InvalidOperationException("Không thể hủy hóa đơn đã có thanh toán. Vui lòng hoàn tiền trước.");

        var customer = await db.Customers.FindAsync([invoice.CustomerId], cancellationToken);

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            invoice.Status = InvoiceStatuses.Cancelled;

            if (customer != null &&
                string.Equals(customer.CustomerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase))
            {
                customer.DebtBalance -= invoice.TotalAmount ?? 0m;
                if (customer.DebtBalance < 0)
                    customer.DebtBalance = 0;
            }

            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }

        return await GetByIdAsync(id, cancellationToken);
    }

    private async Task<Invoice?> GetInvoiceWithDetailsAsync(
        System.Linq.Expressions.Expression<Func<Invoice, bool>> predicate,
        CancellationToken cancellationToken)
    {
        return await db.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.Order)
            .Include(i => i.PaymentTransactions)
            .FirstOrDefaultAsync(predicate, cancellationToken);
    }

    private static AdminInvoiceDetailDto MapToDetailDto(Invoice invoice)
    {
        var paidAmount = InvoicePaymentBalance.GetGrossReceived(invoice.PaymentTransactions);
        var remainingAmount = InvoicePaymentBalance.GetRemaining(invoice);

        return new AdminInvoiceDetailDto
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            IssueDate = invoice.IssueDate,
            DueDate = invoice.DueDate,
            Status = invoice.Status,
            SubTotal = invoice.SubTotal,
            TaxAmount = invoice.TaxAmount,
            TotalAmount = invoice.TotalAmount,
            PaidAmount = paidAmount,
            RemainingAmount = remainingAmount,
            TaxCodeOnInvoice = invoice.TaxCode,
            CompanyNameOnInvoice = invoice.CompanyName,
            BillingAddress = invoice.BillingAddress,
            PdfUrl = invoice.PdfUrl,
            ContractId = invoice.ContractId,
            Customer = new AdminInvoiceCustomerDto
            {
                Id = invoice.Customer.Id,
                FullName = invoice.Customer.FullName,
                Email = invoice.Customer.Email,
                Phone = invoice.Customer.Phone,
                CustomerType = invoice.Customer.CustomerType,
                CompanyName = invoice.Customer.CompanyName,
                TaxCode = invoice.Customer.TaxCode,
                CompanyAddress = invoice.Customer.CompanyAddress,
                DebtBalance = invoice.Customer.DebtBalance
            },
            Order = invoice.Order == null ? null : new AdminInvoiceOrderDto
            {
                Id = invoice.Order.Id,
                OrderCode = invoice.Order.OrderCode,
                CreatedAt = invoice.Order.CreatedAt,
                OrderStatus = invoice.Order.OrderStatus,
                PaymentStatus = invoice.Order.PaymentStatus,
                PayableTotal = invoice.Order.PayableTotal
            },
            Payments = invoice.PaymentTransactions
                .OrderByDescending(pt => pt.PaymentDate)
                .Select(pt => new AdminInvoicePaymentDto
                {
                    Id = pt.Id,
                    Amount = pt.Amount,
                    PaymentMethod = pt.PaymentMethod,
                    TransactionType = pt.TransactionType,
                    PaymentDate = pt.PaymentDate,
                    ReferenceCode = pt.ReferenceCode,
                    Note = pt.Note
                }).ToList()
        };
    }

    private async Task<string> GenerateInvoiceNumberAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var prefix = $"INV{now:yyyyMMdd}";

        var lastInvoice = await db.Invoices
            .Where(i => i.InvoiceNumber.StartsWith(prefix))
            .OrderByDescending(i => i.InvoiceNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int sequence = 1;
        if (lastInvoice != null)
        {
            var lastSeq = lastInvoice.InvoiceNumber.Substring(prefix.Length);
            if (int.TryParse(lastSeq, out var n))
                sequence = n + 1;
        }

        return $"{prefix}{sequence:D4}";
    }
}
