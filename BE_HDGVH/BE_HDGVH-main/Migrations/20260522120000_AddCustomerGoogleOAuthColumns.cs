using System;
using BE_API.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE_API.Migrations
{
    [DbContext(typeof(BeContext))]
    [Migration("20260522120000_AddCustomerGoogleOAuthColumns")]
    public partial class AddCustomerGoogleOAuthColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Phone",
                table: "Customers",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: false);

            migrationBuilder.AddColumn<string>(
                name: "GoogleSubject",
                table: "Customers",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "GoogleEmailVerified",
                table: "Customers",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "GoogleLinkedAtUtc",
                table: "Customers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Customers_GoogleSubject",
                table: "Customers",
                column: "GoogleSubject",
                unique: true,
                filter: "[GoogleSubject] IS NOT NULL");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Customers_GoogleSubject",
                table: "Customers");

            migrationBuilder.DropColumn(name: "GoogleLinkedAtUtc", table: "Customers");
            migrationBuilder.DropColumn(name: "GoogleEmailVerified", table: "Customers");
            migrationBuilder.DropColumn(name: "GoogleSubject", table: "Customers");

            migrationBuilder.AlterColumn<string>(
                name: "Phone",
                table: "Customers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
        }
    }
}
