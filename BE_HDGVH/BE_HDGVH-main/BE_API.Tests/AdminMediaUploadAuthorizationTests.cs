using System.Security.Claims;
using BE_API.Authorization;
using Xunit;

namespace BE_API.Tests;

public class AdminMediaUploadAuthorizationTests
{
    [Theory]
    [InlineData("contract", true)]
    [InlineData("invoice", true)]
    [InlineData("CONTRACT", true)]
    [InlineData("product", false)]
    [InlineData(null, false)]
    [InlineData("", false)]
    public void Sales_can_only_upload_staff_document_folders(string? folder, bool expected)
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(JwtClaimTypes.Role, AppRoles.Sales),
            new Claim(JwtClaimTypes.PrincipalKind, PrincipalKinds.Staff),
        ],
        authenticationType: "test"));

        Assert.Equal(expected, AdminMediaUploadAuthorization.CanUpload(user, folder));
    }

    [Theory]
    [InlineData("product")]
    [InlineData("contract")]
    [InlineData(null)]
    public void Admin_can_upload_any_folder(string? folder)
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(JwtClaimTypes.Role, AppRoles.Admin),
            new Claim(JwtClaimTypes.PrincipalKind, PrincipalKinds.Staff),
        ],
        authenticationType: "test"));

        Assert.True(AdminMediaUploadAuthorization.CanUpload(user, folder));
    }
}
