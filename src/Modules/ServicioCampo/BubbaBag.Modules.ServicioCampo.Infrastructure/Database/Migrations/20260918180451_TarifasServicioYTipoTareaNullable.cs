using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class TarifasServicioYTipoTareaNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TarifarioReglaCriterios",
                schema: "serviciocampo");

            migrationBuilder.AlterColumn<Guid>(
                name: "ClienteFacturacionId",
                schema: "serviciocampo",
                table: "TiposTareaServicio",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateTable(
                name: "TarifasServicio",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteFacturacionId = table.Column<Guid>(type: "uuid", nullable: true),
                    EmpresaContratante = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CodigoServicio = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DetalleServicio = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Sucursal = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Puntos = table.Column<int>(type: "integer", nullable: false),
                    FijoBase = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    FijoAdicional = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    VariableTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador1_CycleTime = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador2_Agenda = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador3_Sin30 = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    VariableAdicionalTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador1_Adicional = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador2_Adicional = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Indicador3_Adicional = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MontoTotalTeorico = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    AplicaPago = table.Column<bool>(type: "boolean", nullable: false),
                    AplicaGarantia = table.Column<bool>(type: "boolean", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TarifasServicio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TarifasServicio_clientes_ClienteFacturacionId",
                        column: x => x.ClienteFacturacionId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TarifasServicio_ClienteFacturacionId",
                schema: "serviciocampo",
                table: "TarifasServicio",
                column: "ClienteFacturacionId");

            migrationBuilder.CreateIndex(
                name: "IX_TarifasServicio_EmpresaContratante_CodigoServicio_Sucursal",
                schema: "serviciocampo",
                table: "TarifasServicio",
                columns: new[] { "EmpresaContratante", "CodigoServicio", "Sucursal" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TarifasServicio",
                schema: "serviciocampo");

            migrationBuilder.AlterColumn<Guid>(
                name: "ClienteFacturacionId",
                schema: "serviciocampo",
                table: "TiposTareaServicio",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "TarifarioReglaCriterios",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TarifarioReglaId = table.Column<Guid>(type: "uuid", nullable: false),
                    CampoOrdenTrabajo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OperadorComparacion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "IGUAL"),
                    ValorEsperado = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TarifarioReglaCriterios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TarifarioReglaCriterios_TarifarioReglas_TarifarioReglaId",
                        column: x => x.TarifarioReglaId,
                        principalSchema: "serviciocampo",
                        principalTable: "TarifarioReglas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TarifarioReglaCriterios_TarifarioReglaId_CampoOrdenTrabajo",
                schema: "serviciocampo",
                table: "TarifarioReglaCriterios",
                columns: new[] { "TarifarioReglaId", "CampoOrdenTrabajo" });
        }
    }
}
