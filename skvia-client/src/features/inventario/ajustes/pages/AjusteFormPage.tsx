import { useCallback, useEffect, useState } from 'react';
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
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { AlmacenService } from '../../almacenes/services/almacen.service';
import type { AlmacenDto } from '../../almacenes/types/almacen.types';
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
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [motivo, setMotivo] = useState<string>(MOTIVOS_AJUSTE[0]);
  const [documentoReferencia, setDocumentoReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [lineas, setLineas] = useState<LineaAjusteForm[]>([]);

  // Diálogo de confirmación para aplicar o anular
  const [dialogAplicarOpen, setDialogAplicarOpen] = useState(false);
  const [dialogAnularOpen, setDialogAnularOpen] = useState(false);
  const [dialogExitoOpen, setDialogExitoOpen] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const estado: EstadoAjuste = ajuste?.estado || 'Borrador';
  const esSoloLectura = estado === 'Aplicado' || estado === 'Anulado';

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

  const handleAplicar = async () => {
    if (!id || !ajuste) return;
    if (lineas.length === 0) {
      setError('No puede aplicar un ajuste sin líneas de productos.');
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      await AjusteService.aplicarAjuste(id);
      setDialogAplicarOpen(false);
      setMensajeExito(`El ajuste ${ajuste.numero} fue aplicado con éxito. El inventario físico y Kardex fueron actualizados.`);
      setDialogExitoOpen(true);
      await cargarAjuste();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aplicar el ajuste.');
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
          <D365CommandDivider />

          {!esSoloLectura && (
            <>
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

          {id && estado === 'Borrador' && (
            <>
              <D365CommandButton
                icon={<Checkmark16Regular />}
                disabled={guardando || cargando || lineas.length === 0}
                onClick={() => setDialogAplicarOpen(true)}
              >
                Aplicar ajuste
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
          { label: 'Estado', value: estado },
          { label: 'Tipo', value: tipo },
          { label: 'Ítems', value: String(lineas.length) },
          { label: 'Unidades', value: totalCantidad.toLocaleString('es-PE') },
          { label: 'Valorización', value: formatoMoneda.format(totalValor) },
        ]}
        processFlow={<AjusteEtapas estado={estado} />}
        tabs={
          <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(String(d.value))}>
            <Tab value="general">General</Tab>
            <Tab value="lineas">Líneas de ajuste ({lineas.length})</Tab>
            <Tab value="auditoria">Auditoría</Tab>
          </TabList>
        }
      />

      {/* 3. Contenedor del Cuerpo */}
      <div className={formStyles.contentBody}>
        {cargando ? (
          <div className={formStyles.card}>
            <Skeleton animation="pulse">
              <SkeletonItem size={16} className={formStyles.skeletonHeader} />
              <div className={formStyles.grid2Cols}>
                {Array.from({ length: 6 }, (_, i) => (
                  <SkeletonItem key={i} size={32} className={formStyles.skeletonFull} />
                ))}
              </div>
            </Skeleton>
          </div>
        ) : (
          <>
            {/* PESTAÑA: GENERAL */}
            {tab === 'general' && (
              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>Información del Ajuste</div>
                <div className={formStyles.grid2Cols}>
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
                      value={estado}
                      readOnly
                      appearance="filled-darker"
                      contentAfter={<LockClosed16Regular title="Solo lectura" aria-label="Solo lectura" />}
                    />
                  </D365FormField>

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
                      <option value="ConteoFisico">Ajuste por conteo físico / inventario</option>
                    </Select>
                  </D365FormField>

                  <D365FormField label="Almacén de ajuste" required htmlFor="ajuste-almacen">
                    <Select
                      id="ajuste-almacen"
                      className={formStyles.d365ControlFull}
                      value={almacenId}
                      disabled={esSoloLectura}
                      onChange={(_, d) => setAlmacenId(d.value)}
                    >
                      {almacenes.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.nombre}
                        </option>
                      ))}
                    </Select>
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
                      placeholder="Ej. ACTA-INV-2026-001 o INF-MERMA-12"
                      value={documentoReferencia}
                      disabled={esSoloLectura}
                      onChange={(_, d) => setDocumentoReferencia(d.value)}
                    />
                  </D365FormField>

                  <div style={{ gridColumn: '1 / -1' }}>
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
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <D365FormField label="Observaciones / Justificación" htmlFor="ajuste-obs">
                      <Textarea
                        id="ajuste-obs"
                        className={formStyles.d365ControlFull}
                        rows={3}
                        placeholder="Describa el motivo o justificación detallada de este ajuste de inventario..."
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
              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>Trazabilidad y Kardex</div>
                <div className={formStyles.grid2Cols}>
                  <D365FormField label="Registrado por">
                    <Input
                      className={formStyles.d365ControlFull}
                      value={ajuste?.usuarioRegistro || 'SuperAdmin'}
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

                  <D365FormField label="Aprobado por">
                    <Input
                      className={formStyles.d365ControlFull}
                      value={ajuste?.usuarioAprobacion || '—'}
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
                          : '—'
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
                          : 'Sin impacto (Borrador no afecta stock)'
                      }
                      readOnly
                      appearance="filled-darker"
                      contentAfter={<LockClosed16Regular />}
                    />
                  </D365FormField>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Diálogo Confirmar Aplicar Ajuste */}
      <Dialog open={dialogAplicarOpen} onOpenChange={(_, d) => setDialogAplicarOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>¿Aplicar este ajuste de inventario?</DialogTitle>
            <DialogContent>
              Esta acción modificará el stock físico y registrará los movimientos oficiales de Kardex.
              Una vez aplicado, el ajuste quedará en estado <strong>Aplicado</strong> y no podrá ser modificado.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDialogAplicarOpen(false)}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleAplicar} disabled={guardando}>
                Sí, aplicar ajuste
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
