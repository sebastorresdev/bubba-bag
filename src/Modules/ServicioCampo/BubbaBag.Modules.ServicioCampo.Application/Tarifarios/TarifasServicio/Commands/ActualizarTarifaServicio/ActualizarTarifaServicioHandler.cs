using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Commands.ActualizarTarifaServicio;

public class ActualizarTarifaServicioHandler : ICommandHandler<ActualizarTarifaServicioCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarTarifaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarTarifaServicioCommand request, CancellationToken cancellationToken)
    {
        var tarifa = await _context.TarifasServicio.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tarifa == null)
            return Result.Failure("Tarifa de servicio no encontrada.");

        tarifa.Actualizar(
            detalleServicio: request.DetalleServicio,
            tipificacion: request.Tipificacion,
            tipoTareaServicioId: request.TipoTareaServicioId,
            empresaContratante: request.EmpresaContratante,
            clienteFacturacionId: request.ClienteFacturacionId,
            sucursal: request.Sucursal,
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

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
