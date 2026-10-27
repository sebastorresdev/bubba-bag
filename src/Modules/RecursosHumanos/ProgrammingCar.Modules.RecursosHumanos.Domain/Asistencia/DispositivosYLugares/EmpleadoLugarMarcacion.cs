using System;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Empleados;
using ProgrammingCar.SharedKernel;

namespace ProgrammingCar.Modules.RecursosHumanos.Domain.Asistencia.DispositivosYLugares;

public class EmpleadoLugarMarcacion : Entity<Guid>
{
    public Guid EmpleadoId { get; private set; }
    public Empleado Empleado { get; private set; } = default!;

    public Guid LugarMarcacionId { get; private set; }
    public LugarMarcacion LugarMarcacion { get; private set; } = default!;

    private EmpleadoLugarMarcacion() { }

    public EmpleadoLugarMarcacion(Guid id, Guid empleadoId, Guid lugarMarcacionId)
    {
        Id = id;
        EmpleadoId = empleadoId;
        LugarMarcacionId = lugarMarcacionId;
    }
}
