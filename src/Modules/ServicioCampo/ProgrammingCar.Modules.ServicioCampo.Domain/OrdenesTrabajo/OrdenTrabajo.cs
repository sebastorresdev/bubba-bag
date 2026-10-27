using ProgrammingCar.SharedKernel;
using ProgrammingCar.Modules.ServicioCampo.Domain.Enums;
using ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Recursos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Clientes;
using ProgrammingCar.Modules.ServicioCampo.Domain.Organizacion;

namespace ProgrammingCar.Modules.ServicioCampo.Domain.OrdenesTrabajo;

/// <summary>
/// Orden de Trabajo Universal (Field Service Work Order).
/// Representa el expediente y compromiso de servicio técnico de punta a punta.
/// </summary>
public class OrdenTrabajo : Entity<Guid>
{
    public string CodigoWo { get; private set; } = default!; // 'WO-2026-000001'
    
    // Tipo de Orden (Modalidad Operativa: CAMPO, ENCOMIENDA, REMOTO)
    public Guid? ListaPreciosId { get; private set; }
    public string Moneda { get; private set; } = "PEN";

    public Guid TipoOrdenId { get; private set; }
    public TipoOrdenTrabajo TipoOrden { get; private set; } = default!;

    public Guid CreadoPorId { get; private set; }

    // Unidad Organizativa / Sede de atención principal
    public Guid? UnidadOrganizativaId { get; private set; }
    public UnidadOrganizativa? UnidadOrganizativa { get; private set; }

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
    public Guid? RecursoId => VisitaActual?.RecursoId;
    public Guid? RecursoTecnicoId => RecursoId;
    public DateOnly? FechaProgramada => VisitaActual?.FechaProgramada;
    public string? BloqueHorario => VisitaActual?.BloqueHorario;
    public DateTime? FechaInicioReal => VisitaActual?.FechaInicioReal;
    public DateTime? FechaCierreReal => VisitaActual?.FechaFinReal;
    public string? FirmaClienteUrl => VisitaActual?.FirmaClienteUrl;
    public bool EvidenciasConfirmadas => VisitaActual?.EvidenciasConfirmadas ?? false;
    public string? ObservacionesGenerales { get; private set; }
    public uint Version { get; private set; }
    public void RegistrarModificacion() => UpdatedAt = DateTime.UtcNow;

