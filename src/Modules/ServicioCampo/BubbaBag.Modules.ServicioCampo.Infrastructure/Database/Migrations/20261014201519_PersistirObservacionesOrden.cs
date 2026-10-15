using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class PersistirObservacionesOrden : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ObservacionesGenerales",
                schema: "serviciocampo",
                table: "OrdenesTrabajo",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
            // Mantener lo que mostraba la ficha antes: el reporte de la visita más reciente.
            migrationBuilder.Sql(@"UPDATE serviciocampo.""OrdenesTrabajo"" o
                SET ""ObservacionesGenerales"" = (SELECT v.""ObservacionesTecnico""
                    FROM serviciocampo.""OrdenTrabajoVisitas"" v
                    WHERE v.""OrdenTrabajoId"" = o.""Id""
                    ORDER BY v.""NumeroVisita"" DESC LIMIT 1)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ObservacionesGenerales",
                schema: "serviciocampo",
                table: "OrdenesTrabajo");
        }
    }
}
