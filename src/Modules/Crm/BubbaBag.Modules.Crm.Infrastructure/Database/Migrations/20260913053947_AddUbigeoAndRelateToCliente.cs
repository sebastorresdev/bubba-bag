using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.Crm.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddUbigeoAndRelateToCliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ubigeos",
                schema: "crm",
                columns: table => new
                {
                    Codigo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Departamento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Provincia = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Distrito = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CapitalLegal = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CodigoRegionNatural = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    RegionNatural = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ubigeos", x => x.Codigo);
                });

            migrationBuilder.DropColumn(
                name: "Departamento",
                schema: "crm",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "Distrito",
                schema: "crm",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "Provincia",
                schema: "crm",
                table: "clientes");

            migrationBuilder.AddColumn<string>(
                name: "UbigeoCodigo",
                schema: "crm",
                table: "clientes",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_clientes_UbigeoCodigo",
                schema: "crm",
                table: "clientes",
                column: "UbigeoCodigo");

            migrationBuilder.CreateIndex(
                name: "IX_ubigeos_Departamento",
                schema: "crm",
                table: "ubigeos",
                column: "Departamento");

            migrationBuilder.CreateIndex(
                name: "IX_ubigeos_Departamento_Provincia",
                schema: "crm",
                table: "ubigeos",
                columns: new[] { "Departamento", "Provincia" });

            migrationBuilder.AddForeignKey(
                name: "FK_clientes_ubigeos_UbigeoCodigo",
                schema: "crm",
                table: "clientes",
                column: "UbigeoCodigo",
                principalSchema: "crm",
                principalTable: "ubigeos",
                principalColumn: "Codigo",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_clientes_ubigeos_UbigeoCodigo",
                schema: "crm",
                table: "clientes");

            migrationBuilder.DropTable(
                name: "ubigeos",
                schema: "crm");

            migrationBuilder.DropIndex(
                name: "IX_clientes_UbigeoCodigo",
                schema: "crm",
                table: "clientes");

            migrationBuilder.DropColumn(
                name: "UbigeoCodigo",
                schema: "crm",
                table: "clientes");

            migrationBuilder.AddColumn<string>(
                name: "Departamento",
                schema: "crm",
                table: "clientes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Distrito",
                schema: "crm",
                table: "clientes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Provincia",
                schema: "crm",
                table: "clientes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
