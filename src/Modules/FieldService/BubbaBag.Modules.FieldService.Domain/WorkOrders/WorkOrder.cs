using BubbaBag.SharedKernel;
using BubbaBag.Modules.FieldService.Domain.Enums;
using BubbaBag.Modules.FieldService.Domain.Mantenimientos;
using BubbaBag.Modules.FieldService.Domain.Clientes;

namespace BubbaBag.Modules.FieldService.Domain.WorkOrders;

/// <summary>
/// Orden de Trabajo Universal (Field Service Work Order).
/// Representa la visita logística o despacho a campo.
/// </summary>
public class WorkOrder : Entity<Guid>
{
    public string CodigoWo { get; private set; } = default!; // 'WO-2026-000001'
    
    // Tipo de Orden (Mantenimiento)
    public Guid TipoOrdenId { get; private set; }
    public TipoOrdenTrabajo TipoOrden { get; private set; } = default!;

    // Origen Dinámico (Mantenimiento)
    public Guid OrigenOrdenId { get; private set; }
    public OrigenOrden OrigenOrden { get; private set; } = default!;

    public Guid CreadoPorId { get; private set; }

    // Actores Clave: Quién paga y Quién recibe la visita
    public Guid ClienteFacturacionId { get; private set; }
    public Cliente ClienteFacturacion { get; private set; } = default!; // DIRECTV, Claro, Empresa propia

    public Guid ClienteServicioId { get; private set; }
    public Cliente ClienteServicio { get; private set; } = default!;    // Andrés Calamaro, Vecino real

    // Referencias Externas (Agnóstico a la fuente: Siebel, SGA, etc.)
    public string? NumeroOrdenExterna { get; private set; }   // "1-86131756103"
    public string? CodigoContratoIbs { get; private set; }    // "40757240"
    public string? IdEncabezadoExterno { get; private set; }

    // =========================================================================
    // TRIPLE ESTADO (Estilo Dynamics 365)
    // =========================================================================
    public EstadoSistema EstadoSistema { get; private set; }
    public string EstadoInterno { get; private set; } = default!; // 'PENDIENTE_ASIGNAR', 'ASIGNADA', 'EN_SITIO', 'FINALIZADA_CAMPO', 'FINALIZADA_PREACTIVADA'
    public string? EstadoExterno { get; private set; }             // Texto libre del Excel: "Abierta", "Liquidada", etc.

    public string? MotivoCierre { get; private set; }

    // Despacho y Asignación (Booking)
    public Guid? CuadrillaTecnicoId { get; private set; }
    public DateOnly? FechaProgramada { get; private set; }
    public string? BloqueHorario { get; private set; }

    // Tiempos Reales de Operación
    public DateTime? FechaInicioReal { get; private set; }
    public DateTime? FechaCierreReal { get; private set; }

    // Evidencias y Cierre
    public string? FirmaClienteUrl { get; private set; }
    public string? FotoFachadaUrl { get; private set; }
    public string? FotoInstalacionUrl { get; private set; }
    public string? ObservacionesGenerales { get; private set; }

    // Subtareas (Hijos agregados)
    private readonly List<WorkOrderTarea> _tareas = new();
    public IReadOnlyCollection<WorkOrderTarea> Tareas => _tareas.AsReadOnly();

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    private WorkOrder() { }

    public static WorkOrder Crear(
        string codigoWo,
        Guid tipoOrdenId,
        Guid origenOrdenId,
        Guid creadoPorId,
        Guid clienteFacturacionId,
        Guid clienteServicioId,
        string? numeroOrdenExterna = null,
        string? codigoContratoIbs = null,
        string? estadoExterno = null)
    {
        return new WorkOrder
        {
            Id = Guid.NewGuid(),
            CodigoWo = codigoWo.Trim().ToUpperInvariant(),
            TipoOrdenId = tipoOrdenId,
            OrigenOrdenId = origenOrdenId,
            CreadoPorId = creadoPorId,
            ClienteFacturacionId = clienteFacturacionId,
            ClienteServicioId = clienteServicioId,
            NumeroOrdenExterna = numeroOrdenExterna?.Trim(),
            CodigoContratoIbs = codigoContratoIbs?.Trim(),
            EstadoExterno = estadoExterno?.Trim(),
            EstadoSistema = EstadoSistema.PendienteProgramar,
            EstadoInterno = "PENDIENTE_ASIGNAR",
            CreatedAt = DateTime.UtcNow
        };
    }

    public void ActualizarEstadoExterno(string nuevoEstadoExterno)
    {
        EstadoExterno = nuevoEstadoExterno.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void AsignarCuadrilla(Guid cuadrillaTecnicoId, DateOnly fechaProgramada, string bloqueHorario)
    {
        CuadrillaTecnicoId = cuadrillaTecnicoId;
        FechaProgramada = fechaProgramada;
        BloqueHorario = bloqueHorario.Trim();
        EstadoSistema = EstadoSistema.Programado;
        EstadoInterno = "ASIGNADA";
        UpdatedAt = DateTime.UtcNow;
    }

    public void IniciarVisitaEnCampo()
    {
        EstadoSistema = EstadoSistema.EnProgreso;
        EstadoInterno = "EN_SITIO";
        FechaInicioReal = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void FinalizarEnCampo(string? firmaUrl, string? fotoFachadaUrl, string? fotoInstalacionUrl, string? observaciones)
    {
        EstadoSistema = EstadoSistema.Completado;
        EstadoInterno = "FINALIZADA_CAMPO";
        MotivoCierre = "INSTALACION_EXITOSA";
        FechaCierreReal = DateTime.UtcNow;
        FirmaClienteUrl = firmaUrl;
        FotoFachadaUrl = fotoFachadaUrl;
        FotoInstalacionUrl = fotoInstalacionUrl;
        ObservacionesGenerales = observaciones?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    // Cierre Administrativo de Preactivación (Venta en Siebel sin visita a campo)
    public void CerrarComoPreactivacionAdministrativa(string observaciones)
    {
        EstadoSistema = EstadoSistema.Completado;
        EstadoInterno = "FINALIZADA_PREACTIVADA";
        MotivoCierre = "PREACTIVACION_ADMINISTRATIVA";
        FechaCierreReal = DateTime.UtcNow;
        ObservacionesGenerales = observaciones.Trim();
        CuadrillaTecnicoId = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancelar(string motivo)
    {
        EstadoSistema = EstadoSistema.Cancelado;
        EstadoInterno = "CANCELADA";
        MotivoCierre = motivo.Trim();
        FechaCierreReal = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public WorkOrderTarea AgregarTarea(
        Guid tipoTareaId,
        decimal tarifaBase,
        bool esElegibleBono,
        string? nombreRegla = null,
        Guid? tarifarioReglaId = null,
        string? numeroWoIbs = null,
        string? descripcion = null)
    {
        var tarea = new WorkOrderTarea(
            Id,
            tipoTareaId,
            tarifaBase,
            esElegibleBono,
            _tareas.Count + 1,
            nombreRegla,
            tarifarioReglaId,
            numeroWoIbs,
            descripcion);

        _tareas.Add(tarea);
        return tarea;
    }
}
