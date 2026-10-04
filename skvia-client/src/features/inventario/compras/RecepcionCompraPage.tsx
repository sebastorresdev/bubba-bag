import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Label,
  ProgressBar,
  Badge,
  Text,
  Spinner,
  makeStyles,
  tokens,
  typographyStyles,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  createTableColumn,
  TableCellLayout,
} from '@fluentui/react-components';
import type { TableColumnDefinition } from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  Checkmark16Regular,
  Dismiss16Regular,
  Search16Regular,
  Clock16Regular,
  CheckmarkCircle16Filled,
  Warning16Filled,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../components/common/D365FormField';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { CompraService } from './compra.service';
import type { CompraDto, LineaRecepcionDatos } from './compra.service';

const useStyles = makeStyles({
  splitLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
    '@media (min-width: 900px)': {
      gridTemplateColumns: '340px 1fr',
    },
  },
  scannerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  scannerRow: {
    display: 'flex',
    gap: '8px',
  },
  scannerInput: {
    flexGrow: 1,
    fontFamily: 'monospace',
    fontWeight: tokens.fontWeightSemibold,
  },
  seriesToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px',
  },
  filterGroup: {
    display: 'flex',
    gap: '4px',
  },
  serieText: {
    fontFamily: 'monospace',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '13px',
  },
  summaryMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    textAlign: 'center',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metricValue: {
    ...typographyStyles.body1Strong,
    color: tokens.colorNeutralForeground1,
  },
  metricLabel: {
    ...typographyStyles.caption2,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
  },
  feedbackText: {
    ...typographyStyles.caption1,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: tokens.borderRadiusSmall,
  },
  feedbackSuccess: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground1,
  },
  feedbackWarning: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  feedbackError: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground1,
  },
  tableWrapper: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
});

interface SerieItem {
  serie: string;
  producto: string;
  productoId: string;
}

