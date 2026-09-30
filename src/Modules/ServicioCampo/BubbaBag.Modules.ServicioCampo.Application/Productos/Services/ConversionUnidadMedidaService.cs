using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Services;

public interface IConversionUnidadMedidaService
{
    /// <summary>
    /// Convierte una cantidad expresada en <paramref name="unidadOrigenId"/> a la unidad base del grupo.
    /// Opcionalmente redondea el resultado a la precisión decimal indicada.
    /// </summary>
    Task<decimal> ConvertirAUnidadBaseAsync(Guid unidadOrigenId, decimal cantidad, int? decimalesRedondeo = null, CancellationToken ct = default);

    /// <summary>
    /// Convierte una cantidad en unidades base a la unidad destino especificada.
    /// Opcionalmente redondea el resultado a la precisión decimal indicada.
    /// </summary>
    Task<decimal> ConvertirDesdeUnidadBaseAsync(Guid unidadDestinoId, decimal cantidadBase, int? decimalesRedondeo = null, CancellationToken ct = default);

    /// <summary>
    /// Convierte directamente entre dos unidades del mismo grupo.
    /// Opcionalmente redondea el resultado a la precisión decimal indicada.
    /// </summary>
    Task<decimal> ConvertirAsync(Guid unidadOrigenId, Guid unidadDestinoId, decimal cantidad, int? decimalesRedondeo = null, CancellationToken ct = default);
}

public class ConversionUnidadMedidaService : IConversionUnidadMedidaService
{
    private readonly IServicioCampoDbContext _context;

    public ConversionUnidadMedidaService(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<decimal> ConvertirAUnidadBaseAsync(Guid unidadOrigenId, decimal cantidad, int? decimalesRedondeo = null, CancellationToken ct = default)
    {
        var unidad = await ObtenerUnidadAsync(unidadOrigenId, ct);
        return AplicarRedondeo(unidad.ConvertirAUnidadBase(cantidad), decimalesRedondeo);
    }

    public async Task<decimal> ConvertirDesdeUnidadBaseAsync(Guid unidadDestinoId, decimal cantidadBase, int? decimalesRedondeo = null, CancellationToken ct = default)
    {
        var unidad = await ObtenerUnidadAsync(unidadDestinoId, ct);
        return AplicarRedondeo(unidad.ConvertirDesdeUnidadBase(cantidadBase), decimalesRedondeo);
    }

    public async Task<decimal> ConvertirAsync(Guid unidadOrigenId, Guid unidadDestinoId, decimal cantidad, int? decimalesRedondeo = null, CancellationToken ct = default)
    {
        var origen = await ObtenerUnidadAsync(unidadOrigenId, ct);
        var destino = await ObtenerUnidadAsync(unidadDestinoId, ct);

        if (origen.GrupoUnidadMedidaId != destino.GrupoUnidadMedidaId)
            throw new InvalidOperationException(
                $"Las unidades '{origen.Nombre}' y '{destino.Nombre}' pertenecen a grupos distintos y no son convertibles entre sí.");

        // Primero pasar a unidad base, luego a destino
        var enBase = origen.ConvertirAUnidadBase(cantidad);
        var resultado = destino.ConvertirDesdeUnidadBase(enBase);
        return AplicarRedondeo(resultado, decimalesRedondeo);
    }

    private static decimal AplicarRedondeo(decimal valor, int? decimales)
    {
        return decimales.HasValue
            ? Math.Round(valor, Math.Clamp(decimales.Value, 0, 5), MidpointRounding.AwayFromZero)
            : valor;
    }

    private async Task<Domain.Productos.UnidadMedida> ObtenerUnidadAsync(Guid id, CancellationToken ct)
    {
        var unidad = await _context.UnidadesMedida
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new InvalidOperationException($"No se encontró la unidad de medida con ID '{id}'.");

        return unidad;
    }
}
