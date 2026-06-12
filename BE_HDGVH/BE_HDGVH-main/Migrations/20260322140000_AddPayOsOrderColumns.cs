using BE_API.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE_API.Migrations
{
    [DbContext(typeof(BeContext))]
    [Migration("20260322140000_AddPayOsOrderColumns")]
    public class AddPayOsOrderColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PayOsCheckoutUrl",
                table: "Order",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PayOsLinkExpiresAt",
                table: "Order",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayOsPaymentLinkId",
                table: "Order",
                type: "nvarchar(max)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "PayOsCheckoutUrl", table: "Order");
            migrationBuilder.DropColumn(name: "PayOsLinkExpiresAt", table: "Order");
            migrationBuilder.DropColumn(name: "PayOsPaymentLinkId", table: "Order");
        }
    }
}
