using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE_API.Migrations
{
    /// <inheritdoc />
    public partial class AddReturnTicketFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "ReturnExchangeTickets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "ReturnExchangeTickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "ReturnExchangeTickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "ReturnExchangeTickets",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CustomerNote",
                table: "ReturnExchangeTickets",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InternalNote",
                table: "ReturnExchangeTickets",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StockManagerId",
                table: "ReturnExchangeTickets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TicketNumber",
                table: "ReturnExchangeTickets",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnExchangeTickets_StockManagerId",
                table: "ReturnExchangeTickets",
                column: "StockManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnExchangeTickets_TicketNumber",
                table: "ReturnExchangeTickets",
                column: "TicketNumber",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ReturnExchangeTickets_AppUsers_StockManagerId",
                table: "ReturnExchangeTickets",
                column: "StockManagerId",
                principalTable: "AppUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReturnExchangeTickets_AppUsers_StockManagerId",
                table: "ReturnExchangeTickets");

            migrationBuilder.DropIndex(
                name: "IX_ReturnExchangeTickets_StockManagerId",
                table: "ReturnExchangeTickets");

            migrationBuilder.DropIndex(
                name: "IX_ReturnExchangeTickets_TicketNumber",
                table: "ReturnExchangeTickets");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "ReturnExchangeTickets");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "ReturnExchangeTickets");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "ReturnExchangeTickets");

            migrationBuilder.DropColumn(
                name: "CustomerNote",
                table: "ReturnExchangeTickets");

            migrationBuilder.DropColumn(
                name: "InternalNote",
                table: "ReturnExchangeTickets");

            migrationBuilder.DropColumn(
                name: "StockManagerId",
                table: "ReturnExchangeTickets");

            migrationBuilder.DropColumn(
                name: "TicketNumber",
                table: "ReturnExchangeTickets");

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "ReturnExchangeTickets",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }
    }
}
