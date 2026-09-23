using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;

namespace BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Orden de Trabajo Universal (Field Service Work Order).
/// Representa el expediente y compromiso de servicio técnico de punta a punta.
/// </summary>
public class OrdenTrabajo : Entity<Guid>
{
    public string CodigoWo { get; private set; } = default!; // 'WO-2026-000001'
    
    // Tipo de Orden (Modalidad Operativa: CAMPO, ENCOMIENDA, REMOTO)
    public Guid TipoOrdenId { get; private set; }
    public TipoOrdenTrabajo TipoOrden { get; private set; } = default!;

    public Guid CreadoPorId { get; private set; }

    // Zona Operativa / Territorio de despacho
    public Guid? ZonaOperativaId { get; private set; }
    public ZonaOperativa? ZonaOperativa { get; private set; }

    // Actores Clave: Quién paga y Quién recibe la visita
    public Guid ClienteFacturacionId { get; private set; }
    public Cliente ClienteFacturacion { get; private set; } = default!; // DIRECTV, Claro, Empresa contratante

    public Guid ClienteServicioId { get; private set; }
    public Cliente ClienteServicio { get; private set; } = default!;    // Abonado final en domicilio

    // Identificadores y referencias del requerimiento
    public string? NumeroOrden { get; private set; }         // "1-86131756103"
    public string? ReferenciaExterna { get; private set; }   // Referencia externa (ej. Siebel "1-86131756103", SGA)
    public string? CodigoContrato { get; private set; }      // "40757240"
    public string? NumeroPedido { get; private set; }

    // =========================================================================
    // ESTADOS Y CICLO DE VIDA
    // =========================================================================
    public EstadoOrdenTrabajo Estado { get; private set; }
    public EstadoSistema EstadoSistema { get; private set; }
    public string? EstadoOrigen { get; private set; }        // Texto original: "Asignada", "Finalizada"

    // Auditoría de Cierre / Rechazo / Cancelación
    public Guid? MotivoCierreId { get; private set; }
    public MotivoIncidencia? MotivoCierre { get; private set; }
    public string? ObservacionesCierre { get; private set; }

    // =========================================================================
    // GESTIÓN Y DESCARGA DE MATERIALES DE BODEGA (En la Orden)
    // =========================================================================
    public bool NoConsumioMateriales { get; private set; }
    public bool DescargaMaterialesOmitida { get; private set; }
    public string? MotivoOmisionMateriales { get; private set; }
    public bool DescargaMaterialesObligatoria { get; private set; } = true;
    public bool DescargaMaterialesConfirmada { get; private set; }
    public DateTime? FechaDescargaMateriales { get; private set; }
    public int ContadorOmisionDescarga { get; private set; }

    private readonly List<OrdenTrabajoMaterial> _materiales = new();
    public IReadOnlyCollection<OrdenTrabajoMaterial> Materiales => _materiales.AsReadOnly();

    // =========================================================================
    // VISITAS EN CAMPO (1 a N)
    // =========================================================================
    private readonly List<OrdenTrabajoVisita> _visitas = new();
    public IReadOnlyCollection<OrdenTrabajoVisita> Visitas => _visitas.AsReadOnly();

    public OrdenTrabajoVisita? VisitaActual => _visitas.OrderByDescending(v => v.NumeroVisita).FirstOrDefault();

    // Propiedades delegadas de la Visita Actual (para consulta ágil de lectura)
    public Guid? RecursoTecnicoId => VisitaActual?.RecursoTecnicoId;
    public DateOnly? FechaProgramada => VisitaActual?.FechaProgramada;
    public string? BloqueHorario => VisitaActual?.BloqueHorario;
    public DateTime? FechaInicioReal => VisitaActual?.FechaInicioReal;
    public DateTime? FechaCierreReal => VisitaActual?.FechaFinReal;
    public string? FirmaClienteUrl => VisitaActual?.FirmaClienteUrl;
    public bool EvidenciasConfirmadas => VisitaActual?.EvidenciasConfirmadas ?? false;
    public string? ObservacionesGenerales => VisitaActual?.ObservacionesTecnico;

    // =========================================================================
    // SUBTAREAS
    // =========================================================================
    private readonly List<OrdenTrabajoTarea> _tareas = new();
    public IReadOnlyCollection<OrdenTrabajoTarea> Tareas => _tareas.AsReadOnly();

    // =========================================================================
    // TRABAJOS OPERATIVOS (1 a N)
    // =========================================================================
    private readonly List<Trabajo> _trabajos = new();
    public IReadOnlyCollection<Trabajo> Trabajos => _trabajos.OrderBy(t => t.ItemNumero).ToList().AsReadOnly();