export function RecepcionCompraPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formStyles = useD365FormStyles();
  const styles = useStyles();

  const [compra, setCompra] = useState<CompraDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Estados de escaneo y verificación
  const [serieInput, setSerieInput] = useState('');
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'aviso' | 'error'; texto: string } | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'recibidas' | 'pendientes'>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [seriesVerificadas, setSeriesVerificadas] = useState<Set<string>>(new Set());
  const [cantidadesNoSeriadas, setCantidadesNoSeriadas] = useState<Record<string, number>>({});

  const scannerRef = useRef<HTMLInputElement>(null);

  const cargarCompra = useCallback(async (compraId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await CompraService.obtenerPorId(compraId);
      setCompra(data);

      const yaRecepcionada = data.estado === 'Recibida' || data.estado === 'Recibida con faltantes';

      // Inicializar series verificadas
      const verificadas = new Set<string>();
      data.lineas.forEach(l => {
        if (yaRecepcionada && l.seriesRecibidas) {
          l.seriesRecibidas.forEach(s => verificadas.add(s.trim().toUpperCase()));
        }
      });
      setSeriesVerificadas(verificadas);

      // Inicializar cantidades de insumos no seriados
      const cants: Record<string, number> = {};
      data.lineas.forEach(l => {
        if (l.series.length === 0) {
          cants[l.productoId] = yaRecepcionada && l.cantidadRecibida !== undefined && l.cantidadRecibida !== null
            ? l.cantidadRecibida
            : l.cantidad;
        }
      });
      setCantidadesNoSeriadas(cants);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la orden de compra.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) void cargarCompra(id);
  }, [id, cargarCompra]);

  useEffect(() => {
    if (!loading && compra?.estado === 'Enviada') {
      scannerRef.current?.focus();
    }
  }, [loading, compra?.estado]);

  // Lista plana de series esperadas
  const todasLasSeries: SerieItem[] = useMemo(() => {
    if (!compra) return [];
    const lista: SerieItem[] = [];
    compra.lineas.forEach(l => {
      l.series.forEach(s => {
        if (s.trim()) {
          lista.push({
            serie: s.trim().toUpperCase(),
            producto: l.producto,
            productoId: l.productoId,
          });
        }
      });
    });
    return lista;
  }, [compra]);

  const lineasNoSeriadas = useMemo(() => {
    return compra ? compra.lineas.filter(l => l.series.length === 0) : [];
  }, [compra]);

  const soloLectura = compra?.estado === 'Recibida';
  const totalSeries = todasLasSeries.length;
  const cantidadVerificadas = seriesVerificadas.size;
  const progresoPorcentaje = totalSeries > 0 ? Math.round((cantidadVerificadas / totalSeries) * 100) : 100;
  const tieneSerializados = totalSeries > 0;

  const totalInsumos = Object.values(cantidadesNoSeriadas).reduce((acc, curr) => acc + (curr > 0 ? curr : 0), 0);
  const totalUnidadesRecibidas = cantidadVerificadas + totalInsumos;

  // Lógica de pistola / escaneo
  const procesarEscaneo = (valor: string) => {
    const limpio = valor.trim().toUpperCase();
    if (!limpio) return;

    const encontrada = todasLasSeries.find(x => x.serie === limpio);
    if (!encontrada) {
      setFeedback({ tipo: 'error', texto: `Serie ${limpio} no encontrada en esta orden.` });
      setSerieInput('');
      return;
    }

    if (seriesVerificadas.has(limpio)) {
      setFeedback({ tipo: 'aviso', texto: `Serie ${limpio} ya se encuentra registrada.` });
      setSerieInput('');
      return;
    }

    setSeriesVerificadas(prev => new Set(prev).add(limpio));
    setFeedback({ tipo: 'ok', texto: `Serie ${limpio} verificada.` });
    setSerieInput('');
    scannerRef.current?.focus();
  };

  const alternarSerie = (serie: string) => {
    if (soloLectura) return;
    setSeriesVerificadas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(serie)) {
        nuevo.delete(serie);
      } else {
        nuevo.add(serie);
      }
      return nuevo;
    });
  };

  const marcarTodas = () => {
    if (soloLectura) return;
    setSeriesVerificadas(new Set(todasLasSeries.map(x => x.serie)));
    setFeedback({ tipo: 'ok', texto: `Todas las series marcadas como recibidas (${totalSeries}).` });
  };

  const limpiarVerificacion = () => {
    if (soloLectura) return;
    setSeriesVerificadas(new Set());
    setFeedback(null);
  };

  // Filtrado de series para la tabla
  const seriesVisibles = useMemo(() => {
    return todasLasSeries.filter(item => {
      const verif = seriesVerificadas.has(item.serie);
      const matchFiltro =
        filtro === 'todas' ? true : filtro === 'recibidas' ? verif : !verif;

      const q = busqueda.trim().toUpperCase();
      const matchBusqueda = !q || item.serie.includes(q) || item.producto.toUpperCase().includes(q);

      return matchFiltro && matchBusqueda;
    });
  }, [todasLasSeries, seriesVerificadas, filtro, busqueda]);

  const columnasSeries: TableColumnDefinition<SerieItem>[] = useMemo(() => [
    createTableColumn({
      columnId: 'estado',
      renderHeaderCell: () => 'Estado',
      renderCell: item => {
        const verif = seriesVerificadas.has(item.serie);
        return (
          <TableCellLayout>
            <Badge
              appearance={verif ? 'filled' : 'outline'}
              color={verif ? 'success' : 'informative'}
              icon={verif ? <Checkmark16Regular /> : <Clock16Regular />}
            >
              {verif ? 'Recibida' : 'Pendiente'}
            </Badge>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({
      columnId: 'serie',
      renderHeaderCell: () => 'Número de Serie',
      renderCell: item => <TableCellLayout><Text className={styles.serieText}>{item.serie}</Text></TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'producto',
      renderHeaderCell: () => 'Producto',
      renderCell: item => <TableCellLayout truncate>{item.producto}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'accion',
      renderHeaderCell: () => 'Acción',
      renderCell: item => {
        if (soloLectura) return null;
        const verif = seriesVerificadas.has(item.serie);
        return (
          <TableCellLayout>
            <Button
              size="small"
              appearance="subtle"
              onClick={() => alternarSerie(item.serie)}
            >
              {verif ? 'Desmarcar' : 'Recibir'}
            </Button>
          </TableCellLayout>
        );
      },
    }),
  ], [seriesVerificadas, soloLectura, styles.serieText]);

  const guardarRecepcion = async () => {
    if (!compra || !id) return;

    if (totalUnidadesRecibidas <= 0) {
      setError('Debe recepcionar al menos un producto o serie.');
      return;
    }

    if (tieneSerializados && cantidadVerificadas < totalSeries) {
      const conf = window.confirm(
        `Se recepcionarán ${cantidadVerificadas} de ${totalSeries} series. Las restantes quedarán como faltantes. ¿Desea confirmar el ingreso?`
      );
      if (!conf) return;
    }

    const lineasARecepcionar: LineaRecepcionDatos[] = compra.lineas.map(l => {
      if (l.series.length > 0) {
        const seriesRec = l.series
          .map(s => s.trim().toUpperCase())
          .filter(s => seriesVerificadas.has(s));
        return {
          productoId: l.productoId,
          cantidad: seriesRec.length,
          series: seriesRec,
        };
      } else {
        const cant = cantidadesNoSeriadas[l.productoId] ?? l.cantidad;
        return {
          productoId: l.productoId,
          cantidad: Math.max(0, cant),
          series: [],
        };
      }
    });

    try {
      setSaving(true);
      setError(null);
      await CompraService.recepcionar(id, {
        tipoDocumento: compra.tipoDocumento,
        numeroDocumento: compra.numeroDocumento,
        fechaDocumento: compra.fechaDocumento,
        lineas: lineasARecepcionar,
      });
      setMensaje('Recepción registrada correctamente.');
      void cargarCompra(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar la recepción.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={formStyles.root} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '360px' }}>
        <Spinner label="Cargando recepción..." />
      </div>
    );
  }

  if (!compra) {
    return (
      <div className={formStyles.root}>
        <D365MessageBar intent="error">No se encontró la orden de compra solicitada.</D365MessageBar>
        <Button appearance="subtle" icon={<ArrowLeft16Regular />} onClick={() => navigate('/servicio-campo/recepciones-compra')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className={formStyles.root}>
      {error && <D365MessageBar intent="error" onDismiss={() => setError(null)}>{error}</D365MessageBar>}
      {mensaje && <D365MessageBar intent="success" onDismiss={() => setMensaje(null)}>{mensaje}</D365MessageBar>}

      <D365CommandBar ariaLabel="Comandos de recepción" busy={saving} busyLabel="Registrando ingreso en almacén...">
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            aria-label="Volver"
            onClick={() => navigate(`/servicio-campo/recepciones-compra/${id}`)}
          />
          <D365CommandDivider />
          {!soloLectura && (
            <D365CommandButton
              icon={<Save16Regular />}
              tone="save"
              disabled={saving || totalUnidadesRecibidas <= 0}
              onClick={() => void guardarRecepcion()}
            >
              Confirmar recepción
            </D365CommandButton>
          )}
          {soloLectura && (
            <Badge appearance="tint" color="success" icon={<CheckmarkCircle16Filled />}>
              Recepción finalizada
            </Badge>
          )}
        </div>
      </D365CommandBar>

      <D365EntityHeader
        title={compra.numero}
        subtitle="Recepción física de material"
        avatarName={compra.proveedor || 'Recepción'}
        metadata={[
          { label: 'Estado', value: compra.estado },
          { label: 'Destino', value: compra.almacen },
          { label: 'Proveedor', value: compra.proveedor },
          { label: 'Comprobante', value: `${compra.tipoDocumento} ${compra.numeroDocumento || 'S/N'}` },
        ]}
      />

      <div className={formStyles.contentBody}>
        <div className={styles.splitLayout}>
          {/* Panel Izquierdo: Resumen y Lector de código */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Métricas de Recepción */}
            <div className={formStyles.card}>
              <Text weight="semibold" size={300} style={{ marginBottom: '8px', display: 'block' }}>
                Resumen de unidades
              </Text>
              <div className={styles.summaryMetrics}>
                <div className={styles.metricItem}>
                  <span className={styles.metricValue}>{totalSeries + lineasNoSeriadas.reduce((a, b) => a + b.cantidad, 0)}</span>
                  <span className={styles.metricLabel}>Esperadas</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricValue}>{totalUnidadesRecibidas}</span>
                  <span className={styles.metricLabel}>Recibidas</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricValue}>
                    {Math.max(0, (totalSeries + lineasNoSeriadas.reduce((a, b) => a + b.cantidad, 0)) - totalUnidadesRecibidas)}
                  </span>
                  <span className={styles.metricLabel}>Pendientes</span>
                </div>
              </div>

              {tieneSerializados && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Avance de series</Text>
                    <Text size={200} weight="semibold">{progresoPorcentaje}%</Text>
                  </div>
                  <ProgressBar value={progresoPorcentaje / 100} color={progresoPorcentaje === 100 ? 'success' : 'brand'} />
                </div>
              )}
            </div>

            {/* Lector de código de barras */}
            {tieneSerializados && !soloLectura && (
              <div className={formStyles.card}>
                <div className={styles.scannerSection}>
                  <Text weight="semibold" size={300}>
                    Lector de código de barras
                  </Text>
                  <div className={styles.scannerRow}>
                    <Label htmlFor="recepcion-compra-serie">Serie</Label>
                    <Input
                      ref={scannerRef}
                      className={styles.scannerInput}
                      id="recepcion-compra-serie"
                      value={serieInput}
                      disabled={saving}
                      onChange={(_, d) => setSerieInput(d.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          procesarEscaneo(serieInput);
                        }
                      }}
                    />
                    <Button
                      appearance="primary"
                      disabled={saving || !serieInput.trim()}
                      onClick={() => procesarEscaneo(serieInput)}
                    >
                      Registrar
                    </Button>
                  </div>

                  {feedback && (
                    <div
                      className={`${styles.feedbackText} ${
                        feedback.tipo === 'ok'
                          ? styles.feedbackSuccess
                          : feedback.tipo === 'aviso'
                          ? styles.feedbackWarning
                          : styles.feedbackError
                      }`}
                    >
                      {feedback.tipo === 'ok' && <CheckmarkCircle16Filled />}
                      {feedback.tipo === 'aviso' && <Warning16Filled />}
                      {feedback.tipo === 'error' && <Dismiss16Regular />}
                      <span>{feedback.texto}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <Button size="small" appearance="outline" onClick={marcarTodas}>
                      Marcar todas
                    </Button>
                    {cantidadVerificadas > 0 && (
                      <Button size="small" appearance="subtle" onClick={limpiarVerificacion}>
                        Limpiar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Datos de Comprobante */}
            <div className={formStyles.card}>
              <Text weight="semibold" size={300} style={{ marginBottom: '8px', display: 'block' }}>
                Datos del documento
              </Text>
              <D365FormField label="Tipo">
                <Text>{compra.tipoDocumento}</Text>
              </D365FormField>
              <D365FormField label="Número">
                <Text weight="semibold">{compra.numeroDocumento || '---'}</Text>
              </D365FormField>
              <D365FormField label="Fecha">
                <Text>{compra.fechaDocumento || '---'}</Text>
              </D365FormField>
            </div>
          </div>

          {/* Panel Derecho: Tabla de Series e Insumos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Series */}
            {tieneSerializados && (
              <div className={formStyles.card}>
                <div className={styles.seriesToolbar}>
                  <div className={styles.filterGroup}>
                    <Button
                      size="small"
                      appearance={filtro === 'todas' ? 'primary' : 'subtle'}
                      onClick={() => setFiltro('todas')}
                    >
                      Todas ({totalSeries})
                    </Button>
                    <Button
                      size="small"
                      appearance={filtro === 'recibidas' ? 'primary' : 'subtle'}
                      onClick={() => setFiltro('recibidas')}
                    >
                      Recibidas ({cantidadVerificadas})
                    </Button>
                    <Button
                      size="small"
                      appearance={filtro === 'pendientes' ? 'primary' : 'subtle'}
                      onClick={() => setFiltro('pendientes')}
                    >
                      Pendientes ({totalSeries - cantidadVerificadas})
                    </Button>
                  </div>

                  <Input
                    size="small"
                    placeholder="Buscar" aria-label="Buscar serie"
                    contentBefore={<Search16Regular />}
                    value={busqueda}
                    onChange={(_, d) => setBusqueda(d.value)}
                    style={{ width: '180px' }}
                  />
                </div>

                <div className={styles.tableWrapper}>
                  <DataGrid
                    items={seriesVisibles}
                    columns={columnasSeries}
                    getRowId={item => item.serie}
                    size="small"
                  >
                    <DataGridHeader>
                      <DataGridRow>
                        {({ renderHeaderCell }) => (
                          <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                        )}
                      </DataGridRow>
                    </DataGridHeader>
                    <DataGridBody<SerieItem>>
                      {({ item, rowId }) => (
                        <DataGridRow<SerieItem> key={rowId}>
                          {({ renderCell }) => (
                            <DataGridCell>{renderCell(item)}</DataGridCell>
                          )}
                        </DataGridRow>
                      )}
                    </DataGridBody>
                  </DataGrid>
                </div>
              </div>
            )}

            {/* Insumos no seriados */}
            {lineasNoSeriadas.length > 0 && (
              <div className={formStyles.card}>
                <Text weight="semibold" size={300} style={{ marginBottom: '12px', display: 'block' }}>
                  Insumos y materiales por cantidad
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lineasNoSeriadas.map(linea => {
                    const cant = cantidadesNoSeriadas[linea.productoId] ?? linea.cantidad;
                    return (
                      <div
                        key={linea.productoId}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 120px 140px',
                          gap: '12px',
                          alignItems: 'center',
                          padding: '10px 14px',
                          border: `1px solid ${tokens.colorNeutralStroke2}`,
                          borderRadius: tokens.borderRadiusMedium,
                          backgroundColor: tokens.colorNeutralBackground1,
                        }}
                      >
                        <div>
                          <Text weight="semibold">{linea.producto}</Text>
                          <br />
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            Esperado: {linea.cantidad} {linea.unidad || 'UND'}
                          </Text>
                        </div>

                        <div>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Unidad:</Text>{' '}
                          <Text weight="semibold">{linea.unidad || 'UND'}</Text>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Text size={200}>Recibido:</Text>
                          {soloLectura ? (
                            <Text weight="semibold">{cant} {linea.unidad || 'UND'}</Text>
                          ) : (
                            <Input
                              type="number"
                              min={0}
                              max={linea.cantidad}
                              value={String(cant)}
                              disabled={saving}
                              style={{ width: '80px', textAlign: 'center' }}
                              onChange={(_, d) => {
                                const val = Number(d.value);
                                setCantidadesNoSeriadas(prev => ({
                                  ...prev,
                                  [linea.productoId]: isNaN(val) ? 0 : Math.max(0, val),
                                }));
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
