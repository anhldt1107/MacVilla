using BE_API.Authorization;
using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.Fulfillment;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminFulfillmentService(
    IRepository<FulfillmentTicket> fulfillmentRepo,
    IRepository<CustomerOrder> orderRepo,
    IRepository<AppUser> userRepo,
    BeContext db,
    FulfillmentInventoryOutService inventoryOutService,
    WarrantyProvisioningService warrantyProvisioning,
    NotificationBusinessEmitter notificationEmitter) : IAdminFulfillmentService
{
    public async Task<PagedResultDto<FulfillmentListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? status,
        int? orderId,
        int? assignedWorkerId,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = fulfillmentRepo.Get().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(f => f.Status == status);

        if (orderId.HasValue)
            query = query.Where(f => f.OrderId == orderId.Value);

        if (assignedWorkerId.HasValue)
            query = query.Where(f => f.AssignedWorkerId == assignedWorkerId.Value);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .ThenByDescending(f => f.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FulfillmentListItemDto
            {
                Id = f.Id,
                OrderId = f.OrderId,
                OrderCode = f.Order.OrderCode,
                TicketType = f.TicketType,
                Status = f.Status,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt,
                AssignedWorkerId = f.AssignedWorkerId,
                AssignedWorkerName = f.AssignedWorker != null ? f.AssignedWorker.FullName : null,
                CreatedBy = f.CreatedBy,
                CreatedByName = f.CreatedByUser != null ? f.CreatedByUser.FullName : null,
                CustomerName = f.Order.Customer.FullName,
                CustomerPhone = f.Order.Customer.Phone
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<FulfillmentListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<FulfillmentDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var dto = await fulfillmentRepo.Get()
            .AsNoTracking()
            .Where(f => f.Id == id)
            .Select(f => new FulfillmentDetailDto
            {
                Id = f.Id,
                OrderId = f.OrderId,
                TicketType = f.TicketType,
                Status = f.Status,
                Notes = f.Notes,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt,
                AssignedWorkerId = f.AssignedWorkerId,
                AssignedWorkerName = f.AssignedWorker != null ? f.AssignedWorker.FullName : null,
                CreatedBy = f.CreatedBy,
                CreatedByName = f.CreatedByUser != null ? f.CreatedByUser.FullName : null,
                Order = new FulfillmentOrderDto
                {
                    Id = f.Order.Id,
                    OrderCode = f.Order.OrderCode,
                    OrderStatus = f.Order.OrderStatus,
                    PaymentStatus = f.Order.PaymentStatus,
                    CreatedAt = f.Order.CreatedAt,
                    MerchandiseTotal = f.Order.MerchandiseTotal,
                    DiscountTotal = f.Order.DiscountTotal,
                    PayableTotal = f.Order.PayableTotal,
                    Customer = new FulfillmentCustomerDto
                    {
                        Id = f.Order.Customer.Id,
                        FullName = f.Order.Customer.FullName,
                        Email = f.Order.Customer.Email,
                        Phone = f.Order.Customer.Phone
                    },
                    ShippingAddress = f.Order.ShippingAddress != null ? new FulfillmentAddressDto
                    {
                        Id = f.Order.ShippingAddress.Id,
                        ReceiverName = f.Order.ShippingAddress.ReceiverName,
                        ReceiverPhone = f.Order.ShippingAddress.ReceiverPhone,
                        AddressLine = f.Order.ShippingAddress.AddressLine
                    } : null,
                    Lines = f.Order.Items.Select(i => new FulfillmentOrderLineDto
                    {
                        Id = i.Id,
                        VariantId = i.VariantId,
                        SkuSnapshot = i.SkuSnapshot,
                        Quantity = i.Quantity,
                        PriceSnapshot = i.PriceSnapshot,
                        SubTotal = i.SubTotal,
                        CurrentSku = i.Variant.Sku,
                        VariantName = i.Variant.VariantName,
                        ProductName = i.Variant.Product.Name,
                        ImageUrl = i.Variant.Product.ImageUrl
                    }).ToList()
                }
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy phiếu xuất kho");

        dto.AllowedFulfillmentTransitions = OrderFulfillmentWorkflow
            .GetAllowedFulfillmentTransitions(dto.Status)
            .ToList();
        dto.AllowedOrderTransitions = OrderFulfillmentWorkflow
            .GetAllowedOrderTransitions(dto.Order.OrderStatus)
            .ToList();
        var orderEntity = await orderRepo.Get().AsNoTracking()
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId, cancellationToken);
        dto.Warnings = orderEntity != null
            ? OrderFulfillmentWorkflow.BuildOrderWarnings(orderEntity, orderEntity.Customer)
            : [];

        dto.InventoryOutPosted = await inventoryOutService.HasOutPostedAsync(dto.Id, cancellationToken);

        return dto;
    }

    public async Task<FulfillmentDetailDto> CreateAsync(
        int orderId,
        FulfillmentCreateDto dto,
        int createdByUserId,
        CancellationToken cancellationToken = default)
    {
        var order = await orderRepo.Get()
            .Include(o => o.FulfillmentTickets)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng");

        OrderFulfillmentWorkflow.ValidateOrderAllowsCreate(order);
        OrderFulfillmentWorkflow.ValidateNoActiveFulfillment(order.FulfillmentTickets);

        var fromStatus = order.OrderStatus;
        OrderFulfillmentWorkflow.TryAdvanceOrderOnCreate(order);

        var entity = new FulfillmentTicket
        {
            OrderId = orderId,
            TicketType = dto.TicketType?.Trim(),
            Status = FulfillmentStatuses.Pending,
            Notes = dto.Notes?.Trim(),
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        await fulfillmentRepo.AddAsync(entity, cancellationToken);

        if (!string.Equals(fromStatus, order.OrderStatus, StringComparison.OrdinalIgnoreCase))
        {
            orderRepo.Update(order);
            await AppendOrderStatusHistoryAsync(
                order.Id,
                fromStatus,
                order.OrderStatus,
                "Tạo phiếu công việc",
                "FulfillmentSync",
                createdByUserId,
                cancellationToken);
        }
        else
        {
            orderRepo.Update(order);
        }

        await fulfillmentRepo.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnFulfillmentCreatedAsync(entity.Id, cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<FulfillmentDetailDto> AssignWorkerAsync(
        int id,
        FulfillmentAssignWorkerDto dto,
        CancellationToken cancellationToken = default)
    {
        var fulfillment = await fulfillmentRepo.Get()
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy phiếu xuất kho");

        if (fulfillment.Status == FulfillmentStatuses.Shipped)
            throw new InvalidOperationException("Phiếu đã giao vận chuyển, không thể thay đổi Worker");

        if (fulfillment.Status == FulfillmentStatuses.Cancelled)
            throw new InvalidOperationException("Phiếu đã hủy, không thể thay đổi Worker");

        var worker = await userRepo.Get()
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == dto.WorkerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy Worker");

        if (worker.Status != UserStatuses.Active)
            throw new InvalidOperationException("Worker không hoạt động");

        if (!OrderFulfillmentWorkflow.IsWorkerRole(worker.Role?.RoleName))
            throw new InvalidOperationException("Người được gán phải có vai trò Worker.");

        fulfillment.AssignedWorkerId = dto.WorkerId;
        fulfillment.UpdatedAt = DateTime.UtcNow;

        fulfillmentRepo.Update(fulfillment);
        await fulfillmentRepo.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnFulfillmentAssignedAsync(id, dto.WorkerId, cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<FulfillmentDetailDto> UpdateStatusAsync(
        int id,
        FulfillmentUpdateStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        var newStatus = dto.Status.Trim();

        if (!FulfillmentStatuses.IsValid(newStatus))
            throw new InvalidOperationException($"Trạng thái không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", FulfillmentStatuses.All)}");

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var fulfillment = await db.FulfillmentTickets
                .Include(f => f.Order)
                    .ThenInclude(o => o.Customer)
                .FirstOrDefaultAsync(f => f.Id == id, cancellationToken)
                ?? throw new KeyNotFoundException("Không tìm thấy phiếu xuất kho");

            if (!FulfillmentStatuses.CanTransition(fulfillment.Status, newStatus))
                throw new InvalidOperationException($"Không thể chuyển trạng thái từ '{fulfillment.Status}' sang '{newStatus}'");

            OrderFulfillmentWorkflow.ValidateBeforeFulfillmentStatusChange(fulfillment, newStatus);

            var orderFromStatus = fulfillment.Order.OrderStatus;
            fulfillment.Status = newStatus;
            fulfillment.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(dto.Notes))
                fulfillment.Notes = dto.Notes.Trim();

            if (string.Equals(newStatus, FulfillmentStatuses.Shipped, StringComparison.OrdinalIgnoreCase))
            {
                await inventoryOutService.PostOutForFulfillmentAsync(
                    fulfillment,
                    fulfillment.Order,
                    fulfillment.AssignedWorkerId,
                    cancellationToken);
            }

            var becameDelivered = OrderFulfillmentWorkflow.TryAdvanceOrderOnFulfillmentStatus(
                fulfillment.Order,
                newStatus,
                fulfillment.TicketType);

            if (!string.Equals(orderFromStatus, fulfillment.Order.OrderStatus, StringComparison.OrdinalIgnoreCase))
            {
                var note = becameDelivered
                    ? $"Phiếu #{fulfillment.Id} → {newStatus} (khách tự lấy)"
                    : $"Phiếu #{fulfillment.Id} → {newStatus}";
                await AppendOrderStatusHistoryAsync(
                    fulfillment.Order.Id,
                    orderFromStatus,
                    fulfillment.Order.OrderStatus,
                    note,
                    "FulfillmentSync",
                    null,
                    cancellationToken);
            }

            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            if (becameDelivered)
                await warrantyProvisioning.EnsureWarrantyTicketForOrderAsync(fulfillment.Order.Id, cancellationToken);

            if (string.Equals(newStatus, FulfillmentStatuses.Shipped, StringComparison.OrdinalIgnoreCase))
                await notificationEmitter.OnFulfillmentShippedAsync(id, cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }

        return await GetByIdAsync(id, cancellationToken);
    }

    private async Task AppendOrderStatusHistoryAsync(
        int orderId,
        string fromStatus,
        string toStatus,
        string? note,
        string source,
        int? actorUserId,
        CancellationToken cancellationToken)
    {
        await db.OrderStatusHistories.AddAsync(new OrderStatusHistory
        {
            OrderId = orderId,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            Note = note,
            Source = source,
            ActorUserId = actorUserId,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);
    }
}
