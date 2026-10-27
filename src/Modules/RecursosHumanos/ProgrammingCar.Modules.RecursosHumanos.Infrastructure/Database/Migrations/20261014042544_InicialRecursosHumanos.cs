using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProgrammingCar.Modules.RecursosHumanos.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class InicialRecursosHumanos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "rrhh");

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
                name: "Sucursales",
                schema: "rrhh",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Ciudad = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Direccion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    EsSedePrincipal = table.Column<bool>(type: "boolean", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sucursales", x => x.Id);
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

            migrationBuilder.CreateTable(
                name: "Empleados",
                schema: "rrhh",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombres = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Apellidos = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TipoDocumento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NumeroDocumento = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    FechaNacimiento = table.Column<DateOnly>(type: "date", nullable: true),
                    Direccion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    FotoUrl = table.Column<string>(type: "text", nullable: true),
                    FechaIngreso = table.Column<DateOnly>(type: "date", nullable: true),
                    DepartamentoId = table.Column<Guid>(type: "uuid", nullable: true),
                    CargoId = table.Column<Guid>(type: "uuid", nullable: true),
                    TipoContrato = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FechaCese = table.Column<DateOnly>(type: "date", nullable: true),
                    MotivoCese = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ObservacionesCese = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SalarioBase = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    MonedaSalario = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    TieneAsignacionFamiliar = table.Column<bool>(type: "boolean", nullable: false),
                    RegimenPensionario = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Cuspp = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    EntidadFinanciera = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CuentaBancaria = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CuentaInterbancaria = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Empleados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Empleados_Cargos_CargoId",
                        column: x => x.CargoId,
                        principalSchema: "rrhh",
                        principalTable: "Cargos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Empleados_Departamentos_DepartamentoId",
                        column: x => x.DepartamentoId,
                        principalSchema: "rrhh",
                        principalTable: "Departamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

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
                name: "IX_Empleados_Email",
                schema: "rrhh",
                table: "Empleados",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Empleados_Estado",
                schema: "rrhh",
                table: "Empleados",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Empleados_TipoDocumento_NumeroDocumento",
                schema: "rrhh",
                table: "Empleados",
                columns: new[] { "TipoDocumento", "NumeroDocumento" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sucursales_Codigo",
                schema: "rrhh",
                table: "Sucursales",
                column: "Codigo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Empleados",
                schema: "rrhh");

            migrationBuilder.DropTable(
                name: "Sucursales",
                schema: "rrhh");

            migrationBuilder.DropTable(
                name: "Cargos",
                schema: "rrhh");

            migrationBuilder.DropTable(
                name: "Departamentos",
                schema: "rrhh");
        }
    }
}
