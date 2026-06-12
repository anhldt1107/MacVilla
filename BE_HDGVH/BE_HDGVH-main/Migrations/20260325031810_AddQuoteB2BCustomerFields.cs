using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE_API.Migrations
{
    /// <inheritdoc />
    public partial class AddQuoteB2BCustomerFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CounterOfferMessage",
                table: "Quotes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CustomerAcceptedAt",
                table: "Quotes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerNotes",
                table: "Quotes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerRejectReason",
                table: "Quotes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CustomerRejectedAt",
                table: "Quotes",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CounterOfferMessage",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "CustomerAcceptedAt",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "CustomerNotes",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "CustomerRejectReason",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "CustomerRejectedAt",
                table: "Quotes");
        }
    }
}
