import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Input,
  Select,
  Tab,
  TabList,
  Textarea,
  Skeleton,
  SkeletonItem,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  tokens,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Checkmark16Regular,
  Dismiss16Regular,
  Add16Regular,
  LockClosed16Regular,
  CheckmarkCircle24Filled,
  Send16Regular,
  ArrowReset20Regular,
  Box16Regular,
  Delete16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { SelectorEntidadRelacionada, type OpcionEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { AlmacenService } from '../../almacenes/services/almacen.service';
import type { AlmacenDto } from '../../almacenes/types/almacen.types';
import { ProductoService } from '../../productos/services/producto.service';
import type { ProductoDto } from '../../productos/types/producto.types';
import { AjusteEtapas } from '../components/AjusteEtapas';
import { LineasAjusteGrid, type LineaAjusteForm } from '../components/LineasAjusteGrid';
import { AjusteService } from '../services/ajuste.service';
import {
  MOTIVOS_AJUSTE,
  type AjusteInventarioDto,
  type EstadoAjuste,
  type GuardarAjusteInput,
  type TipoAjuste,
} from '../types/ajuste.types';

const formatoMoneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export function AjusteFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formStyles = useD365FormStyles();
  const currentUser = useCurrentUser();

  const [ajuste, setAjuste] = useState<AjusteInventarioDto | null>(null);
  const [cargando, setCargando] = useState(Boolean(id));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tab, setTab] = useState('general');

  // Catálogos
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [productosCache, setProductosCache] = useState<ProductoDto[]>([]);

  // Estados del formulario
  const [tipo, setTipo] = useState<TipoAjuste>('Entrada');
  const [almacenId, setAlmacenId] = useState('');
  const [busquedaAlmacen, setBusquedaAlmacen] = useState('');
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [motivo, setMotivo] = useState<string>(MOTIVOS_AJUSTE[0]);
  const [documentoReferencia, setDocumentoReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [lineas, setLineas] = useState<LineaAjusteForm[]>([]);

  // Opciones para SelectorEntidadRelacionada (TagPicker)
  const opcionesAlmacen: OpcionEntidadRelacionada[] = useMemo(
    () =>
      almacenes.map(a => ({
        id: a.id,
        nombre: a.nombre,
        detalle: a.codigo ? `Código: ${a.codigo}` : String(a.tipo ?? ''),
      })),
    [almacenes]
  );

  const almacenSeleccionado = useMemo(
    () => opcionesAlmacen.find(a => a.id === almacenId) || null,
    [opcionesAlmacen, almacenId]
  );

  // Diálogo de confirmación para aplicar, rechazar o anular
  const [dialogAplicarOpen, setDialogAplicarOpen] = useState(false);
  const [dialogRechazarOpen, setDialogRechazarOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [dialogAnularOpen, setDialogAnularOpen] = useState(false);
  const [dialogEliminarOpen, setDialogEliminarOpen] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [dialogExitoOpen, setDialogExitoOpen] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // Roles y permisos
  const esSuperAdmin =
    currentUser.roles.some(r => ['SuperAdmin', 'ServicioCampoAdmin', 'InventarioAdmin'].includes(r)) ||
    currentUser.rol === 'SuperAdmin';
  const esSupervisorAlmacen =
    esSuperAdmin ||
    currentUser.roles.some(r => ['Supervisor', 'SupervisorAlmacen'].includes(r)) ||
    currentUser.rol === 'Supervisor' ||
    Boolean(almacenes.find(a => a.id === almacenId)?.esSupervisor);

  const estado: EstadoAjuste = ajuste?.estado || 'Borrador';
  const esSoloLectura =
    estado === 'Aplicado' ||
    estado === 'Anulado' ||
    (estado === 'EnRevision' && !esSupervisorAlmacen);

  // Carga de catálogos y datos existentes
  useEffect(() => {
    let activo = true;
    void AlmacenService.getAlmacenes(true).then(alms => {
      if (activo) {
        setAlmacenes(alms);
        if (!almacenId && alms.length > 0) {
          setAlmacenId(alms[0].id);
        }
      }
    });
    void ProductoService.getProductos(undefined, undefined, true).then(prods => {
      if (activo && Array.isArray(prods)) {
        setProductosCache(prods.filter(p => p.tipo === 'Inventario'));
      }
    });
    return () => {
      activo = false;
    };
  }, []);

  const cargarAjuste = useCallback(async () => {
    if (!id) return;
    try {
      setCargando(true);
      setError(null);
      const data = await AjusteService.obtenerAjustePorId(id);
      if (!data) {
        setError('El ajuste de inventario no existe o fue eliminado.');
        return;
      }
      setAjuste(data);
      setTipo(data.tipo);
      setAlmacenId(data.almacenId);
      setFecha(new Date(data.fecha + 'T00:00:00'));
      setMotivo(data.motivo);
      setDocumentoReferencia(data.documentoReferencia || '');
      setObservaciones(data.observaciones || '');

      setLineas(
        data.lineas.map(l => ({
          clave: crypto.randomUUID(),
          id: l.id,
          productoId: l.productoId,
          codigoProducto: l.codigoProducto,
          nombreProducto: l.nombreProducto,
          unidad: l.unidad,
          tipo: l.tipo,
          cantidad: String(l.cantidad),
          costo: String(l.costoUnitario),
          series: l.series.join('\n'),
          motivoLinea: l.motivoLinea || '',
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el ajuste.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      void cargarAjuste();
    }
  }, [id, cargarAjuste]);

  const alCargarProducto = (p: ProductoDto) => {
    setProductosCache(prev => {
      if (prev.some(x => x.id === p.id)) return prev;
      return [...prev, p];
    });
  };

  const validar = (): string | null => {
    if (!almacenId) return 'Debe seleccionar un almacén para el ajuste.';
    if (!fecha) return 'Debe especificar la fecha del ajuste.';
    if (!motivo.trim()) return 'Debe indicar el motivo del ajuste.';
    return null;
  };

  const guardar = async (cerrarDespues = false) => {
    const errorVal = validar();
    if (errorVal) {
      setError(errorVal);
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      const almNombre = almacenes.find(a => a.id === almacenId)?.nombre || 'Almacén';

      const payload: GuardarAjusteInput = {
        tipo,
        almacenId,
        fecha: (fecha || new Date()).toISOString().slice(0, 10),
        motivo,
        documentoReferencia: documentoReferencia.trim() || null,
        observaciones: observaciones.trim() || null,
        lineas: lineas.map(l => ({
          productoId: l.productoId,
          codigoProducto: l.codigoProducto,
          nombreProducto: l.nombreProducto,
          unidad: l.unidad,
          tipo: l.tipo,
          cantidad: Number(l.cantidad) || 0,
          costoUnitario: Number(l.costo) || 0,
          series: l.series.split(/\r?\n/).map(s => s.trim()).filter(Boolean),
          motivoLinea: l.motivoLinea.trim() || undefined,
        })),
      };

      const res = await AjusteService.guardarAjuste(id || null, payload, almNombre, productosCache);
      setMensaje('Ajuste de inventario guardado correctamente.');

      if (cerrarDespues) {
        navigate('/servicio-campo/ajustes-inventario');
      } else if (!id) {
        navigate(`/servicio-campo/ajustes-inventario/${res.id}`, { replace: true });
      } else {
        await cargarAjuste();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el ajuste.');
    } finally {
      setGuardando(false);
    }
  };

  const handleSolicitarAprobacion = async () => {
    if (lineas.length === 0) {
      setError('Debe ingresar al menos una línea de producto antes de solicitar aprobación.');
      return;
    }
    const errorVal = validar();
    if (errorVal) {
      setError(errorVal);
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      const almNombre = almacenes.find(a => a.id === almacenId)?.nombre || 'Almacén';

      const payload: GuardarAjusteInput = {
        tipo,
        almacenId,
        fecha: (fecha || new Date()).toISOString().slice(0, 10),
        motivo,
        documentoReferencia: documentoReferencia.trim() || null,
        observaciones: observaciones.trim() || null,
        lineas: lineas.map(l => ({
          productoId: l.productoId,
          codigoProducto: l.codigoProducto,
          nombreProducto: l.nombreProducto,
          unidad: l.unidad,
          tipo: l.tipo,
          cantidad: Number(l.cantidad) || 0,
          costoUnitario: Number(l.costo) || 0,
          series: l.series.split(/\r?\n/).map(s => s.trim()).filter(Boolean),
          motivoLinea: l.motivoLinea.trim() || undefined,
        })),
      };

      const resGuardado = await AjusteService.guardarAjuste(id || null, payload, almNombre, productosCache);
      const targetId = id || resGuardado.id;

      const res = await AjusteService.solicitarAprobacion(targetId);
      setMensaje(
        `Ajuste enviado a revisión exitosamente. N° de Aprobación generado: ${res.numeroAprobacion}. Pendiente de visto bueno por el Supervisor de Almacén o SuperAdmin.`
      );
      if (!id) {
        navigate(`/servicio-campo/ajustes-inventario/${targetId}`, { replace: true });
      } else {
        await cargarAjuste();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el ajuste a revisión.');
    } finally {
      setGuardando(false);
    }
  };

  const handleAplicar = async () => {
    if (!id || !ajuste) return;
    if (lineas.length === 0) {
      setError('No puede aplicar un ajuste sin líneas de productos.');
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      await AjusteService.aplicarAjuste(id, currentUser.nombre || 'Supervisor');
      setDialogAplicarOpen(false);
      setMensajeExito(
        `El ajuste ${ajuste.numero} fue aprobado y aplicado con éxito. N° de Aprobación: ${
          ajuste.numeroAprobacion || 'Consolidado'
        }. El inventario físico y Kardex fueron actualizados.`
      );
      setDialogExitoOpen(true);
      await cargarAjuste();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aplicar el ajuste.');
    } finally {
      setGuardando(false);
    }
  };

  const handleRechazar = async () => {
    if (!id) return;
    try {
      setGuardando(true);
      setError(null);
      await AjusteService.rechazarAjuste(id, motivoRechazo);
      setDialogRechazarOpen(false);
      setMotivoRechazo('');
      setMensaje('El ajuste fue observado y devuelto a Borrador para correcciones.');
      await cargarAjuste();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo observar el ajuste.');
    } finally {
      setGuardando(false);
    }
  };

  const handleAnular = async () => {
    if (!id) return;
    try {
      setGuardando(true);
      setError(null);
      await AjusteService.anularAjuste(id);
      setDialogAnularOpen(false);
      setMensaje('El ajuste fue anulado.');
      await cargarAjuste();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo anular el ajuste.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!id) return;
    try {
      setEliminando(true);
      setError(null);
      await AjusteService.eliminarAjuste(id);
      navigate('/servicio-campo/ajustes-inventario');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el ajuste.');
      setEliminando(false);
    }
  };

  const totalCantidad = lineas.reduce((s, x) => s + (Number(x.cantidad) || 0), 0);
  const totalValor = lineas.reduce(
    (s, x) => s + (Number(x.cantidad) || 0) * (Number(x.costo) || 0),
    0
  );

  return (
    <div className={formStyles.root}>
      {error && <D365MessageBar intent="error" onDismiss={() => setError(null)}>{error}</D365MessageBar>}
      {mensaje && <D365MessageBar intent="success" onDismiss={() => setMensaje(null)}>{mensaje}</D365MessageBar>}

      {/* 1. Barra de comandos D365 */}
      <D365CommandBar ariaLabel="Comandos de Ajuste de Inventario" busy={guardando}>
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Volver"
            title="Volver al listado"
            onClick={() => navigate('/servicio-campo/ajustes-inventario')}
          />

          {/* Botones de guardado para creación o edición en Borrador */}
          {estado === 'Borrador' && (
            <>
              <D365CommandDivider />
              <D365CommandButton
                icon={<Save16Regular />}
                tone="save"
                disabled={guardando || cargando}
                onClick={() => void guardar(false)}
              >
                Guardar
              </D365CommandButton>
              <D365CommandButton
                icon={<SaveMultiple16Regular />}
                tone="save"
                disabled={guardando || cargando}
                onClick={() => void guardar(true)}
              >
                Guardar y cerrar
              </D365CommandButton>
            </>
          )}

          {/* En Borrador ya guardado: Enviar a revisión / Solicitar aprobación */}
          {id && estado === 'Borrador' && (
            <>
              <D365CommandButton
                icon={<Send16Regular />}
                tone="brand"
                disabled={guardando || cargando || lineas.length === 0}
                onClick={() => void handleSolicitarAprobacion()}
              >
                Confirmar y solicitar aprobación
              </D365CommandButton>
              {esSupervisorAlmacen && (
                <D365CommandButton
                  icon={<Checkmark16Regular />}
                  tone="brand"
                  disabled={guardando || cargando || lineas.length === 0}
                  onClick={() => setDialogAplicarOpen(true)}
                >
                  Aprobar y aplicar
                </D365CommandButton>
              )}
              <D365CommandButton
                icon={<Delete16Regular />}
                tone="danger"
                disabled={guardando || cargando}
                onClick={() => setDialogEliminarOpen(true)}
              >
                Eliminar borrador
              </D365CommandButton>
              <D365CommandButton
                icon={<Dismiss16Regular />}
                tone="danger"
                disabled={guardando || cargando}
                onClick={() => setDialogAnularOpen(true)}
              >
                Anular
              </D365CommandButton>
            </>
          )}

          {/* En Revisión: el Supervisor o SuperAdmin puede Aprobar o Devolver */}
          {id && estado === 'EnRevision' && (
            <>
              <D365CommandDivider />
              {esSupervisorAlmacen ? (
                <>
                  <D365CommandButton
                    icon={<Checkmark16Regular />}
                    tone="brand"
                    disabled={guardando || cargando}
                    onClick={() => setDialogAplicarOpen(true)}
                  >
                    Aprobar ajuste
                  </D365CommandButton>
                  <D365CommandButton
                    icon={<ArrowReset20Regular />}
                    tone="default"
                    disabled={guardando || cargando}
                    onClick={() => setDialogRechazarOpen(true)}
                  >
                    Devolver a borrador
                  </D365CommandButton>
                  <D365CommandButton
                    icon={<Dismiss16Regular />}
                    tone="danger"
                    disabled={guardando || cargando}
                    onClick={() => setDialogAnularOpen(true)}
                  >
                    Anular
                  </D365CommandButton>
                </>
              ) : (
                <span
                  style={{
                    fontSize: '12px',
                    color: tokens.colorNeutralForeground3,
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  Pendiente de visto bueno por Supervisor
                </span>
              )}
            </>
          )}

          <D365CommandDivider />
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/ajustes-inventario/nuevo')}
          >
            Nuevo
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. Cabecera de Entidad D365 */}
      <D365EntityHeader
        loading={cargando}
        title={ajuste?.numero || 'Nuevo ajuste de inventario'}
        subtitle="Ajuste de Inventario"
        avatarName={ajuste?.nombreAlmacen || 'Ajuste'}
        metadata={[
          { label: 'Estado', value: estado === 'EnRevision' ? 'En Revisión' : estado },
          ...(ajuste?.numeroAprobacion ? [{ label: 'N° Aprobación', value: ajuste.numeroAprobacion }] : []),
          { label: 'Tipo', value: tipo },
          { label: 'Ítems', value: String(lineas.length) },
          { label: 'Unidades', value: totalCantidad.toLocaleString('es-PE') },
          { label: 'Valorización', value: formatoMoneda.format(totalValor) },
        ]}
        processFlow={<AjusteEtapas estado={estado} embedded />}
        tabs={
          <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(String(d.value))}>
            <Tab value="general">General</Tab>
            <Tab value="lineas">Líneas de ajuste</Tab>
            <Tab value="auditoria">Auditoría</Tab>
          </TabList>
        }
      />

      {/* 3. Contenedor del Cuerpo */}
      <div className={formStyles.contentBody}>
        {cargando ? (
          <div style={{ maxWidth: '620px', width: '100%' }}>
            <div className={formStyles.card}>
              <Skeleton animation="pulse">
                <SkeletonItem size={16} className={formStyles.skeletonHeader} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <SkeletonItem key={i} size={32} className={formStyles.skeletonFull} />
                  ))}
                </div>
              </Skeleton>
            </div>
          </div>
        ) : (
          <>
            {/* PESTAÑA: GENERAL */}
            {tab === 'general' && (
              <div style={{ maxWidth: '620px', width: '100%' }}>
                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Información del Ajuste</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <D365FormField label="Código de ajuste" htmlFor="ajuste-numero">
                      <Input
                        id="ajuste-numero"
                        className={formStyles.d365ControlFull}
                        value={ajuste?.numero || 'Se generará al guardar'}
                        readOnly
                        appearance="filled-darker"
                        contentAfter={<LockClosed16Regular title="Solo lectura" aria-label="Solo lectura" />}
                      />
                    </D365FormField>

                    <D365FormField label="Estado" htmlFor="ajuste-estado">
                      <Input
                        id="ajuste-estado"
                        className={formStyles.d365ControlFull}
                        value={estado === 'EnRevision' ? 'En Revisión (Pendiente de Aprobación)' : estado}
                        readOnly
                        appearance="filled-darker"
                        contentAfter={<LockClosed16Regular title="Solo lectura" aria-label="Solo lectura" />}
                      />
                    </D365FormField>

                    {ajuste?.numeroAprobacion && (
                      <D365FormField label="N° de aprobación" htmlFor="ajuste-num-aprob">
                        <Input
                          id="ajuste-num-aprob"
                          className={formStyles.d365ControlFull}
                          value={ajuste.numeroAprobacion}
                          readOnly
                          appearance="filled-darker"
                          contentAfter={<LockClosed16Regular title="Código de aprobación" aria-label="Código de aprobación" />}
                        />
                      </D365FormField>
                    )}

                    <D365FormField label="Tipo de ajuste" required htmlFor="ajuste-tipo">
                      <Select
                        id="ajuste-tipo"
                        className={formStyles.d365ControlFull}
                        value={tipo}
                        disabled={esSoloLectura}
                        onChange={(_, d) => setTipo(d.value as TipoAjuste)}
                      >
                        <option value="Entrada">Ingreso por ajuste (+)</option>
                        <option value="Salida">Salida por ajuste (-)</option>
                      </Select>
                    </D365FormField>

                    <D365FormField
                      label="Almacén de ajuste"
                      required
                      info="Almacén físico donde se realiza el ajuste de existencias"
                    >
                      <SelectorEntidadRelacionada
                        etiquetaGrupo="Almacenes Disponibles"
                        opciones={opcionesAlmacen}
                        seleccionada={almacenSeleccionado}
                        textoBusqueda={busquedaAlmacen}
                        alCambiarBusqueda={setBusquedaAlmacen}
                        alSeleccionar={nuevoId => setAlmacenId(nuevoId || '')}
                        alNavegar={nuevoId => navigate(`/servicio-campo/almacenes/${nuevoId}`)}
                        icono={<Box16Regular />}
                        tituloEnlace="Ver ficha del almacén"
                        deshabilitado={esSoloLectura}
                        textoVacio="No hay almacenes disponibles"
                      />
                    </D365FormField>

                    <D365FormField label="Fecha del ajuste" required htmlFor="ajuste-fecha">
                      <DatePicker
                        id="ajuste-fecha"
                        className={formStyles.d365ControlFull}
                        value={fecha}
                        disabled={esSoloLectura}
                        onSelectDate={d => setFecha(d || null)}
                        formatDate={d => (d ? d.toLocaleDateString('es-PE') : '')}
                      />
                    </D365FormField>

                    <D365FormField label="Doc. Referencia / Acta" htmlFor="ajuste-doc">
                      <Input
                        id="ajuste-doc"
                        className={formStyles.d365ControlFull}
                        value={documentoReferencia}
                        disabled={esSoloLectura}
                        onChange={(_, d) => setDocumentoReferencia(d.value)}
                      />
                    </D365FormField>

                    <D365FormField label="Motivo del ajuste" required htmlFor="ajuste-motivo">
                      <Select
                        id="ajuste-motivo"
                        className={formStyles.d365ControlFull}
                        value={motivo}
                        disabled={esSoloLectura}
                        onChange={(_, d) => setMotivo(d.value)}
                      >
                        {MOTIVOS_AJUSTE.map(m => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </Select>
                    </D365FormField>

                    <D365FormField label="Observaciones / Justificación" align="top" htmlFor="ajuste-obs">
                      <Textarea
                        id="ajuste-obs"
                        className={formStyles.d365ControlFull}
                        rows={3}
                        value={observaciones}
                        disabled={esSoloLectura}
                        onChange={(_, d) => setObservaciones(d.value)}
                      />
                    </D365FormField>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: LÍNEAS DE AJUSTE */}
            {tab === 'lineas' && (
              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>Productos y Materiales a Ajustar</div>
                <LineasAjusteGrid
                  lineas={lineas}
                  tipoAjusteGeneral={tipo}
                  bloqueado={guardando}
                  soloLectura={esSoloLectura}
                  alCambiar={setLineas}
                  productosRegistrados={productosCache}
                  alCargarProducto={alCargarProducto}
                />
              </div>
            )}

            {/* PESTAÑA: AUDITORÍA */}
            {tab === 'auditoria' && (
              <div style={{ maxWidth: '620px', width: '100%' }}>
                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Trazabilidad y Control de Aprobación</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <D365FormField label="Registrado por">
                      <Input
                        className={formStyles.d365ControlFull}
                        value={ajuste?.usuarioRegistro || currentUser.nombre || 'Almacenero'}
                        readOnly
                        appearance="filled-darker"
                        contentAfter={<LockClosed16Regular />}
                      />
                    </D365FormField>

                    <D365FormField label="Fecha de registro">
                      <Input
                        className={formStyles.d365ControlFull}
                        value={
                          ajuste?.fechaRegistro
                            ? new Date(ajuste.fechaRegistro).toLocaleString('es-PE')
                            : 'Pendiente'
                        }
                        readOnly
                        appearance="filled-darker"
                        contentAfter={<LockClosed16Regular />}
                      />
                    </D365FormField>

                    <D365FormField label="N° de Aprobación">
                      <Input
                        className={formStyles.d365ControlFull}
                        value={ajuste?.numeroAprobacion || (estado === 'Borrador' ? 'Pendiente de solicitud' : 'Generado al enviar a revisión')}
                        readOnly
                        appearance="filled-darker"
                        contentAfter={<LockClosed16Regular />}
                      />
                    </D365FormField>

                    <D365FormField label="Aprobado por">
                      <Input
                        className={formStyles.d365ControlFull}
                        value={ajuste?.usuarioAprobacion || 'Pendiente de aprobación'}
                        readOnly
                        appearance="filled-darker"
                        contentAfter={<LockClosed16Regular />}
                      />
                    </D365FormField>

                    <D365FormField label="Fecha de aprobación">
                      <Input
                        className={formStyles.d365ControlFull}
                        value={
                          ajuste?.fechaAprobacion
                            ? new Date(ajuste.fechaAprobacion).toLocaleString('es-PE')
                            : 'Pendiente de aprobación'
                        }
                        readOnly
                        appearance="filled-darker"
                        contentAfter={<LockClosed16Regular />}
                      />
                    </D365FormField>

                    <D365FormField label="Tipo Movimiento Kardex">
                      <Input
                        className={formStyles.d365ControlFull}
                        value="Tipo 7 · AjusteInventario (Auditado)"
                        readOnly
                        appearance="filled-darker"
                        contentAfter={<LockClosed16Regular />}
                      />
                    </D365FormField>

                    <D365FormField label="Impacto en Kardex">
                      <Input
                        className={formStyles.d365ControlFull}
                        value={
                          estado === 'Aplicado'
                            ? 'Existencias actualizadas en almacén'
                            : 'Sin impacto (Pendiente de aprobación)'
                        }
                        readOnly
                        appearance="filled-darker"
                        contentAfter={<LockClosed16Regular />}
                      />
                    </D365FormField>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Diálogo Confirmar Aplicar/Aprobar Ajuste */}
      <Dialog open={dialogAplicarOpen} onOpenChange={(_, d) => setDialogAplicarOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>¿Aprobar y aplicar este ajuste de inventario?</DialogTitle>
            <DialogContent>
              Esta acción modificará el stock físico y registrará los movimientos oficiales de Kardex bajo la autorización de <strong>{currentUser.nombre || 'Supervisor'}</strong>.
              Una vez aprobado, el ajuste quedará en estado <strong>Aplicado</strong> y no podrá ser modificado.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDialogAplicarOpen(false)}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleAplicar} disabled={guardando}>
                Sí, aprobar y aplicar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Diálogo Observar / Devolver a Borrador */}
      <Dialog open={dialogRechazarOpen} onOpenChange={(_, d) => setDialogRechazarOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Observar y devolver a borrador</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
                <p style={{ margin: 0 }}>
                  Indique la observación o motivo por el cual se devuelve este ajuste al almacenero para su corrección:
                </p>
                <Textarea
                  rows={3}
                  value={motivoRechazo}
                  onChange={(_, d) => setMotivoRechazo(d.value)}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDialogRechazarOpen(false)}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleRechazar} disabled={guardando}>
                Devolver a borrador
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Diálogo Confirmar Anular Ajuste */}
      <Dialog open={dialogAnularOpen} onOpenChange={(_, d) => setDialogAnularOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>¿Anular ajuste de inventario?</DialogTitle>
            <DialogContent>
              El ajuste quedará anulado y no alterará las existencias de almacén.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDialogAnularOpen(false)}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleAnular} disabled={guardando}>
                Sí, anular ajuste
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Diálogo Confirmar Eliminar Borrador de Ajuste */}
      <Dialog open={dialogEliminarOpen} onOpenChange={(_, d) => !d.open && !eliminando && setDialogEliminarOpen(false)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Eliminar borrador de ajuste</DialogTitle>
            <DialogContent>
              ¿Está seguro de que desea eliminar el borrador del ajuste <strong>{ajuste?.numero}</strong>? Esta acción no se puede deshacer.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" disabled={eliminando} onClick={() => setDialogEliminarOpen(false)}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: '#fff' }}
                disabled={eliminando}
                onClick={() => void handleEliminar()}
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Diálogo Confirmar Anular Ajuste */}
      <Dialog open={dialogAnularOpen} onOpenChange={(_, d) => setDialogAnularOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>¿Anular ajuste de inventario?</DialogTitle>
            <DialogContent>
              El ajuste quedará anulado y no alterará las existencias de almacén.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDialogAnularOpen(false)}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleAnular} disabled={guardando}>
                Sí, anular ajuste
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Diálogo Operación Exitosa */}
      <Dialog open={dialogExitoOpen} onOpenChange={(_, d) => setDialogExitoOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckmarkCircle24Filled style={{ color: 'var(--colorPaletteGreenForeground1, #107c41)' }} />
                <span>Ajuste Procesado con Éxito</span>
              </div>
            </DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
                <p style={{ margin: 0 }}>{mensajeExito}</p>
                {ajuste?.numero && (
                  <p style={{ margin: 0 }}>
                    <strong>Nº Ajuste: </strong>
                    <span>{ajuste.numero}</span>
                  </p>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={() => setDialogExitoOpen(false)}>
                Aceptar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
