using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class ActualizarVisitasYEstadosServicioCampo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OrdenesTrabajo_EstadoInterno",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "BloqueHorario",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "CuadrillaTecnicoId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "EstadoInterno",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "FechaCierreReal",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "FechaProgramada",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "FirmaClienteUrl",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "FotoFachadaUrl",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "FotoInstalacionUrl",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "ObservacionesGenerales",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.RenameColumn(
                name: "FechaInicioReal",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "FechaDescargaMateriales");

            migrationBuilder.AddColumn<int>(
                name: "ContadorOmisionDescarga",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "DescargaMaterialesConfirmada",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "DescargaMaterialesObligatoria",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Estado",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "EvidenciasConfirmadas",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "OrdenTrabajoVisitas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroVisita = table.Column<int>(type: "integer", nullable: false),
                    NumeroVisitaSiebel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NumeroVisitaToa = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CuadrillaTecnicoId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaProgramada = table.Column<DateOnly>(type: "date", nullable: false),
                    BloqueHorario = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    InicioAgendado = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FinAgendado = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Estado = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    FechaSalidaEnCamino = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaInicioReal = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaFinReal = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaSincronizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FotoFachadaUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FotoInstalacionUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FotoEvidenciaAdicionalUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FirmaClienteUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FirmadoPor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NombreFirmante = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    DniFirmante = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    EvidenciasConfirmadas = table.Column<bool>(type: "boolean", nullable: false),
                    NoConsumioMateriales = table.Column<bool>(type: "boolean", nullable: false),
                    DescargaMaterialesOmitida = table.Column<bool>(type: "boolean", nullable: false),
                    MotivoOmisionMateriales = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    DescargaConfirmadaAlmacen = table.Column<bool>(type: "boolean", nullable: false),
                    MotivoCancelacion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    ObservacionesTecnico = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenTrabajoVisitas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoVisitas_OrdenesTrabajo_OrdenTrabajoId",
                        column: x => x.OrdenTrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "OrdenesTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_Estado",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_CuadrillaTecnicoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "CuadrillaTecnicoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_Estado",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_FechaProgramada",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "FechaProgramada");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_NumeroVisitaSiebel",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "NumeroVisitaSiebel");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_NumeroVisitaToa",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "NumeroVisitaToa");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_OrdenTrabajoId_NumeroVisita",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                columns: new[] { "OrdenTrabajoId", "NumeroVisita" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrdenTrabajoVisitas",
                schema: "serviciocampo");

            migrationBuilder.DropIndex(
                name: "IX_OrdenesTrabajo_Estado",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "ContadorOmisionDescarga",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "DescargaMaterialesConfirmada",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "DescargaMaterialesObligatoria",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "Estado",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "EvidenciasConfirmadas",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.RenameColumn(
                name: "FechaDescargaMateriales",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "FechaInicioReal");

            migrationBuilder.AddColumn<string>(
                name: "BloqueHorario",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CuadrillaTecnicoId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EstadoInterno",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCierreReal",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "FechaProgramada",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirmaClienteUrl",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FotoFachadaUrl",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FotoInstalacionUrl",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObservacionesGenerales",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_EstadoInterno",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "EstadoInterno");
        }
    }
}
