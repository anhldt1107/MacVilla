using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class StoreVoucherService(BeContext db, IRepository<Voucher> voucherRepo) : IStoreVoucherService
{
    public async Task<StoreVoucherValidateResponseDto> ValidateAsync(
        StoreVoucherValidateRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var code = dto.Code.Trim();
        if (code.Length == 0)
            throw new ArgumentException("Mã voucher không hợp lệ.");

        var voucher = await voucherRepo.Get()
            .AsNoTracking()
            .Include(v => v.Campaign)
            .FirstOrDefaultAsync(v => v.Code.ToLower() == code.ToLowerInvariant(), cancellationToken);

        if (voucher is null)
            throw new KeyNotFoundException("Không tìm thấy mã giảm giá.");

        var baseResponse = new StoreVoucherValidateResponseDto
        {
            Code = voucher.Code,
            VoucherId = voucher.Id,
            DiscountType = voucher.DiscountType,
            MinOrderValue = voucher.MinOrderValue
        };

        var now = DateTime.UtcNow;
        if (!VoucherComputation.IsEligible(voucher, now, out var reason))
            return NotApplicable(baseResponse, reason!);

        if (!dto.SubTotal.HasValue)
        {
            baseResponse.Applicable = true;
            baseResponse.Message =
                $"Mã hợp lệ. Đơn tối thiểu {voucher.MinOrderValue:N0} để áp dụng. Gửi thêm tạm tính để xem số tiền giảm.";
            return baseResponse;
        }

        var subTotal = dto.SubTotal.Value;
        if (subTotal < 0)
            throw new ArgumentException("Tạm tính không hợp lệ.");

        if (!VoucherComputation.MeetsMinOrder(voucher, subTotal))
        {
            return NotApplicable(
                baseResponse,
                $"Đơn chưa đạt giá trị tối thiểu ({voucher.MinOrderValue:N0}) để dùng voucher.");
        }

        var discount = VoucherComputation.ComputeDiscount(subTotal, voucher);
        baseResponse.Applicable = true;
        baseResponse.DiscountAmount = discount;
        baseResponse.SubTotalAfterDiscount = Math.Max(0, subTotal - discount);
        baseResponse.Message = "Áp dụng voucher thành công.";
        return baseResponse;
    }

    public async Task<StoreCartVouchersResponseDto> ListForCartAsync(
        int customerId,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        var merchandise = await ComputeCartMerchandiseAsync(customerId, cancellationToken);

        var vouchers = await voucherRepo.Get()
            .AsNoTracking()
            .Include(v => v.Campaign)
            // Không dùng string.Equals(..., StringComparison) — EF Core không dịch được sang SQL.
            .Where(v =>
                v.Status == VoucherStatuses.Active &&
                v.Campaign.Status == VoucherStatuses.Active)
            .OrderBy(v => v.MinOrderValue)
            .ThenBy(v => v.Code)
            .Take(200)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var items = new List<StoreCartVoucherListItemDto>(vouchers.Count);

        foreach (var v in vouchers)
        {
            var row = new StoreCartVoucherListItemDto
            {
                VoucherId = v.Id,
                Code = v.Code,
                DiscountType = v.DiscountType,
                DiscountValue = v.DiscountValue,
                MinOrderValue = v.MinOrderValue,
                MaxDiscountAmount = v.MaxDiscountAmount,
                CampaignName = v.Campaign.Name
            };

            if (!VoucherComputation.IsEligible(v, now, out var reason))
            {
                row.Eligible = false;
                row.ApplicableToCart = false;
                row.Message = reason;
                items.Add(row);
                continue;
            }

            row.Eligible = true;
            if (!VoucherComputation.MeetsMinOrder(v, merchandise))
            {
                row.ApplicableToCart = false;
                row.Message =
                    $"Đơn chưa đạt giá trị tối thiểu ({v.MinOrderValue:N0}) để dùng voucher.";
                items.Add(row);
                continue;
            }

            try
            {
                var discount = VoucherComputation.ComputeDiscount(merchandise, v);
                row.ApplicableToCart = true;
                row.DiscountAmount = discount;
                row.Message = "Áp dụng được cho giỏ hiện tại.";
            }
            catch (InvalidOperationException ex)
            {
                row.ApplicableToCart = false;
                row.Message = ex.Message;
            }

            items.Add(row);
        }

        return new StoreCartVouchersResponseDto
        {
            MerchandiseSubtotal = merchandise,
            Items = items
        };
    }

    private async Task EnsureB2CAsync(int customerId, CancellationToken cancellationToken)
    {
        var ok = await db.Customers.AsNoTracking()
            .AnyAsync(c => c.Id == customerId && c.CustomerType == CustomerTypes.B2C, cancellationToken);
        if (!ok)
            throw new KeyNotFoundException("Không tìm thấy tài khoản");
    }

    /// <summary>
    /// Tạm tính để so với MinOrderValue — chỉ tính dòng SP Active, không kiểm tra tồn (tránh chặn cả danh sách mã).
    /// </summary>
    private async Task<decimal> ComputeCartMerchandiseAsync(int customerId, CancellationToken cancellationToken)
    {
        var cart = await db.ShoppingCarts
            .AsNoTracking()
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId, cancellationToken);

        if (cart is null || cart.Items.Count == 0)
            return 0;

        var variantIds = cart.Items.Select(i => i.VariantId).Distinct().ToList();
        var variants = await db.ProductVariants
            .AsNoTracking()
            .Include(x => x.Product)
            .Where(x => variantIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        decimal sum = 0;
        foreach (var ci in cart.Items)
        {
            if (!variants.TryGetValue(ci.VariantId, out var v))
                continue;
            if (!string.Equals(v.Product.Status, ProductStatus.Active, StringComparison.OrdinalIgnoreCase))
                continue;

            sum += v.RetailPrice * ci.Quantity;
        }

        return sum;
    }

    private static StoreVoucherValidateResponseDto NotApplicable(StoreVoucherValidateResponseDto r, string message)
    {
        r.Applicable = false;
        r.Message = message;
        return r;
    }
}
