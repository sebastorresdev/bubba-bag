using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Crm.Application.Clientes.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Crm.Application.Clientes.Features;

public record ObtenerClientesQuery(
    string? Search = null,
    bool? SoloFacturacion = null,
    bool? SoloServicio = null,
    bool? SoloActivos = null
) : IQuery<Result<IReadOnlyList<ClienteListadoItemDto>>>;

public class ObtenerClientesHandler : IQueryHandler<ObtenerClientesQuery, Result<IReadOnlyList<ClienteListadoItemDto>>>
{
    private readonly ICrmDbContext _context;

    public ObtenerClientesHandler(ICrmDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IReadOnlyList<ClienteListadoItemDto>>> HandleAsync(ObtenerClientesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Clientes.AsNoTracking().AsQueryable();

        if (request.SoloActivos.HasValue)
        {
            query = query.Where(c => c.Activo == request.SoloActivos.Value);
        }

        if (request.SoloFacturacion.HasValue && request.SoloFacturacion.Value)
        {
            query = query.Where(c => c.EsClienteFacturacion);
        }

        if (request.SoloServicio.HasValue && request.SoloServicio.Value)
        {
            query = query.Where(c => c.EsClienteServicio);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToUpper();
            query = query.Where(c =>
                c.CodigoCliente.Contains(term) ||
                c.DocumentoIdentidad.Contains(term) ||
                c.Nombres.ToUpper().Contains(term) ||
                (c.Apellidos != null && c.Apellidos.ToUpper().Contains(term)) ||
                (c.RazonSocial != null && c.RazonSocial.ToUpper().Contains(term)) ||
                c.TelefonoPrincipal.Contains(term));
        }

        var list = await query
            .OrderBy(c => c.Nombres)
            .Select(c => new ClienteListadoItemDto(
                c.Id,
                c.CodigoCliente,
                c.TipoPersona,
                c.TipoDocumento,
                c.DocumentoIdentidad,
                c.Nombres,
                c.Apellidos,
                c.RazonSocial,
                c.NombreCompletoODenominacion,
                c.TelefonoPrincipal,
                c.Email,
                c.Direccion,
                c.Distrito,
                c.Provincia,
                c.Departamento,
                c.EsClienteFacturacion,
                c.EsClienteServicio,
                c.Activo
            ))
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyList<ClienteListadoItemDto>>.Success(list);
    }
}
