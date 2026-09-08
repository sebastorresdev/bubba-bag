using System;
using BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Enums;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.PerfilYAsignacion;

public class PerfilAsistenciaEmpleado : Entity<Guid>
{
    public Guid EmpleadoId { get; private set; }
    public Empleado Empleado { get; private set; } = default!;

    // 1. Fiscalización de Jornada y Personal de Confianza
    public bool ControlarAsistencia { get; private set; } = true; // false = Personal de confianza / dirección
    public AutomatizacionMarcacion Automatizacion { get; private set; } = AutomatizacionMarcacion.Ninguna;

    // 2. Modo de Marcación exigido
    public ModalidadMarcacion ModoMarcacion { get; private set; } = ModalidadMarcacion.DosMarcaciones;

    // 3. Reglas de Horas Extras
    public bool PermiteHorasExtra { get; private set; } = false;
    public TipoCompensacionHorasExtra CompensacionHorasExtra { get; private set; } = TipoCompensacionHorasExtra.NoAplica;

    // 4. Canales de Marcación Permitidos
    public bool PermitirMarcacionWeb { get; private set; } = false;
    public bool PermitirMarcacionMovil { get; private set; } = false;
    public bool PermitirMarcacionKiosko { get; private set; } = true;

    // 5. Validaciones de Seguridad en Marcación Móvil / Web
    public bool RequiereFoto { get; private set; } = false;
    public bool RequiereGps { get; private set; } = false;
    public bool ValidarGeocercaSede { get; private set; } = false;

    // 6. Tolerancia Personalizada (Sobrescribe la del turno si se especifica)
    public int? MinutosToleranciaPersonalizada { get; private set; }

    private PerfilAsistenciaEmpleado() { }

    public PerfilAsistenciaEmpleado(
        Guid id,
        Guid empleadoId,
        bool controlarAsistencia = true,
        AutomatizacionMarcacion automatizacion = AutomatizacionMarcacion.Ninguna,
        ModalidadMarcacion modoMarcacion = ModalidadMarcacion.DosMarcaciones,
        bool permiteHorasExtra = false,
        TipoCompensacionHorasExtra compensacionHorasExtra = TipoCompensacionHorasExtra.NoAplica,
        bool permitirMarcacionWeb = false,
        bool permitirMarcacionMovil = false,
        bool permitirMarcacionKiosko = true,
        bool requiereFoto = false,
        bool requiereGps = false,
        bool validarGeocercaSede = false,
        int? minutosToleranciaPersonalizada = null)
    {
        Id = id;
        EmpleadoId = empleadoId;
        ControlarAsistencia = controlarAsistencia;
        Automatizacion = automatizacion;
        ModoMarcacion = modoMarcacion;
        PermiteHorasExtra = permiteHorasExtra;
        CompensacionHorasExtra = compensacionHorasExtra;
        PermitirMarcacionWeb = permitirMarcacionWeb;
        PermitirMarcacionMovil = permitirMarcacionMovil;
        PermitirMarcacionKiosko = permitirMarcacionKiosko;
        RequiereFoto = requiereFoto;
        RequiereGps = requiereGps;
        ValidarGeocercaSede = validarGeocercaSede;
        MinutosToleranciaPersonalizada = minutosToleranciaPersonalizada;
    }

    public void ActualizarConfiguracion(
        bool controlarAsistencia,
        AutomatizacionMarcacion automatizacion,
        ModalidadMarcacion modoMarcacion,
        bool permiteHorasExtra,
        TipoCompensacionHorasExtra compensacionHorasExtra,
        bool permitirMarcacionWeb,
        bool permitirMarcacionMovil,
        bool permitirMarcacionKiosko,
        bool requiereFoto,
        bool requiereGps,
        bool validarGeocercaSede,
        int? minutosToleranciaPersonalizada)
    {
        ControlarAsistencia = controlarAsistencia;
        Automatizacion = automatizacion;
        ModoMarcacion = modoMarcacion;
        PermiteHorasExtra = permiteHorasExtra;
        CompensacionHorasExtra = compensacionHorasExtra;
        PermitirMarcacionWeb = permitirMarcacionWeb;
        PermitirMarcacionMovil = permitirMarcacionMovil;
        PermitirMarcacionKiosko = permitirMarcacionKiosko;
        RequiereFoto = requiereFoto;
        RequiereGps = requiereGps;
        ValidarGeocercaSede = validarGeocercaSede;
        MinutosToleranciaPersonalizada = minutosToleranciaPersonalizada;
    }
}
