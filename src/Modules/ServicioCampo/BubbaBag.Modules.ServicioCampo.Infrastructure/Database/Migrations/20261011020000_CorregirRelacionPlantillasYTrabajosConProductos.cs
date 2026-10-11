using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations;

[DbContext(typeof(ServicioCampoDbContext))]
[Migration("20261011020000_CorregirRelacionPlantillasYTrabajosConProductos")]
public partial class CorregirRelacionPlantillasYTrabajosConProductos : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'FK_PlantillasTrabajo_Servicios_ServicioId'
                ) THEN
                    ALTER TABLE serviciocampo."PlantillasTrabajo" 
                    DROP CONSTRAINT "FK_PlantillasTrabajo_Servicios_ServicioId";
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'FK_PlantillasTrabajo_Productos_ServicioId'
                ) THEN
                    ALTER TABLE serviciocampo."PlantillasTrabajo" 
                    ADD CONSTRAINT "FK_PlantillasTrabajo_Productos_ServicioId" 
                    FOREIGN KEY ("ServicioId") REFERENCES inventario."Productos"("Id") ON DELETE RESTRICT;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'FK_Trabajos_Servicios_ServicioId'
                ) THEN
                    ALTER TABLE serviciocampo."Trabajos" 
                    DROP CONSTRAINT "FK_Trabajos_Servicios_ServicioId";
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'FK_Trabajos_Productos_ServicioId'
                ) THEN
                    ALTER TABLE serviciocampo."Trabajos" 
                    ADD CONSTRAINT "FK_Trabajos_Productos_ServicioId" 
                    FOREIGN KEY ("ServicioId") REFERENCES inventario."Productos"("Id") ON DELETE RESTRICT;
                END IF;
            END $$;
        """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'FK_PlantillasTrabajo_Productos_ServicioId'
                ) THEN
                    ALTER TABLE serviciocampo."PlantillasTrabajo" 
                    DROP CONSTRAINT "FK_PlantillasTrabajo_Productos_ServicioId";
                END IF;

                IF EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'FK_Trabajos_Productos_ServicioId'
                ) THEN
                    ALTER TABLE serviciocampo."Trabajos" 
                    DROP CONSTRAINT "FK_Trabajos_Productos_ServicioId";
                END IF;
            END $$;
        """);
    }
}
