using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Queries.ObtenerTipoOrdenTrabajoPorId;

public class ObtenerTipoOrdenTrabajoPorIdHandler : IQueryHandler<ObtenerTipoOrdenTrabajoPorIdQuery, Result<TipoOrdenTrabajoDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerTipoOrdenTrabajoPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<TipoOrdenTrabajoDto>> HandleAsync(ObtenerTipoOrdenTrabajoPorIdQuery request, CancellationToken cancellationToken)
    {
        var tipo = await _context.TiposOrdenTrabajo.AsNoTracking()
            .Where(t => t.Id == request.Id)
            .Select(t => new TipoOrdenTrabajoDto(
                t.Id,
                t.Nombre,
                t.Descripcion,
                t.RequiereVisitaCampo,
                t.ExigeFirmaCliente,
                t.ExigeEvidenciasFotograficas,
                t.ColorHex,
                t.Activo,
                t.ListaPreciosId,
                t.ListaPrecios != null ? t.ListaPrecios.Nombre : null))
            .FirstOrDefaultAsync(cancellationToken);

        return tipo != null
            ? Result<TipoOrdenTrabajoDto>.Success(tipo)
            : Result<TipoOrdenTrabajoDto>.Failure("Tipo de orden de trabajo no encontrado.");
    }
}
