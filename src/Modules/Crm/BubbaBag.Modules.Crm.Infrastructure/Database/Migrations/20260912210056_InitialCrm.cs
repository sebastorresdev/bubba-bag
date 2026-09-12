using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.Crm.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialCrm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "crm");

            migrationBuilder.CreateTable(
                name: "clientes",
                schema: "crm",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CodigoCliente = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TipoPersona = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "NATURAL"),
                    TipoDocumento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "DNI"),
                    DocumentoIdentidad = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Nombres = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Apellidos = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    RazonSocial = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TelefonoPrincipal = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TelefonoSecundario = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Direccion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Distrito = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Provincia = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Departamento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ReferenciaUbicacion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    CoordenadaLat = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    CoordenadaLng = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    EsClienteFacturacion = table.Column<bool>(type: "boolean", nullable: false),
                    EsClienteServicio = table.Column<bool>(type: "boolean", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_clientes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_clientes_CodigoCliente",
                schema: "crm",
                table: "clientes",
                column: "CodigoCliente",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_clientes_DocumentoIdentidad",
                schema: "crm",
                table: "clientes",
                column: "DocumentoIdentidad");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "clientes",
                schema: "crm");
        }
    }
}
