using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations;

[DbContext(typeof(ServicioCampoDbContext))]
[Migration("20260928180000_ConfigurarDecimalesCantidadPorProducto")]
public sealed class ConfigurarDecimalesCantidadPorProducto : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE inventario."UnidadesMedida"
                ADD COLUMN IF NOT EXISTS "PermiteDecimales" boolean NOT NULL DEFAULT false;

            ALTER TABLE inventario."Productos"
                ADD COLUMN IF NOT EXISTS "DecimalesCantidad" integer NOT NULL DEFAULT 0;

            UPDATE inventario."Productos" AS producto
            SET "DecimalesCantidad" = CASE WHEN unidad."PermiteDecimales" THEN 2 ELSE 0 END
            FROM inventario."UnidadesMedida" AS unidad
            WHERE lower(trim(producto."UnidadMedida")) = lower(trim(unidad."Nombre"));

            ALTER TABLE inventario."Productos"
                DROP CONSTRAINT IF EXISTS "CK_Productos_DecimalesCantidad";
            ALTER TABLE inventario."Productos"
                ADD CONSTRAINT "CK_Productos_DecimalesCantidad"
                CHECK ("DecimalesCantidad" BETWEEN 0 AND 5);

            ALTER TABLE inventario."UnidadesMedida"
                DROP COLUMN IF EXISTS "PermiteDecimales";

            ALTER TABLE inventario."MovimientosInventario"
                ALTER COLUMN "Cantidad" TYPE numeric(14,5);
            ALTER TABLE inventario."StocksAlmacen"
                ALTER COLUMN "CantidadDisponible" TYPE numeric(14,5),
                ALTER COLUMN "CantidadReservada" TYPE numeric(14,5);
            ALTER TABLE serviciocampo."MaterialesTrabajo"
                ALTER COLUMN "CantidadPrevista" TYPE numeric(14,5),
                ALTER COLUMN "CantidadUtilizada" TYPE numeric(14,5);
            ALTER TABLE serviciocampo."LiquidacionesMaterialItems"
                ALTER COLUMN "CantidadConsumida" TYPE numeric(14,5),
                ALTER COLUMN "CantidadDevuelta" TYPE numeric(14,5);
            ALTER TABLE serviciocampo."OrdenTrabajoMateriales"
                ALTER COLUMN "Cantidad" TYPE numeric(14,5);
            ALTER TABLE serviciocampo."PlantillasMateriales"
                ALTER COLUMN "CantidadPrevista" TYPE numeric(14,5);
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE inventario."UnidadesMedida"
                ADD COLUMN IF NOT EXISTS "PermiteDecimales" boolean NOT NULL DEFAULT false;

            UPDATE inventario."UnidadesMedida" AS unidad
            SET "PermiteDecimales" = EXISTS (
                SELECT 1
                FROM inventario."Productos" AS producto
                WHERE lower(trim(producto."UnidadMedida")) = lower(trim(unidad."Nombre"))
                  AND producto."DecimalesCantidad" > 0);

            ALTER TABLE serviciocampo."PlantillasMateriales"
                ALTER COLUMN "CantidadPrevista" TYPE numeric(12,2);
            ALTER TABLE serviciocampo."OrdenTrabajoMateriales"
                ALTER COLUMN "Cantidad" TYPE numeric(14,2);
            ALTER TABLE serviciocampo."LiquidacionesMaterialItems"
                ALTER COLUMN "CantidadConsumida" TYPE numeric(12,2),
                ALTER COLUMN "CantidadDevuelta" TYPE numeric(12,2);
            ALTER TABLE serviciocampo."MaterialesTrabajo"
                ALTER COLUMN "CantidadPrevista" TYPE numeric(12,2),
                ALTER COLUMN "CantidadUtilizada" TYPE numeric(12,2);
            ALTER TABLE inventario."StocksAlmacen"
                ALTER COLUMN "CantidadDisponible" TYPE numeric(14,2),
                ALTER COLUMN "CantidadReservada" TYPE numeric(14,2);
            ALTER TABLE inventario."MovimientosInventario"
                ALTER COLUMN "Cantidad" TYPE numeric(14,2);

            ALTER TABLE inventario."Productos"
                DROP CONSTRAINT IF EXISTS "CK_Productos_DecimalesCantidad";
            ALTER TABLE inventario."Productos"
                DROP COLUMN IF EXISTS "DecimalesCantidad";
            """);
    }
}
