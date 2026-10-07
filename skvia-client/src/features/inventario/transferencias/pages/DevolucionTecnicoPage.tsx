import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Select,
  Textarea,
  Text,
  Badge,
  Spinner,
  Combobox,
  Option,
  makeStyles,
  tokens,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  Add16Regular,
  Delete16Regular,
  ArrowDownload16Regular,
  Print16Regular,
  ArrowSync16Regular,
  CheckmarkCircle16Regular,
  Box16Regular,
  Tag16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { AlmacenService } from '../../almacenes/services/almacen.service';
import type { AlmacenDto, UbicacionInventarioDto } from '../../almacenes/types/almacen.types';
import { OrganizacionService } from '../../../organizacion/services/organizacion.service';
import type { RecursoDto } from '../../../organizacion/types/organizacion.types';
import { InventarioProductoService } from '../../inventario-productos/services/inventario-producto.service';
import type { InventarioProductoDto, ItemSeriadoStockDto } from '../../inventario-productos/types/inventario-producto.types';
import { TransferenciaService } from '../services/transferencia.service';

const useStyles = makeStyles({
  gridRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    '@media (max-width: 800px)': {
      gridTemplateColumns: '1fr',
    },
  },
  scannerBox: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px',
    marginBottom: '16px',
  },
  scannerRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '12px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  productoField: {
    flex: '1 1 300px',
    minWidth: '250px',
  },
  cantidadField: {
    width: '100px',
    flexShrink: 0,
  },
  condicionField: {
    width: '150px',
    flexShrink: 0,
  },
  comboboxOption: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  comboboxOptionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  comboboxOptionCode: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  th: {
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '10px 12px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  td: {
    padding: '10px 12px',
    fontSize: '13px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    verticalAlign: 'middle',
  },
  totalsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: '12px',
  },
  seriesBadgeList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '4px',
  },
});

interface LineaDevolucion {
  idTemp: string;
  productoId: string;
  codigo: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  condicion: 1 | 2; // 1: Utilizable, 2: Defectuoso
  series: string[];
}

