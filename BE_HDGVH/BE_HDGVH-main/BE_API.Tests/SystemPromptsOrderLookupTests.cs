using BE_API.Service.Ai;
using Xunit;

namespace BE_API.Tests;

public class SystemPromptsOrderLookupTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void B2C_prompt_includes_order_lookup_without_requiring_order_code(bool strictBoundary)
    {
        var caller = AiCallerContext.ForCustomer(1, isB2B: false, displayName: "Khách A");
        var prompt = SystemPrompts.For(caller, strictBoundary);

        Assert.Contains("get_my_orders", prompt);
        Assert.Contains("không", prompt);
        Assert.Contains("hỏi mã trước", prompt);
        Assert.DoesNotContain("orderCode chính xác từ user", prompt);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void B2B_prompt_includes_order_lookup_directive(bool strictBoundary)
    {
        var caller = AiCallerContext.ForCustomer(2, isB2B: true, displayName: "Công ty B");
        var prompt = SystemPrompts.For(caller, strictBoundary);

        Assert.Contains("get_my_orders", prompt);
        Assert.Contains("orderStatus", prompt);
        Assert.DoesNotContain("orderCode chính xác từ user", prompt);
    }

    [Fact]
    public void Storefront_boundary_suggests_order_status_not_only_order_code()
    {
        var caller = AiCallerContext.ForCustomer(1, isB2B: false);
        var prompt = SystemPrompts.For(caller, strictTopicBoundaryStorefront: true);

        Assert.Contains("hỏi tình trạng đơn", prompt);
        Assert.DoesNotContain("nhắn mã đơn", prompt);
    }
}