    public void ActualizarObservaciones(string? observaciones)
    {
        ValidarEditable();
        if (observaciones?.Length > 2000) throw new InvalidOperationException("Las observaciones no pueden superar 2000 caracteres.");
        ObservacionesGenerales = observaciones?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void CambiarEstadoSistema(EstadoSistema nuevo, Guid? motivoId = null, string? observaciones = null)
    {
        ValidarEditable();
        if (nuevo == EstadoSistema) return;
        if (nuevo == EstadoSistema.Cancelado)
        {
            CancelarOrden(motivoId, observaciones);
            return;
        }
        if (nuevo == EstadoSistema.PendienteProgramar && EstadoSistema == EstadoSistema.Borrador)
        {
            EstadoSistema = nuevo; Estado = EstadoOrdenTrabajo.Pendiente;
        }
        else if (nuevo == EstadoSistema.Programado && EstadoSistema == EstadoSistema.PendienteProgramar)
        {
            if (VisitaActual == null || VisitaActual.Estado != EstadoVisita.Programada)
                throw new InvalidOperationException("Programe una visita con técnico y fecha antes de confirmar la programación.");
            EstadoSistema = nuevo; Estado = EstadoOrdenTrabajo.Programada;
        }
        else if (nuevo == EstadoSistema.EnProgreso && EstadoSistema == EstadoSistema.Programado)
        {
            if (VisitaActual == null) throw new InvalidOperationException("La orden no tiene visita programada.");
            VisitaActual.IniciarAtencion();
            EstadoSistema = nuevo; Estado = EstadoOrdenTrabajo.EnProgreso;
        }
        else if (nuevo == EstadoSistema.Completado && EstadoSistema == EstadoSistema.EnProgreso)
        {
            ValidarCierreTrabajos();
            if (TipoOrden.ExigeEvidenciasFotograficas && !EvidenciasConfirmadas
                || TipoOrden.ExigeFirmaCliente && string.IsNullOrWhiteSpace(FirmaClienteUrl))
                throw new InvalidOperationException("Faltan evidencias o firma del cliente para completar la orden.");
            if (DescargaMaterialesObligatoria && !DescargaMaterialesConfirmada)
                throw new InvalidOperationException("Confirme la liquidación de materiales antes de completar la orden.");
            EstadoSistema = nuevo; Estado = EstadoOrdenTrabajo.Finalizada;
        }
        else throw new InvalidOperationException("La transición de estado solicitada no está permitida.");
        UpdatedAt = DateTime.UtcNow;
    }

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
        string? referenciaExterna = null,
        Guid? listaPreciosId = null,
        string moneda = "PEN",
        Guid? unidadOrganizativaId = null)
    {
        var refExt = referenciaExterna?.Trim() ?? numeroOrden?.Trim();
        var orden = new OrdenTrabajo
        {
            Id = Guid.NewGuid(),
            CodigoWo = codigoWo.Trim().ToUpperInvariant(),
            TipoOrdenId = tipoOrdenId, ListaPreciosId = listaPreciosId, Moneda = moneda,
            CreadoPorId = creadoPorId,
            ClienteFacturacionId = clienteFacturacionId,
            ClienteServicioId = clienteServicioId,
            UnidadOrganizativaId = unidadOrganizativaId,
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

    public decimal TotalPuntos => _trabajos.Sum(t => t.Puntos);

    public Trabajo AgregarTrabajo(
        string codigoTrabajo,
        Guid servicioId,
        int? itemNumero = null,
        Guid? configuracionServicioId = null,
        decimal tarifaBase = 0m,
        string? observaciones = null,
        string? codigoExterno = null,
        string? referenciaEquipo = null,
        string? origenPrecio = null,
        decimal puntos = 1.0m)
    {
        ValidarEditable();
        if (_trabajos.Any(t => t.CodigoTrabajo == codigoTrabajo)) throw new InvalidOperationException("El código del trabajo ya existe.");
        var numero = itemNumero ?? (_trabajos.Select(t => t.ItemNumero).DefaultIfEmpty(0).Max() + 1);
        var trabajo = Trabajo.Crear(Id, codigoTrabajo, servicioId, numero, configuracionServicioId, tarifaBase, observaciones, codigoExterno, referenciaEquipo, origenPrecio, puntos);
        _trabajos.Add(trabajo);
        UpdatedAt = DateTime.UtcNow;
        return trabajo;
    }

    public void ValidarEditable()
    {
        if (Estado is EstadoOrdenTrabajo.Finalizada or EstadoOrdenTrabajo.Cancelada or EstadoOrdenTrabajo.Rechazada or EstadoOrdenTrabajo.Liquidada)
            throw new InvalidOperationException("La orden está cerrada y no admite cambios.");
    }

    public void ValidarCierreTrabajos()
    {
        if (_trabajos.Count == 0 || _trabajos.Any(t => t.Estado is EstadoTrabajo.Pendiente or EstadoTrabajo.EnProgreso))
            throw new InvalidOperationException("Complete, cancele o rechace cada trabajo antes de cerrar la orden.");
        if (!_trabajos.Any(t => t.Estado == EstadoTrabajo.Completado))
            throw new InvalidOperationException("La orden no tiene trabajos completados. Revise su cancelación o rechazo.");
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
        VerificarPromocionAFinalizada();
        UpdatedAt = DateTime.UtcNow;
    }

    public void AsignarUnidadOrganizativa(Guid? unidadOrganizativaId)
    {
        ValidarEditable();
        UnidadOrganizativaId = unidadOrganizativaId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AsignarZonaOperativa(Guid? zonaOperativaId)
    {
        ValidarEditable();
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
        bool hayTareasCompletas = _trabajos.Count > 0
            ? _trabajos.Any(t => t.Estado == EstadoTrabajo.Completado) && _trabajos.All(t => t.Estado is EstadoTrabajo.Completado or EstadoTrabajo.Cancelado or EstadoTrabajo.Rechazado)
            : _tareas.Count > 0 && _tareas.All(t => t.EstadoTarea is EstadoTarea.Completa or EstadoTarea.Cancelada or EstadoTarea.Rechazada);
        bool todasTareasRechazadasOCanceladas = _trabajos.Count > 0
            ? _trabajos.All(t => t.Estado is EstadoTrabajo.Cancelado or EstadoTrabajo.Rechazado)
            : _tareas.Count > 0 && _tareas.All(t => t.EstadoTarea is EstadoTarea.Cancelada or EstadoTarea.Rechazada);

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

    public void CancelarOrden(Guid? motivoId, string? observaciones = null)
    {
        ValidarEditable();
        Estado = EstadoOrdenTrabajo.Cancelada;
        EstadoSistema = EstadoSistema.Cancelado;
        MotivoCierreId = motivoId;
        ObservacionesCierre = observaciones?.Trim();

        // Cancelar visita activa si existe
        if (VisitaActual != null && VisitaActual.Estado != EstadoVisita.Completada && VisitaActual.Estado != EstadoVisita.Cancelada)
        {
            VisitaActual.CancelarVisita(motivoId, observaciones);
        }

        // Cancelar trabajos pendientes o en progreso
        foreach (var trabajo in _trabajos.Where(t => t.Estado is EstadoTrabajo.Pendiente or EstadoTrabajo.EnProgreso))
        {
            trabajo.Cancelar(observaciones);
        }

        // Cancelar subtareas pendientes
        foreach (var tarea in _tareas.Where(t => t.EstadoTarea is EstadoTarea.Abierta or EstadoTarea.EnProgreso))
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

    /// <summary>
    /// Sincroniza el ciclo de vida de la Orden de Trabajo según el estado de sus trabajos operativos:
    /// - Si todos los trabajos quedan Cancelados: la orden pasa automáticamente a Cancelada.
    /// - Si todos los trabajos quedan Rechazados (o combinación de Rechazados y Cancelados sin ningún completado): la orden pasa a Rechazada.
    /// </summary>
    public void SincronizarEstadoDesdeTrabajos(string? motivo = null)
    {
        if (_trabajos.Count == 0) return;

        bool tieneActivos = _trabajos.Any(t => t.Estado is EstadoTrabajo.Pendiente or EstadoTrabajo.EnProgreso);
        if (tieneActivos) return;

        bool tieneCompletados = _trabajos.Any(t => t.Estado == EstadoTrabajo.Completado);
        if (tieneCompletados) return;

        bool todosCancelados = _trabajos.All(t => t.Estado == EstadoTrabajo.Cancelado);
        bool todosRechazadosOCancelados = _trabajos.All(t => t.Estado is EstadoTrabajo.Cancelado or EstadoTrabajo.Rechazado);

        if (todosCancelados)
        {
            Estado = EstadoOrdenTrabajo.Cancelada;
            EstadoSistema = EstadoSistema.Cancelado;
            ObservacionesCierre = motivo?.Trim() ?? "Todos los trabajos de la orden fueron cancelados.";
            if (VisitaActual != null && VisitaActual.Estado != EstadoVisita.Completada && VisitaActual.Estado != EstadoVisita.Cancelada)
            {
                VisitaActual.CancelarVisita(null, ObservacionesCierre);
            }
            UpdatedAt = DateTime.UtcNow;
        }
        else if (todosRechazadosOCancelados)
        {
            Estado = EstadoOrdenTrabajo.Rechazada;
            EstadoSistema = EstadoSistema.Cancelado;
            ObservacionesCierre = motivo?.Trim() ?? "Todos los trabajos de la orden fueron rechazados.";
            if (VisitaActual != null && VisitaActual.Estado != EstadoVisita.Completada && VisitaActual.Estado != EstadoVisita.Cancelada)
            {
                VisitaActual.CancelarVisita(null, ObservacionesCierre);
            }
            UpdatedAt = DateTime.UtcNow;
        }
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

    public void VerificarPromocionAFinalizada()
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
