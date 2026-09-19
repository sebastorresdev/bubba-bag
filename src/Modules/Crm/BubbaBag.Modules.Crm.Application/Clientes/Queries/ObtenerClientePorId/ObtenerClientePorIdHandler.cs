using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Crm.Application.Clientes.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Crm.Application.Clientes.Queries.ObtenerClientePorId;

public class ObtenerClientePorIdHandler : IQueryHandler<ObtenerClientePorIdQuery, Result<ClienteDetalleDto>>
{
    private readonly ICrmDbContext _context;

    public ObtenerClientePorIdHandler(ICrmDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ClienteDetalleDto>> HandleAsync(ObtenerClientePorIdQuery request, CancellationToken cancellationToken)
    {
        var cliente = await _context.Clientes
            .AsNoTracking()
            .Where(c => c.Id == request.Id)
            .Select(c => new ClienteDetalleDto(
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
                c.TelefonoSecundario,
                c.Email,
                c.Direccion,
                c.UbigeoCodigo,
                c.Ubigeo != null ? c.Ubigeo.Distrito : string.Empty,
                c.Ubigeo != null ? c.Ubigeo.Provincia : string.Empty,
                c.Ubigeo != null ? c.Ubigeo.Departamento : string.Empty,
                c.ReferenciaUbicacion,
                c.CoordenadaLat,
                c.CoordenadaLng,
                c.EsClienteFacturacion,
                c.EsClienteServicio,
                c.Activo
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (cliente == null)
        {
            return Result<ClienteDetalleDto>.Failure("Cliente no encontrado.");
        }

        return Result<ClienteDetalleDto>.Success(cliente);
    }
}
