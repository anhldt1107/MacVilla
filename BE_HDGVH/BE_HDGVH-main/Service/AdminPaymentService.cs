using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminPaymentService(
    BeContext db,
    IInvoiceAndOrderPaymentSyncService invoiceAndOrderPaymentSync,
    NotificationBusinessEmitter notificationEmitter
) : IAdminPaymentService
{
    public async Task<PagedResultDto<AdminPaymentListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        int? customerId = null,
        int? invoiceId = null,
        int? orderId = null,
        string? transactionType = null,
        string? paymentMethod = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.PaymentTransactions
            .AsNoTracking()
            .Include(pt => pt.Customer)
            .Include(pt => pt.Invoice)
            .AsQueryable();

        if (customerId.HasValue)
        {
            query = query.Where(pt => pt.CustomerId == customerId.Value);
        }

        if (invoiceId.HasValue)
        {
            query = query.Where(pt => pt.InvoiceId == invoiceId.Value);
        }

        if (orderId.HasValue)
        {
            query = query.Where(pt => pt.Invoice != null && pt.Invoice.OrderId == orderId.Value);
        }

        if (!string.IsNullOrWhiteSpace(transactionType))
        {
            query = query.Where(pt => pt.TransactionType == transactionType);
        }

        if (!string.IsNullOrWhiteSpace(paymentMethod))
        {
            query = query.Where(pt => pt.PaymentMethod == paymentMethod);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(pt => pt.PaymentDate >= fromDate.Value);
        }
        if (toDate.HasValue)
        {
            var endDate = toDate.Value.Date.AddDays(1);
            query = query.Where(pt => pt.PaymentDate < endDate);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower().Trim();
            query = query.Where(pt =>
                (pt.ReferenceCode != null && pt.ReferenceCode.ToLower().Contains(searchLower)) ||
                pt.Customer.FullName.ToLower().Contains(searchLower) ||
                (pt.Customer.Phone != null && pt.Customer.Phone.Contains(searchLower)) ||
                (pt.Customer.CompanyName != null && pt.Customer.CompanyName.ToLower().Contains(searchLower)) ||
                (pt.Invoice != null && pt.Invoice.InvoiceNumber.ToLower().Contains(searchLower)));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(pt => pt.PaymentDate)
            .ThenByDescending(pt => pt.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(pt => new AdminPaymentListItemDto
            {
                Id = pt.Id,
                Amount = pt.Amount,
                PaymentMethod = pt.PaymentMethod,
                TransactionType = pt.TransactionType,
                PaymentDate = pt.PaymentDate,
                ReferenceCode = pt.ReferenceCode,
                Note = pt.Note,
                CustomerId = pt.CustomerId,
                CustomerName = pt.Customer.FullName,
                CustomerPhone = pt.Customer.Phone,
                CustomerEmail = pt.Customer.Email,
                CompanyName = pt.Customer.CompanyName,
                InvoiceId = pt.InvoiceId,
                InvoiceNumber = pt.Invoice != null ? pt.Invoice.InvoiceNumber : null
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminPaymentListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminPaymentDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var payment = await db.PaymentTransactions
            .AsNoTracking()
            .Include(pt => pt.Customer)
            .Include(pt => pt.Invoice!)
                .ThenInclude(i => i.Order)
            .FirstOrDefaultAsync(pt => pt.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy giao dịch thanh toán với ID {id}");

        return MapToDetailDto(payment);
    }

    public async Task<AdminPaymentDetailDto> CreatePaymentAsync(
        AdminPaymentCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        if (dto.Amount <= 0)
            throw new ArgumentException("Số tiền phải lớn hơn 0");

        var customer = await db.Customers.FindAsync([dto.CustomerId], cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy khách hàng");

        Invoice? invoice = null;
        if (dto.InvoiceId.HasValue)
        {
            invoice = await db.Invoices
                .Include(i => i.PaymentTransactions)
                .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId.Value, cancellationToken)
                ?? throw new KeyNotFoundException("Không tìm thấy hóa đơn");

            if (invoice.CustomerId != dto.CustomerId)
                throw new InvalidOperationException("Hóa đơn không thuộc về khách hàng này");

            if (!InvoiceStatuses.CanReceivePayment(invoice.Status))
                throw new InvalidOperationException($"Không thể ghi nhận thanh toán cho hóa đơn ở trạng thái '{invoice.Status}'");

            InvoicePaymentBalance.EnsureAmountDoesNotExceedRemaining(invoice, dto.Amount);
        }

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var payment = new PaymentTransaction
            {
                CustomerId = dto.CustomerId,
                InvoiceId = dto.InvoiceId,
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod.Trim(),
                TransactionType = PaymentTransactionTypes.Payment,
                PaymentDate = dto.PaymentDate,
                ReferenceCode = dto.ReferenceCode?.Trim(),
                Note = dto.Note?.Trim()
            };

            await db.PaymentTransactions.AddAsync(payment, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            if (invoice != null)
            {
                await invoiceAndOrderPaymentSync.ApplyPaymentTransactionSideEffectsAsync(invoice.Id, cancellationToken);
            }

            if (string.Equals(customer.CustomerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase))
            {
                customer.DebtBalance -= dto.Amount;
                if (customer.DebtBalance < 0)
                    customer.DebtBalance = 0;
                await db.SaveChangesAsync(cancellationToken);
            }

            await tx.CommitAsync(cancellationToken);
            await notificationEmitter.OnPaymentReceivedAsync(payment.Id, cancellationToken);

            return await GetByIdAsync(payment.Id, cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<AdminPaymentDetailDto> CreateRefundAsync(
        AdminPaymentRefundDto dto,
        CancellationToken cancellationToken = default)
    {
        if (dto.Amount <= 0)
            throw new ArgumentException("Số tiền hoàn phải lớn hơn 0");

        var customer = await db.Customers.FindAsync([dto.CustomerId], cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy khách hàng");

        Invoice? invoice = null;
        if (dto.InvoiceId.HasValue)
        {
            invoice = await db.Invoices
                .Include(i => i.PaymentTransactions)
                .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId.Value, cancellationToken)
                ?? throw new KeyNotFoundException("Không tìm thấy hóa đơn");

            if (invoice.CustomerId != dto.CustomerId)
                throw new InvalidOperationException("Hóa đơn không thuộc về khách hàng này");

            var refundableBalance = InvoicePaymentBalance.GetNetPaid(invoice.PaymentTransactions);

            if (dto.Amount > refundableBalance)
                throw new InvalidOperationException($"Số tiền hoàn ({dto.Amount:N0}) lớn hơn số tiền đã thanh toán ({refundableBalance:N0})");
        }

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var refund = new PaymentTransaction
            {
                CustomerId = dto.CustomerId,
                InvoiceId = dto.InvoiceId,
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod.Trim(),
                TransactionType = PaymentTransactionTypes.Refund,
                PaymentDate = dto.PaymentDate,
                ReferenceCode = dto.ReferenceCode?.Trim(),
                Note = dto.Note?.Trim()
            };

            await db.PaymentTransactions.AddAsync(refund, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            if (invoice != null)
            {
                await invoiceAndOrderPaymentSync.ApplyPaymentTransactionSideEffectsAsync(invoice.Id, cancellationToken);
            }

            if (string.Equals(customer.CustomerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase))
            {
                customer.DebtBalance += dto.Amount;
                await db.SaveChangesAsync(cancellationToken);
            }

            await tx.CommitAsync(cancellationToken);

            await notificationEmitter.OnPaymentRefundedAsync(refund.Id, cancellationToken);

            return await GetByIdAsync(refund.Id, cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static AdminPaymentDetailDto MapToDetailDto(PaymentTransaction payment)
    {
        return new AdminPaymentDetailDto
        {
            Id = payment.Id,
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod,
            TransactionType = payment.TransactionType,
            PaymentDate = payment.PaymentDate,
            ReferenceCode = payment.ReferenceCode,
            Note = payment.Note,
            Customer = new AdminPaymentCustomerDto
            {
                Id = payment.Customer.Id,
                FullName = payment.Customer.FullName,
                Email = payment.Customer.Email,
                Phone = payment.Customer.Phone,
                CustomerType = payment.Customer.CustomerType,
                CompanyName = payment.Customer.CompanyName,
                TaxCode = payment.Customer.TaxCode,
                DebtBalance = payment.Customer.DebtBalance
            },
            Invoice = payment.Invoice == null ? null : new AdminPaymentInvoiceDto
            {
                Id = payment.Invoice.Id,
                InvoiceNumber = payment.Invoice.InvoiceNumber,
                IssueDate = payment.Invoice.IssueDate,
                DueDate = payment.Invoice.DueDate,
                Status = payment.Invoice.Status,
                TotalAmount = payment.Invoice.TotalAmount,
                OrderId = payment.Invoice.OrderId,
                OrderCode = payment.Invoice.Order?.OrderCode
            }
        };
    }
}
