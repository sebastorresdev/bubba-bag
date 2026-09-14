using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class ConfiguracionEvidenciasYMotivosServicioCampo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DescargaConfirmadaAlmacen",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropColumn(
                name: "DescargaMaterialesOmitida",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropColumn(
                name: "FotoEvidenciaAdicionalUrl",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropColumn(
                name: "FotoFachadaUrl",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropColumn(
                name: "MotivoCancelacion",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropColumn(
                name: "MotivoOmisionMateriales",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropColumn(
                name: "NoConsumioMateriales",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropColumn(
                name: "MotivoNoRealizada",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas");

            migrationBuilder.DropColumn(
                name: "MotivoCierre",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.RenameColumn(
                name: "FotoInstalacionUrl",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "ObservacionesCancelacion");

            migrationBuilder.RenameColumn(
                name: "EvidenciasConfirmadas",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "NoConsumioMateriales");

            migrationBuilder.AddColumn<bool>(
                name: "ExigeEvidenciasFotograficas",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "ExigeFirmaCliente",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MotivoCancelacionId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MotivoRechazoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObservacionesRechazo",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "DescargaMaterialesOmitida",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "MotivoCierreId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotivoOmisionMateriales",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObservacionesCierre",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MotivosIncidencia",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Ambito = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MotivosIncidencia", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrdenTrabajoVisitaEvidencias",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoVisitaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    EsObligatoria = table.Column<bool>(type: "boolean", nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CoordenadasGps = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenTrabajoVisitaEvidencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoVisitaEvidencias_OrdenTrabajoVisitas_OrdenTraba~",
                        column: x => x.OrdenTrabajoVisitaId,
                        principalSchema: "serviciocampo",
                        principalTable: "OrdenTrabajoVisitas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitas_MotivoCancelacionId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "MotivoCancelacionId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_MotivoRechazoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "MotivoRechazoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_MotivoCierreId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "MotivoCierreId");

            migrationBuilder.CreateIndex(
                name: "IX_MotivosIncidencia_Ambito",
                schema: "serviciocampo",
                table: "MotivosIncidencia",
                column: "Ambito");

            migrationBuilder.CreateIndex(
                name: "IX_MotivosIncidencia_Codigo",
                schema: "serviciocampo",
                table: "MotivosIncidencia",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoVisitaEvidencias_OrdenTrabajoVisitaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitaEvidencias",
                column: "OrdenTrabajoVisitaId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrdenesTrabajo_MotivosIncidencia_MotivoCierreId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "MotivoCierreId",
                principalSchema: "serviciocampo",
                principalTable: "MotivosIncidencia",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrdenTrabajoTareas_MotivosIncidencia_MotivoRechazoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "MotivoRechazoId",
                principalSchema: "serviciocampo",
                principalTable: "MotivosIncidencia",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrdenTrabajoVisitas_MotivosIncidencia_MotivoCancelacionId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "MotivoCancelacionId",
                principalSchema: "serviciocampo",
                principalTable: "MotivosIncidencia",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrdenesTrabajo_MotivosIncidencia_MotivoCierreId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropForeignKey(
                name: "FK_OrdenTrabajoTareas_MotivosIncidencia_MotivoRechazoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas");

            migrationBuilder.DropForeignKey(
                name: "FK_OrdenTrabajoVisitas_MotivosIncidencia_MotivoCancelacionId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropTable(
                name: "MotivosIncidencia",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "OrdenTrabajoVisitaEvidencias",
                schema: "serviciocampo");

            migrationBuilder.DropIndex(
                name: "IX_OrdenTrabajoVisitas_MotivoCancelacionId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropIndex(
                name: "IX_OrdenTrabajoTareas_MotivoRechazoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas");

            migrationBuilder.DropIndex(
                name: "IX_OrdenesTrabajo_MotivoCierreId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "ExigeEvidenciasFotograficas",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo");

            migrationBuilder.DropColumn(
                name: "ExigeFirmaCliente",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo");

            migrationBuilder.DropColumn(
                name: "MotivoCancelacionId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropColumn(
                name: "MotivoRechazoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas");

            migrationBuilder.DropColumn(
                name: "ObservacionesRechazo",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas");

            migrationBuilder.DropColumn(
                name: "DescargaMaterialesOmitida",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "MotivoCierreId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "MotivoOmisionMateriales",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "ObservacionesCierre",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.RenameColumn(
                name: "ObservacionesCancelacion",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "FotoInstalacionUrl");

            migrationBuilder.RenameColumn(
                name: "NoConsumioMateriales",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "EvidenciasConfirmadas");

            migrationBuilder.AddColumn<bool>(
                name: "DescargaConfirmadaAlmacen",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "DescargaMaterialesOmitida",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FotoEvidenciaAdicionalUrl",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FotoFachadaUrl",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotivoCancelacion",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotivoOmisionMateriales",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "NoConsumioMateriales",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MotivoNoRealizada",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotivoCierre",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
