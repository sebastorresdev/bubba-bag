using System;
using System.Linq;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders;

public static class ClienteSeeder
{
    public static async Task SeedAsync(ServicioCampoDbContext context, ILogger logger)
    {
        try
        {
            var directv = await context.Clientes.FirstOrDefaultAsync(c =>
                c.CodigoCliente == "CLI-DIRECTV" ||
                (c.RazonSocial != null && c.RazonSocial.ToUpper().Contains("DIRECTV")) ||
                c.DocumentoIdentidad == "20508565434");

            if (directv == null)
            {
                logger.LogInformation("[ClienteSeeder] Registrando cliente corporativo de facturación: DIRECTV PERU S.R.L.");

                var ubigeoSurco = await context.Ubigeos.FirstOrDefaultAsync(u =>
                    u.Codigo == "150140" || (u.Distrito != null && u.Distrito.Contains("SURCO")));

                var ubigeoCodigo = ubigeoSurco?.Codigo ??
                                   await context.Ubigeos.Select(u => u.Codigo).FirstOrDefaultAsync() ??
                                   "150101";

                directv = Cliente.Crear(
                    codigoCliente: "CLI-DIRECTV",
                    documentoIdentidad: "20508565434",
                    nombres: "DIRECTV",
                    apellidos: null,
                    telefonoPrincipal: "012004600",
                    direccion: "AV. MANUEL OLGUIN NRO. 325 INT. 1601 URB. EL DERBY, SANTIAGO DE SURCO",
                    ubigeoCodigo: ubigeoCodigo,
                    esClienteFacturacion: true,
                    esClienteServicio: false,
                    tipoDocumento: "RUC",
                    tipoPersona: "JURIDICA",
                    razonSocial: "DIRECTV PERU S.R.L.",
                    email: "atencion@directv.pe",
                    referencia: "Edificio Capital El Derby"
                );

                context.Clientes.Add(directv);
                await context.SaveChangesAsync();
                logger.LogInformation("[ClienteSeeder] Cliente corporativo DIRECTV PERU S.R.L. registrado exitosamente con ID: {Id}", directv.Id);
            }
            else
            {
                logger.LogInformation("[ClienteSeeder] El cliente corporativo DIRECTV ya existe con ID: {Id}", directv.Id);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[ClienteSeeder] Error al sembrar el cliente corporativo DIRECTV.");
        }
    }
}
