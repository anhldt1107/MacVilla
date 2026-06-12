using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class StoreB2BOrderService(BeContext db, AfterSalesQuantityService afterSalesQuantity) : IStoreB2BOrderService
{
    public async Task<PagedResultDto<StoreB2BOrderListItemDto>> GetPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? orderStatus = null,
        string? paymentStatus = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.Quote)
            .Include(o => o.Contract)
            .Include(o => o.Items)
            .Where(o => o.CustomerId == customerId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(orderStatus))
        {
            query = query.Where(o => o.OrderStatus == orderStatus);
        }

        if (!string.IsNullOrWhiteSpace(paymentStatus))
        {
            query = query.Where(o => o.PaymentStatus == paymentStatus);
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new StoreB2BOrderListItemDto
            {
                Id = o.Id,
                OrderCode = o.OrderCode,
                OrderStatus = o.OrderStatus,
                PaymentStatus = o.PaymentStatus,
                PaymentMethod = o.PaymentMethod,
                CreatedAt = o.CreatedAt,
                MerchandiseTotal = o.MerchandiseTotal,
                DiscountTotal = o.DiscountTotal,
                PayableTotal = o.PayableTotal,
                LineCount = o.Items.Count,
                QuoteCode = o.Quote != null ? o.Quote.QuoteCode : null,
                ContractNumber = o.Contract != null ? o.Contract.ContractNumber : null
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<StoreB2BOrderListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<StoreB2BOrderDetailDto> GetByOrderCodeAsync(
        int customerId,
        string orderCode,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        if (string.IsNullOrWhiteSpace(orderCode))
            throw new ArgumentException("Mã đơn hàng không được để trống");

        var codeLower = orderCode.Trim().ToLower();
        var order = await GetOrderWithDetailsAsync(
            o => o.OrderCode.ToLower() == codeLower && o.CustomerId == customerId,
            cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {orderCode}");

        var dto = MapToDetailDto(order);
        await EnrichAfterSalesLineQuantitiesAsync(dto, order.Id, cancellationToken);
        return dto;
    }

    public async Task<StoreB2BOrderTimelineDto> GetTimelineAsync(
        int customerId,
        string orderCode,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2BCustomerAsync(customerId, cancellationToken);

        if (string.IsNullOrWhiteSpace(orderCode))
            throw new ArgumentException("Mã đơn hàng không được để trống");

        var codeLower = orderCode.Trim().ToLower();
        var order = await db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.FulfillmentTickets)
            .FirstOrDefaultAsync(
                o => o.OrderCode.ToLower() == codeLower && o.CustomerId == customerId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {orderCode}");

        var events = new List<StoreB2BOrderTimelineEventDto>();

        events.Add(new StoreB2BOrderTimelineEventDto
        {
            EventType = "Order",
            Status = "Created",
            Description = "Đơn hàng được tạo",
            Timestamp = order.CreatedAt
        });

        if (order.OrderStatus != OrderStatuses.New && order.OrderStatus != OrderStatuses.AwaitingPayment)
        {
            events.Add(new StoreB2BOrderTimelineEventDto
            {
                EventType = "Order",
                Status = OrderStatuses.Confirmed,
                Description = "Đơn hàng đã được xác nhận",
                Timestamp = order.CreatedAt.AddMinutes(1)
            });
        }

        foreach (var fulfillment in order.FulfillmentTickets.OrderBy(f => f.CreatedAt))
        {
            events.Add(new StoreB2BOrderTimelineEventDto
            {
                EventType = "Fulfillment",
                Status = fulfillment.Status,
                Description = GetFulfillmentDescription(fulfillment.Status, fulfillment.TicketType),
                Timestamp = fulfillment.UpdatedAt ?? fulfillment.CreatedAt,
                Notes = fulfillment.Notes
            });
        }

        if (order.PaymentStatus == "Paid")
        {
            events.Add(new StoreB2BOrderTimelineEventDto
            {
                EventType = "Payment",
                Status = "Paid",
                Description = "Đã thanh toán",
                Timestamp = order.CreatedAt.AddMinutes(2)
            });
        }

        if (order.OrderStatus == OrderStatuses.Shipped)
        {
            events.Add(new StoreB2BOrderTimelineEventDto
            {
                EventType = "Shipping",
                Status = OrderStatuses.Shipped,
                Description = "Đang giao hàng",
                Timestamp = order.CreatedAt.AddDays(1)
            });
        }

        if (order.OrderStatus == OrderStatuses.Delivered)
        {
            events.Add(new StoreB2BOrderTimelineEventDto
            {
                EventType = "Shipping",
                Status = OrderStatuses.Delivered,
                Description = "Đã giao hàng thành công",
                Timestamp = order.CreatedAt.AddDays(2)
            });
        }

        if (order.OrderStatus == OrderStatuses.Completed)
        {
            events.Add(new StoreB2BOrderTimelineEventDto
            {
                EventType = "Order",
                Status = OrderStatuses.Completed,
                Description = "Đơn hàng hoàn thành",
                Timestamp = order.CreatedAt.AddDays(3)
            });
        }

        if (order.OrderStatus == OrderStatuses.Cancelled)
        {
            events.Add(new StoreB2BOrderTimelineEventDto
            {
                EventType = "Order",
                Status = OrderStatuses.Cancelled,
                Description = "Đơn hàng đã bị hủy",
                Timestamp = order.CreatedAt.AddMinutes(5)
            });
        }

        return new StoreB2BOrderTimelineDto
        {
            OrderCode = order.OrderCode,
            CurrentStatus = order.OrderStatus,
            Events = events.OrderBy(e => e.Timestamp).ToList()
        };
    }

    private async Task EnsureB2BCustomerAsync(int customerId, CancellationToken cancellationToken)
    {
        var exists = await db.Customers.AsNoTracking()
            .AnyAsync(c => c.Id == customerId && c.CustomerType == CustomerTypes.B2B, cancellationToken);
        if (!exists)
            throw new KeyNotFoundException("Không tìm thấy tài khoản doanh nghiệp");
    }

    private async Task<CustomerOrder?> GetOrderWithDetailsAsync(
        System.Linq.Expressions.Expression<Func<CustomerOrder, bool>> predicate,
        CancellationToken cancellationToken)
    {
        return await db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.Quote)
            .Include(o => o.Contract)
            .Include(o => o.ShippingAddress)
            .Include(o => o.Sales)
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Product)
            .Include(o => o.FulfillmentTickets)
            .FirstOrDefaultAsync(predicate, cancellationToken);
    }

    private static StoreB2BOrderDetailDto MapToDetailDto(CustomerOrder order)
    {
        return new StoreB2BOrderDetailDto
        {
            Id = order.Id,
            OrderCode = order.OrderCode,
            OrderStatus = order.OrderStatus,
            PaymentStatus = order.PaymentStatus,
            PaymentMethod = order.PaymentMethod,
            CreatedAt = order.CreatedAt,
            MerchandiseTotal = order.MerchandiseTotal,
            DiscountTotal = order.DiscountTotal,
            PayableTotal = order.PayableTotal,
            QuoteCode = order.Quote?.QuoteCode,
            QuoteId = order.QuoteId,
            ContractNumber = order.Contract?.ContractNumber,
            ContractId = order.ContractId,
            ShippingAddress = order.ShippingAddress == null ? null : new StoreB2BOrderAddressDto
            {
                Id = order.ShippingAddress.Id,
                ReceiverName = order.ShippingAddress.ReceiverName,
                ReceiverPhone = order.ShippingAddress.ReceiverPhone,
                AddressLine = order.ShippingAddress.AddressLine
            },
            Sales = order.Sales == null ? null : new StoreB2BOrderSalesDto
            {
                Id = order.Sales.Id,
                FullName = order.Sales.FullName,
                Email = order.Sales.Email,
                Phone = order.Sales.Phone
            },
            Lines = order.Items.OrderBy(i => i.Id).Select(i => new StoreB2BOrderLineDto
            {
                Id = i.Id,
                VariantId = i.VariantId,
                Sku = i.SkuSnapshot ?? i.Variant.Sku,
                ProductName = i.Variant.Product.Name,
                VariantName = i.Variant.VariantName,
                ImageUrl = i.Variant.ImageUrl,
                Quantity = i.Quantity,
                UnitPrice = i.PriceSnapshot,
                SubTotal = i.SubTotal
            }).ToList(),
            Fulfillments = order.FulfillmentTickets.OrderByDescending(f => f.CreatedAt).Select(f => new StoreB2BOrderFulfillmentDto
            {
                Id = f.Id,
                TicketType = f.TicketType,
                Status = f.Status,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt,
                Notes = f.Notes
            }).ToList()
        };
    }

    private async Task EnrichAfterSalesLineQuantitiesAsync(
        StoreB2BOrderDetailDto dto,
        int orderId,
        CancellationToken cancellationToken)
    {
        var eligibility = await afterSalesQuantity.GetLineEligibilityForOrderAsync(orderId, cancellationToken);
        foreach (var line in dto.Lines)
        {
            if (eligibility.TryGetValue(line.Id, out var e))
            {
                line.ReturnableQuantity = e.Returnable;
                line.WarrantyClaimableQuantity = e.Claimable;
            }
        }
    }

    private static string GetFulfillmentDescription(string status, string? ticketType)
    {
        var typeDesc = ticketType switch
        {
            "Pickup" => "lấy hàng",
            "Pack" => "đóng gói",
            "Ship" => "giao vận",
            _ => "xuất kho"
        };

        return status switch
        {
            FulfillmentStatuses.Pending => $"Phiếu {typeDesc} đang chờ xử lý",
            FulfillmentStatuses.Picking => "Đang lấy hàng",
            FulfillmentStatuses.Packed => "Đã đóng gói",
            FulfillmentStatuses.Shipped => "Đã giao cho vận chuyển",
            FulfillmentStatuses.Cancelled => $"Phiếu {typeDesc} đã hủy",
            _ => $"Phiếu {typeDesc}: {status}"
        };
    }
}
