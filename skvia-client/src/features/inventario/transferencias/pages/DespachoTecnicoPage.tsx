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
  VehicleTruckProfile16Regular,
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
    flex: '1 1 320px',
    minWidth: '260px',
  },
  cantidadField: {
    width: '110px',
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

interface LineaDespacho {
  idTemp: string;
  productoId: string;
  codigo: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  series: string[];
}

export const DespachoTecnicoPage: React.FC = () => {
  const formStyles = useD365FormStyles();
  const classes = useStyles();
  const navigate = useNavigate();

  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [tecnicos, setTecnicos] = useState<RecursoDto[]>([]);
  const [ubicacionesOrigen, setUbicacionesOrigen] = useState<UbicacionInventarioDto[]>([]);
  const [productosStock, setProductosStock] = useState<InventarioProductoDto[]>([]);

  // Form states
  const [almacenOrigenId, setAlmacenOrigenId] = useState('');
  const [ubicacionOrigenId, setUbicacionOrigenId] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Selector de material
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [cantidadInput, setCantidadInput] = useState<number>(1);
  const [seriesDisponibles, setSeriesDisponibles] = useState<ItemSeriadoStockDto[]>([]);
  const [seriesSeleccionadas, setSeriesSeleccionadas] = useState<string[]>([]);

  const [lineas, setLineas] = useState<LineaDespacho[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Modal de éxito
  const [despachoExitoso, setDespachoExitoso] = useState<{ id?: string; numero: string } | null>(null);

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

        // Preseleccionar primera bodega si existe
        const bodegas = alms.filter(a => a.tipo === 1);
        if (bodegas.length > 0) {
          setAlmacenOrigenId(bodegas[0].id);
        }
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar catálogos.' });
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  // Cargar ubicaciones y stock de la bodega origen
  useEffect(() => {
    if (!almacenOrigenId) {
      setUbicacionesOrigen([]);
      setProductosStock([]);
      return;
    }
    const cargarOrigen = async () => {
      try {
        const [ubics, stocks] = await Promise.all([
          AlmacenService.getUbicaciones(almacenOrigenId),
          InventarioProductoService.obtener(almacenOrigenId),
        ]);
        setUbicacionesOrigen(ubics);
        if (ubics.length > 0) {
          const principal = ubics.find(u => u.codigo === 'PRINCIPAL') || ubics[0];
          setUbicacionOrigenId(principal.id);
        }
        setProductosStock(stocks);
      } catch (err: any) {
        console.error(err);
      }
    };
    void cargarOrigen();
  }, [almacenOrigenId]);

  // Encontrar almacén de custodia del técnico seleccionado
  const custodiaTecnico = useMemo(() => {
    if (!tecnicoId) return null;
    return almacenes.find(a => a.recursoId === tecnicoId && a.tipo === 2);
  }, [tecnicoId, almacenes]);

  const productoSeleccionado = useMemo(() => {
    return productosStock.find(p => p.productoId === productoSeleccionadoId);
  }, [productoSeleccionadoId, productosStock]);

  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto.trim()) return productosStock;
    const term = busquedaProducto.toLowerCase();
    return productosStock.filter(
      p => p.codigoProducto.toLowerCase().includes(term) || p.nombreProducto.toLowerCase().includes(term)
    );
  }, [productosStock, busquedaProducto]);

  // Cargar series cuando se elige un producto serializado
  useEffect(() => {
    if (!productoSeleccionado?.esSerializado || !almacenOrigenId) {
      setSeriesDisponibles([]);
      setSeriesSeleccionadas([]);
      return;
    }
    const cargarSeries = async () => {
      try {
        const series = await InventarioProductoService.obtenerSeries(almacenOrigenId, productoSeleccionado.productoId);
        const seriesUsadas = new Set(lineas.flatMap(l => l.series));
        const disponibles = series.filter(s => !seriesUsadas.has(s.numeroSerie));
        setSeriesDisponibles(disponibles);
      } catch (err: any) {
        console.error(err);
      }
    };
    void cargarSeries();
  }, [productoSeleccionadoId, almacenOrigenId, lineas]);

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
          texto: `Debe seleccionar exactamente ${cantidadInput} serie(s) para este producto serializado.`,
        });
        return;
      }
    }

    const nuevaLinea: LineaDespacho = {
      idTemp: crypto.randomUUID(),
      productoId: productoSeleccionado.productoId,
      codigo: productoSeleccionado.codigoProducto,
      nombre: productoSeleccionado.nombreProducto,
      unidad: productoSeleccionado.nombreUnidadMedida || 'UND',
      cantidad: cantidadInput,
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

  const handleConfirmarDespacho = async () => {
    if (!almacenOrigenId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione el almacén de origen.' });
      return;
    }
    if (!tecnicoId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione al técnico receptor.' });
      return;
    }
    if (!custodiaTecnico) {
      setMensaje({
        tipo: 'error',
        texto: 'El técnico seleccionado no tiene un almacén de custodia personal asociado en su sede.',
      });
      return;
    }
    if (lineas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agregue al menos un material al despacho.' });
      return;
    }

    try {
      setSubmitting(true);
      setMensaje(null);

      const ubicsDestino = await AlmacenService.getUbicaciones(custodiaTecnico.id);
      const ubicacionDestinoId = ubicsDestino[0]?.id;
      if (!ubicacionDestinoId) {
        throw new Error('El almacén de custodia del técnico no tiene una ubicación principal configurada.');
      }

      const res = await TransferenciaService.crear({
        almacenOrigenId,
        almacenDestinoId: custodiaTecnico.id,
        ubicacionOrigenId,
        ubicacionDestinoId,
        modalidad: 1, // Inmediata
        operacionId: crypto.randomUUID(),
        observacion: observaciones.trim() || undefined,
        lineas: lineas.map(l => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          series: l.series.length > 0 ? l.series : undefined,
          condicion: 1, // Utilizable
        })),
      });

      const ultimas = await TransferenciaService.obtener();
      const creada = ultimas.find(t => t.numero === res.numero);

      setDespachoExitoso({
        id: creada?.id,
        numero: res.numero,
      });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al procesar el despacho.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDescargarCargo = async () => {
    if (!despachoExitoso?.id) return;
    try {
      await TransferenciaService.descargarCargoPdf(despachoExitoso.id, despachoExitoso.numero);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  const handleImprimirCargo = async () => {
    if (!despachoExitoso?.id) return;
    try {
      await TransferenciaService.abrirCargoPdf(despachoExitoso.id);
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
    setDespachoExitoso(null);
  };

  const bodegasOrigen = almacenes.filter(a => a.tipo === 1);
  const totalCantidad = lineas.reduce((acc, l) => acc + l.cantidad, 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="large" label="Cargando formulario de despacho..." />
      </div>
    );
  }

  return (
    <div className={formStyles.root}>
      <D365CommandBar ariaLabel="Comandos de despacho a técnicos">
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
            onClick={() => void handleConfirmarDespacho()}
            disabled={submitting || lineas.length === 0}
          >
            {submitting ? 'Procesando...' : 'Confirmar Despacho'}
          </D365CommandButton>
        </div>
      </D365CommandBar>

      <D365EntityHeader
        title="Despacho a Personal Técnico"
        subtitle="Abastecimiento y dotación de materiales y herramientas para cuadrillas de campo"
        avatarIcon={<VehicleTruckProfile16Regular />}
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
          <div className={formStyles.cardSectionTitle}>1. Origen y Técnico Receptor</div>

          <div className={classes.gridRow}>
            <D365FormField label="Bodega de Origen" required info="Almacén físico desde donde se entrega el material">
              <Select
                value={almacenOrigenId}
                onChange={(_, d) => setAlmacenOrigenId(d.value)}
              >
                {bodegasOrigen.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} ({b.codigo || 'BOD'}) - {b.unidadOrganizativaNombre || 'Central'}
                  </option>
                ))}
              </Select>
            </D365FormField>

            <D365FormField label="Ubicación Física de Salida" required>
              <Select
                value={ubicacionOrigenId}
                onChange={(_, d) => setUbicacionOrigenId(d.value)}
              >
                {ubicacionesOrigen.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.codigo})
                  </option>
                ))}
              </Select>
            </D365FormField>
          </div>

          <div className={classes.gridRow} style={{ marginTop: '12px' }}>
            <D365FormField label="Técnico Receptor" required info="Colaborador de campo que recibe y asume custodia del material">
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

            <D365FormField label="Custodia Personal (Destino)">
              <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {custodiaTecnico ? (
                  <Badge appearance="filled" color="brand">
                    {custodiaTecnico.nombre} ({custodiaTecnico.codigo})
                  </Badge>
                ) : (
                  <Text style={{ color: tokens.colorNeutralForeground4, fontSize: '13px' }}>
                    {tecnicoId ? '⚠️ Este técnico no tiene almacén de custodia activo.' : 'Seleccione un técnico para vincular su custodia.'}
                  </Text>
                )}
              </div>
            </D365FormField>
          </div>

          <div style={{ marginTop: '12px' }}>
            <D365FormField label="Observaciones / Motivo" info="Información adicional (Nro. de orden, proyecto o tarea)">
              <Textarea
                value={observaciones}
                onChange={(_, d) => setObservaciones(d.value)}
                placeholder="Ej. Dotación de materiales y equipos para inicio de guardia semanal..."
                rows={2}
              />
            </D365FormField>
          </div>
        </div>

        <div className={formStyles.card}>
          <div className={formStyles.cardSectionTitle}>2. Agregar Materiales y Equipos al Despacho</div>

          <div className={classes.scannerBox}>
            <div className={classes.scannerRow}>
              <div className={classes.productoField}>
                <D365FormField label="Buscar Producto" required info="Escriba el código o nombre para autocompletar">
                  <Combobox
                    placeholder="Escriba código o nombre del producto..."
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
                        {productosStock.length === 0
                          ? 'No hay productos con stock en este almacén'
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
                              <Badge size="small" appearance="tint" color={p.cantidadDisponible > 0 ? 'success' : 'danger'}>
                                Stock: {p.cantidadDisponible} {p.nombreUnidadMedida || 'UND'}
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
                  <Tag16Regular /> Seleccione las {cantidadInput} serie(s) que entregará en mano:
                </Text>
                {seriesDisponibles.length === 0 ? (
                  <Text style={{ color: tokens.colorPaletteRedForeground1, fontSize: '12px', display: 'block', marginTop: '6px' }}>
                    No hay series libres disponibles en la bodega de origen para este producto.
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
                Aún no ha agregado materiales al despacho. Seleccione un producto arriba y haga clic en "Agregar".
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
                    <th className={classes.th}>Series Asignadas</th>
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
                <Text weight="semibold">Total de Ítems: {lineas.length}</Text>
                <Text weight="bold" size={400}>Total de Unidades a Despachar: {totalCantidad}</Text>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de éxito y descarga de cargo */}
      <Dialog open={!!despachoExitoso} onOpenChange={() => setDespachoExitoso(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tokens.colorPaletteGreenForeground1 }}>
                <CheckmarkCircle16Regular style={{ fontSize: '24px' }} />
                ¡Despacho Registrado con Éxito!
              </div>
            </DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <Text>
                  Se generó correctamente la operación N° <strong>{despachoExitoso?.numero}</strong>.
                </Text>
                <Text style={{ color: tokens.colorNeutralForeground3 }}>
                  El material y los números de serie ahora se encuentran registrados bajo la custodia del técnico. Puede descargar o imprimir el Cargo Oficial de Custodia para que sea firmado.
                </Text>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <Button
                    appearance="primary"
                    icon={<ArrowDownload16Regular />}
                    onClick={() => void handleDescargarCargo()}
                  >
                    Descargar Cargo (PDF)
                  </Button>
                  <Button
                    appearance="outline"
                    icon={<Print16Regular />}
                    onClick={() => void handleImprimirCargo()}
                  >
                    Abrir / Imprimir
                  </Button>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="subtle" onClick={resetFormulario}>
                Realizar otro despacho
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
