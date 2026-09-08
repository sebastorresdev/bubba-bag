using System;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Consolidado;

public class BancoHorasSaldo : Entity<Guid>
{
    public Guid EmpleadoId { get; private set; }
    public Empleado Empleado { get; private set; } = default!;

    public int MinutosDisponibles { get; private set; } = 0;
    public int MinutosCompensadosHistoricos { get; private set; } = 0;
    public DateTime UltimaActualizacion { get; private set; } = DateTime.UtcNow;

    private BancoHorasSaldo() { }

    public BancoHorasSaldo(Guid id, Guid empleadoId)
    {
        Id = id;
        EmpleadoId = empleadoId;
        MinutosDisponibles = 0;
        MinutosCompensadosHistoricos = 0;
        UltimaActualizacion = DateTime.UtcNow;
    }

    public void AgregarMinutos(int minutos)
    {
        if (minutos <= 0) return;
        MinutosDisponibles += minutos;
        UltimaActualizacion = DateTime.UtcNow;
    }

    public void ConsumirMinutos(int minutos)
    {
        if (minutos <= 0) return;
        MinutosDisponibles = Math.Max(0, MinutosDisponibles - minutos);
        MinutosCompensadosHistoricos += minutos;
        UltimaActualizacion = DateTime.UtcNow;
    }
}
