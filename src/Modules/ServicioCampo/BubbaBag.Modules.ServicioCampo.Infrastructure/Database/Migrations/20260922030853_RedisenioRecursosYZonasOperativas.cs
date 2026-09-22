using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class RedisenioRecursosYZonasOperativas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CatalogosServicio_clientes_ContratanteId",
                schema: "serviciocampo",
                table: "CatalogosServicio");

            migrationBuilder.DropIndex(
                name: "IX_OrdenesTrabajo_NumeroOrdenExterna",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.RenameColumn(
                name: "NumeroVisitaToa",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "NumeroVisitaOrigen");

            migrationBuilder.RenameColumn(
                name: "NumeroVisitaSiebel",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "NumeroCita");

            migrationBuilder.RenameColumn(
                name: "CuadrillaTecnicoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "RecursoTecnicoId");

            migrationBuilder.RenameIndex(
                name: "IX_OrdenTrabajoVisitas_NumeroVisitaToa",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "IX_OrdenTrabajoVisitas_NumeroVisitaOrigen");

            migrationBuilder.RenameIndex(
                name: "IX_OrdenTrabajoVisitas_NumeroVisitaSiebel",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "IX_OrdenTrabajoVisitas_NumeroCita");

            migrationBuilder.RenameIndex(
                name: "IX_OrdenTrabajoVisitas_CuadrillaTecnicoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "IX_OrdenTrabajoVisitas_RecursoTecnicoId");

            migrationBuilder.RenameColumn(
                name: "NumeroOrdenExterna",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "NumeroPedido");

            migrationBuilder.RenameColumn(
                name: "IdEncabezadoExterno",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "NumeroOrden");

            migrationBuilder.RenameColumn(
                name: "EstadoExterno",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "EstadoOrigen");

            migrationBuilder.RenameColumn(
                name: "CodigoContratoIbs",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "CodigoContrato");

            migrationBuilder.RenameIndex(
                name: "IX_OrdenesTrabajo_CodigoContratoIbs",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "IX_OrdenesTrabajo_CodigoContrato");

            migrationBuilder.RenameColumn(
                name: "ContratanteId",
                schema: "serviciocampo",
                table: "CatalogosServicio",
                newName: "ClienteId");

            migrationBuilder.RenameIndex(
                name: "IX_CatalogosServicio_ContratanteId",
                schema: "serviciocampo",
                table: "CatalogosServicio",
                newName: "IX_CatalogosServicio_ClienteId");

            migrationBuilder.AddColumn<decimal>(
                name: "PrecioBase",
                schema: "serviciocampo",
                table: "Servicios",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "ProductoComercialId",
                schema: "serviciocampo",
                table: "Servicios",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ZonaOperativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ZonasOperativas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    DescripcionProveedor = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    SucursalId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlmacenPredeterminadoId = table.Column<Guid>(type: "uuid", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZonasOperativas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RecursosTecnicos",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NombreCompleto = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    DocumentoIdentidad = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ZonaOperativaId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlmacenBaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlmacenMovilId = table.Column<Guid>(type: "uuid", nullable: true),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    EmpleadoId = table.Column<Guid>(type: "uuid", nullable: true),
                    CapacidadMaximaOrdenesPorDia = table.Column<int>(type: "integer", nullable: false, defaultValue: 6),
                    ColorHex = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true, defaultValue: "#0078d4"),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecursosTecnicos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecursosTecnicos_ZonasOperativas_ZonaOperativaId",
                        column: x => x.ZonaOperativaId,
                        principalSchema: "serviciocampo",
                        principalTable: "ZonasOperativas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_NumeroOrden",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "NumeroOrden");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_ZonaOperativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "ZonaOperativaId");

            migrationBuilder.CreateIndex(
                name: "IX_RecursosTecnicos_AlmacenBaseId",
                schema: "serviciocampo",
                table: "RecursosTecnicos",
                column: "AlmacenBaseId");

            migrationBuilder.CreateIndex(
                name: "IX_RecursosTecnicos_AlmacenMovilId",
                schema: "serviciocampo",
                table: "RecursosTecnicos",
                column: "AlmacenMovilId");

            migrationBuilder.CreateIndex(
                name: "IX_RecursosTecnicos_Codigo",
                schema: "serviciocampo",
                table: "RecursosTecnicos",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecursosTecnicos_EmpleadoId",
                schema: "serviciocampo",
                table: "RecursosTecnicos",
                column: "EmpleadoId");

            migrationBuilder.CreateIndex(
                name: "IX_RecursosTecnicos_UsuarioId",
                schema: "serviciocampo",
                table: "RecursosTecnicos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_RecursosTecnicos_ZonaOperativaId",
                schema: "serviciocampo",
                table: "RecursosTecnicos",
                column: "ZonaOperativaId");

            migrationBuilder.CreateIndex(
                name: "IX_ZonasOperativas_AlmacenPredeterminadoId",
                schema: "serviciocampo",
                table: "ZonasOperativas",
                column: "AlmacenPredeterminadoId");

            migrationBuilder.CreateIndex(
                name: "IX_ZonasOperativas_Codigo",
                schema: "serviciocampo",
                table: "ZonasOperativas",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ZonasOperativas_SucursalId",
                schema: "serviciocampo",
                table: "ZonasOperativas",
                column: "SucursalId");

            migrationBuilder.AddForeignKey(
                name: "FK_CatalogosServicio_clientes_ClienteId",
                schema: "serviciocampo",
                table: "CatalogosServicio",
                column: "ClienteId",
                principalSchema: "crm",
                principalTable: "clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_OrdenesTrabajo_ZonasOperativas_ZonaOperativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "ZonaOperativaId",
                principalSchema: "serviciocampo",
                principalTable: "ZonasOperativas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrdenTrabajoVisitas_RecursosTecnicos_RecursoTecnicoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                column: "RecursoTecnicoId",
                principalSchema: "serviciocampo",
                principalTable: "RecursosTecnicos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CatalogosServicio_clientes_ClienteId",
                schema: "serviciocampo",
                table: "CatalogosServicio");

            migrationBuilder.DropForeignKey(
                name: "FK_OrdenesTrabajo_ZonasOperativas_ZonaOperativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropForeignKey(
                name: "FK_OrdenTrabajoVisitas_RecursosTecnicos_RecursoTecnicoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas");

            migrationBuilder.DropTable(
                name: "RecursosTecnicos",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "ZonasOperativas",
                schema: "serviciocampo");

            migrationBuilder.DropIndex(
                name: "IX_OrdenesTrabajo_NumeroOrden",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropIndex(
                name: "IX_OrdenesTrabajo_ZonaOperativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.DropColumn(
                name: "PrecioBase",
                schema: "serviciocampo",
                table: "Servicios");

            migrationBuilder.DropColumn(
                name: "ProductoComercialId",
                schema: "serviciocampo",
                table: "Servicios");

            migrationBuilder.DropColumn(
                name: "ZonaOperativaId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");

            migrationBuilder.RenameColumn(
                name: "RecursoTecnicoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "CuadrillaTecnicoId");

            migrationBuilder.RenameColumn(
                name: "NumeroVisitaOrigen",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "NumeroVisitaToa");

            migrationBuilder.RenameColumn(
                name: "NumeroCita",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "NumeroVisitaSiebel");

            migrationBuilder.RenameIndex(
                name: "IX_OrdenTrabajoVisitas_RecursoTecnicoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "IX_OrdenTrabajoVisitas_CuadrillaTecnicoId");

            migrationBuilder.RenameIndex(
                name: "IX_OrdenTrabajoVisitas_NumeroVisitaOrigen",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "IX_OrdenTrabajoVisitas_NumeroVisitaToa");

            migrationBuilder.RenameIndex(
                name: "IX_OrdenTrabajoVisitas_NumeroCita",
                schema: "serviciocampo",
                table: "OrdenTrabajoVisitas",
                newName: "IX_OrdenTrabajoVisitas_NumeroVisitaSiebel");

            migrationBuilder.RenameColumn(
                name: "NumeroPedido",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "NumeroOrdenExterna");

            migrationBuilder.RenameColumn(
                name: "NumeroOrden",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "IdEncabezadoExterno");

            migrationBuilder.RenameColumn(
                name: "EstadoOrigen",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "EstadoExterno");

            migrationBuilder.RenameColumn(
                name: "CodigoContrato",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "CodigoContratoIbs");

            migrationBuilder.RenameIndex(
                name: "IX_OrdenesTrabajo_CodigoContrato",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                newName: "IX_OrdenesTrabajo_CodigoContratoIbs");

            migrationBuilder.RenameColumn(
                name: "ClienteId",
                schema: "serviciocampo",
                table: "CatalogosServicio",
                newName: "ContratanteId");

            migrationBuilder.RenameIndex(
                name: "IX_CatalogosServicio_ClienteId",
                schema: "serviciocampo",
                table: "CatalogosServicio",
                newName: "IX_CatalogosServicio_ContratanteId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_NumeroOrdenExterna",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "NumeroOrdenExterna");

            migrationBuilder.AddForeignKey(
                name: "FK_CatalogosServicio_clientes_ContratanteId",
                schema: "serviciocampo",
                table: "CatalogosServicio",
                column: "ContratanteId",
                principalSchema: "crm",
                principalTable: "clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
