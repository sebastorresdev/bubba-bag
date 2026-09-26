using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerListaPreciosPorId;

public record DetalleListaPreciosDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string Moneda,
    string? Descripcion,
    DateTime? FechaInicio,
    DateTime? FechaFin,
    bool Activo,
    List<ElementoListaPreciosDto> Elementos
);

public record ObtenerListaPreciosPorIdQuery(Guid Id) : IQuery<Result<DetalleListaPreciosDto>>;

public class ObtenerListaPreciosPorIdHandler : IQueryHandler<ObtenerListaPreciosPorIdQuery, Result<DetalleListaPreciosDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerListaPreciosPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<DetalleListaPreciosDto>> HandleAsync(ObtenerListaPreciosPorIdQuery query, CancellationToken cancellationToken = default)
    {
        var lista = await _context.ListasPrecios
            .AsNoTracking()
            .Include(l => l.Elementos)
                .ThenInclude(e => e.Producto)
            .Include(l => l.Elementos)
                .ThenInclude(e => e.UnidadMedida)
            .FirstOrDefaultAsync(l => l.Id == query.Id, cancellationToken);

        if (lista == null)
        {
            return Result<DetalleListaPreciosDto>.Failure($"No se encontró la lista de precios con ID '{query.Id}'.");
        }

        var elementosDto = lista.Elementos
            .OrderBy(e => e.Producto.Nombre)
            .Select(e => new ElementoListaPreciosDto(
                e.Id,
                e.ListaPreciosId,
                e.ProductoId,
                e.Producto.Codigo,
                e.Producto.Nombre,
                e.UnidadMedidaId,
                e.UnidadMedida != null ? e.UnidadMedida.Nombre : e.Producto.UnidadMedida,
                e.Monto,
                (int)e.MetodoFijacion
            ))
            .ToList();

        var detalle = new DetalleListaPreciosDto(
            lista.Id,
            lista.Codigo,
            lista.Nombre,
            lista.Moneda,
            lista.Descripcion,
            lista.FechaInicio,
            lista.FechaFin,
            lista.Activo,
            elementosDto
        );

        return Result<DetalleListaPreciosDto>.Success(detalle);
    }
}
