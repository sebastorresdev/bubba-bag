using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCamposD365Producto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""AfectoImpuesto"" boolean NOT NULL DEFAULT true;
                ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""CodigoBarras"" character varying(50);
                ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""ConvertirEnActivoCliente"" boolean NOT NULL DEFAULT false;
                ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""CostoActual"" numeric(12,2) NOT NULL DEFAULT 0;
                ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""CostoEstandar"" numeric(12,2) NOT NULL DEFAULT 0;
                ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""Notas"" character varying(1000);
                ALTER TABLE inventario.""Productos"" ADD COLUMN IF NOT EXISTS ""ProveedorDefecto"" character varying(150);

                CREATE TABLE IF NOT EXISTS inventario.""CategoriasProducto"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""Nombre"" character varying(100) NOT NULL,
                    ""Familia"" character varying(100),
                    ""Descripcion"" character varying(300),
                    ""Activo"" boolean NOT NULL DEFAULT true
                );

                CREATE TABLE IF NOT EXISTS inventario.""UnidadesMedida"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""Codigo"" character varying(20) NOT NULL,
                    ""Nombre"" character varying(100) NOT NULL,
                    ""Abreviatura"" character varying(10) NOT NULL,
                    ""PermiteDecimales"" boolean NOT NULL DEFAULT false,
                    ""Descripcion"" character varying(300),
                    ""Activo"" boolean NOT NULL DEFAULT true
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_UnidadesMedida_Codigo""
                ON inventario.""UnidadesMedida"" (""Codigo"");
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP TABLE IF EXISTS inventario.""CategoriasProducto"";
                DROP TABLE IF EXISTS inventario.""UnidadesMedida"";
                ALTER TABLE inventario.""Productos"" DROP COLUMN IF EXISTS ""AfectoImpuesto"";
                ALTER TABLE inventario.""Productos"" DROP COLUMN IF EXISTS ""CodigoBarras"";
                ALTER TABLE inventario.""Productos"" DROP COLUMN IF EXISTS ""ConvertirEnActivoCliente"";
                ALTER TABLE inventario.""Productos"" DROP COLUMN IF EXISTS ""CostoActual"";
                ALTER TABLE inventario.""Productos"" DROP COLUMN IF EXISTS ""CostoEstandar"";
                ALTER TABLE inventario.""Productos"" DROP COLUMN IF EXISTS ""Notas"";
                ALTER TABLE inventario.""Productos"" DROP COLUMN IF EXISTS ""ProveedorDefecto"";
            ");
        }
    }
}