    // =========================================================================
    // LIQUIDACIONES / DESCARGAS FINALES DE MATERIALES (A nivel Orden de Trabajo)
    // =========================================================================
    private readonly List<LiquidacionMaterial> _liquidacionesMaterial = new();
    public IReadOnlyCollection<LiquidacionMaterial> LiquidacionesMaterial => _liquidacionesMaterial.AsReadOnly();

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    private OrdenTrabajo() { }

    public static OrdenTrabajo Crear(
        string codigoWo,
        Guid tipoOrdenId,
        Guid creadoPorId,
        Guid clienteFacturacionId,
        Guid clienteServicioId,
        Guid? zonaOperativaId = null,
        string? numeroOrden = null,
        string? codigoContrato = null,
        string? numeroPedido = null,
        string? estadoOrigen = null,
        bool descargaMaterialesObligatoria = true,
        string? referenciaExterna = null)
    {
        var refExt = referenciaExterna?.Trim() ?? numeroOrden?.Trim();
        var orden = new OrdenTrabajo
        {
            Id = Guid.NewGuid(),
            CodigoWo = codigoWo.Trim().ToUpperInvariant(),
            TipoOrdenId = tipoOrdenId,
            CreadoPorId = creadoPorId,
            ClienteFacturacionId = clienteFacturacionId,
            ClienteServicioId = clienteServicioId,
            ZonaOperativaId = zonaOperativaId,
            NumeroOrden = refExt,
            ReferenciaExterna = refExt,
            CodigoContrato = codigoContrato?.Trim(),
            NumeroPedido = numeroPedido?.Trim(),
            EstadoOrigen = estadoOrigen?.Trim(),
            DescargaMaterialesObligatoria = descargaMaterialesObligatoria,
            Estado = EstadoOrdenTrabajo.Pendiente,
            EstadoSistema = EstadoSistema.PendienteProgramar,
            CreatedAt = DateTime.UtcNow
        };

        return orden;
    }

    public Trabajo AgregarTrabajo(
        string codigoTrabajo,
        Guid servicioId,
        int? itemNumero = null,
        Guid? plantillaTrabajoId = null,
        decimal tarifaBase = 0m,
        string? observaciones = null)
    {
        var numero = itemNumero ?? (_trabajos.Count + 1);
        var trabajo = Trabajo.Crear(Id, codigoTrabajo, servicioId, numero, plantillaTrabajoId, tarifaBase, observaciones);
        _trabajos.Add(trabajo);
        UpdatedAt = DateTime.UtcNow;
        return trabajo;
    }

    public LiquidacionMaterial GenerarLiquidacionMaterial(
        string numeroLiquidacion,
        Guid almacenId,
        Guid responsableId,
        string? observaciones = null)
    {
        var liquidacion = LiquidacionMaterial.Crear(Id, numeroLiquidacion, almacenId, responsableId, observaciones);
        liquidacion.ConsolidarDesdeOrden(this);
        _liquidacionesMaterial.Add(liquidacion);
        UpdatedAt = DateTime.UtcNow;
        return liquidacion;
    }

