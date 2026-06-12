using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminReturnService(
    BeContext db,
    AfterSalesQuantityService afterSalesQuantity,
    IAdminPaymentService paymentService,
    NotificationBusinessEmitter notificationEmitter) : IAdminReturnService
{
    public async Task<PagedResultDto<AdminReturnListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        string? type = null,
        int? customerId = null,
        int? orderId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.ReturnExchangeTickets
            .AsNoTracking()
            .Include(t => t.Customer)
            .Include(t => t.Order)
            .Include(t => t.ManagerApproved)
            .Include(t => t.Items)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == status);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(t => t.Type == type);

        if (customerId.HasValue)
            query = query.Where(t => t.CustomerId == customerId.Value);

        if (orderId.HasValue)
            query = query.Where(t => t.OrderId == orderId.Value);

        if (fromDate.HasValue)
            query = query.Where(t => t.CreatedAt >= fromDate.Value);

        if (toDate.HasValue)
        {
            var endDate = toDate.Value.Date.AddDays(1);
            query = query.Where(t => t.CreatedAt < endDate);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower().Trim();
            query = query.Where(t =>
                t.TicketNumber.ToLower().Contains(searchLower) ||
                t.Customer.FullName.ToLower().Contains(searchLower) ||
                (t.Customer.Phone != null && t.Customer.Phone.Contains(searchLower)) ||
                t.Order.OrderCode.ToLower().Contains(searchLower));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new AdminReturnListItemDto
            {
                Id = t.Id,
                TicketNumber = t.TicketNumber,
                Type = t.Type,
                Status = t.Status,
                Reason = t.Reason,
                RefundAmount = t.RefundAmount,
                ItemCount = t.Items.Count,
                CreatedAt = t.CreatedAt,
                ApprovedAt = t.ApprovedAt,
                CompletedAt = t.CompletedAt,
                CustomerId = t.CustomerId,
                CustomerName = t.Customer.FullName,
                CustomerPhone = t.Customer.Phone,
                CustomerEmail = t.Customer.Email,
                OrderId = t.OrderId,
                OrderCode = t.Order.OrderCode,
                ManagerIdApproved = t.ManagerIdApproved,
                ManagerName = t.ManagerApproved != null ? t.ManagerApproved.FullName : null
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminReturnListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public Task<AdminReturnDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        GetDetailOrThrowAsync(t => t.Id == id, cancellationToken);

    public async Task<AdminReturnDetailDto> GetByTicketNumberAsync(string ticketNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ticketNumber))
            throw new ArgumentException("Mã phiếu đổi/trả không được để trống");

        var numberLower = ticketNumber.Trim().ToLower();
        return await GetDetailOrThrowAsync(t => t.TicketNumber.ToLower() == numberLower, cancellationToken);
    }

    public async Task<AdminReturnDetailDto> CreateAsync(
        AdminReturnCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        var order = await LoadOrderForReturnAsync(dto.OrderId, cancellationToken);

        if (!ReturnTypes.IsValid(dto.Type))
            throw new ArgumentException($"Loại '{dto.Type}' không hợp lệ. Phải là: {string.Join(", ", ReturnTypes.All)}");

        if (dto.Items == null || dto.Items.Count == 0)
            throw new ArgumentException("Phải có ít nhất 1 sản phẩm cần đổi/trả");

        await ValidateReturnItemsAsync(order, dto.Type, dto.Items, cancellationToken);

        var ticketNumber = await ReturnTicketCodes.GenerateUniqueAsync(db.ReturnExchangeTickets, cancellationToken);
        var now = DateTime.UtcNow;

        var ticket = new ReturnExchangeTicket
        {
            TicketNumber = ticketNumber,
            OrderId = dto.OrderId,
            CustomerId = order.CustomerId,
            Type = dto.Type,
            Reason = dto.Reason,
            CustomerNote = dto.CustomerNote,
            InternalNote = dto.InternalNote,
            Status = ReturnTicketStatuses.Requested,
            RefundAmount = 0,
            CreatedAt = now
        };

        await db.ReturnExchangeTickets.AddAsync(ticket, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        foreach (var itemDto in dto.Items)
        {
            var orderItem = order.Items.First(i => i.Id == itemDto.OrderItemId);
            await db.ReturnItems.AddAsync(new ReturnItem
            {
                TicketId = ticket.Id,
                OrderItemId = orderItem.Id,
                VariantIdReturned = orderItem.VariantId,
                VariantIdExchanged = dto.Type == ReturnTypes.Exchange ? itemDto.VariantIdExchanged : null,
                Quantity = itemDto.Quantity,
                InventoryAction = null
            }, cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnReturnPendingApprovalAsync(ticket.Id, cancellationToken);
        return await GetByIdAsync(ticket.Id, cancellationToken);
    }

    public async Task<AdminReturnDetailDto> ApproveAsync(
        int id,
        int managerId,
        AdminReturnApproveDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await db.ReturnExchangeTickets
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu đổi/trả với ID {id}");

        if (!ReturnTicketStatuses.CanApprove(ticket.Status))
            throw new InvalidOperationException($"Phiếu ở trạng thái '{ticket.Status}' không thể duyệt");

        _ = await db.AppUsers.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == managerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy Manager");

        ticket.Status = ReturnTicketStatuses.Approved;
        ticket.ManagerIdApproved = managerId;
        ticket.ApprovedAt = DateTime.UtcNow;
        ticket.RefundAmount = dto.RefundAmount;
        AppendInternalNote(ticket, "[Duyệt]", dto.InternalNote);

        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnReturnApprovedAsync(id, cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminReturnDetailDto> RejectAsync(
        int id,
        int managerId,
        AdminReturnRejectDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await db.ReturnExchangeTickets
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu đổi/trả với ID {id}");

        if (!ReturnTicketStatuses.CanReject(ticket.Status))
            throw new InvalidOperationException($"Phiếu ở trạng thái '{ticket.Status}' không thể từ chối");

        _ = await db.AppUsers.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == managerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy Manager");

        ticket.Status = ReturnTicketStatuses.Rejected;
        ticket.ManagerIdApproved = managerId;
        ticket.ApprovedAt = DateTime.UtcNow;
        AppendInternalNote(ticket, "[Từ chối]", dto.RejectReason);

        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnReturnRejectedAsync(id, cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminReturnDetailDto> StartProcessingAsync(
        int id,
        int staffId,
        AdminReturnTransitionDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await db.ReturnExchangeTickets
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu đổi/trả với ID {id}");

        TransitionOrThrow(ticket, ReturnTicketStatuses.Processing);
        AppendInternalNote(ticket, "[Bắt đầu thu hồi]", dto.InternalNote);
        await db.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminReturnDetailDto> ReceiveItemsAsync(
        int id,
        int staffId,
        AdminReturnTransitionDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await db.ReturnExchangeTickets
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu đổi/trả với ID {id}");

        TransitionOrThrow(ticket, ReturnTicketStatuses.ItemsReceived);
        AppendInternalNote(ticket, "[Đã nhận hàng]", dto.InternalNote);
        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnReturnItemsReceivedAsync(id, cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminReturnDetailDto> CancelAsync(
        int id,
        AdminReturnTransitionDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await db.ReturnExchangeTickets
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu đổi/trả với ID {id}");

        if (!ReturnTicketStatuses.CanCancel(ticket.Status))
            throw new InvalidOperationException($"Phiếu ở trạng thái '{ticket.Status}' không thể hủy");

        ticket.Status = ReturnTicketStatuses.Cancelled;
        AppendInternalNote(ticket, "[Hủy]", dto.InternalNote);
        await db.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<AdminReturnDetailDto> CompleteAsync(
        int id,
        int stockManagerId,
        AdminReturnCompleteDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await db.ReturnExchangeTickets
            .Include(t => t.Order)
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu đổi/trả với ID {id}");

        if (!ReturnTicketStatuses.CanComplete(ticket.Status))
            throw new InvalidOperationException(
                $"Phiếu ở trạng thái '{ticket.Status}' không thể hoàn thành. Cần ở trạng thái '{ReturnTicketStatuses.ItemsReceived}'");

        _ = await db.AppUsers.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == stockManagerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy Stock Manager");

        if (dto.Items == null || dto.Items.Count == 0)
            throw new ArgumentException("Phải chỉ định hành động kho cho từng dòng hàng");

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            foreach (var itemDto in dto.Items)
            {
                var returnItem = ticket.Items.FirstOrDefault(i => i.Id == itemDto.ReturnItemId)
                    ?? throw new KeyNotFoundException($"Không tìm thấy ReturnItem với ID {itemDto.ReturnItemId}");

                if (!InventoryActions.IsValid(itemDto.InventoryAction))
                    throw new ArgumentException(
                        $"Hành động '{itemDto.InventoryAction}' không hợp lệ. Phải là: {string.Join(", ", InventoryActions.All)}");

                returnItem.InventoryAction = itemDto.InventoryAction;

                if (itemDto.InventoryAction == InventoryActions.Restock)
                {
                    await ApplyInventoryInAsync(
                        returnItem.VariantIdReturned,
                        returnItem.Quantity,
                        ticket.TicketNumber,
                        stockManagerId,
                        cancellationToken);
                }

                if (ticket.Type == ReturnTypes.Exchange && returnItem.VariantIdExchanged.HasValue)
                {
                    await ApplyInventoryOutAsync(
                        returnItem.VariantIdExchanged.Value,
                        returnItem.Quantity,
                        ticket.TicketNumber,
                        stockManagerId,
                        cancellationToken);
                }

                await afterSalesQuantity.ApplyWarrantyReductionOnReturnCompleteAsync(
                    returnItem.OrderItemId,
                    returnItem.Quantity,
                    cancellationToken);
            }

            ticket.Status = ReturnTicketStatuses.Completed;
            ticket.StockManagerId = stockManagerId;
            ticket.CompletedAt = DateTime.UtcNow;
            AppendInternalNote(ticket, "[Hoàn thành]", dto.InternalNote);

            await db.SaveChangesAsync(cancellationToken);

            var shouldRefund = dto.CreateRefund ?? (
                ticket.Type == ReturnTypes.Return && ticket.RefundAmount > 0);

            if (shouldRefund && ticket.RefundAmount > 0)
            {
                var invoiceId = await db.Invoices.AsNoTracking()
                    .Where(i => i.OrderId == ticket.OrderId)
                    .OrderByDescending(i => i.Id)
                    .Select(i => (int?)i.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                await paymentService.CreateRefundAsync(new AdminPaymentRefundDto
                {
                    CustomerId = ticket.CustomerId,
                    InvoiceId = invoiceId,
                    Amount = ticket.RefundAmount,
                    PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod)
                        ? "BankTransfer"
                        : dto.PaymentMethod.Trim(),
                    PaymentDate = DateTime.UtcNow,
                    ReferenceCode = ticket.TicketNumber,
                    Note = $"Hoàn tiền phiếu đổi/trả {ticket.TicketNumber}"
                }, cancellationToken);
            }

            await tx.CommitAsync(cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }

        await notificationEmitter.OnReturnCompletedAsync(id, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    private async Task ApplyInventoryInAsync(
        int variantId,
        int quantity,
        string ticketNumber,
        int staffId,
        CancellationToken cancellationToken)
    {
        var inventory = await db.Inventories
            .FirstOrDefaultAsync(i => i.VariantId == variantId, cancellationToken);

        if (inventory == null)
        {
            inventory = new Inventory
            {
                VariantId = variantId,
                QuantityOnHand = 0,
                QuantityReserved = 0,
                QuantityAvailable = 0
            };
            await db.Inventories.AddAsync(inventory, cancellationToken);
        }

        InventoryQuantityHelper.ApplyIn(inventory, quantity);

        await db.InventoryTransactions.AddAsync(new InventoryTransaction
        {
            VariantId = variantId,
            TransactionType = TransactionTypes.In,
            Quantity = quantity,
            ReferenceType = "ReturnExchangeTicket",
            ReferenceId = ticketNumber,
            Notes = $"Nhập lại kho từ phiếu đổi/trả {ticketNumber}",
            ManagerIdApproved = staffId,
            Timestamp = DateTime.UtcNow
        }, cancellationToken);
    }

    private async Task ApplyInventoryOutAsync(
        int variantId,
        int quantity,
        string ticketNumber,
        int staffId,
        CancellationToken cancellationToken)
    {
        var inventory = await db.Inventories
            .FirstOrDefaultAsync(i => i.VariantId == variantId, cancellationToken)
            ?? throw new InvalidOperationException($"Không có tồn kho cho variant {variantId} để xuất hàng đổi");

        InventoryQuantityHelper.ApplyOut(inventory, quantity);

        await db.InventoryTransactions.AddAsync(new InventoryTransaction
        {
            VariantId = variantId,
            TransactionType = TransactionTypes.Out,
            Quantity = quantity,
            ReferenceType = "ReturnExchangeTicket",
            ReferenceId = ticketNumber,
            Notes = $"Xuất hàng đổi từ phiếu {ticketNumber}",
            ManagerIdApproved = staffId,
            Timestamp = DateTime.UtcNow
        }, cancellationToken);
    }

    private async Task<CustomerOrder> LoadOrderForReturnAsync(int orderId, CancellationToken cancellationToken)
    {
        var order = await db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng");

        if (order.OrderStatus != OrderStatuses.Delivered && order.OrderStatus != OrderStatuses.Completed)
            throw new InvalidOperationException("Chỉ có thể tạo phiếu đổi/trả cho đơn hàng đã giao hoặc hoàn thành");

        return order;
    }

    private async Task ValidateReturnItemsAsync(
        CustomerOrder order,
        string type,
        List<AdminReturnItemCreateDto> items,
        CancellationToken cancellationToken)
    {
        foreach (var item in items)
        {
            if (item.OrderItemId <= 0)
                throw new ArgumentException("orderItemId là bắt buộc cho mỗi dòng đổi/trả");

            var orderItem = order.Items.FirstOrDefault(i => i.Id == item.OrderItemId)
                ?? throw new ArgumentException($"Dòng đơn {item.OrderItemId} không thuộc đơn hàng này");

            if (item.VariantIdReturned > 0 && item.VariantIdReturned != orderItem.VariantId)
                throw new ArgumentException($"variantIdReturned không khớp với dòng đơn {item.OrderItemId}");

            await afterSalesQuantity.ValidateReturnItemAsync(orderItem, item.Quantity, cancellationToken);

            if (type == ReturnTypes.Exchange && item.VariantIdExchanged.HasValue)
            {
                _ = await db.ProductVariants.AsNoTracking()
                    .FirstOrDefaultAsync(v => v.Id == item.VariantIdExchanged.Value, cancellationToken)
                    ?? throw new KeyNotFoundException($"Không tìm thấy sản phẩm đổi VariantId {item.VariantIdExchanged.Value}");
            }
        }
    }

    private static void TransitionOrThrow(ReturnExchangeTicket ticket, string toStatus)
    {
        if (!ReturnTicketStatuses.CanTransition(ticket.Status, toStatus))
            throw new InvalidOperationException($"Không thể chuyển từ '{ticket.Status}' sang '{toStatus}'");

        ticket.Status = toStatus;
    }

    private static void AppendInternalNote(ReturnExchangeTicket ticket, string prefix, string? note)
    {
        if (string.IsNullOrWhiteSpace(note))
            return;

        ticket.InternalNote = string.IsNullOrWhiteSpace(ticket.InternalNote)
            ? $"{prefix} {note}"
            : $"{ticket.InternalNote}\n{prefix} {note}";
    }

    private async Task<AdminReturnDetailDto> GetDetailOrThrowAsync(
        System.Linq.Expressions.Expression<Func<ReturnExchangeTicket, bool>> predicate,
        CancellationToken cancellationToken)
    {
        var ticket = await GetTicketWithDetailsAsync(predicate, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy phiếu đổi/trả");

        return MapToDetailDto(ticket);
    }

    private async Task<ReturnExchangeTicket?> GetTicketWithDetailsAsync(
        System.Linq.Expressions.Expression<Func<ReturnExchangeTicket, bool>> predicate,
        CancellationToken cancellationToken)
    {
        return await db.ReturnExchangeTickets
            .AsNoTracking()
            .Include(t => t.Customer)
            .Include(t => t.Order)
            .Include(t => t.ManagerApproved)
            .Include(t => t.StockManager)
            .Include(t => t.Items)
                .ThenInclude(i => i.VariantReturned)
                    .ThenInclude(v => v.Product)
            .Include(t => t.Items)
                .ThenInclude(i => i.VariantExchanged)
                    .ThenInclude(v => v!.Product)
            .FirstOrDefaultAsync(predicate, cancellationToken);
    }

    private AdminReturnDetailDto MapToDetailDto(ReturnExchangeTicket ticket)
    {
        return new AdminReturnDetailDto
        {
            Id = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            Type = ticket.Type,
            Status = ticket.Status,
            Reason = ticket.Reason,
            CustomerNote = ticket.CustomerNote,
            InternalNote = ticket.InternalNote,
            RefundAmount = ticket.RefundAmount,
            CreatedAt = ticket.CreatedAt,
            ApprovedAt = ticket.ApprovedAt,
            CompletedAt = ticket.CompletedAt,
            Customer = new AdminReturnCustomerDto
            {
                Id = ticket.Customer.Id,
                FullName = ticket.Customer.FullName,
                Email = ticket.Customer.Email,
                Phone = ticket.Customer.Phone,
                CustomerType = ticket.Customer.CustomerType,
                CompanyName = ticket.Customer.CompanyName
            },
            Order = new AdminReturnOrderDto
            {
                Id = ticket.Order.Id,
                OrderCode = ticket.Order.OrderCode,
                CreatedAt = ticket.Order.CreatedAt,
                OrderStatus = ticket.Order.OrderStatus,
                PaymentStatus = ticket.Order.PaymentStatus,
                PayableTotal = ticket.Order.PayableTotal
            },
            ManagerIdApproved = ticket.ManagerIdApproved,
            ManagerName = ticket.ManagerApproved?.FullName,
            StockManagerId = ticket.StockManagerId,
            StockManagerName = ticket.StockManager?.FullName,
            Items = ticket.Items.Select(i => new AdminReturnItemDto
            {
                Id = i.Id,
                OrderItemId = i.OrderItemId,
                VariantIdReturned = i.VariantIdReturned,
                SkuReturned = i.VariantReturned.Sku,
                VariantNameReturned = i.VariantReturned.VariantName,
                ProductNameReturned = i.VariantReturned.Product.Name,
                ImageUrlReturned = i.VariantReturned.ImageUrl,
                UnitPriceReturned = i.VariantReturned.RetailPrice,
                VariantIdExchanged = i.VariantIdExchanged,
                SkuExchanged = i.VariantExchanged?.Sku,
                VariantNameExchanged = i.VariantExchanged?.VariantName,
                ProductNameExchanged = i.VariantExchanged?.Product.Name,
                ImageUrlExchanged = i.VariantExchanged?.ImageUrl,
                Quantity = i.Quantity,
                InventoryAction = i.InventoryAction
            }).ToList()
        };
    }
}
