using BE_API.Database;
using BE_API.Domain;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE_API.Tests;

/// <summary>
/// Kiểm tra biến thể có bản ghi <see cref="Inventory"/> với QuantityAvailable &gt; 0.
/// Thuộc tính ProductAttribute/ProductAttributeValue để AND filter ids.
/// </summary>
public class StoreCatalogListingFiltersTests : IDisposable
{
    private readonly BeContext _ctx;

    public StoreCatalogListingFiltersTests()
    {
        var options = new DbContextOptionsBuilder<BeContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _ctx = new BeContext(options);
        _ctx.Database.EnsureCreated();
        Seed();
    }

    private void Seed()
    {
        var cat = new Category { Id = 900, ParentId = null, Name = "Test Cat", Slug = "test-cat-filt" };

        var pStock = new Product
        {
            Id = 8001,
            CategoryId = 900,
            Name = "Có hàng một phần",
            Slug = "with-stock-item",
            Status = ProductStatus.Active,
            BasePrice = 1_000m,
            WarrantyPeriodMonths = 12
        };
        var pNoStock = new Product
        {
            Id = 8002,
            CategoryId = 900,
            Name = "Hết kho báo không",
            Slug = "no-stock-inv",
            Status = ProductStatus.Active,
            BasePrice = 2_000m,
            WarrantyPeriodMonths = 12
        };
        var pAttrBrand = new Product
        {
            Id = 8003,
            CategoryId = 900,
            Name = "Thuộc tính thương hiệu",
            Slug = "brand-attr-product",
            Status = ProductStatus.Active,
            BasePrice = 3_000m,
            WarrantyPeriodMonths = 12
        };
        var pAttrBrandDup = new Product
        {
            Id = 8004,
            CategoryId = 900,
            Name = "Thuộc tính thương hiệu trùng nhãn",
            Slug = "brand-attr-product-dup",
            Status = ProductStatus.Active,
            BasePrice = 3_500m,
            WarrantyPeriodMonths = 12
        };

        _ctx.Categories.Add(cat);
        _ctx.Products.AddRange(pStock, pNoStock, pAttrBrand, pAttrBrandDup);

        var vStock = new ProductVariant
        {
            Id = 8101,
            ProductId = 8001,
            Sku = "STOCK-OK",
            VariantName = "A",
            RetailPrice = pStock.BasePrice!.Value,
            CostPrice = 100
        };
        var vNoRows = new ProductVariant
        {
            Id = 8102,
            ProductId = 8002,
            Sku = "NO-INV-ROW",
            VariantName = "B",
            RetailPrice = pNoStock.BasePrice!.Value,
            CostPrice = 100
        };
        var vZeroAvail = new ProductVariant
        {
            Id = 8103,
            ProductId = 8002,
            Sku = "ZERO-INV",
            VariantName = "C",
            RetailPrice = 100,
            CostPrice = 50
        };
        var vAttrHolder = new ProductVariant
        {
            Id = 8104,
            ProductId = 8003,
            Sku = "ATTR-SKU",
            VariantName = "D",
            RetailPrice = 100,
            CostPrice = 50
        };
        var vAttrHolderDup = new ProductVariant
        {
            Id = 8105,
            ProductId = 8004,
            Sku = "ATTR-SKU-DUP",
            VariantName = "E",
            RetailPrice = 100,
            CostPrice = 50
        };
        _ctx.ProductVariants.AddRange(vStock, vNoRows, vZeroAvail, vAttrHolder, vAttrHolderDup);

        _ctx.Inventories.Add(new Inventory
        {
            VariantId = 8101,
            QuantityOnHand = 10,
            QuantityReserved = 0,
            QuantityAvailable = 10
        });
        _ctx.Inventories.Add(new Inventory
        {
            VariantId = 8103,
            QuantityOnHand = 0,
            QuantityReserved = 0,
            QuantityAvailable = 0
        });

        var attrBrand = new ProductAttribute
        {
            Id = 8201,
            ProductId = 8003,
            Name = "Thương hiệu"
        };
        _ctx.ProductAttributes.Add(attrBrand);

        var valInax = new ProductAttributeValue
        {
            Id = 8301,
            AttributeId = 8201,
            Value = "Inax"
        };
        _ctx.ProductAttributeValues.Add(valInax);

        var attrBrandDup = new ProductAttribute
        {
            Id = 8202,
            ProductId = 8004,
            Name = "Thương hiệu"
        };
        _ctx.ProductAttributes.Add(attrBrandDup);

        var valInaxDup = new ProductAttributeValue
        {
            Id = 8302,
            AttributeId = 8202,
            Value = "Inax"
        };
        _ctx.ProductAttributeValues.Add(valInaxDup);

        _ctx.SaveChanges();
    }

