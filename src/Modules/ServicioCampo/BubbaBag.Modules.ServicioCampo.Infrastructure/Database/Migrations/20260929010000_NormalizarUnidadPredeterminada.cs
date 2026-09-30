using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations;

/// <summary>
/// Elimina las unidades demostrativas del arranque antiguo y conserva únicamente
/// el grupo predeterminado requerido por el sistema.
/// </summary>
[DbContext(typeof(ServicioCampoDbContext))]
[Migration("20260929010000_NormalizarUnidadPredeterminada")]
public partial class NormalizarUnidadPredeterminada : Migration
{
    private const string UnidadPredeterminada = "a1111111-1111-1111-1111-111111111111";

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql($$"""
            UPDATE inventario."Productos"
            SET "GrupoUnidadMedidaId" = '{{UnidadPredeterminada}}',
                "UnidadMedidaDefectoId" = '{{UnidadPredeterminada}}'
            WHERE "GrupoUnidadMedidaId" IN (
                    'a2222222-2222-2222-2222-222222222222',
                    'a3333333-3333-3333-3333-333333333333',
                    'a4444444-4444-4444-4444-444444444444',
                    'a5555555-5555-5555-5555-555555555555',
                    'a6666666-6666-6666-6666-666666666666')
               OR "UnidadMedidaDefectoId" IN (
                    'a2222222-2222-2222-2222-222222222222',
                    'a3333333-3333-3333-3333-333333333333',
                    'a4444444-4444-4444-4444-444444444444',
                    'a5555555-5555-5555-5555-555555555555',
                    'a6666666-6666-6666-6666-666666666666');

            UPDATE inventario."ElementosListaPrecios"
            SET "UnidadMedidaId" = NULL
            WHERE "UnidadMedidaId" IN (
                'a2222222-2222-2222-2222-222222222222',
                'a3333333-3333-3333-3333-333333333333',
                'a4444444-4444-4444-4444-444444444444',
                'a5555555-5555-5555-5555-555555555555',
                'a6666666-6666-6666-6666-666666666666');

            DELETE FROM inventario."UnidadesMedida"
            WHERE "Id" IN (
                'a2222222-2222-2222-2222-222222222222',
                'a3333333-3333-3333-3333-333333333333',
                'a4444444-4444-4444-4444-444444444444',
                'a5555555-5555-5555-5555-555555555555',
                'a6666666-6666-6666-6666-666666666666');

            DELETE FROM inventario."GruposUnidadMedida"
            WHERE "Id" IN (
                'a2222222-2222-2222-2222-222222222222',
                'a3333333-3333-3333-3333-333333333333',
                'a4444444-4444-4444-4444-444444444444',
                'a5555555-5555-5555-5555-555555555555',
                'a6666666-6666-6666-6666-666666666666');

            UPDATE inventario."GruposUnidadMedida"
            SET "Nombre" = 'Única unidad', "FechaModificacion" = NOW()
            WHERE "Id" = '{{UnidadPredeterminada}}';

            UPDATE inventario."UnidadesMedida"
            SET "Nombre" = 'Única unidad'
            WHERE "Id" = '{{UnidadPredeterminada}}';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql($$"""
            UPDATE inventario."GruposUnidadMedida"
            SET "Nombre" = 'Unidades', "FechaModificacion" = NOW()
            WHERE "Id" = '{{UnidadPredeterminada}}';

            UPDATE inventario."UnidadesMedida"
            SET "Nombre" = 'Unidades'
            WHERE "Id" = '{{UnidadPredeterminada}}';
            """);
    }
}
