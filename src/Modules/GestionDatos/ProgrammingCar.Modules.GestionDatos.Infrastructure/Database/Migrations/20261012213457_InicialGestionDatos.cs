using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProgrammingCar.Modules.GestionDatos.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class InicialGestionDatos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "gestiondatos");

            migrationBuilder.CreateTable(
                name: "DataImportJobs",
                schema: "gestiondatos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NombreArchivo = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    TipoRegistro = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TamanoBytes = table.Column<long>(type: "bigint", nullable: false),
                    Estado = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ModoDuplicados = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PermitirDuplicados = table.Column<bool>(type: "boolean", nullable: false),
                    CreadoPor = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaFinalizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalProcesados = table.Column<int>(type: "integer", nullable: false),
                    TotalExitosos = table.Column<int>(type: "integer", nullable: false),
                    TotalFallidos = table.Column<int>(type: "integer", nullable: false),
                    TotalParciales = table.Column<int>(type: "integer", nullable: false),
                    MapeoCamposJson = table.Column<string>(type: "text", nullable: true),
                    ParametrosDelimitadorJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataImportJobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DataImportJobErrors",
                schema: "gestiondatos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DataImportJobId = table.Column<Guid>(type: "uuid", nullable: false),
                    Fila = table.Column<int>(type: "integer", nullable: false),
                    ClaveIdentificador = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Columna = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Mensaje = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ValorOriginal = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataImportJobErrors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DataImportJobErrors_DataImportJobs_DataImportJobId",
                        column: x => x.DataImportJobId,
                        principalSchema: "gestiondatos",
                        principalTable: "DataImportJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DataImportJobErrors_DataImportJobId",
                schema: "gestiondatos",
                table: "DataImportJobErrors",
                column: "DataImportJobId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DataImportJobErrors",
                schema: "gestiondatos");

            migrationBuilder.DropTable(
                name: "DataImportJobs",
                schema: "gestiondatos");
        }
    }
}