export const DevolucionTecnicoPage: React.FC = () => {
  const formStyles = useD365FormStyles();
  const classes = useStyles();
  const navigate = useNavigate();

  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [tecnicos, setTecnicos] = useState<RecursoDto[]>([]);
  const [ubicacionesDestino, setUbicacionesDestino] = useState<UbicacionInventarioDto[]>([]);
  const [productosCustodia, setProductosCustodia] = useState<InventarioProductoDto[]>([]);

  // Form states
  const [tecnicoId, setTecnicoId] = useState('');
  const [almacenDestinoId, setAlmacenDestinoId] = useState('');
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Selector de material
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [cantidadInput, setCantidadInput] = useState<number>(1);
  const [condicionInput, setCondicionInput] = useState<1 | 2>(1); // 1: Utilizable, 2: Defectuoso
  const [seriesDisponibles, setSeriesDisponibles] = useState<ItemSeriadoStockDto[]>([]);
  const [seriesSeleccionadas, setSeriesSeleccionadas] = useState<string[]>([]);

  const [lineas, setLineas] = useState<LineaDevolucion[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Modal de éxito
  const [devolucionExitosa, setDevolucionExitosa] = useState<{ id?: string; numero: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [alms, tecs] = await Promise.all([
          AlmacenService.getAlmacenes(true),
          OrganizacionService.getRecursos(1, undefined, true),
        ]);
        setAlmacenes(alms);
        setTecnicos(tecs);

        const bodegas = alms.filter(a => a.tipo === 1);
        if (bodegas.length > 0) {
          setAlmacenDestinoId(bodegas[0].id);
        }
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar catálogos.' });
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const custodiaTecnico = useMemo(() => {
    if (!tecnicoId) return null;
    return almacenes.find(a => a.recursoId === tecnicoId && a.tipo === 2);
  }, [tecnicoId, almacenes]);

  useEffect(() => {
    if (!custodiaTecnico) {
      setProductosCustodia([]);
      return;
    }
    const cargarStockCustodia = async () => {
      try {
        const stocks = await InventarioProductoService.obtener(custodiaTecnico.id);
        setProductosCustodia(stocks);
      } catch (err: any) {
        console.error(err);
      }
    };
    void cargarStockCustodia();
  }, [custodiaTecnico]);

  useEffect(() => {
    if (!almacenDestinoId) {
      setUbicacionesDestino([]);
      return;
    }
    const cargarDestino = async () => {
      try {
        const ubics = await AlmacenService.getUbicaciones(almacenDestinoId);
        setUbicacionesDestino(ubics);
        if (ubics.length > 0) {
          const principal = ubics.find(u => u.codigo === 'PRINCIPAL') || ubics[0];
          setUbicacionDestinoId(principal.id);
        }
      } catch (err: any) {
        console.error(err);
      }
    };
    void cargarDestino();
  }, [almacenDestinoId]);

  const productoSeleccionado = useMemo(() => {
    return productosCustodia.find(p => p.productoId === productoSeleccionadoId);
  }, [productoSeleccionadoId, productosCustodia]);

  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto.trim()) return productosCustodia;
    const term = busquedaProducto.toLowerCase();
    return productosCustodia.filter(
      p => p.codigoProducto.toLowerCase().includes(term) || p.nombreProducto.toLowerCase().includes(term)
    );
  }, [productosCustodia, busquedaProducto]);

  useEffect(() => {
    if (!productoSeleccionado?.esSerializado || !custodiaTecnico) {
      setSeriesDisponibles([]);
      setSeriesSeleccionadas([]);
      return;
    }
    const cargarSeries = async () => {
      try {
        const series = await InventarioProductoService.obtenerSeries(custodiaTecnico.id, productoSeleccionado.productoId);
        const seriesUsadas = new Set(lineas.flatMap(l => l.series));
        const disponibles = series.filter(s => !seriesUsadas.has(s.numeroSerie));
        setSeriesDisponibles(disponibles);
      } catch (err: any) {
        console.error(err);
      }
    };
    void cargarSeries();
  }, [productoSeleccionadoId, custodiaTecnico, lineas]);

  const handleAgregarLinea = () => {
    if (!productoSeleccionado) return;
    if (cantidadInput <= 0) {
      setMensaje({ tipo: 'error', texto: 'La cantidad debe ser mayor a 0.' });
      return;
    }

    if (productoSeleccionado.esSerializado) {
      if (seriesSeleccionadas.length !== cantidadInput) {
        setMensaje({
          tipo: 'error',
          texto: `Debe seleccionar exactamente ${cantidadInput} serie(s) que el técnico está devolviendo.`,
        });
        return;
      }
    }

    const nuevaLinea: LineaDevolucion = {
      idTemp: crypto.randomUUID(),
      productoId: productoSeleccionado.productoId,
      codigo: productoSeleccionado.codigoProducto,
      nombre: productoSeleccionado.nombreProducto,
      unidad: productoSeleccionado.nombreUnidadMedida || 'UND',
      cantidad: cantidadInput,
      condicion: condicionInput,
      series: [...seriesSeleccionadas],
    };

    setLineas(prev => [...prev, nuevaLinea]);
    setProductoSeleccionadoId('');
    setBusquedaProducto('');
    setCantidadInput(1);
    setSeriesSeleccionadas([]);
    setMensaje(null);
  };

  const handleEliminarLinea = (idTemp: string) => {
    setLineas(prev => prev.filter(l => l.idTemp !== idTemp));
  };

  const handleConfirmarDevolucion = async () => {
    if (!tecnicoId || !custodiaTecnico) {
      setMensaje({ tipo: 'error', texto: 'Seleccione un técnico con almacén de custodia válido.' });
      return;
    }
    if (!almacenDestinoId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione la bodega de destino.' });
      return;
    }
    if (lineas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agregue al menos un material a la devolución.' });
      return;
    }

    try {
      setSubmitting(true);
      setMensaje(null);

      const ubicsOrigen = await AlmacenService.getUbicaciones(custodiaTecnico.id);
      const ubicacionOrigenId = ubicsOrigen[0]?.id;
      if (!ubicacionOrigenId) {
        throw new Error('El almacén de custodia del técnico no tiene ubicación principal.');
      }

      const res = await TransferenciaService.crear({
        almacenOrigenId: custodiaTecnico.id,
        almacenDestinoId,
        ubicacionOrigenId,
        ubicacionDestinoId,
        modalidad: 1, // Inmediata
        operacionId: crypto.randomUUID(),
        observacion: observaciones.trim() || undefined,
        lineas: lineas.map(l => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          series: l.series.length > 0 ? l.series : undefined,
          condicion: l.condicion,
        })),
      });

      const ultimas = await TransferenciaService.obtener();
      const creada = ultimas.find(t => t.numero === res.numero);

      setDevolucionExitosa({
        id: creada?.id,
        numero: res.numero,
      });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al procesar la devolución.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDescargarActa = async () => {
    if (!devolucionExitosa?.id) return;
    try {
      await TransferenciaService.descargarCargoPdf(devolucionExitosa.id, devolucionExitosa.numero);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  const handleImprimirActa = async () => {
    if (!devolucionExitosa?.id) return;
    try {
      await TransferenciaService.abrirCargoPdf(devolucionExitosa.id);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  const resetFormulario = () => {
    setLineas([]);
    setObservaciones('');
    setProductoSeleccionadoId('');
    setBusquedaProducto('');
    setSeriesSeleccionadas([]);
    setDevolucionExitosa(null);
  };

  const bodegasDestino = almacenes.filter(a => a.tipo === 1);
  const totalCantidad = lineas.reduce((acc, l) => acc + l.cantidad, 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="large" label="Cargando formulario de devolución..." />
      </div>
    );
  }

  return (
    <div className={formStyles.root}>
      <D365CommandBar ariaLabel="Comandos de devolución de técnicos">
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Volver"
            title="Volver a Transferencias"
            onClick={() => navigate('/servicio-campo/transferencias')}
          />
          <D365CommandDivider />
          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            onClick={() => void handleConfirmarDevolucion()}
            disabled={submitting || lineas.length === 0}
          >
            {submitting ? 'Procesando...' : 'Confirmar Devolución'}
          </D365CommandButton>
        </div>
      </D365CommandBar>

      <D365EntityHeader
        title="Devolución de Material de Técnico"
        subtitle="Reingreso a bodega de materiales sobrantes o equipos averiados retirados en campo"
        avatarIcon={<ArrowSync16Regular />}
      />

      <div className={formStyles.contentBody}>
        {mensaje && (
          <div style={{ marginBottom: '16px' }}>
            <D365MessageBar intent={mensaje.tipo}>
              {mensaje.texto}
            </D365MessageBar>
          </div>
        )}

        <div className={formStyles.card}>
          <div className={formStyles.cardSectionTitle}>1. Técnico que Devuelve y Bodega Receptora</div>

          <div className={classes.gridRow}>
            <D365FormField label="Técnico de Campo" required info="Técnico que entrega el material que tenía bajo custodia">
              <Select
                value={tecnicoId}
                onChange={(_, d) => setTecnicoId(d.value)}
              >
                <option value="">-- Seleccione un técnico --</option>
                {tecnicos.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombreCompleto} {t.documentoIdentidad ? `[DNI: ${t.documentoIdentidad}]` : ''} - {t.unidadOrganizativaNombre || ''}
                  </option>
                ))}
              </Select>
            </D365FormField>

            <D365FormField label="Custodia Personal">
              <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {custodiaTecnico ? (
                  <Badge appearance="filled" color="brand">
                    {custodiaTecnico.nombre} ({custodiaTecnico.codigo})
                  </Badge>
                ) : (
                  <Text style={{ color: tokens.colorNeutralForeground4, fontSize: '13px' }}>
                    {tecnicoId ? '⚠️ Este técnico no tiene almacén de custodia activo.' : 'Seleccione un técnico para ver su custodia.'}
                  </Text>
                )}
              </div>
            </D365FormField>
          </div>

          <div className={classes.gridRow} style={{ marginTop: '12px' }}>
            <D365FormField label="Bodega Destino" required info="Almacén principal que recibe y resguarda los materiales">
              <Select
                value={almacenDestinoId}
                onChange={(_, d) => setAlmacenDestinoId(d.value)}
              >
                {bodegasDestino.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} ({b.codigo || 'BOD'}) - {b.unidadOrganizativaNombre || 'Central'}
                  </option>
                ))}
              </Select>
            </D365FormField>

            <D365FormField label="Ubicación Física de Destino" required>
              <Select
                value={ubicacionDestinoId}
                onChange={(_, d) => setUbicacionDestinoId(d.value)}
              >
                {ubicacionesDestino.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.codigo})
                  </option>
                ))}
              </Select>
            </D365FormField>
          </div>

          <div style={{ marginTop: '12px' }}>
            <D365FormField label="Observaciones / Motivo" info="Justificación del reingreso o reporte de avería">
              <Textarea
                value={observaciones}
                onChange={(_, d) => setObservaciones(d.value)}
                placeholder="Ej. Devolución de sobrante de instalación o piezas averiadas retiradas en orden OT-1049..."
                rows={2}
              />
            </D365FormField>
          </div>
        </div>

        <div className={formStyles.card}>
          <div className={formStyles.cardSectionTitle}>2. Materiales Retornados y Clasificación de Estado</div>

          <div className={classes.scannerBox}>
            <div className={classes.scannerRow}>
              <div className={classes.productoField}>
                <D365FormField label="Material en Custodia" required info="Escriba el código o nombre para autocompletar">
                  <Combobox
                    placeholder={
                      !custodiaTecnico
                        ? 'Seleccione primero un técnico con custodia'
                        : 'Escriba código o nombre en custodia...'
                    }
                    disabled={!custodiaTecnico}
                    value={
                      productoSeleccionado
                        ? `${productoSeleccionado.codigoProducto} - ${productoSeleccionado.nombreProducto}`
                        : busquedaProducto
                    }
                    selectedOptions={productoSeleccionadoId ? [productoSeleccionadoId] : []}
                    onChange={e => {
                      setBusquedaProducto(e.target.value);
                      if (productoSeleccionadoId) {
                        setProductoSeleccionadoId('');
                      }
                    }}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) {
                        setProductoSeleccionadoId(data.optionValue);
                        setBusquedaProducto('');
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    {productosFiltrados.length === 0 ? (
                      <Option value="" disabled>
                        {!custodiaTecnico
                          ? 'Seleccione primero un técnico'
                          : productosCustodia.length === 0
                          ? 'El técnico no tiene productos en custodia'
                          : 'No se encontraron coincidencias'}
                      </Option>
                    ) : (
                      productosFiltrados.map(p => (
                        <Option
                          key={p.productoId}
                          value={p.productoId}
                          text={`${p.codigoProducto} - ${p.nombreProducto}`}
                        >
                          <div className={classes.comboboxOption}>
                            <div className={classes.comboboxOptionHeader}>
                              <Text weight="semibold">{p.nombreProducto}</Text>
                              <Badge size="small" appearance="tint" color={p.cantidadDisponible > 0 ? 'brand' : 'danger'}>
                                En custodia: {p.cantidadDisponible} {p.nombreUnidadMedida || 'UND'}
                              </Badge>
                            </div>
                            <span className={classes.comboboxOptionCode}>
                              SKU: {p.codigoProducto} {p.esSerializado ? '· Serializado' : ''}
                            </span>
                          </div>
                        </Option>
                      ))
                    )}
                  </Combobox>
                </D365FormField>
              </div>

              <div className={classes.cantidadField}>
                <D365FormField label="Cantidad" required>
                  <Input
                    type="number"
                    min={1}
                    value={cantidadInput.toString()}
                    onChange={(_, d) => setCantidadInput(Math.max(1, Number(d.value) || 1))}
                    style={{ width: '100%' }}
                  />
                </D365FormField>
              </div>

              <div className={classes.condicionField}>
                <D365FormField label="Condición" info="¿En qué estado retorna?">
                  <Select
                    value={condicionInput.toString()}
                    onChange={(_, d) => setCondicionInput(Number(d.value) as 1 | 2)}
                    style={{ width: '100%' }}
                  >
                    <option value="1">🟢 Utilizable</option>
                    <option value="2">🔴 Defectuoso</option>
                  </Select>
                </D365FormField>
              </div>

              <div style={{ paddingBottom: '2px' }}>
                <Button
                  icon={<Add16Regular />}
                  appearance="primary"
                  onClick={handleAgregarLinea}
                  disabled={!productoSeleccionado}
                >
                  Agregar
                </Button>
              </div>
            </div>

            {productoSeleccionado?.esSerializado && (
              <div style={{ marginTop: '16px', borderTop: `1px solid ${tokens.colorNeutralStroke2}`, paddingTop: '12px' }}>
                <Text weight="semibold" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag16Regular /> Seleccione las {cantidadInput} serie(s) que el técnico está devolviendo:
                </Text>
                {seriesDisponibles.length === 0 ? (
                  <Text style={{ color: tokens.colorPaletteRedForeground1, fontSize: '12px', display: 'block', marginTop: '6px' }}>
                    No hay series registradas en la custodia de este técnico para este ítem.
                  </Text>
                ) : (
                  <div className={classes.seriesBadgeList}>
                    {seriesDisponibles.map(s => {
                      const seleccionada = seriesSeleccionadas.includes(s.numeroSerie);
                      return (
                        <Button
                          key={s.numeroSerie}
                          size="small"
                          appearance={seleccionada ? 'primary' : 'outline'}
                          onClick={() => {
                            if (seleccionada) {
                              setSeriesSeleccionadas(prev => prev.filter(x => x !== s.numeroSerie));
                            } else {
                              if (seriesSeleccionadas.length < cantidadInput) {
                                setSeriesSeleccionadas(prev => [...prev, s.numeroSerie]);
                              }
                            }
                          }}
                        >
                          {s.numeroSerie}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabla de ítems agregados */}
          {lineas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium }}>
              <Box16Regular style={{ fontSize: '24px', color: tokens.colorNeutralForeground4 }} />
              <Text block style={{ color: tokens.colorNeutralForeground3, marginTop: '8px' }}>
                Aún no ha agregado materiales a la devolución. Seleccione un producto arriba y haga clic en "Agregar".
              </Text>
            </div>
          ) : (
            <>
              <table className={classes.table}>
                <thead>
                  <tr>
                    <th className={classes.th}>#</th>
                    <th className={classes.th}>Código</th>
                    <th className={classes.th}>Descripción del Producto</th>
                    <th className={classes.th}>Cantidad</th>
                    <th className={classes.th}>Unidad</th>
                    <th className={classes.th}>Condición</th>
                    <th className={classes.th}>Series Devueltas</th>
                    <th className={classes.th} style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l, idx) => (
                    <tr key={l.idTemp}>
                      <td className={classes.td}>{idx + 1}</td>
                      <td className={classes.td}><strong>{l.codigo}</strong></td>
                      <td className={classes.td}>{l.nombre}</td>
                      <td className={classes.td}><strong>{l.cantidad}</strong></td>
                      <td className={classes.td}>{l.unidad}</td>
                      <td className={classes.td}>
                        <Badge
                          appearance="filled"
                          color={l.condicion === 1 ? 'informative' : 'danger'}
                        >
                          {l.condicion === 1 ? 'Utilizable' : 'Defectuoso'}
                        </Badge>
                      </td>
                      <td className={classes.td}>
                        {l.series.length > 0 ? (
                          <div className={classes.seriesBadgeList}>
                            {l.series.map(s => (
                              <Badge key={s} appearance="tint" color="brand">{s}</Badge>
                            ))}
                          </div>
                        ) : (
                          <Text style={{ color: tokens.colorNeutralForeground4 }}>-</Text>
                        )}
                      </td>
                      <td className={classes.td} style={{ textAlign: 'center' }}>
                        <Button
                          icon={<Delete16Regular />}
                          appearance="subtle"
                          size="small"
                          onClick={() => handleEliminarLinea(l.idTemp)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={classes.totalsBar}>
                <Text weight="semibold">Total de Ítems Devueltos: {lineas.length}</Text>
                <Text weight="bold" size={400}>Total de Unidades Reingresadas: {totalCantidad}</Text>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de éxito y descarga de acta */}
      <Dialog open={!!devolucionExitosa} onOpenChange={() => setDevolucionExitosa(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tokens.colorPaletteGreenForeground1 }}>
                <CheckmarkCircle16Regular style={{ fontSize: '24px' }} />
                ¡Devolución Procesada con Éxito!
              </div>
            </DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <Text>
                  Se generó correctamente el acta de devolución N° <strong>{devolucionExitosa?.numero}</strong>.
                </Text>
                <Text style={{ color: tokens.colorNeutralForeground3 }}>
                  Las existencias han reingresado a la bodega en la condición especificada. Puede descargar o imprimir el Acta Oficial de Devolución para archivo y firmas.
                </Text>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <Button
                    appearance="primary"
                    icon={<ArrowDownload16Regular />}
                    onClick={() => void handleDescargarActa()}
                  >
                    Descargar Acta (PDF)
                  </Button>
                  <Button
                    appearance="outline"
                    icon={<Print16Regular />}
                    onClick={() => void handleImprimirActa()}
                  >
                    Abrir / Imprimir
                  </Button>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="subtle" onClick={resetFormulario}>
                Realizar otra devolución
              </Button>
              <Button appearance="secondary" onClick={() => navigate('/servicio-campo/transferencias')}>
                Ir al Historial
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
