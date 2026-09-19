using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Queries.ObtenerTarifasServicio;

public class ObtenerTarifasServicioHandler : IQueryHandler<ObtenerTarifasServicioQuery, Result<List<TarifaServicioDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerTarifasServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<TarifaServicioDto>>> HandleAsync(ObtenerTarifasServicioQuery request, CancellationToken cancellationToken)
    {
        var query = _context.TarifasServicio
            .AsNoTracking()
            .Include(t => t.ClienteFacturacion)
            .Include(t => t.TipoTareaServicio)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.EmpresaContratante))
        {
            var emp = request.EmpresaContratante.Trim().ToUpperInvariant();
            query = query.Where(t => t.EmpresaContratante == emp);
        }

        if (!string.IsNullOrWhiteSpace(request.Tipificacion))
        {
            var tip = request.Tipificacion.Trim().ToUpperInvariant();
            query = query.Where(t => t.Tipificacion == tip);
        }

        if (!string.IsNullOrWhiteSpace(request.Sucursal))
        {
            var suc = request.Sucursal.Trim().ToUpperInvariant();
            query = query.Where(t => t.Sucursal == suc || t.Sucursal == null);
        }

        if (request.SoloActivos == true)
        {
            query = query.Where(t => t.Activo);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(t =>
                t.CodigoServicio.ToLower().Contains(search) ||
                t.DetalleServicio.ToLower().Contains(search) ||
                t.Tipificacion.ToLower().Contains(search) ||
                (t.Sucursal != null && t.Sucursal.ToLower().Contains(search)));
        }

        var items = await query
            .OrderBy(t => t.EmpresaContratante)
            .ThenBy(t => t.Tipificacion)
            .ThenBy(t => t.CodigoServicio)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(t => new TarifaServicioDto(
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
        )).ToList();

        return Result<List<TarifaServicioDto>>.Success(dtos);
    }
}
