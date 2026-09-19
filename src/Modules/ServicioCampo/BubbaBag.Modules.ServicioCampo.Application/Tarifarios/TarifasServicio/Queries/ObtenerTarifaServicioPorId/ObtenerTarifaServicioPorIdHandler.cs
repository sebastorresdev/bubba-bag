using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Queries.ObtenerTarifaServicioPorId;

public class ObtenerTarifaServicioPorIdHandler : IQueryHandler<ObtenerTarifaServicioPorIdQuery, Result<TarifaServicioDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerTarifaServicioPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<TarifaServicioDto>> HandleAsync(ObtenerTarifaServicioPorIdQuery request, CancellationToken cancellationToken)
    {
        var t = await _context.TarifasServicio
            .AsNoTracking()
            .Include(x => x.ClienteFacturacion)
            .Include(x => x.TipoTareaServicio)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (t == null)
        {
            return Result<TarifaServicioDto>.Failure("La tarifa de servicio solicitada no existe.");
        }

        var dto = new TarifaServicioDto(
            t.Id,
            t.Tipificacion,
            t.EmpresaContratante,
            t.ClienteFacturacionId,
            t.ClienteFacturacion != null
                ? (!string.IsNullOrWhiteSpace(t.ClienteFacturacion.RazonSocial) ? t.ClienteFacturacion.RazonSocial : $"{t.ClienteFacturacion.Nombres} {t.ClienteFacturacion.Apellidos}".Trim())
                : null,
            t.TipoTareaServicioId,
            t.TipoTareaServicio?.CodigoTarea,
            t.TipoTareaServicio?.Nombre,
            t.CodigoServicio,
            t.DetalleServicio,
            t.Sucursal,
            t.Puntos,
            t.FijoBase,
            t.FijoAdicional,
            t.TotalFijo,
            t.VariableTotal,
            t.Indicador1_CycleTime,
            t.Indicador2_Agenda,
            t.Indicador3_Sin30,
            t.VariableAdicionalTotal,
            t.Indicador1_Adicional,
            t.Indicador2_Adicional,
            t.Indicador3_Adicional,
            t.MontoTotalTeorico,
            t.AplicaPago,
            t.AplicaGarantia,
            t.Activo
        );

        return Result<TarifaServicioDto>.Success(dto);
    }
}
