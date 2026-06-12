using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Common;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class StoreB2BQuoteService(BeContext db, NotificationBusinessEmitter notificationEmitter) : IStoreB2BQuoteService
{
    public async Task<StoreB2BQuoteDetailDto> CreateRequestAsync(
        int customerId,
        StoreB2BQuoteRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var customer = await db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy khách hàng");

        if (!string.Equals(customer.CustomerType, CustomerTypes.B2B, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Chỉ khách doanh nghiệp (B2B) mới có thể gửi yêu cầu báo giá");

        if (dto.Items == null || dto.Items.Count == 0)
            throw new ArgumentException("Yêu cầu báo giá phải có ít nhất 1 sản phẩm");

        var variantIds = dto.Items.Select(i => i.VariantId).Distinct().ToList();
        var variants = await db.ProductVariants
            .Include(v => v.Product)
            .Where(v => variantIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            decimal totalAmount = 0;
            var quoteLines = new List<(int VariantId, decimal UnitPrice, int Qty, decimal SubTotal)>();

            foreach (var item in dto.Items)
            {
                if (!variants.TryGetValue(item.VariantId, out var variant))
                    throw new InvalidOperationException($"Không tìm thấy sản phẩm với VariantId {item.VariantId}");

                if (!string.Equals(variant.Product.Status, ProductStatus.Active, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException($"Sản phẩm \"{variant.Product.Name}\" không còn bán");

                if (item.Quantity <= 0)
                    throw new ArgumentException($"Số lượng phải lớn hơn 0 cho SKU {variant.Sku}");

                var unitPrice = variant.RetailPrice;
                var subTotal = unitPrice * item.Quantity;
                totalAmount += subTotal;
                quoteLines.Add((variant.Id, unitPrice, item.Quantity, subTotal));
            }

            var quoteCode = await QuoteCodes.GenerateUniqueAsync(db.Quotes, cancellationToken);

            var quote = new Quote
            {
                QuoteCode = quoteCode,
                CustomerId = customerId,
                Status = QuoteStatuses.Requested,
                TotalAmount = totalAmount,
                FinalAmount = totalAmount,
                CustomerNotes = dto.Notes?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            await db.Quotes.AddAsync(quote, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            foreach (var (variantId, unitPrice, qty, subTotal) in quoteLines)
            {
                await db.QuoteItems.AddAsync(new QuoteItem
                {
                    QuoteId = quote.Id,
                    VariantId = variantId,
                    Quantity = qty,
                    UnitPrice = unitPrice,
                    SubTotal = subTotal
                }, cancellationToken);
            }

            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return await GetByIdInternalAsync(quote.Id, customerId, cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<PagedResultDto<StoreB2BQuoteListItemDto>> GetPagedAsync(
        int customerId,
        int page,
        int pageSize,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var visibleStatuses = QuoteStatuses.VisibleToCustomer;
        var query = db.Quotes
            .AsNoTracking()
            .Include(q => q.Sales)
            .Where(q => q.CustomerId == customerId)
            .Where(q => visibleStatuses.Contains(q.Status))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(q => q.Status == status);
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(q => q.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(q => new StoreB2BQuoteListItemDto
            {
                Id = q.Id,
                QuoteCode = q.QuoteCode,
                CreatedAt = q.CreatedAt,
                Status = q.Status,
                LineCount = q.Items.Count,
                TotalAmount = q.TotalAmount,
                DiscountType = q.DiscountType,
                DiscountValue = q.DiscountValue,
                FinalAmount = q.FinalAmount,
                ValidUntil = q.ValidUntil,
                SalesName = q.Sales != null ? q.Sales.FullName : null
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<StoreB2BQuoteListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<StoreB2BQuoteDetailDto> GetByCodeAsync(
        int customerId,
        string quoteCode,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(quoteCode))
            throw new ArgumentException("Mã báo giá không được để trống");

        var codeLower = quoteCode.Trim().ToLower();
        var quote = await GetQuoteWithDetailsAsync(
            q => q.QuoteCode.ToLower() == codeLower && q.CustomerId == customerId,
            cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy báo giá với mã {quoteCode}");

        if (!QuoteStatuses.IsVisibleToCustomer(quote.Status))
            throw new KeyNotFoundException($"Không tìm thấy báo giá với mã {quoteCode}");

        return MapToDetailDto(quote);
    }

    public async Task<StoreB2BQuoteDetailDto> AcceptAsync(
        int customerId,
        int quoteId,
        CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes
            .FirstOrDefaultAsync(q => q.Id == quoteId && q.CustomerId == customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy báo giá");

        if (!QuoteStatuses.CanCustomerAccept(quote.Status))
            throw new InvalidOperationException($"Không thể chấp nhận báo giá ở trạng thái '{quote.Status}'");

        if (quote.ValidUntil.HasValue && quote.ValidUntil.Value < DateTime.UtcNow)
            throw new InvalidOperationException("Báo giá đã hết hạn");

        quote.Status = QuoteStatuses.CustomerAccepted;
        quote.CustomerAcceptedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnQuoteCustomerAcceptedAsync(quoteId, cancellationToken);

        return await GetByIdInternalAsync(quoteId, customerId, cancellationToken);
    }

    public async Task<StoreB2BQuoteDetailDto> RejectAsync(
        int customerId,
        int quoteId,
        StoreB2BQuoteRejectDto dto,
        CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes
            .FirstOrDefaultAsync(q => q.Id == quoteId && q.CustomerId == customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy báo giá");

        if (!QuoteStatuses.CanCustomerReject(quote.Status))
            throw new InvalidOperationException($"Không thể từ chối báo giá ở trạng thái '{quote.Status}'");

        quote.Status = QuoteStatuses.CustomerRejected;
        quote.CustomerRejectReason = dto.Reason?.Trim();
        quote.CustomerRejectedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        await notificationEmitter.OnQuoteCustomerRejectedAsync(quoteId, cancellationToken);

        return await GetByIdInternalAsync(quoteId, customerId, cancellationToken);
    }

    public async Task<StoreB2BQuoteDetailDto> CounterOfferAsync(
        int customerId,
        int quoteId,
        StoreB2BQuoteCounterOfferDto dto,
        CancellationToken cancellationToken = default)
    {
        var quote = await db.Quotes
            .FirstOrDefaultAsync(q => q.Id == quoteId && q.CustomerId == customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy báo giá");

        if (!QuoteStatuses.CanCounterOffer(quote.Status))
            throw new InvalidOperationException($"Không thể gửi phản hồi thương lượng ở trạng thái '{quote.Status}'");

        if (string.IsNullOrWhiteSpace(dto.Message))
            throw new ArgumentException("Nội dung phản hồi không được để trống");

        quote.Status = QuoteStatuses.CounterOffer;
        quote.CounterOfferMessage = dto.Message.Trim();
        await db.SaveChangesAsync(cancellationToken);
        await notificationEmitter.OnQuoteCounterOfferAsync(quoteId, cancellationToken);

        return await GetByIdInternalAsync(quoteId, customerId, cancellationToken);
    }

    private async Task<StoreB2BQuoteDetailDto> GetByIdInternalAsync(
        int id,
        int customerId,
        CancellationToken cancellationToken)
    {
        var quote = await GetQuoteWithDetailsAsync(
            q => q.Id == id && q.CustomerId == customerId,
            cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy báo giá");

        return MapToDetailDto(quote);
    }

    private async Task<Quote?> GetQuoteWithDetailsAsync(
        System.Linq.Expressions.Expression<Func<Quote, bool>> predicate,
        CancellationToken cancellationToken)
    {
        return await db.Quotes
            .AsNoTracking()
            .Include(q => q.Sales)
            .Include(q => q.Items)
                .ThenInclude(i => i.Variant)
                    .ThenInclude(v => v.Product)
            .FirstOrDefaultAsync(predicate, cancellationToken);
    }

    private static StoreB2BQuoteDetailDto MapToDetailDto(Quote quote)
    {
        return new StoreB2BQuoteDetailDto
        {
            Id = quote.Id,
            QuoteCode = quote.QuoteCode,
            CreatedAt = quote.CreatedAt,
            Status = quote.Status,
            TotalAmount = quote.TotalAmount,
            DiscountType = quote.DiscountType,
            DiscountValue = quote.DiscountValue,
            FinalAmount = quote.FinalAmount,
            ValidUntil = quote.ValidUntil,
            Notes = quote.Notes,
            CustomerNotes = quote.CustomerNotes,
            RejectReason = quote.RejectReason,
            CustomerRejectReason = quote.CustomerRejectReason,
            CounterOfferMessage = quote.CounterOfferMessage,
            ApprovedAt = quote.ApprovedAt,
            Sales = quote.Sales == null ? null : new StoreB2BQuoteSalesDto
            {
                Id = quote.Sales.Id,
                FullName = quote.Sales.FullName,
                Email = quote.Sales.Email,
                Phone = quote.Sales.Phone
            },
            Lines = quote.Items.OrderBy(i => i.Id).Select(i => new StoreB2BQuoteLineDto
            {
                Id = i.Id,
                VariantId = i.VariantId,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                SubTotal = i.SubTotal,
                CurrentSku = i.Variant.Sku,
                VariantName = i.Variant.VariantName,
                ProductName = i.Variant.Product.Name,
                ImageUrl = FirstNonWhiteSpace(i.Variant.ImageUrl, i.Variant.Product.ImageUrl)
            }).ToList()
        };
    }

    private static string? FirstNonWhiteSpace(params string?[] values)
    {
        foreach (var v in values)
        {
            if (!string.IsNullOrWhiteSpace(v))
                return v.Trim();
        }
        return null;
    }
}
