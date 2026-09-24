using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerUnidadMedidaPorId;

public record ObtenerUnidadMedidaPorIdQuery(Guid Id) : IQuery<Result<UnidadMedidaDto>>;

public class ObtenerUnidadMedidaPorIdHandler : IQueryHandler<ObtenerUnidadMedidaPorIdQuery, Result<UnidadMedidaDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerUnidadMedidaPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<UnidadMedidaDto>> HandleAsync(ObtenerUnidadMedidaPorIdQuery query, CancellationToken cancellationToken = default)
    {
        var u = await _context.UnidadesMedida
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == query.Id, cancellationToken);

        if (u is null)
            return Result<UnidadMedidaDto>.Failure("La unidad de medida no existe.");

        var dto = new UnidadMedidaDto(
            u.Id,
            u.Codigo,
            u.Nombre,
            u.Abreviatura,
            u.PermiteDecimales,
            u.Descripcion,
            u.Activo
        );

        return Result<UnidadMedidaDto>.Success(dto);
    }
}