    public void ConfirmarLiquidacionMateriales(Guid liquidacionId, string? observaciones = null)
    {
        var liq = _liquidacionesMaterial.FirstOrDefault(l => l.Id == liquidacionId)
            ?? throw new InvalidOperationException($"No se encontró la liquidación de materiales con ID {liquidacionId}.");

        liq.Confirmar(observaciones);
        DescargaMaterialesConfirmada = true;
        FechaDescargaMateriales = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AsignarZonaOperativa(Guid zonaOperativaId)
    {
        ZonaOperativaId = zonaOperativaId;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Programa o reprograma una cita de visita con técnico y bloque horario.
    /// </summary>
    public OrdenTrabajoVisita ProgramarVisita(
        string codigoVisita,
        Guid recursoTecnicoId,
        DateOnly fechaProgramada,
        string? bloqueHorario,
        DateTime? inicioAgendado = null,
        DateTime? finAgendado = null,
        string? numeroVisitaOrigen = null,
        string? numeroCita = null)
    {
        if (Estado == EstadoOrdenTrabajo.Finalizada || Estado == EstadoOrdenTrabajo.Liquidada || Estado == EstadoOrdenTrabajo.Cancelada)
            throw new InvalidOperationException($"No se puede programar una visita en una orden con estado '{Estado}'.");

        var nuevaVisita = new OrdenTrabajoVisita(
            Id,
            codigoVisita,
            _visitas.Count + 1,
            recursoTecnicoId,
            fechaProgramada,
            bloqueHorario,
            inicioAgendado,
            finAgendado,
            numeroVisitaOrigen,
            numeroCita);

        _visitas.Add(nuevaVisita);

        Estado = EstadoOrdenTrabajo.Programada;
        EstadoSistema = EstadoSistema.Programado;
        UpdatedAt = DateTime.UtcNow;

        return nuevaVisita;
    }

    public void NotificarVisitaEnCamino(Guid visitaId, DateTime? fechaSalida = null)
    {
        var visita = ObtenerVisita(visitaId);
        visita.MarcarEnCamino(fechaSalida);
        UpdatedAt = DateTime.UtcNow;
    }

    public void NotificarVisitaEnCurso(Guid visitaId, DateTime? fechaLlegada = null)
    {
        var visita = ObtenerVisita(visitaId);
        visita.IniciarAtencion(fechaLlegada);

        Estado = EstadoOrdenTrabajo.EnProgreso;
        EstadoSistema = EstadoSistema.EnProgreso;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RegistrarConsumoMateriales(
        bool noConsumioMateriales,
        bool descargaOmitida,
        string? motivoOmisionMateriales = null)
    {
        NoConsumioMateriales = noConsumioMateriales;
        DescargaMaterialesOmitida = descargaOmitida;
        MotivoOmisionMateriales = motivoOmisionMateriales?.Trim();

        if (descargaOmitida)
        {
            ContadorOmisionDescarga++;
        }

        if (noConsumioMateriales || !DescargaMaterialesObligatoria)
        {
            DescargaMaterialesConfirmada = true;
            FechaDescargaMateriales = DateTime.UtcNow;
        }

        VerificarPromocionAFinalizada();
        UpdatedAt = DateTime.UtcNow;
    }

    public OrdenTrabajoMaterial RegistrarMaterialConsumido(
        Guid productoId,
        decimal cantidad,
        Guid? itemSeriadoId = null,
        string? numeroSerie = null,
        string? numeroSmartCard = null,
        Guid? visitaId = null,
        string? observaciones = null)
    {
        var mat = OrdenTrabajoMaterial.CrearConsumo(
            Id,
            productoId,
            cantidad,
            itemSeriadoId,
            numeroSerie,
            numeroSmartCard,
            visitaId,
            observaciones);

        _materiales.Add(mat);
        DescargaMaterialesConfirmada = true;
        FechaDescargaMateriales = DateTime.UtcNow;
        NoConsumioMateriales = false;
        DescargaMaterialesOmitida = false;
        UpdatedAt = DateTime.UtcNow;

        VerificarPromocionAFinalizada();
        return mat;
    }

    public OrdenTrabajoMaterial RegistrarEquipoRetirado(
        Guid productoId,
        string numeroSerie,
        Guid? itemSeriadoId = null,
        string? numeroSmartCard = null,
        Guid? visitaId = null,
        string? motivo = null)
    {
        var mat = OrdenTrabajoMaterial.CrearRetiro(
            Id,
            productoId,
            numeroSerie,
            itemSeriadoId,
            numeroSmartCard,
            visitaId,
            motivo);

        _materiales.Add(mat);
        UpdatedAt = DateTime.UtcNow;
        return mat;
    }

    public void NotificarVisitaCompletada(
        Guid visitaId,
        string? firmaUrl,
        string? firmadoPor,
        string? nombreFirmante,
        string? dniFirmante,
        string? observaciones,
        DateTime? fechaFinReal = null,
        bool sincronizadoInmediato = true)
    {
        var visita = ObtenerVisita(visitaId);
        visita.CompletarVisita(
            firmaUrl,
            firmadoPor,
            nombreFirmante,
            dniFirmante,
            observaciones,
            fechaFinReal,
            sincronizadoInmediato);

        // Evaluar resultado de las subtareas
        bool hayTareasCompletas = _tareas.Any(t => t.EstadoTarea == EstadoTarea.Completa);
        bool todasTareasRechazadasOCanceladas = _tareas.Count > 0 &&
            _tareas.All(t => t.EstadoTarea == EstadoTarea.Cancelada || t.EstadoTarea == EstadoTarea.Rechazada);

        if (todasTareasRechazadasOCanceladas)
        {
            Estado = EstadoOrdenTrabajo.Rechazada;
            ObservacionesCierre = "Todas las subtareas fueron canceladas o rechazadas en sitio.";
            EstadoSistema = EstadoSistema.Cancelado;
        }
        else if (hayTareasCompletas)
        {
            // Si evidencias y materiales están validados -> Finalizada
            // Si falta alguno -> Completa (esperando regularización)
            if (EvidenciasConfirmadas && DescargaMaterialesConfirmada)
            {
                Estado = EstadoOrdenTrabajo.Finalizada;
                ObservacionesCierre = "Instalación completada y regularizada satisfactoriamente.";
                EstadoSistema = EstadoSistema.Completado;
            }
            else
            {
                Estado = EstadoOrdenTrabajo.Completa;
                ObservacionesCierre = "Visita técnica completada; pendiente confirmación de evidencias o materiales.";
                EstadoSistema = EstadoSistema.EnProgreso;
            }
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void NotificarVisitaCancelada(Guid visitaId, Guid motivoId, string? observaciones = null)
    {
        var visita = ObtenerVisita(visitaId);
        visita.CancelarVisita(motivoId, observaciones);

        // Al cancelarse una visita en sitio, la orden pasa a Rechazada para revisión de coordinación
        Estado = EstadoOrdenTrabajo.Rechazada;
        MotivoCierreId = motivoId;
        ObservacionesCierre = observaciones?.Trim();
        EstadoSistema = EstadoSistema.PendienteProgramar;
        UpdatedAt = DateTime.UtcNow;
    }

    public void NotificarVisitaVencida(Guid visitaId, Guid? motivoVencimientoId = null)
    {
        var visita = ObtenerVisita(visitaId);
        visita.MarcarVencida(motivoVencimientoId);

        Estado = EstadoOrdenTrabajo.Rechazada;
        MotivoCierreId = motivoVencimientoId;
        ObservacionesCierre = "Visita vencida al cierre de jornada sin reporte técnico.";
        EstadoSistema = EstadoSistema.PendienteProgramar;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Almacén confirma la descarga de materiales de la bodega móvil.
    /// Si la orden estaba en 'Completa' y las evidencias están validadas, promueve a 'Finalizada'.
    /// </summary>
    public void ConfirmarDescargaMaterialesAlmacen()
    {
        DescargaMaterialesConfirmada = true;
        FechaDescargaMateriales = DateTime.UtcNow;

        VerificarPromocionAFinalizada();
        UpdatedAt = DateTime.UtcNow;
    }

    public void Liquidar()
    {
        if (Estado != EstadoOrdenTrabajo.Finalizada)
            throw new InvalidOperationException($"Solo se puede liquidar una orden que se encuentre en estado '{EstadoOrdenTrabajo.Finalizada}'.");

        Estado = EstadoOrdenTrabajo.Liquidada;
        EstadoSistema = EstadoSistema.Completado;
        UpdatedAt = DateTime.UtcNow;
    }

    public void CerrarComoPreactivacionAdministrativa(string observaciones)
    {
        Estado = EstadoOrdenTrabajo.Finalizada;
        EstadoSistema = EstadoSistema.Completado;
        ObservacionesCierre = observaciones.Trim();
        DescargaMaterialesConfirmada = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void CancelarOrden(Guid motivoId, string? observaciones = null)
    {
        Estado = EstadoOrdenTrabajo.Cancelada;
        EstadoSistema = EstadoSistema.Cancelado;
        MotivoCierreId = motivoId;
        ObservacionesCierre = observaciones?.Trim();

        // Cancelar visita activa si existe
        if (VisitaActual != null && VisitaActual.Estado != EstadoVisita.Completada && VisitaActual.Estado != EstadoVisita.Cancelada)
        {
            VisitaActual.CancelarVisita(motivoId, observaciones);
        }

        // Cancelar subtareas pendientes
        foreach (var tarea in _tareas.Where(t => t.EstadoTarea == EstadoTarea.Abierta))
        {
            tarea.Cancelar(motivoId, observaciones);
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void ActualizarEstadoOrigen(string nuevoEstadoOrigen)
    {
        EstadoOrigen = nuevoEstadoOrigen.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public OrdenTrabajoTarea AgregarTarea(
        string codigoTarea,
        Guid tipoTareaId,
        decimal tarifaBase,
        bool esElegibleBono,
        string? nombreRegla = null,
        string? numeroWoIbs = null,
        string? descripcion = null)
    {
        var tarea = new OrdenTrabajoTarea(
            Id,
            codigoTarea,
            tipoTareaId,
            tarifaBase,
            esElegibleBono,
            _tareas.Count + 1,
            nombreRegla,
            numeroWoIbs,
            descripcion);

        _tareas.Add(tarea);
        return tarea;
    }

    private void VerificarPromocionAFinalizada()
    {
        if (Estado == EstadoOrdenTrabajo.Completa && EvidenciasConfirmadas && DescargaMaterialesConfirmada)
        {
            Estado = EstadoOrdenTrabajo.Finalizada;
            ObservacionesCierre = "Instalación completada y regularizada satisfactoriamente.";
            EstadoSistema = EstadoSistema.Completado;
        }
    }

    private OrdenTrabajoVisita ObtenerVisita(Guid visitaId)
    {
        var visita = _visitas.FirstOrDefault(v => v.Id == visitaId);
        if (visita == null)
            throw new InvalidOperationException($"No se encontró la visita '{visitaId}' en la orden '{CodigoWo}'.");
        return visita;
    }
}
