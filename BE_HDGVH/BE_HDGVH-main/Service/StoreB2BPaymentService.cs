using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Options;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BE_API.Service;

public class StoreB2BPaymentService(
    BeContext db,
    IOptions<B2bBankTransferOptions> bankTransferOptions,
    NotificationBusinessEmitter notificationEmitter
) : IStoreB2BPaymentService
{
    private readonly B2bBankTransferOptions _bank = bankTransferOptions.Value;
    public async Task<PagedResultDto<StoreB2BPaymentListItemDto>> GetPaymentsPagedAsync(
        int customerId,
        int page,
        int pageSize,
        int? invoiceId = null,
        string? transactionType = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.PaymentTransactions
            .AsNoTracking()
            .Include(pt => pt.Invoice)
            .Where(pt => pt.CustomerId == customerId)
            .AsQueryable();

        if (invoiceId.HasValue)
        {
            query = query.Where(pt => pt.InvoiceId == invoiceId.Value);
        }

        if (!string.IsNullOrWhiteSpace(transactionType))
        {
            query = query.Where(pt => pt.TransactionType == transactionType);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(pt => pt.PaymentDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            var toDateEnd = toDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(pt => pt.PaymentDate <= toDateEnd);
        }

        var total = await query.CountAsync(cancellationToken);

        var payments = await query
            .OrderByDescending(pt => pt.PaymentDate)
            .ThenByDescending(pt => pt.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = payments.Select(pt => new StoreB2BPaymentListItemDto
        {
            Id = pt.Id,
            Amount = pt.Amount,
            PaymentMethod = pt.PaymentMethod,
            TransactionType = pt.TransactionType,
            PaymentDate = pt.PaymentDate,
            ReferenceCode = pt.ReferenceCode,
            Note = pt.Note,
            InvoiceId = pt.InvoiceId,
            InvoiceNumber = pt.Invoice?.InvoiceNumber
        }).ToList();

        return new PagedResultDto<StoreB2BPaymentListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<StoreB2BPaymentDetailDto> GetPaymentByIdAsync(
        int customerId,
        int paymentId,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        var payment = await db.PaymentTransactions
            .AsNoTracking()
            .Include(pt => pt.Invoice)
            .FirstOrDefaultAsync(
                pt => pt.Id == paymentId && pt.CustomerId == customerId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy giao dịch thanh toán với ID {paymentId}");

        return new StoreB2BPaymentDetailDto
        {
            Id = payment.Id,
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod,
            TransactionType = payment.TransactionType,
            PaymentDate = payment.PaymentDate,
            ReferenceCode = payment.ReferenceCode,
            Note = payment.Note,
            Invoice = payment.Invoice == null ? null : new StoreB2BPaymentInvoiceDto
            {
                Id = payment.Invoice.Id,
                InvoiceNumber = payment.Invoice.InvoiceNumber,
                IssueDate = payment.Invoice.IssueDate,
                DueDate = payment.Invoice.DueDate,
                Status = payment.Invoice.Status,
                TotalAmount = payment.Invoice.TotalAmount
            }
        };
    }

    public async Task<StoreB2BNotifyTransferResponseDto> NotifyTransferAsync(
        int customerId,
        StoreB2BNotifyTransferRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        if (string.IsNullOrWhiteSpace(dto.ReferenceCode))
            throw new ArgumentException("Mã tham chiếu chuyển khoản không được để trống");

        if (dto.Amount <= 0)
            throw new ArgumentException("Số tiền chuyển khoản phải lớn hơn 0");

        if (dto.InvoiceId.HasValue)
        {
            var invoiceExists = await db.Invoices
                .AnyAsync(i => i.Id == dto.InvoiceId.Value && i.CustomerId == customerId, cancellationToken);

            if (!invoiceExists)
                throw new KeyNotFoundException($"Không tìm thấy hóa đơn với ID {dto.InvoiceId}");
        }

        var existingNotification = await db.TransferNotifications
            .AnyAsync(tn => tn.ReferenceCode == dto.ReferenceCode.Trim() && tn.CustomerId == customerId, cancellationToken);

        if (existingNotification)
            throw new InvalidOperationException($"Đã có thông báo chuyển khoản với mã tham chiếu {dto.ReferenceCode}");

        var notification = new TransferNotification
        {
            CustomerId = customerId,
            InvoiceId = dto.InvoiceId,
            ReferenceCode = dto.ReferenceCode.Trim(),
            Amount = dto.Amount,
            Note = dto.Note?.Trim(),
            AttachmentUrl = dto.AttachmentUrl?.Trim(),
            Status = TransferNotificationStatuses.Pending,
            CreatedAt = DateTime.UtcNow
        };

        db.TransferNotifications.Add(notification);
        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnTransferNotificationPendingAsync(notification.Id, cancellationToken);

        return new StoreB2BNotifyTransferResponseDto
        {
            Id = notification.Id,
            Amount = notification.Amount,
            ReferenceCode = notification.ReferenceCode,
            Note = notification.Note,
            CreatedAt = notification.CreatedAt,
            Status = notification.Status,
            Message = "Thông báo chuyển khoản đã được ghi nhận. Kế toán sẽ xác nhận sau khi đối soát."
        };
    }

    public async Task<PagedResultDto<StoreB2BTransferNotificationListItemDto>> GetTransferNotificationsPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.TransferNotifications
            .AsNoTracking()
            .Include(tn => tn.Invoice)
            .Where(tn => tn.CustomerId == customerId);

        if (!string.IsNullOrWhiteSpace(status) && TransferNotificationStatuses.IsValid(status))
        {
            var st = TransferNotificationStatuses.All.First(s =>
                string.Equals(s, status.Trim(), StringComparison.OrdinalIgnoreCase));
            query = query.Where(tn => tn.Status == st);
        }

        var total = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderByDescending(tn => tn.CreatedAt)
            .ThenByDescending(tn => tn.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = rows.Select(tn => new StoreB2BTransferNotificationListItemDto
        {
            Id = tn.Id,
            ReferenceCode = tn.ReferenceCode,
            Amount = tn.Amount,
            Note = tn.Note,
            Status = tn.Status,
            CreatedAt = tn.CreatedAt,
            AttachmentUrl = tn.AttachmentUrl,
            InvoiceId = tn.InvoiceId,
            InvoiceNumber = tn.Invoice?.InvoiceNumber,
            ProcessNote = tn.ProcessNote
        }).ToList();

        return new PagedResultDto<StoreB2BTransferNotificationListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public StoreB2BBankTransferInfoDto GetBankTransferInfo()
    {
        var b = string.IsNullOrWhiteSpace(_bank.Beneficiary) ? "—" : _bank.Beneficiary.Trim();
        var acct = string.IsNullOrWhiteSpace(_bank.AccountNumber) ? "—" : _bank.AccountNumber.Trim();
        var bank = string.IsNullOrWhiteSpace(_bank.BankName) ? "—" : _bank.BankName.Trim();
        var prefix = string.IsNullOrWhiteSpace(_bank.TransferSyntaxPrefix)
            ? "THANHTOAN"
            : _bank.TransferSyntaxPrefix.Trim();

        return new StoreB2BBankTransferInfoDto
        {
            Beneficiary = b,
            AccountNumber = acct,
            BankName = bank,
            TransferSyntaxPrefix = prefix
        };
    }

    private async Task<Customer> EnsureB2BCustomerAsync(int customerId, CancellationToken cancellationToken)
    {
        // Dùng chung cho B2B & B2C; chỉ kiểm tra khách tồn tại.
        var customer = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

        if (customer == null)
            throw new KeyNotFoundException("Không tìm thấy tài khoản khách hàng");

        return customer;
    }
}
