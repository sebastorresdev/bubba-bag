using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class EstructurarCatalogosYEstadosEmpleado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cargo",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.DropColumn(
                name: "Departamento",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.AddColumn<string>(
                name: "MotivoCese",
                schema: "rrhh",
                table: "Empleados",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                schema: "rrhh",
                table: "Empleados",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AddColumn<Guid>(
                name: "CargoId",
                schema: "rrhh",
                table: "Empleados",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DepartamentoId",
                schema: "rrhh",
                table: "Empleados",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "FechaCese",
                schema: "rrhh",
                table: "Empleados",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObservacionesCese",
                schema: "rrhh",
                table: "Empleados",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Departamentos",
                schema: "rrhh",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departamentos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Cargos",
                schema: "rrhh",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DepartamentoId = table.Column<Guid>(type: "uuid", nullable: false),
                    SalarioReferencial = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cargos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cargos_Departamentos_DepartamentoId",
                        column: x => x.DepartamentoId,
                        principalSchema: "rrhh",
                        principalTable: "Departamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Empleados_CargoId",
                schema: "rrhh",
                table: "Empleados",
                column: "CargoId");

            migrationBuilder.CreateIndex(
                name: "IX_Empleados_DepartamentoId",
                schema: "rrhh",
                table: "Empleados",
                column: "DepartamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Empleados_Estado",
                schema: "rrhh",
                table: "Empleados",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_DepartamentoId_Nombre",
                schema: "rrhh",
                table: "Cargos",
                columns: new[] { "DepartamentoId", "Nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Departamentos_Nombre",
                schema: "rrhh",
                table: "Departamentos",
                column: "Nombre",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Empleados_Cargos_CargoId",
                schema: "rrhh",
                table: "Empleados",
                column: "CargoId",
                principalSchema: "rrhh",
                principalTable: "Cargos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Empleados_Departamentos_DepartamentoId",
                schema: "rrhh",
                table: "Empleados",
                column: "DepartamentoId",
                principalSchema: "rrhh",
                principalTable: "Departamentos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Empleados_Cargos_CargoId",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.DropForeignKey(
                name: "FK_Empleados_Departamentos_DepartamentoId",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.DropTable(
                name: "Cargos",
                schema: "rrhh");

            migrationBuilder.DropTable(
                name: "Departamentos",
                schema: "rrhh");

            migrationBuilder.DropIndex(
                name: "IX_Empleados_CargoId",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.DropIndex(
                name: "IX_Empleados_DepartamentoId",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.DropIndex(
                name: "IX_Empleados_Estado",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.DropColumn(
                name: "CargoId",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.DropColumn(
                name: "DepartamentoId",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.DropColumn(
                name: "FechaCese",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.DropColumn(
                name: "ObservacionesCese",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.DropColumn(
                name: "MotivoCese",
                schema: "rrhh",
                table: "Empleados");

            migrationBuilder.AddColumn<string>(
                name: "Departamento",
                schema: "rrhh",
                table: "Empleados",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                schema: "rrhh",
                table: "Empleados",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<string>(
                name: "Cargo",
                schema: "rrhh",
                table: "Empleados",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
