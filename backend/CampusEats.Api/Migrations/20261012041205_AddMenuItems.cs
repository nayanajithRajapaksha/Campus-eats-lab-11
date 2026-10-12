using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CampusEats.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMenuItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MenuItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItems", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "MenuItems",
                columns: new[] { "Id", "Category", "Description", "Name", "Price" },
                values: new object[,]
                {
                    { 1, "Meals", "Rice with chicken curry and vegetables.", "Chicken Rice", 650.00m },
                    { 2, "Meals", "Rice with seasonal vegetable curries.", "Vegetable Rice", 450.00m },
                    { 3, "Meals", "Chopped roti with chicken, vegetables and spices.", "Chicken Kottu", 750.00m },
                    { 4, "Meals", "Chopped roti with vegetables and spices.", "Vegetable Kottu", 550.00m },
                    { 5, "Snacks", "Chicken and fresh vegetables served in bread.", "Chicken Sandwich", 400.00m },
                    { 6, "Snacks", "A crisp roll filled with seasoned vegetables.", "Vegetable Roll", 150.00m },
                    { 7, "Drinks", "Freshly brewed tea with milk.", "Milk Tea", 120.00m },
                    { 8, "Drinks", "Fresh lime juice served chilled.", "Lime Juice", 200.00m }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MenuItems");
        }
    }
}
