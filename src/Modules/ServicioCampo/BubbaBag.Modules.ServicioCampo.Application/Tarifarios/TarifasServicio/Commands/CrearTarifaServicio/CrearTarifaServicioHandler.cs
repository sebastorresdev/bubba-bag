using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Commands.CrearTarifaServicio;

public class CrearTarifaServicioHandler : ICommandHandler<CrearTarifaServicioCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearTarifaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearTarifaServicioCommand request, CancellationToken cancellationToken)
    {
        var codigo = request.CodigoServicio.Trim().ToUpperInvariant();
        var empresa = request.EmpresaContratante.Trim().ToUpperInvariant();
        var sucursal = string.IsNullOrWhiteSpace(request.Sucursal) ? null : request.Sucursal.Trim().ToUpperInvariant();

        var existe = await _context.TarifasServicio.AnyAsync(t =>
            t.EmpresaContratante == empresa &&
            t.CodigoServicio == codigo &&
            t.Sucursal == sucursal, cancellationToken);

        if (existe)
        {
            var sucMsg = sucursal != null ? $"para la sucursal '{sucursal}'" : "de alcance general";
            return Result<Guid>.Failure($"Ya existe una tarifa con el código '{codigo}' {sucMsg} para '{empresa}'.");
        }

        var tarifa = TarifaServicio.Crear(
            codigoServicio: codigo,
            detalleServicio: request.DetalleServicio,
            tipificacion: request.Tipificacion,
            tipoTareaServicioId: request.TipoTareaServicioId,
            empresaContratante: empresa,
            clienteFacturacionId: request.ClienteFacturacionId,
            sucursal: sucursal,
            puntos: request.Puntos,
            fijoBase: request.FijoBase,
            fijoAdicional: request.FijoAdicional,
            variableTotal: request.VariableTotal,
            cycleTime: request.Indicador1_CycleTime,
            agenda: request.Indicador2_Agenda,
            sin30: request.Indicador3_Sin30,
            variableAdicionalTotal: request.VariableAdicionalTotal,
            cycleTimeAdic: request.Indicador1_Adicional,
            agendaAdic: request.Indicador2_Adicional,
            sin30Adic: request.Indicador3_Adicional,
            montoTotal: request.MontoTotalTeorico,
            aplicaPago: request.AplicaPago,
            aplicaGarantia: request.AplicaGarantia
        );

        _context.TarifasServicio.Add(tarifa);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(tarifa.Id);
    }
}
