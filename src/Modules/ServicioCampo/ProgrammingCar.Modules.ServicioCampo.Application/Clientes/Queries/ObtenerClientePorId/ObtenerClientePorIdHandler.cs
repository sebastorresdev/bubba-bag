using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.ServicioCampo.Application.Clientes.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Clientes.Queries.ObtenerClientePorId;

public class ObtenerClientePorIdHandler : IQueryHandler<ObtenerClientePorIdQuery, Result<ClienteDetalleDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerClientePorIdHandler(IServicioCampoDbContext context)
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
                c.Activo,
                c.ContactoPrincipalId,
                c.ContactoPrincipal != null ? (c.ContactoPrincipal.Nombres + " " + c.ContactoPrincipal.Apellidos).Trim() : null,
                c.Contactos
                    .OrderBy(ct => ct.Nombres)
                    .Select(ct => new ContactoDto(
                        ct.Id,
                        ct.Nombres,
                        ct.Apellidos,
                        (ct.Nombres + " " + ct.Apellidos).Trim(),
                        ct.Cargo,
                        ct.CuentaId,
                        c.Nombres,
                        ct.Email,
                        ct.TelefonoMovil,
                        ct.TelefonoTrabajo,
                        ct.Direccion,
                        ct.UbigeoCodigo,
                        ct.Ubigeo != null ? ct.Ubigeo.Distrito : null,
                        ct.Ubigeo != null ? ct.Ubigeo.Provincia : null,
                        ct.Ubigeo != null ? ct.Ubigeo.Departamento : null,
                        ct.Activo,
                        ct.CreatedAt
                    )).ToList(),
                c.CodigoExterno
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (cliente == null)
        {
            return Result<ClienteDetalleDto>.Failure("Cuenta no encontrada.");
        }

        return Result<ClienteDetalleDto>.Success(cliente);
    }
}
