using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEmpleadoCRUD : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "rrhh");

            migrationBuilder.CreateTable(
                name: "Empleados",
                schema: "rrhh",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombres = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Apellidos = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TipoDocumento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    NumeroDocumento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Estado = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    FechaNacimiento = table.Column<DateOnly>(type: "date", nullable: true),
                    Direccion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    FechaIngreso = table.Column<DateOnly>(type: "date", nullable: true),
                    Cargo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Departamento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    TipoContrato = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SalarioBase = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    MonedaSalario = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    TieneAsignacionFamiliar = table.Column<bool>(type: "boolean", nullable: false),
                    RegimenPensionario = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Cuspp = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    EntidadFinanciera = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CuentaBancaria = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CuentaInterbancaria = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Empleados", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Empleados_Email",
                schema: "rrhh",
                table: "Empleados",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Empleados_TipoDocumento_NumeroDocumento",
                schema: "rrhh",
                table: "Empleados",
                columns: new[] { "TipoDocumento", "NumeroDocumento" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Empleados",
                schema: "rrhh");
        }
    }
}
