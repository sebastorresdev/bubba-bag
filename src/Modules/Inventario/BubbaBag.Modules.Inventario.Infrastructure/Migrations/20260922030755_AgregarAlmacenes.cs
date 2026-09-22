using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.Inventario.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarAlmacenes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "PrecioBase",
                schema: "inventario",
                table: "Productos",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric(12,2)",
                oldPrecision: 12,
                oldScale: 2);

            migrationBuilder.CreateTable(
                name: "Almacenes",
                schema: "inventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Direccion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SucursalId = table.Column<Guid>(type: "uuid", nullable: true),
                    RecursoTecnicoId = table.Column<Guid>(type: "uuid", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Almacenes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_Codigo",
                schema: "inventario",
                table: "Almacenes",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_RecursoTecnicoId",
                schema: "inventario",
                table: "Almacenes",
                column: "RecursoTecnicoId");

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_SucursalId",
                schema: "inventario",
                table: "Almacenes",
                column: "SucursalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Almacenes",
                schema: "inventario");

            migrationBuilder.AlterColumn<decimal>(
                name: "PrecioBase",
                schema: "inventario",
                table: "Productos",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(12,2)",
                oldPrecision: 12,
                oldScale: 2,
                oldDefaultValue: 0m);
        }
    }
}