    private StoreCatalogService MakeSut()
    {
        var categoryService = new Mock<ICategoryService>();
        categoryService
            .Setup(s => s.GetTreeAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Dto.Category.CategoryTreeNodeDto>());

        return new StoreCatalogService(
            categoryService.Object,
            new Repository<Product>(_ctx),
            new Repository<Category>(_ctx),
            new Repository<ProductVariant>(_ctx),
            new Repository<ProductAttributeValue>(_ctx));
    }

    [Fact]
    public async Task InStockOnly_keeps_Product_With_PositiveAvailability()
    {
        var sut = MakeSut();
        var page = await sut.GetProductsPagedAsync(
            page: 1,
            pageSize: 50,
            categoryId: null,
            includeSubcategories: true,
            search: null,
            minPrice: null,
            maxPrice: null,
            sort: null,
            inStockOnly: true,
            attributeValueIds: null,
            cancellationToken: default);

        Assert.Contains(page.Items, i => i.Id == 8001);
        Assert.DoesNotContain(page.Items, i => i.Id == 8002 || i.Id == 8003);
    }

    [Fact]
    public async Task AttributeValueIds_keeps_Product_Matching_All_Ids_AND()
    {
        var sut = MakeSut();
        var page = await sut.GetProductsPagedAsync(
            page: 1,
            pageSize: 50,
            categoryId: null,
            includeSubcategories: true,
            search: null,
            minPrice: null,
            maxPrice: null,
            sort: null,
            inStockOnly: false,
            attributeValueIds: new List<int> { 8301 },
            cancellationToken: default);

        Assert.Equal(2, page.Items.Count);
        Assert.Contains(page.Items, i => i.Id == 8003);
        Assert.Contains(page.Items, i => i.Id == 8004);
    }

    [Fact]
    public async Task AttributeFilterOptions_Dedupes_Same_Value_Text_Per_Attribute()
    {
        var sut = MakeSut();
        var options = await sut.GetProductAttributeFilterOptionsAsync(
            categoryId: null,
            includeSubcategories: true,
            search: null,
            cancellationToken: default);

        var brand = Assert.Single(options, g => g.AttributeName == "Thương hiệu");
        Assert.Single(brand.Values);
        Assert.Equal("Inax", brand.Values[0].Value);
    }

    [Fact]
    public async Task AttributeValueIds_Matches_All_Products_With_Same_Attribute_Value_Text()
    {
        var sut = MakeSut();
        var page = await sut.GetProductsPagedAsync(
            page: 1,
            pageSize: 50,
            categoryId: null,
            includeSubcategories: true,
            search: null,
            minPrice: null,
            maxPrice: null,
            sort: null,
            inStockOnly: false,
            attributeValueIds: new List<int> { 8301 },
            cancellationToken: default);

        Assert.Equal(2, page.Items.Count);
        Assert.Contains(page.Items, i => i.Id == 8003);
        Assert.Contains(page.Items, i => i.Id == 8004);
    }

    public void Dispose() => _ctx.Dispose();
}
