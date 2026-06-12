using BE_API.Dto.Category;
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

public class StoreCatalogServiceSearchTests : IDisposable
{
    private readonly BeContext _ctx;

    public StoreCatalogServiceSearchTests()
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
        var cat = new Category { Id = 501, ParentId = null, Name = "Chậu bếp Test", Slug = "sink-test-ai" };
        _ctx.Categories.Add(cat);

        var pNoHit = new Product
        {
            Id = 9001,
            CategoryId = 501,
            Name = "Chậu tên chung không có mã trong tên",
            Slug = "generic-sink",
            Description = "",
            WarrantyPeriodMonths = 12,
            Status = ProductStatus.Active,
            BasePrice = 1_000_000m
        };

        var pSku = new Product
        {
            Id = 9002,
            CategoryId = 501,
            Name = "Sản phẩm SKU ẩn",
            Slug = "hidden-sku-name",
            Description = "",
            WarrantyPeriodMonths = 12,
            Status = ProductStatus.Active,
            BasePrice = 2_700_000m
        };

        _ctx.Products.AddRange(pNoHit, pSku);

        var vSku = new ProductVariant
        {
            Id = 9101,
            ProductId = pSku.Id,
            Sku = "BANCOOT-CIELO-1102",
            VariantName = "CIELO 1102 hai hố",
            RetailPrice = pSku.BasePrice!.Value,
            CostPrice = 100_000
        };

        var vNoHit = new ProductVariant
        {
            Id = 9102,
            ProductId = pNoHit.Id,
            Sku = "OTHER-SKU",
            VariantName = "Default",
            RetailPrice = 500_000,
            CostPrice = 50_000
        };

        _ctx.ProductVariants.AddRange(vSku, vNoHit);

        _ctx.SaveChanges();
    }

    private StoreCatalogService MakeSut()
    {
        var categoryService = new Mock<ICategoryService>();
        categoryService
            .Setup(s => s.GetTreeAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CategoryTreeNodeDto>());

        return new StoreCatalogService(
            categoryService.Object,
            new Repository<Product>(_ctx),
            new Repository<Category>(_ctx),
            new Repository<ProductVariant>(_ctx),
            new Repository<ProductAttributeValue>(_ctx));
    }

    [Fact]
    public async Task GetProductsPagedAsync_Matches_Search_BySku()
    {
        var sut = MakeSut();
        var page = await sut.GetProductsPagedAsync(1, 20, categoryId: null, includeSubcategories: true,
            search: "1102");

        Assert.Contains(page.Items, i => i.Id == 9002);
        Assert.DoesNotContain(page.Items, i => i.Id == 9001);
    }

    [Fact]
    public async Task GetProductsPagedAsync_Matches_Search_ByVariantName()
    {
        var sut = MakeSut();
        var page = await sut.GetProductsPagedAsync(1, 20, categoryId: null, includeSubcategories: true,
            search: "hai hố");

        Assert.Single(page.Items);
        Assert.Equal(9002, page.Items[0].Id);
    }

    public void Dispose() => _ctx.Dispose();
}
