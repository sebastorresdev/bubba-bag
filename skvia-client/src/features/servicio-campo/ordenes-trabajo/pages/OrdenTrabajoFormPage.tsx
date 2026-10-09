import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Text,
  TabList,
  Tab,
  Combobox,
  Option,
  Textarea,
  Toast,
  Toaster,
  ToastTitle,
  useId,
  useToastController,
  Spinner,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  DismissCircle16Regular,
  CheckmarkCircle16Regular,
  ClipboardTask24Regular,
  CalendarClock16Regular,
  Delete16Regular,
  Play16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { WorkOrderEtapas } from '../components/WorkOrderEtapas';
import { OrdenTrabajoService } from '../services/ordenTrabajo.service';
import { ClienteService } from '../../../crm/clientes/services/cliente.service';
import type { ClienteListadoItemDto } from '../../../crm/clientes/types/cliente.types';
import type {
  OrdenTrabajoDetalleDto,
  CrearOrdenTrabajoDto,
  ActualizarOrdenTrabajoDto,
  EstadoSistema,
  TipoOrdenTrabajoOpcion,
} from '../types/ordenTrabajo.types';

export const OrdenTrabajoFormPage: React.FC = () => {
  const formStyles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const esNuevo = !id || id === 'nuevo';

  const toasterId = useId('wo-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(!esNuevo);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'resumen' | 'cliente' | 'programacion' | 'materiales'>('resumen');

  // Catálogos
  const [tiposOrden, setTiposOrden] = useState<TipoOrdenTrabajoOpcion[]>([]);
  const [clientesFacturacion, setClientesFacturacion] = useState<ClienteListadoItemDto[]>([]);
  const [clientesServicio, setClientesServicio] = useState<ClienteListadoItemDto[]>([]);

  // Campos de la Orden
  const [orden, setOrden] = useState<OrdenTrabajoDetalleDto | null>(null);
  const [codigoWo, setCodigoWo] = useState('');
  const [tipoOrdenId, setTipoOrdenId] = useState('');
  const [clienteFacturacionId, setClienteFacturacionId] = useState('');
  const [clienteServicioId, setClienteServicioId] = useState('');
  const [zonaOperativaNombre, setZonaOperativaNombre] = useState('Lima Metropolitana');
  const [numeroOrden, setNumeroOrden] = useState('');
  const [referenciaExterna, setReferenciaExterna] = useState('');
  const [codigoContrato, setCodigoContrato] = useState('');
  const [numeroPedido, setNumeroPedido] = useState('');
  const [estadoSistema, setEstadoSistema] = useState<EstadoSistema>('Borrador');
  const [estadoOperativo, setEstadoOperativo] = useState('Pendiente');
  const [observaciones, setObservaciones] = useState('');

  // Programación y Despacho
  const [recursoTecnicoId, setRecursoTecnicoId] = useState('');
  const [recursoTecnicoNombre, setRecursoTecnicoNombre] = useState('');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [bloqueHorario, setBloqueHorario] = useState('09:00 - 13:00');

  const notifySuccess = useCallback((title: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  // Cargar Catálogos Iniciales
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [tipos, clientesFact, clientesServ] = await Promise.all([
          OrdenTrabajoService.obtenerTiposOrden(),
          ClienteService.obtenerClientes({ soloFacturacion: true }),
          ClienteService.obtenerClientes({ soloServicio: true }),
        ]);

        setTiposOrden(tipos);
        setClientesFacturacion(clientesFact);
        setClientesServicio(clientesServ);

        if (esNuevo && tipos.length > 0) {
          setTipoOrdenId(tipos[0].id);
        }
        if (esNuevo && clientesFact.length > 0) {
          setClienteFacturacionId(clientesFact[0].id);
        }
        if (esNuevo && clientesServ.length > 0) {
          setClienteServicioId(clientesServ[0].id);
        }
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    };

    void cargarCatalogos();
  }, [esNuevo]);

  // Cargar Orden Existente
  useEffect(() => {
    if (esNuevo) return;

    const cargarOrden = async () => {
      try {
        setLoading(true);
        const data = await OrdenTrabajoService.obtenerOrdenPorId(id);
        setOrden(data);
        setCodigoWo(data.codigoWo);
        setTipoOrdenId(data.tipoOrdenId);
        setClienteFacturacionId(data.clienteFacturacionId);
        setClienteServicioId(data.clienteServicioId);
        setZonaOperativaNombre(data.zonaOperativaNombre || 'Lima Metropolitana');
        setNumeroOrden(data.numeroOrden || '');
        setReferenciaExterna(data.referenciaExterna || '');
        setCodigoContrato(data.codigoContrato || '');
        setNumeroPedido(data.numeroPedido || '');
        setEstadoSistema((data.estadoSistema as EstadoSistema) || 'Borrador');
        setEstadoOperativo(data.estado || 'Pendiente');
        setObservaciones(data.observacionesGenerales || '');
        setRecursoTecnicoId(data.recursoTecnicoId || '');
        setRecursoTecnicoNombre(data.recursoTecnicoNombre || '');
        setFechaProgramada(data.fechaProgramada || '');
        setBloqueHorario(data.bloqueHorario || '09:00 - 13:00');
      } catch (e) {
        console.error(e);
        setMensaje({ tipo: 'error', texto: 'No se pudo cargar la orden de trabajo.' });
      } finally {
        setLoading(false);
      }
    };

    void cargarOrden();
  }, [id, esNuevo]);

  // Cliente de servicio seleccionado (para datos de dirección)
  const clienteServicioSeleccionado = useMemo(() => {
    return clientesServicio.find((c) => c.id === clienteServicioId);
  }, [clientesServicio, clienteServicioId]);

  const handleGuardar = async (cerrar = false) => {
    if (!tipoOrdenId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione un tipo de orden de trabajo.' });
      return;
    }
    if (!clienteFacturacionId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione un cliente de facturación.' });
      return;
    }
    if (!clienteServicioId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione el cliente abonado para la atención.' });
      return;
    }

    try {
      setSubmitting(true);
      setMensaje(null);

      if (esNuevo) {
        const dto: CrearOrdenTrabajoDto = {
          tipoOrdenId,
          clienteFacturacionId,
          clienteServicioId,
          numeroOrden: numeroOrden.trim() || undefined,
          referenciaExterna: referenciaExterna.trim() || undefined,
          codigoContrato: codigoContrato.trim() || undefined,
          numeroPedido: numeroPedido.trim() || undefined,
          recursoTecnicoId: recursoTecnicoId || undefined,
          fechaProgramada: fechaProgramada || undefined,
          bloqueHorario: bloqueHorario || undefined,
          observaciones: observaciones.trim() || undefined,
        };

        const res = await OrdenTrabajoService.crearOrden(dto);
        notifySuccess('Orden de Trabajo registrada exitosamente.');
        if (cerrar) {
          navigate('/servicio-campo/ordenes');
        } else {
          navigate(`/servicio-campo/ordenes/${res.id}`, { replace: true });
        }
      } else {
        const dto: ActualizarOrdenTrabajoDto = {
          recursoTecnicoId: recursoTecnicoId || undefined,
          fechaProgramada: fechaProgramada || undefined,
          bloqueHorario: bloqueHorario || undefined,
          observaciones: observaciones.trim() || undefined,
        };

        await OrdenTrabajoService.actualizarOrden(id, dto);
        notifySuccess('Orden de Trabajo actualizada con éxito.');
        if (cerrar) {
          navigate('/servicio-campo/ordenes');
        }
      }
    } catch (e) {
      console.error(e);
      setMensaje({ tipo: 'error', texto: 'Error al guardar la orden de trabajo.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: EstadoSistema) => {
    if (!id || esNuevo) return;
    try {
      setSubmitting(true);
      await OrdenTrabajoService.cambiarEstadoSistema(id, {
        nuevoEstadoSistema: nuevoEstado,
        recursoTecnicoId: recursoTecnicoId || undefined,
        fechaProgramada: fechaProgramada || undefined,
        bloqueHorario: bloqueHorario || undefined,
      });
      setEstadoSistema(nuevoEstado);
      notifySuccess(`Estado cambiado a: ${nuevoEstado}`);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al cambiar de estado.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async () => {
    if (!id || esNuevo) return;
    if (!window.confirm('¿Está seguro de eliminar esta orden de trabajo?')) return;
    try {
      setSubmitting(true);
      await OrdenTrabajoService.eliminarOrden(id);
      notifySuccess('Orden eliminada exitosamente.');
      navigate('/servicio-campo/ordenes');
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al eliminar la orden.' });
      setSubmitting(false);
    }
  };

  const tituloEncabezado = esNuevo ? 'Nueva Orden de Trabajo' : (codigoWo || 'Orden de Trabajo');
  const subtituloEncabezado = esNuevo
    ? 'Registro de servicio en campo'
    : `${orden?.tipoOrdenNombre || 'Servicio'} — ${orden?.clienteServicioNombre || ''}`;

  return (
    <div className={formStyles.root}>
      <Toaster toasterId={toasterId} />

      {/* 1. BARRA DE COMANDOS D365 */}
      <D365CommandBar ariaLabel="Comandos de Orden de Trabajo" busy={submitting || loading}>
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Volver"
            title="Volver a la lista"
            onClick={() => navigate('/servicio-campo/ordenes')}
          />
          <D365CommandDivider />

          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            onClick={() => void handleGuardar(false)}
            disabled={submitting}
          >
            Guardar
          </D365CommandButton>

          <D365CommandButton
            icon={<SaveMultiple16Regular />}
            tone="save"
            onClick={() => void handleGuardar(true)}
            disabled={submitting}
          >
            Guardar y cerrar
          </D365CommandButton>

          {!esNuevo && (
            <>
              <D365CommandDivider />

              {/* Acciones de Flujo de Estados Dynamics 365 */}
              {estadoSistema === 'Borrador' && (
                <D365CommandButton
                  icon={<CalendarClock16Regular />}
                  tone="brand"
                  onClick={() => void handleCambiarEstado('PendienteProgramar')}
                  disabled={submitting}
                >
                  Liberar para Programar
                </D365CommandButton>
              )}

              {estadoSistema === 'PendienteProgramar' && (
                <D365CommandButton
                  icon={<CalendarClock16Regular />}
                  tone="brand"
                  onClick={() => {
                    if (!fechaProgramada) {
                      setFechaProgramada(new Date().toISOString().slice(0, 10));
                    }
                    void handleCambiarEstado('Programado');
                  }}
                  disabled={submitting}
                >
                  Confirmar y Programar Cita
                </D365CommandButton>
              )}

              {estadoSistema === 'Programado' && (
                <D365CommandButton
                  icon={<Play16Regular />}
                  tone="brand"
                  onClick={() => void handleCambiarEstado('EnProgreso')}
                  disabled={submitting}
                >
                  Iniciar Atención en Campo
                </D365CommandButton>
              )}

              {estadoSistema === 'EnProgreso' && (
                <D365CommandButton
                  icon={<CheckmarkCircle16Regular />}
                  tone="create"
                  onClick={() => void handleCambiarEstado('Completado')}
                  disabled={submitting}
                >
                  Completar Orden
                </D365CommandButton>
              )}

              {estadoSistema !== 'Cancelado' && estadoSistema !== 'Completado' && (
                <D365CommandButton
                  icon={<DismissCircle16Regular />}
                  tone="danger"
                  onClick={() => void handleCambiarEstado('Cancelado')}
                  disabled={submitting}
                >
                  Cancelar Orden
                </D365CommandButton>
              )}

              {(estadoSistema === 'Borrador' || estadoSistema === 'Cancelado') && (
                <D365CommandButton
                  icon={<Delete16Regular />}
                  tone="danger"
                  onClick={() => void handleEliminar()}
                  disabled={submitting}
                >
                  Eliminar
                </D365CommandButton>
              )}

              <D365CommandDivider />
              <D365CommandButton
                icon={<Add16Regular />}
                tone="create"
                onClick={() => navigate('/servicio-campo/ordenes/nuevo')}
              >
                Nueva
              </D365CommandButton>
            </>
          )}
        </div>
      </D365CommandBar>

      {/* 2. ENTITY HEADER CON PROCESS FLOW EDGE-TO-EDGE Y TABS (SIN ICONOS NI NÚMEROS) */}
      <D365EntityHeader
        title={tituloEncabezado}
        subtitle={subtituloEncabezado}
        avatarIcon={<ClipboardTask24Regular />}
        metadata={[
          { label: 'System Status', value: estadoSistema },
          { label: 'Estado Operativo', value: estadoOperativo },
          { label: 'Técnico', value: recursoTecnicoNombre || 'Sin Asignar' },
          { label: 'Fecha Cita', value: fechaProgramada || 'Sin Programar' },
        ]}
        processFlow={
          <WorkOrderEtapas
            estadoSistema={estadoSistema}
            embedded
          />
        }
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) =>
              setSelectedTab(
                data.value as 'resumen' | 'cliente' | 'programacion' | 'materiales'
              )
            }
          >
            <Tab value="resumen">Resumen</Tab>
            <Tab value="cliente">Servicio y Cliente</Tab>
            <Tab value="programacion">Programación y Despacho</Tab>
            <Tab value="materiales">Materiales y Tareas</Tab>
          </TabList>
        }
      />

      {/* 3. ALERT FEEDBACK */}
      {mensaje && (
        <div style={{ padding: '0 24px', marginTop: '12px' }}>
          <D365MessageBar intent={mensaje.tipo} onDismiss={() => setMensaje(null)}>
            {mensaje.texto}
          </D365MessageBar>
        </div>
      )}

      {/* 4. CONTENIDO DE PESTAÑAS */}
      <div className={formStyles.contentBody}>
        {loading ? (
          <div style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}>
            <Spinner label="Cargando orden de trabajo..." />
          </div>
        ) : (
          <>
            {/* ============================================================= */}
            {/* TAB 1: RESUMEN                                                */}
            {/* ============================================================= */}
            {selectedTab === 'resumen' && (
              <div className={formStyles.grid2Cols}>
                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Identificación del Requerimiento</div>

                  <D365FormField label="Código WO" htmlFor="wo-codigo">
                    <Input
                      id="wo-codigo"
                      className={formStyles.d365ControlFull}
                      value={codigoWo || 'Se generará automáticamente al guardar'}
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>

                  <D365FormField label="Tipo de Orden de Trabajo" htmlFor="wo-tipo" required>
                    <Combobox
                      id="wo-tipo"
                      className={formStyles.d365ControlFull}
                      value={tiposOrden.find((t) => t.id === tipoOrdenId)?.nombre || ''}
                      selectedOptions={tipoOrdenId ? [tipoOrdenId] : []}
                      onOptionSelect={(_, data) => {
                        if (data.optionValue) setTipoOrdenId(data.optionValue);
                      }}
                    >
                      {tiposOrden.map((t) => (
                        <Option key={t.id} value={t.id} text={t.nombre}>
                          {t.nombre}
                        </Option>
                      ))}
                    </Combobox>
                  </D365FormField>

                  <D365FormField label="Cliente de Facturación" htmlFor="wo-cliente-fact" required>
                    <Combobox
                      id="wo-cliente-fact"
                      className={formStyles.d365ControlFull}
                      value={
                        clientesFacturacion.find((c) => c.id === clienteFacturacionId)
                          ?.nombreCompletoODenominacion || ''
                      }
                      selectedOptions={clienteFacturacionId ? [clienteFacturacionId] : []}
                      onOptionSelect={(_, data) => {
                        if (data.optionValue) setClienteFacturacionId(data.optionValue);
                      }}
                    >
                      {clientesFacturacion.map((c) => (
                        <Option key={c.id} value={c.id} text={c.nombreCompletoODenominacion}>
                          {c.nombreCompletoODenominacion}
                        </Option>
                      ))}
                    </Combobox>
                  </D365FormField>

                  <D365FormField label="Zona Operativa / Territorio" htmlFor="wo-zona">
                    <Input
                      id="wo-zona"
                      className={formStyles.d365ControlFull}
                      value={zonaOperativaNombre}
                      onChange={(e) => setZonaOperativaNombre(e.target.value)}
                    />
                  </D365FormField>
                </div>

                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Referencias y Contrato</div>

                  <D365FormField label="N° Orden Externa (Siebel / SGA)" htmlFor="wo-num-orden">
                    <Input
                      id="wo-num-orden"
                      className={formStyles.d365ControlFull}
                      value={numeroOrden}
                      onChange={(e) => setNumeroOrden(e.target.value)}
                      placeholder="Ej. 1-86131756103"
                    />
                  </D365FormField>

                  <D365FormField label="Código de Contrato / Abonado" htmlFor="wo-contrato">
                    <Input
                      id="wo-contrato"
                      className={formStyles.d365ControlFull}
                      value={codigoContrato}
                      onChange={(e) => setCodigoContrato(e.target.value)}
                      placeholder="Ej. 40757240"
                    />
                  </D365FormField>

                  <D365FormField label="N° Pedido Comercial" htmlFor="wo-pedido">
                    <Input
                      id="wo-pedido"
                      className={formStyles.d365ControlFull}
                      value={numeroPedido}
                      onChange={(e) => setNumeroPedido(e.target.value)}
                      placeholder="Ej. PED-2026-0044"
                    />
                  </D365FormField>

                  <D365FormField label="Instrucciones Técnicas / Observaciones" htmlFor="wo-obs">
                    <Textarea
                      id="wo-obs"
                      className={formStyles.d365ControlFull}
                      rows={3}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Notas para el técnico de despacho..."
                    />
                  </D365FormField>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 2: SERVICIO Y CLIENTE                                     */}
            {/* ============================================================= */}
            {selectedTab === 'cliente' && (
              <div className={formStyles.grid2Cols}>
                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Abonado Receptor del Servicio</div>

                  <D365FormField label="Cliente Receptor (Abonado)" htmlFor="wo-cliente-serv" required>
                    <Combobox
                      id="wo-cliente-serv"
                      className={formStyles.d365ControlFull}
                      value={
                        clientesServicio.find((c) => c.id === clienteServicioId)
                          ?.nombreCompletoODenominacion || ''
                      }
                      selectedOptions={clienteServicioId ? [clienteServicioId] : []}
                      onOptionSelect={(_, data) => {
                        if (data.optionValue) setClienteServicioId(data.optionValue);
                      }}
                    >
                      {clientesServicio.map((c) => (
                        <Option key={c.id} value={c.id} text={c.nombreCompletoODenominacion}>
                          {c.nombreCompletoODenominacion} ({c.documentoIdentidad})
                        </Option>
                      ))}
                    </Combobox>
                  </D365FormField>

                  {clienteServicioSeleccionado && (
                    <>
                      <D365FormField label="Documento de Identidad">
                        <Input
                          className={formStyles.d365ControlFull}
                          value={`${clienteServicioSeleccionado.tipoPersona}: ${clienteServicioSeleccionado.documentoIdentidad}`}
                          readOnly
                          appearance="filled-darker"
                        />
                      </D365FormField>

                      <D365FormField label="Teléfono de Contacto">
                        <Input
                          className={formStyles.d365ControlFull}
                          value={clienteServicioSeleccionado.telefonoPrincipal}
                          readOnly
                          appearance="filled-darker"
                        />
                      </D365FormField>
                    </>
                  )}
                </div>

                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Ubicación y Dirección de Atención</div>

                  <D365FormField label="Dirección de la Visita">
                    <Input
                      className={formStyles.d365ControlFull}
                      value={orden?.direccionServicio || clienteServicioSeleccionado?.direccion || 'Sin dirección registrada'}
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>

                  <D365FormField label="Referencia de Acceso">
                    <Input
                      className={formStyles.d365ControlFull}
                      value={orden?.referenciaUbicacion || 'A espaldas de la avenida principal'}
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>

                  <D365FormField label="Ubigeo / Distrito">
                    <Input
                      className={formStyles.d365ControlFull}
                      value={orden?.ubigeoTexto || clienteServicioSeleccionado?.distrito || '150101'}
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 3: PROGRAMACIÓN Y DESPACHO                                */}
            {/* ============================================================= */}
            {selectedTab === 'programacion' && (
              <div className={formStyles.grid2Cols}>
                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Asignación de Visita y Técnico</div>

                  <D365FormField label="Técnico de Campo (Recurso)" htmlFor="wo-recurso">
                    <Input
                      id="wo-recurso"
                      className={formStyles.d365ControlFull}
                      value={recursoTecnicoNombre}
                      onChange={(e) => setRecursoTecnicoNombre(e.target.value)}
                      placeholder="Nombre del técnico responsable..."
                    />
                  </D365FormField>

                  <D365FormField label="Fecha Programada de Atención" htmlFor="wo-fecha-prog">
                    <Input
                      id="wo-fecha-prog"
                      type="date"
                      className={formStyles.d365ControlFull}
                      value={fechaProgramada}
                      onChange={(e) => setFechaProgramada(e.target.value)}
                    />
                  </D365FormField>

                  <D365FormField label="Ventana / Bloque Horario" htmlFor="wo-bloque">
                    <Combobox
                      id="wo-bloque"
                      className={formStyles.d365ControlFull}
                      value={bloqueHorario}
                      selectedOptions={[bloqueHorario]}
                      onOptionSelect={(_, d) => {
                        if (d.optionValue) setBloqueHorario(d.optionValue);
                      }}
                    >
                      <Option value="08:00 - 12:00">08:00 - 12:00 (Mañana)</Option>
                      <Option value="13:00 - 17:00">13:00 - 17:00 (Tarde)</Option>
                      <Option value="17:00 - 20:00">17:00 - 20:00 (Vespertino)</Option>
                      <Option value="JORNADA_COMPLETA">Jornada Completa</Option>
                    </Combobox>
                  </D365FormField>
                </div>

                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Historial de Visitas en Campo</div>
                  {orden?.visitas && orden.visitas.length > 0 ? (
                    <Table size="small">
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Cita</TableHeaderCell>
                          <TableHeaderCell>Técnico</TableHeaderCell>
                          <TableHeaderCell>Fecha</TableHeaderCell>
                          <TableHeaderCell>Estado</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orden.visitas.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell>{v.codigoVisita}</TableCell>
                            <TableCell>{v.recursoNombre}</TableCell>
                            <TableCell>{v.fechaProgramada}</TableCell>
                            <TableCell>
                              <Badge appearance="tint" shape="rounded" color="brand">
                                {v.estado}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Text style={{ color: tokens.colorNeutralForeground4, fontSize: '13px' }}>
                      No se han agendado visitas técnicas aún para esta orden.
                    </Text>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: MATERIALES Y TAREAS                                     */}
            {/* ============================================================= */}
            {selectedTab === 'materiales' && (
              <div className={formStyles.grid2Cols}>
                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Materiales y Equipos Utilizados</div>
                  {orden?.materiales && orden.materiales.length > 0 ? (
                    <Table size="small">
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Producto / Equipo</TableHeaderCell>
                          <TableHeaderCell>Cant.</TableHeaderCell>
                          <TableHeaderCell>N° Serie</TableHeaderCell>
                          <TableHeaderCell>Acción</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orden.materiales.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>{m.nombreProducto}</TableCell>
                            <TableCell>{m.cantidad}</TableCell>
                            <TableCell>{m.numeroSerie || '-'}</TableCell>
                            <TableCell>
                              <Badge appearance="tint" shape="rounded" color={m.tipoAccion === 'Retiro' ? 'danger' : 'informative'}>
                                {m.tipoAccion}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Text style={{ color: tokens.colorNeutralForeground4, fontSize: '13px' }}>
                      Sin materiales asignados o descargados en esta orden de trabajo.
                    </Text>
                  )}
                </div>

                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Subtareas de Servicio</div>
                  {orden?.tareas && orden.tareas.length > 0 ? (
                    <Table size="small">
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Tarea</TableHeaderCell>
                          <TableHeaderCell>Estado</TableHeaderCell>
                          <TableHeaderCell>Detalle</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orden.tareas.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>{t.nombreTarea}</TableCell>
                            <TableCell>
                              <Badge appearance="tint" shape="rounded" color={t.estadoTarea === 'Completa' ? 'success' : 'warning'}>
                                {t.estadoTarea}
                              </Badge>
                            </TableCell>
                            <TableCell>{t.observaciones || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Text style={{ color: tokens.colorNeutralForeground4, fontSize: '13px' }}>
                      Sin subtareas configuradas para esta orden.
                    </Text>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
