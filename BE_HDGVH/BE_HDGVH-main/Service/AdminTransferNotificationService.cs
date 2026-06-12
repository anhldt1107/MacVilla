using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminTransferNotificationService(
    BeContext db,
    IInvoiceAndOrderPaymentSyncService invoiceAndOrderPaymentSync,
    NotificationBusinessEmitter notificationEmitter
) : IAdminTransferNotificationService
{
    private const string BankTransferPaymentMethod = "BankTransfer";

    public async Task<PagedResultDto<AdminTransferNotificationListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        int? customerId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.TransferNotifications
            .AsNoTracking()
            .Include(tn => tn.Customer)
            .Include(tn => tn.Invoice)
            .Include(tn => tn.ProcessedByUser)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && TransferNotificationStatuses.IsValid(status))
        {
            var normalizedStatus = TransferNotificationStatuses.All.First(s =>
                s.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
            query = query.Where(tn => tn.Status == normalizedStatus);
        }

        if (customerId.HasValue)
        {
            query = query.Where(tn => tn.CustomerId == customerId.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(tn => tn.CreatedAt >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            var end = toDate.Value.Date.AddDays(1);
            query = query.Where(tn => tn.CreatedAt < end);
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(tn => tn.CreatedAt)
            .ThenByDescending(tn => tn.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(tn => new AdminTransferNotificationListItemDto
            {
                Id = tn.Id,
                CustomerId = tn.CustomerId,
                CustomerName = tn.Customer.FullName,
                CompanyName = tn.Customer.CompanyName,
                InvoiceId = tn.InvoiceId,
                InvoiceNumber = tn.Invoice != null ? tn.Invoice.InvoiceNumber : null,
                ReferenceCode = tn.ReferenceCode,
                Amount = tn.Amount,
                Note = tn.Note,
                AttachmentUrl = tn.AttachmentUrl,
                Status = tn.Status,
                CreatedAt = tn.CreatedAt,
                ProcessedBy = tn.ProcessedBy,
                ProcessedByName = tn.ProcessedByUser != null ? tn.ProcessedByUser.FullName : null,
                ProcessedAt = tn.ProcessedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminTransferNotificationListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminTransferNotificationDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var tn = await db.TransferNotifications
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Invoice)
            .Include(x => x.ProcessedByUser)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy thông báo chuyển khoản với ID {id}");

        return MapToDetailDto(tn);
    }

    public async Task<AdminTransferNotificationDetailDto> VerifyAsync(
        int id,
        int processedByUserId,
        AdminTransferNotificationVerifyDto? dto,
        CancellationToken cancellationToken = default)
    {
        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var tn = await db.TransferNotifications
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
                ?? throw new KeyNotFoundException($"Không tìm thấy thông báo chuyển khoản với ID {id}");

            if (!string.Equals(tn.Status, TransferNotificationStatuses.Pending, StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    $"Chỉ có thể xác nhận thông báo ở trạng thái Pending (hiện tại: {tn.Status}).");
            }

            if (tn.Amount <= 0)
            {
                throw new InvalidOperationException("Số tiền thông báo không hợp lệ.");
            }

            var customer = await db.Customers.FindAsync([tn.CustomerId], cancellationToken)
                ?? throw new KeyNotFoundException("Không tìm thấy khách hàng");

            Invoice? invoice = null;
            if (tn.InvoiceId.HasValue)
            {
                invoice = await db.Invoices
                    .Include(i => i.PaymentTransactions)
                    .FirstOrDefaultAsync(i => i.Id == tn.InvoiceId.Value, cancellationToken)
                    ?? throw new KeyNotFoundException("Không tìm thấy hóa đơn");

                if (invoice.CustomerId != tn.CustomerId)
                {
                    throw new InvalidOperationException("Hóa đơn không thuộc về khách hàng của thông báo.");
                }

                if (!InvoiceStatuses.CanReceivePayment(invoice.Status))
                {
                    throw new InvalidOperationException(
                        $"Không thể ghi nhận thanh toán cho hóa đơn ở trạng thái '{invoice.Status}'.");
                }

                InvoicePaymentBalance.EnsureAmountDoesNotExceedRemaining(invoice, tn.Amount);
            }

            var processNote = dto?.ProcessNote?.Trim();
            var paymentNote = BuildPaymentNote(tn, processNote);

            var payment = new PaymentTransaction
            {
                CustomerId = tn.CustomerId,
                InvoiceId = tn.InvoiceId,
                Amount = tn.Amount,
                PaymentMethod = BankTransferPaymentMethod,
                TransactionType = PaymentTransactionTypes.Payment,
                PaymentDate = DateTime.UtcNow,
                ReferenceCode = tn.ReferenceCode,
                Note = paymentNote
            };

            await db.PaymentTransactions.AddAsync(payment, cancellationToken);

            tn.Status = TransferNotificationStatuses.Verified;
            tn.ProcessedBy = processedByUserId;
            tn.ProcessedAt = DateTime.UtcNow;
            tn.ProcessNote = processNote;

            await db.SaveChangesAsync(cancellationToken);

            if (invoice != null)
            {
                await invoiceAndOrderPaymentSync.ApplyPaymentTransactionSideEffectsAsync(invoice.Id, cancellationToken);
            }

            if (string.Equals(customer.CustomerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase))
            {
                customer.DebtBalance -= tn.Amount;
                if (customer.DebtBalance < 0)
                    customer.DebtBalance = 0;
                await db.SaveChangesAsync(cancellationToken);
            }

            await tx.CommitAsync(cancellationToken);
            await notificationEmitter.OnTransferNotificationVerifiedAsync(id, cancellationToken);

            return await GetByIdAsync(id, cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<AdminTransferNotificationDetailDto> RejectAsync(
        int id,
        int processedByUserId,
        AdminTransferNotificationRejectDto dto,
        CancellationToken cancellationToken = default)
    {
        var tn = await db.TransferNotifications
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy thông báo chuyển khoản với ID {id}");

        if (!string.Equals(tn.Status, TransferNotificationStatuses.Pending, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Chỉ có thể từ chối thông báo ở trạng thái Pending (hiện tại: {tn.Status}).");
        }

        tn.Status = TransferNotificationStatuses.Rejected;
        tn.ProcessNote = dto.Reason.Trim();
        tn.ProcessedBy = processedByUserId;
        tn.ProcessedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnTransferNotificationRejectedAsync(id, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    private static string? BuildPaymentNote(TransferNotification tn, string? processNote)
    {
        var basePart =
            $"Xác nhận thông báo CK #{tn.Id}. Ref: {tn.ReferenceCode}. {(tn.Note ?? string.Empty).Trim()}".Trim();
        if (string.IsNullOrWhiteSpace(processNote))
        {
            return string.IsNullOrWhiteSpace(basePart) ? null : basePart;
        }

        return string.IsNullOrWhiteSpace(basePart)
            ? $"KT: {processNote}"
            : $"{basePart} | KT: {processNote}";
    }

    private static AdminTransferNotificationDetailDto MapToDetailDto(TransferNotification tn)
    {
        return new AdminTransferNotificationDetailDto
        {
            Id = tn.Id,
            CustomerId = tn.CustomerId,
            CustomerName = tn.Customer.FullName,
            CompanyName = tn.Customer.CompanyName,
            InvoiceId = tn.InvoiceId,
            InvoiceNumber = tn.Invoice != null ? tn.Invoice.InvoiceNumber : null,
            ReferenceCode = tn.ReferenceCode,
            Amount = tn.Amount,
            Note = tn.Note,
            AttachmentUrl = tn.AttachmentUrl,
            Status = tn.Status,
            CreatedAt = tn.CreatedAt,
            ProcessedBy = tn.ProcessedBy,
            ProcessedByName = tn.ProcessedByUser != null ? tn.ProcessedByUser.FullName : null,
            ProcessedAt = tn.ProcessedAt,
            ProcessNote = tn.ProcessNote
        };
    }
}
