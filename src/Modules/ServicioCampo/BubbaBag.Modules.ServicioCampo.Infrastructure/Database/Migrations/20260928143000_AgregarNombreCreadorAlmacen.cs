using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Migrations;

[DbContext(typeof(ServicioCampoDbContext))]
[Migration("20260928143000_AgregarNombreCreadorAlmacen")]
public partial class AgregarNombreCreadorAlmacen : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "CreadoPorNombre",
            schema: "inventario",
            table: "Almacenes",
            type: "character varying(150)",
            maxLength: 150,
            nullable: true);

        migrationBuilder.Sql(
            "UPDATE inventario.\"Almacenes\" AS a " +
            "SET \"CreadoPorNombre\" = u.\"NombreCompleto\" " +
            "FROM seguridad.\"AspNetUsers\" AS u " +
            "WHERE a.\"CreadoPorId\" = u.\"Id\"");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "CreadoPorNombre",
            schema: "inventario",
            table: "Almacenes");
    }
}
