using BE_API.Domain;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class CustomerCartService(
    IRepository<Customer> customerRepo,
    IRepository<ShoppingCart> cartRepo,
    IRepository<ShoppingCartItem> cartItemRepo,
    IRepository<ProductVariant> variantRepo,
    IRepository<Inventory> inventoryRepo) : ICustomerCartService
{
    public Task<StoreCartDto> GetCartAsync(int customerId, CancellationToken cancellationToken = default) =>
        GetCartCoreAsync(customerId, cancellationToken);

    public async Task<StoreCartDto> AddOrUpdateItemAsync(
        int customerId,
        StoreCartAddItemDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        var cart = await GetOrCreateCartAsync(customerId, cancellationToken);
        await EnsureVariantSellableAsync(dto.VariantId, cancellationToken);

        var existing = await cartItemRepo.Get()
            .FirstOrDefaultAsync(
                i => i.ShoppingCartId == cart.Id && i.VariantId == dto.VariantId,
                cancellationToken);

        if (existing is null)
        {
            await cartItemRepo.AddAsync(
                new ShoppingCartItem
                {
                    ShoppingCartId = cart.Id,
                    VariantId = dto.VariantId,
                    Quantity = dto.Quantity
                },
                cancellationToken);
        }
        else
        {
            existing.Quantity += dto.Quantity;
            cartItemRepo.Update(existing);
        }

        await BumpCartAsync(cart, cancellationToken);
        return await MapCartAsync(cart.Id, cancellationToken);
    }

    public async Task<StoreCartDto> SetQuantityAsync(
        int customerId,
        int variantId,
        StoreCartSetQuantityDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        var cart = await cartRepo.Get()
            .FirstOrDefaultAsync(c => c.CustomerId == customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Chưa có giỏ hàng.");

        var line = await cartItemRepo.Get()
            .FirstOrDefaultAsync(i => i.ShoppingCartId == cart.Id && i.VariantId == variantId, cancellationToken);

        if (line is null)
            throw new KeyNotFoundException("Không có dòng này trong giỏ.");

        if (dto.Quantity <= 0)
            cartItemRepo.Delete(line);
        else
        {
            await EnsureVariantSellableAsync(variantId, cancellationToken);
            line.Quantity = dto.Quantity;
            cartItemRepo.Update(line);
        }

        await BumpCartAsync(cart, cancellationToken);
        return await MapCartAsync(cart.Id, cancellationToken);
    }

    public async Task<StoreCartDto> RemoveItemAsync(
        int customerId,
        int variantId,
        CancellationToken cancellationToken = default)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        var cart = await cartRepo.Get()
            .FirstOrDefaultAsync(c => c.CustomerId == customerId, cancellationToken);
        if (cart is null)
            return EmptyCartDto();

        var line = await cartItemRepo.Get()
            .FirstOrDefaultAsync(i => i.ShoppingCartId == cart.Id && i.VariantId == variantId, cancellationToken);
        if (line is not null)
        {
            cartItemRepo.Delete(line);
            await BumpCartAsync(cart, cancellationToken);
        }

        return await MapCartAsync(cart.Id, cancellationToken);
    }

    public async Task ClearAsync(int customerId, CancellationToken cancellationToken = default)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        var cart = await cartRepo.Get()
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId, cancellationToken);
        if (cart is null)
            return;

        if (cart.Items.Count > 0)
        {
            cartItemRepo.DeleteRange(cart.Items);
            await BumpCartAsync(cart, cancellationToken);
        }
    }

    private async Task<StoreCartDto> GetCartCoreAsync(int customerId, CancellationToken cancellationToken)
    {
        await EnsureB2CAsync(customerId, cancellationToken);
        var cart = await cartRepo.Get()
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CustomerId == customerId, cancellationToken);
        if (cart is null)
            return EmptyCartDto();

        return await MapCartAsync(cart.Id, cancellationToken);
    }

    private static StoreCartDto EmptyCartDto() =>
        new() { CartId = 0, UpdatedAt = DateTime.UtcNow, Lines = [], MerchandiseSubtotal = 0 };

    private async Task EnsureB2CAsync(int customerId, CancellationToken cancellationToken)
    {
        var ok = await customerRepo.Get().AsNoTracking()
            .AnyAsync(c => c.Id == customerId && c.CustomerType == CustomerTypes.B2C, cancellationToken);
        if (!ok)
            throw new KeyNotFoundException("Không tìm thấy tài khoản");
    }

    private async Task<ShoppingCart> GetOrCreateCartAsync(int customerId, CancellationToken cancellationToken)
    {
        var cart = await cartRepo.Get()
            .FirstOrDefaultAsync(c => c.CustomerId == customerId, cancellationToken);
        if (cart is not null)
            return cart;

        cart = new ShoppingCart
        {
            CustomerId = customerId,
            UpdatedAt = DateTime.UtcNow
        };
        await cartRepo.AddAsync(cart, cancellationToken);
        await cartRepo.SaveChangesAsync(cancellationToken);
        return cart;
    }

    private async Task EnsureVariantSellableAsync(int variantId, CancellationToken cancellationToken)
    {
        var ok = await variantRepo.Get()
            .AsNoTracking()
            .AnyAsync(
                v => v.Id == variantId && v.Product.Status == ProductStatus.Active,
                cancellationToken);
        if (!ok)
            throw new InvalidOperationException("Biến thể không tồn tại hoặc sản phẩm không bán.");
    }

    private async Task BumpCartAsync(ShoppingCart cart, CancellationToken cancellationToken)
    {
        cart.UpdatedAt = DateTime.UtcNow;
        cartRepo.Update(cart);
        await cartRepo.SaveChangesAsync(cancellationToken);
    }

    private async Task<StoreCartDto> MapCartAsync(int cartId, CancellationToken cancellationToken)
    {
        var cartRow = await cartRepo.Get().AsNoTracking().FirstOrDefaultAsync(c => c.Id == cartId, cancellationToken);
        if (cartRow is null)
            return EmptyCartDto();

        var items = await cartItemRepo.Get()
            .AsNoTracking()
            .Where(i => i.ShoppingCartId == cartId)
            .Include(i => i.Variant)
            .ThenInclude(v => v.Product)
            .OrderBy(i => i.Id)
            .ToListAsync(cancellationToken);

        var variantIds = items.Select(i => i.VariantId).Distinct().ToList();
        var invMap = variantIds.Count == 0
            ? new Dictionary<int, int>()
            : await inventoryRepo.Get()
                .AsNoTracking()
                .Where(inv => variantIds.Contains(inv.VariantId))
                .ToDictionaryAsync(inv => inv.VariantId, inv => inv.QuantityAvailable, cancellationToken);

        decimal merch = 0;
        var lines = new List<StoreCartLineDto>();
        foreach (var row in items)
        {
            var v = row.Variant;
            var avail = invMap.GetValueOrDefault(v.Id, 0);
            var unit = v.RetailPrice;
            var lineTotal = unit * row.Quantity;
            merch += lineTotal;
            lines.Add(new StoreCartLineDto
            {
                LineId = row.Id,
                VariantId = v.Id,
                Sku = v.Sku,
                ImageUrl = v.ImageUrl,
                VariantName = v.VariantName,
                ProductName = v.Product.Name,
                Quantity = row.Quantity,
                UnitPrice = unit,
                LineSubtotal = lineTotal,
                QuantityAvailable = avail,
                InsufficientStock = row.Quantity > avail
            });
        }

        return new StoreCartDto
        {
            CartId = cartRow.Id,
            UpdatedAt = cartRow.UpdatedAt,
            Lines = lines,
            MerchandiseSubtotal = merch
        };
    }
}
