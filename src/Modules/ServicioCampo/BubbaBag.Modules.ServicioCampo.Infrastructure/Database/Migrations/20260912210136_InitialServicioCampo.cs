using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialServicioCampo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "serviciocampo");

            migrationBuilder.CreateTable(
                name: "OrigenesOrden",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    EsIntegracionExterna = table.Column<bool>(type: "boolean", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrigenesOrden", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tarifarios",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    ClienteFacturacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Moneda = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false, defaultValue: "PEN"),
                    FechaVigenciaDesde = table.Column<DateOnly>(type: "date", nullable: false),
                    FechaVigenciaHasta = table.Column<DateOnly>(type: "date", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tarifarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tarifarios_clientes_ClienteFacturacionId",
                        column: x => x.ClienteFacturacionId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TiposOrdenTrabajo",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    RequiereVisitaCampo = table.Column<bool>(type: "boolean", nullable: false),
                    ColorHex = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "#0f6cbd"),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposOrdenTrabajo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TiposTareaServicio",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CodigoTarea = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Categoria = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DuracionEstimadaMinutos = table.Column<int>(type: "integer", nullable: false),
                    EsTareaSiebel = table.Column<bool>(type: "boolean", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposTareaServicio", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrdenesTrabajo",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CodigoWo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TipoOrdenId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrigenOrdenId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreadoPorId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteFacturacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroOrdenExterna = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CodigoContratoIbs = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IdEncabezadoExterno = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EstadoSistema = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    EstadoInterno = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EstadoExterno = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MotivoCierre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CuadrillaTecnicoId = table.Column<Guid>(type: "uuid", nullable: true),
                    FechaProgramada = table.Column<DateOnly>(type: "date", nullable: true),
                    BloqueHorario = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FechaInicioReal = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaCierreReal = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FirmaClienteUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FotoFachadaUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FotoInstalacionUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ObservacionesGenerales = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenesTrabajo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenesTrabajo_OrigenesOrden_OrigenOrdenId",
                        column: x => x.OrigenOrdenId,
                        principalSchema: "serviciocampo",
                        principalTable: "OrigenesOrden",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesTrabajo_TiposOrdenTrabajo_TipoOrdenId",
                        column: x => x.TipoOrdenId,
                        principalSchema: "serviciocampo",
                        principalTable: "TiposOrdenTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesTrabajo_clientes_ClienteFacturacionId",
                        column: x => x.ClienteFacturacionId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesTrabajo_clientes_ClienteServicioId",
                        column: x => x.ClienteServicioId,
                        principalSchema: "crm",
                        principalTable: "clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TarifarioReglas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TarifarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    TipoTareaServicioId = table.Column<Guid>(type: "uuid", nullable: false),
                    NombreRegla = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    MontoTarifaBase = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    AplicaBonoIndicador = table.Column<bool>(type: "boolean", nullable: false),
                    Prioridad = table.Column<int>(type: "integer", nullable: false, defaultValue: 10)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TarifarioReglas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TarifarioReglas_Tarifarios_TarifarioId",
                        column: x => x.TarifarioId,
                        principalSchema: "serviciocampo",
                        principalTable: "Tarifarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TarifarioReglas_TiposTareaServicio_TipoTareaServicioId",
                        column: x => x.TipoTareaServicioId,
                        principalSchema: "serviciocampo",
                        principalTable: "TiposTareaServicio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrdenTrabajoTareas",
                schema: "serviciocampo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrdenTrabajoId = table.Column<Guid>(type: "uuid", nullable: false),
                    TipoTareaId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroWoIbs = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ItemNumero = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    EstadoTarea = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TarifaBaseCongelada = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    EsElegibleBonoIndicador = table.Column<bool>(type: "boolean", nullable: false),
                    NombreReglaAplicada = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    TarifarioReglaId = table.Column<Guid>(type: "uuid", nullable: true),
                    MontoBonoFinal = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false, defaultValue: 0.00m),
                    MontoPenalizacion = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false, defaultValue: 0.00m),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ObservacionesCierre = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MotivoNoRealizada = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenTrabajoTareas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoTareas_OrdenesTrabajo_OrdenTrabajoId",
                        column: x => x.OrdenTrabajoId,
                        principalSchema: "serviciocampo",
                        principalTable: "OrdenesTrabajo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoTareas_TarifarioReglas_TarifarioReglaId",
                        column: x => x.TarifarioReglaId,
                        principalSchema: "serviciocampo",
                        principalTable: "TarifarioReglas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_OrdenTrabajoTareas_TiposTareaServicio_TipoTareaId",
                        column: x => x.TipoTareaId,
                        principalSchema: "serviciocampo",
                        principalTable: "TiposTareaServicio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

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
                name: "IX_OrdenesTrabajo_ClienteFacturacionId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "ClienteFacturacionId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_ClienteServicioId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "ClienteServicioId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_CodigoContratoIbs",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "CodigoContratoIbs");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_CodigoWo",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "CodigoWo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_EstadoInterno",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "EstadoInterno");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_EstadoSistema",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "EstadoSistema");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_NumeroOrdenExterna",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "NumeroOrdenExterna");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_OrigenOrdenId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "OrigenOrdenId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesTrabajo_TipoOrdenId",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                column: "TipoOrdenId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_NumeroWoIbs",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "NumeroWoIbs");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_OrdenTrabajoId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "OrdenTrabajoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_TarifarioReglaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "TarifarioReglaId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenTrabajoTareas_TipoTareaId",
                schema: "serviciocampo",
                table: "OrdenTrabajoTareas",
                column: "TipoTareaId");

            migrationBuilder.CreateIndex(
                name: "IX_OrigenesOrden_Codigo",
                schema: "serviciocampo",
                table: "OrigenesOrden",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TarifarioReglaCriterios_TarifarioReglaId_CampoOrdenTrabajo",
                schema: "serviciocampo",
                table: "TarifarioReglaCriterios",
                columns: new[] { "TarifarioReglaId", "CampoOrdenTrabajo" });

            migrationBuilder.CreateIndex(
                name: "IX_TarifarioReglas_TarifarioId",
                schema: "serviciocampo",
                table: "TarifarioReglas",
                column: "TarifarioId");

            migrationBuilder.CreateIndex(
                name: "IX_TarifarioReglas_TipoTareaServicioId",
                schema: "serviciocampo",
                table: "TarifarioReglas",
                column: "TipoTareaServicioId");

            migrationBuilder.CreateIndex(
                name: "IX_Tarifarios_ClienteFacturacionId_FechaVigenciaDesde_FechaVig~",
                schema: "serviciocampo",
                table: "Tarifarios",
                columns: new[] { "ClienteFacturacionId", "FechaVigenciaDesde", "FechaVigenciaHasta" });

            migrationBuilder.CreateIndex(
                name: "IX_Tarifarios_Codigo",
                schema: "serviciocampo",
                table: "Tarifarios",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TiposOrdenTrabajo_Codigo",
                schema: "serviciocampo",
                table: "TiposOrdenTrabajo",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TiposTareaServicio_CodigoTarea",
                schema: "serviciocampo",
                table: "TiposTareaServicio",
                column: "CodigoTarea",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrdenTrabajoTareas",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "TarifarioReglaCriterios",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "OrdenesTrabajo",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "TarifarioReglas",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "OrigenesOrden",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "TiposOrdenTrabajo",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "Tarifarios",
                schema: "serviciocampo");

            migrationBuilder.DropTable(
                name: "TiposTareaServicio",
                schema: "serviciocampo");
        }
    }
}
