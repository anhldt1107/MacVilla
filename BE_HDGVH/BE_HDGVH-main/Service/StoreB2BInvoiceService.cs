using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class StoreB2BInvoiceService(BeContext db) : IStoreB2BInvoiceService
{
    public async Task<StoreB2BDebtSummaryDto> GetDebtSummaryAsync(
        int customerId,
        CancellationToken cancellationToken = default)
    {
        var customer = await EnsureB2BCustomerAsync(customerId, cancellationToken);

        var now = DateTime.UtcNow.Date;
        var dueSoonDate = now.AddDays(7);

        var invoices = await db.Invoices
            .AsNoTracking()
            .Include(i => i.PaymentTransactions)
            .Where(i => i.CustomerId == customerId && i.Status != InvoiceStatuses.Cancelled && i.Status != InvoiceStatuses.Draft)
            .ToListAsync(cancellationToken);

        var unpaidInvoices = new List<(Invoice Invoice, decimal Remaining)>();

        foreach (var invoice in invoices)
        {
            var remaining = InvoicePaymentBalance.GetRemaining(invoice);

            if (remaining > 0)
            {
                unpaidInvoices.Add((invoice, remaining));
            }
        }

        var overdueInvoices = unpaidInvoices
            .Where(x => x.Invoice.DueDate.HasValue && x.Invoice.DueDate.Value.Date < now)
            .ToList();

        var dueSoonInvoices = unpaidInvoices
            .Where(x => x.Invoice.DueDate.HasValue &&
                        x.Invoice.DueDate.Value.Date >= now &&
                        x.Invoice.DueDate.Value.Date <= dueSoonDate)
            .ToList();

        var paidCount = invoices
            .Count(i => i.Status == InvoiceStatuses.Paid ||
                       (InvoicePaymentBalance.GetGrossReceived(i.PaymentTransactions) >= (i.TotalAmount ?? 0) && (i.TotalAmount ?? 0) > 0));

        return new StoreB2BDebtSummaryDto
        {
            TotalDebtBalance = customer.DebtBalance,
            OverdueAmount = overdueInvoices.Sum(x => x.Remaining),
            OverdueCount = overdueInvoices.Count,
            DueSoonAmount = dueSoonInvoices.Sum(x => x.Remaining),
            DueSoonCount = dueSoonInvoices.Count,
            TotalUnpaidAmount = unpaidInvoices.Sum(x => x.Remaining),
            TotalUnpaidCount = unpaidInvoices.Count,
            PaidCount = paidCount
        };
    }

    public async Task<PagedResultDto<StoreB2BInvoiceListItemDto>> GetInvoicesPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.Invoices
            .AsNoTracking()
            .Include(i => i.Order)
            .Include(i => i.Contract)
            .Include(i => i.PaymentTransactions)
            .Where(i => i.CustomerId == customerId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(i => i.Status == status);
        }

        var total = await query.CountAsync(cancellationToken);

        var invoices = await query
            .OrderByDescending(i => i.IssueDate)
            .ThenByDescending(i => i.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow.Date;
        var items = invoices.Select(i =>
        {
            var paidAmount = InvoicePaymentBalance.GetGrossReceived(i.PaymentTransactions);
            var remainingAmount = InvoicePaymentBalance.GetRemaining(i);
            int? daysUntilDue = i.DueDate.HasValue
                ? (int)(i.DueDate.Value.Date - now).TotalDays
                : null;

            return new StoreB2BInvoiceListItemDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                IssueDate = i.IssueDate,
                DueDate = i.DueDate,
                Status = i.Status,
                SubTotal = i.SubTotal,
                TaxAmount = i.TaxAmount,
                TotalAmount = i.TotalAmount,
                PaidAmount = paidAmount,
                RemainingAmount = remainingAmount,
                OrderId = i.OrderId,
                OrderCode = i.Order?.OrderCode,
                ContractId = i.ContractId,
                ContractNumber = i.Contract?.ContractNumber,
                DaysUntilDue = daysUntilDue
            };
        }).ToList();

        return new PagedResultDto<StoreB2BInvoiceListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<StoreB2BInvoiceDetailDto> GetInvoiceByNumberAsync(
        int customerId,
        string invoiceNumber,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        if (string.IsNullOrWhiteSpace(invoiceNumber))
            throw new ArgumentException("Số hóa đơn không được để trống");

        var numberLower = invoiceNumber.Trim().ToLower();
        var invoice = await db.Invoices
            .AsNoTracking()
            .Include(i => i.Order)
            .Include(i => i.Contract)
            .Include(i => i.PaymentTransactions)
            .FirstOrDefaultAsync(
                i => i.InvoiceNumber.ToLower() == numberLower && i.CustomerId == customerId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hóa đơn với số {invoiceNumber}");

        return MapToDetailDto(invoice);
    }

    public async Task<string?> GetInvoicePdfUrlAsync(
        int customerId,
        string invoiceNumber,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        if (string.IsNullOrWhiteSpace(invoiceNumber))
            throw new ArgumentException("Số hóa đơn không được để trống");

        var numberLower = invoiceNumber.Trim().ToLower();
        var invoice = await db.Invoices
            .AsNoTracking()
            .Where(i => i.InvoiceNumber.ToLower() == numberLower && i.CustomerId == customerId)
            .Select(i => new { i.PdfUrl })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy hóa đơn với số {invoiceNumber}");

        return invoice.PdfUrl;
    }

    private async Task<Customer> EnsureB2BCustomerAsync(int customerId, CancellationToken cancellationToken)
    {
        // NOTE: lịch sử gọi tên B2B nhưng hiện dùng chung cho mọi khách (B2B + B2C qua route /api/store/me/*).
        // Chỉ kiểm tra khách tồn tại; service invoice không ràng buộc loại khách.
        var customer = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

        if (customer == null)
            throw new KeyNotFoundException("Không tìm thấy tài khoản khách hàng");

        return customer;
    }

    private static StoreB2BInvoiceDetailDto MapToDetailDto(Invoice invoice)
    {
        var paidAmount = InvoicePaymentBalance.GetGrossReceived(invoice.PaymentTransactions);
        var remainingAmount = InvoicePaymentBalance.GetRemaining(invoice);
        var now = DateTime.UtcNow.Date;
        int? daysUntilDue = invoice.DueDate.HasValue
            ? (int)(invoice.DueDate.Value.Date - now).TotalDays
            : null;

        return new StoreB2BInvoiceDetailDto
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
            TaxCode = invoice.TaxCode,
            CompanyName = invoice.CompanyName,
            BillingAddress = invoice.BillingAddress,
            PdfUrl = invoice.PdfUrl,
            DaysUntilDue = daysUntilDue,
            Order = invoice.Order == null ? null : new StoreB2BInvoiceOrderDto
            {
                Id = invoice.Order.Id,
                OrderCode = invoice.Order.OrderCode,
                CreatedAt = invoice.Order.CreatedAt,
                OrderStatus = invoice.Order.OrderStatus,
                PaymentStatus = invoice.Order.PaymentStatus,
                PayableTotal = invoice.Order.PayableTotal
            },
            Contract = invoice.Contract == null ? null : new StoreB2BInvoiceContractDto
            {
                Id = invoice.Contract.Id,
                ContractNumber = invoice.Contract.ContractNumber,
                Status = invoice.Contract.Status,
                ValidFrom = invoice.Contract.ValidFrom,
                ValidTo = invoice.Contract.ValidTo
            },
            Payments = invoice.PaymentTransactions
                .OrderByDescending(pt => pt.PaymentDate)
                .Select(pt => new StoreB2BInvoicePaymentDto
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
}
