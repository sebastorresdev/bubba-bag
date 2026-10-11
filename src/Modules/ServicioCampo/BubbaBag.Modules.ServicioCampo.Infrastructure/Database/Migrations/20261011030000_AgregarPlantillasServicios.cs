using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations;

[DbContext(typeof(ServicioCampoDbContext))]
[Migration("20261011030000_AgregarPlantillasServicios")]
public partial class AgregarPlantillasServicios : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS serviciocampo."PlantillasServicios" (
                "Id" uuid NOT NULL,
                "PlantillaTrabajoId" uuid NOT NULL,
                "ProductoId" uuid NOT NULL,
                "EsPredeterminada" boolean NOT NULL DEFAULT FALSE,
                CONSTRAINT "PK_PlantillasServicios" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_PlantillasServicios_PlantillasTrabajo" FOREIGN KEY ("PlantillaTrabajoId") REFERENCES serviciocampo."PlantillasTrabajo"("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_PlantillasServicios_Productos" FOREIGN KEY ("ProductoId") REFERENCES inventario."Productos"("Id") ON DELETE RESTRICT
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_PlantillasServicios_PlantillaTrabajoId_ProductoId" 
                ON serviciocampo."PlantillasServicios"("PlantillaTrabajoId", "ProductoId");
            CREATE INDEX IF NOT EXISTS "IX_PlantillasServicios_ProductoId" 
                ON serviciocampo."PlantillasServicios"("ProductoId");

            INSERT INTO serviciocampo."PlantillasServicios" ("Id", "PlantillaTrabajoId", "ProductoId", "EsPredeterminada")
            SELECT gen_random_uuid(), p."Id", p."ServicioId", p."EsPredeterminada"
            FROM serviciocampo."PlantillasTrabajo" p
            WHERE NOT EXISTS (
                SELECT 1 FROM serviciocampo."PlantillasServicios" ps 
                WHERE ps."PlantillaTrabajoId" = p."Id" AND ps."ProductoId" = p."ServicioId"
            );
        """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS serviciocampo."PlantillasServicios";
        """);
    }
}
