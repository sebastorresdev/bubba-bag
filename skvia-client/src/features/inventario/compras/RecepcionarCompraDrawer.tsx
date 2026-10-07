import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Input,
  Label,
  OverlayDrawer,
  ProgressBar,
  Badge,
  makeStyles,
  tokens,
  typographyStyles,
} from '@fluentui/react-components';
import {
  Dismiss16Regular,
  CheckmarkCircle16Filled,
  Warning16Filled,
  ErrorCircle16Filled,
  Checkmark16Regular,
  Clock16Regular,
  Search16Regular,
  Sparkle16Regular,
  ArrowReset20Regular,
} from '@fluentui/react-icons';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import type { CompraDto, RecepcionCompraDatos, LineaRecepcionDatos } from './compra.service';

const useStyles = makeStyles({
  drawer: {
    width: '640px',
    maxWidth: '96vw',
  },
  header: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: '12px',
  },
  headerSubtitle: {
    ...typographyStyles.caption1,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px 24px',
    overflowY: 'auto',
  },
  scannerBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `2px solid ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
  },
  scannerInputRow: {
    display: 'flex',
    gap: '8px',
  },
  scannerInput: {
    flexGrow: 1,
    fontFamily: 'monospace',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '15px',
  },
  feedbackMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: tokens.borderRadiusSmall,
    ...typographyStyles.caption1Strong,
  },
  feedbackSuccess: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground1,
    border: `1px solid ${tokens.colorPaletteGreenBorder2}`,
  },
  feedbackWarning: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
    border: `1px solid ${tokens.colorPaletteYellowBorder2}`,
  },
  feedbackError: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground1,
    border: `1px solid ${tokens.colorPaletteRedBorder2}`,
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typographyStyles.body1Strong,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: tokens.colorNeutralForeground1,
  },
  seriesToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '4px',
  },
  tableContainer: {
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
    maxHeight: '340px',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr 140px 80px',
    padding: '10px 14px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ...typographyStyles.caption1Strong,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tableBody: {
    overflowY: 'auto',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr 140px 80px',
    padding: '10px 14px',
    alignItems: 'center',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    transition: 'background-color 100ms ease',
    ':last-child': {
      borderBottom: 'none',
    },
  },
  rowVerified: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
  },
  rowPending: {
    backgroundColor: tokens.colorNeutralBackground1,
  },
  serieText: {
    fontFamily: 'monospace',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
  },
  productText: {
    ...typographyStyles.caption1,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: '8px',
  },
  suppliesCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  quantityInput: {
    width: '90px',
    textAlign: 'center',
    fontWeight: tokens.fontWeightSemibold,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
});

export interface RecepcionarCompraDrawerProps {
  compra: CompraDto;
  inicial: RecepcionCompraDatos;
  ocupado: boolean;
  error: string | null;
  alCerrar: () => void;
  alConfirmar: (datos: RecepcionCompraDatos) => void;
}

interface ScanFeedback {
  type: 'success' | 'warning' | 'error';
  text: string;
}

export function RecepcionarCompraDrawer({
  compra,
  inicial,
  ocupado,
  error,
  alCerrar,
  alConfirmar,
}: RecepcionarCompraDrawerProps) {
  const styles = useStyles();
  const [serieInput, setSerieInput] = useState('');
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [filtroSeries, setFiltroSeries] = useState<'todas' | 'verificadas' | 'pendientes'>('todas');
  const [busquedaSerie, setBusquedaSerie] = useState('');
  const scannerInputRef = useRef<HTMLInputElement>(null);

  // Mapear todas las series esperadas por producto
  const todasLasSeriesEsperadas = useMemo(() => {
    const listado: { serie: string; producto: string; productoId: string }[] = [];
    compra.lineas.forEach(l => {
      l.series.forEach(s => {
        if (s.trim()) {
          listado.push({
            serie: s.trim().toUpperCase(),
            producto: l.producto,
            productoId: l.productoId,
          });
        }
      });
    });
    return listado;
  }, [compra]);

  const [seriesVerificadas, setSeriesVerificadas] = useState<Set<string>>(() => new Set());

  // Insumos no seriados: estado de cantidades a recepcionar (por defecto la cantidad total esperada)
  const lineasNoSeriadas = useMemo(() => {
    return compra.lineas.filter(l => l.series.length === 0);
  }, [compra]);

  const [cantidadesNoSeriadas, setCantidadesNoSeriadas] = useState<Record<string, number>>(() => {
    const inicial: Record<string, number> = {};
    compra.lineas.forEach(l => {
      if (l.series.length === 0) {
        inicial[l.productoId] = l.cantidad;
      }
    });
    return inicial;
  });

  // Focus automático en el input de la pistola
  useEffect(() => {
    const timer = setTimeout(() => {
      scannerInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const totalSeries = todasLasSeriesEsperadas.length;
  const cantidadVerificadas = seriesVerificadas.size;
  const progresoPorcentaje = totalSeries > 0 ? Math.round((cantidadVerificadas / totalSeries) * 100) : 100;
  const tieneProductosSerializados = totalSeries > 0;
  const todasCompletadas = totalSeries === 0 || cantidadVerificadas === totalSeries;

  // Lógica de pistola
  const procesarEscaneo = (codigo: string) => {
    const codigoLimpio = codigo.trim().toUpperCase();
    if (!codigoLimpio) return;

    const encontrada = todasLasSeriesEsperadas.find(x => x.serie === codigoLimpio);

    if (!encontrada) {
      setFeedback({
        type: 'error',
        text: `La serie "${codigoLimpio}" NO pertenece a este documento.`,
      });
      setSerieInput('');
      return;
    }

    if (seriesVerificadas.has(codigoLimpio)) {
      setFeedback({
        type: 'warning',
        text: `La serie "${codigoLimpio}" ya fue pistoleada previamente.`,
      });
      setSerieInput('');
      return;
    }

    setSeriesVerificadas(prev => new Set(prev).add(codigoLimpio));
    setFeedback({
      type: 'success',
      text: `✓ Serie "${codigoLimpio}" verificada correctamente.`,
    });
    setSerieInput('');
    scannerInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      procesarEscaneo(serieInput);
    }
  };

  const alternarSerie = (serie: string) => {
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

  const verificarTodas = () => {
    setSeriesVerificadas(new Set(todasLasSeriesEsperadas.map(x => x.serie)));
    setFeedback({
      type: 'success',
      text: `Todas las ${totalSeries} series marcadas como recibidas.`,
    });
  };

  const limpiarVerificacion = () => {
    setSeriesVerificadas(new Set());
    setFeedback(null);
  };

  // Filtrado para la tabla vertical
  const seriesFiltradas = useMemo(() => {
    return todasLasSeriesEsperadas.filter(item => {
      const cumpleFiltro =
        filtroSeries === 'todas'
          ? true
          : filtroSeries === 'verificadas'
          ? seriesVerificadas.has(item.serie)
          : !seriesVerificadas.has(item.serie);

      const cumpleBusqueda = busquedaSerie
        ? item.serie.includes(busquedaSerie.trim().toUpperCase()) ||
          item.producto.toLocaleLowerCase().includes(busquedaSerie.trim().toLocaleLowerCase())
        : true;

      return cumpleFiltro && cumpleBusqueda;
    });
  }, [todasLasSeriesEsperadas, seriesVerificadas, filtroSeries, busquedaSerie]);

  // Total de unidades que van a ingresar físicamente
  const totalInsumosRecepcionados = Object.values(cantidadesNoSeriadas).reduce((acc, curr) => acc + (curr > 0 ? curr : 0), 0);
  const totalGeneralUnidades = cantidadVerificadas + totalInsumosRecepcionados;

  const confirmarIngreso = () => {
    if (totalGeneralUnidades <= 0) {
      alert('Debe recepcionar al menos un insumo con cantidad mayor a cero o pistolear una serie.');
      return;
    }

    if (tieneProductosSerializados && !todasCompletadas) {
      const confirmar = window.confirm(
        `Atención: Solo se ingresarán las ${cantidadVerificadas} series que fueron pistoleadas/verificadas. Las ${totalSeries - cantidadVerificadas} faltantes quedarán pendientes. ¿Deseas continuar?`
      );
      if (!confirmar) return;
    }

    // Construir solo las líneas y series que realmente se recepcionaron
    const lineasARecepcionar: LineaRecepcionDatos[] = compra.lineas.map(l => {
      if (l.series.length > 0) {
        // Filtrar solo las series de este producto que fueron verificadas
        const seriesProducto = l.series
          .map(s => s.trim().toUpperCase())
          .filter(s => seriesVerificadas.has(s));

        return {
          productoId: l.productoId,
          cantidad: seriesProducto.length,
          series: seriesProducto,
        };
      } else {
        // Insumos no seriados
        const cant = cantidadesNoSeriadas[l.productoId] ?? l.cantidad;
        return {
          productoId: l.productoId,
          cantidad: Math.max(0, cant),
          series: [],
        };
      }
    });

    alConfirmar({
      tipoDocumento: inicial.tipoDocumento,
      numeroDocumento: inicial.numeroDocumento,
      fechaDocumento: inicial.fechaDocumento,
      lineas: lineasARecepcionar,
    });
  };

  return (
    <OverlayDrawer
      open
      position="end"
      className={styles.drawer}
      onOpenChange={(_, d) => {
        if (!d.open && !ocupado) alCerrar();
      }}
    >
      <DrawerHeader className={styles.header}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              disabled={ocupado}
              icon={<Dismiss16Regular />}
              aria-label="Cerrar"
              onClick={alCerrar}
            />
          }
        >
          Recepción Física de Material
        </DrawerHeaderTitle>
        <div className={styles.headerSubtitle}>
          {compra.numero} • Destino: {compra.almacen} • {compra.tipoDocumento} {compra.numeroDocumento || 'S/N'}
        </div>
      </DrawerHeader>

      <DrawerBody className={styles.body}>
        {error && <D365MessageBar intent="error">{error}</D365MessageBar>}

        {/* Sección de Equipos Seriados y Pistoleo */}
        {tieneProductosSerializados && (
          <>
            <div className={styles.scannerBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.sectionTitle}>
                  <Search16Regular /> Lector de Código de Barras (Pistoleo)
                </span>
                <Badge
                  appearance="tint"
                  shape="rounded"
                  color={todasCompletadas ? 'success' : 'informative'}
                >
                  {todasCompletadas ? 'Todas Pistoleadas' : 'Pistoleo en Curso'}
                </Badge>
              </div>

              <div className={styles.scannerInputRow}>
                <Label htmlFor="drawer-recepcion-serie">Serie</Label>
                <Input
                  ref={scannerInputRef}
                  className={styles.scannerInput}
                  id="drawer-recepcion-serie"
                  value={serieInput}
                  disabled={ocupado}
                  onChange={(_, d) => setSerieInput(d.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  appearance="primary"
                  disabled={ocupado || !serieInput.trim()}
                  onClick={() => procesarEscaneo(serieInput)}
                >
                  Pistolear
                </Button>
              </div>

              {feedback && (
                <div
                  className={`${styles.feedbackMessage} ${
                    feedback.type === 'success'
                      ? styles.feedbackSuccess
                      : feedback.type === 'warning'
                      ? styles.feedbackWarning
                      : styles.feedbackError
                  }`}
                >
                  {feedback.type === 'success' && <CheckmarkCircle16Filled />}
                  {feedback.type === 'warning' && <Warning16Filled />}
                  {feedback.type === 'error' && <ErrorCircle16Filled />}
                  <span>{feedback.text}</span>
                </div>
              )}

              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <span style={typographyStyles.caption1}>Cotejo físico en almacén</span>
                  <span style={typographyStyles.caption1Strong}>
                    {cantidadVerificadas} de {totalSeries} recibidas ({progresoPorcentaje}%)
                  </span>
                </div>
                <ProgressBar
                  value={progresoPorcentaje / 100}
                  color={todasCompletadas ? 'success' : 'brand'}
                />
              </div>
            </div>

            {/* Lista Vertical de Series */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className={styles.seriesToolbar}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    size="small"
                    appearance={filtroSeries === 'todas' ? 'primary' : 'outline'}
                    onClick={() => setFiltroSeries('todas')}
                  >
                    Todas ({totalSeries})
                  </Button>
                  <Button
                    size="small"
                    appearance={filtroSeries === 'verificadas' ? 'primary' : 'outline'}
                    onClick={() => setFiltroSeries('verificadas')}
                  >
                    Recibidas ({cantidadVerificadas})
                  </Button>
                  <Button
                    size="small"
                    appearance={filtroSeries === 'pendientes' ? 'primary' : 'outline'}
                    onClick={() => setFiltroSeries('pendientes')}
                  >
                    Faltantes ({totalSeries - cantidadVerificadas})
                  </Button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    size="small"
                    icon={<Sparkle16Regular />}
                    disabled={ocupado || todasCompletadas}
                    onClick={verificarTodas}
                  >
                    Verificar todas
                  </Button>
                  {cantidadVerificadas > 0 && (
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<ArrowReset20Regular />}
                      disabled={ocupado}
                      onClick={limpiarVerificacion}
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>

              <Input
                size="small"
                placeholder="Buscar" aria-label="Buscar por serie o producto"
                contentBefore={<Search16Regular />}
                value={busquedaSerie}
                onChange={(_, d) => setBusquedaSerie(d.value)}
              />

              {/* Tabla de Series */}
              <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                  <span>Estado</span>
                  <span>Nº de Serie</span>
                  <span>Producto</span>
                  <span style={{ textAlign: 'right' }}>Acción</span>
                </div>
                <div className={styles.tableBody}>
                  {seriesFiltradas.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                      No hay series que coincidan con la búsqueda.
                    </div>
                  ) : (
                    seriesFiltradas.map(item => {
                      const estaVerificada = seriesVerificadas.has(item.serie);
                      return (
                        <div
                          key={item.serie}
                          className={`${styles.tableRow} ${
                            estaVerificada ? styles.rowVerified : styles.rowPending
                          }`}
                        >
                          <div>
                            {estaVerificada ? (
                              <Badge appearance="tint" shape="rounded" color="success" icon={<Checkmark16Regular />}>
                                Recibida
                              </Badge>
                            ) : (
                              <Badge appearance="outline" shape="rounded" color="warning" icon={<Clock16Regular />}>
                                Faltante
                              </Badge>
                            )}
                          </div>
                          <span className={styles.serieText}>{item.serie}</span>
                          <span className={styles.productText} title={item.producto}>
                            {item.producto}
                          </span>
                          <div style={{ textAlign: 'right' }}>
                            <Button
                              size="small"
                              appearance={estaVerificada ? 'subtle' : 'outline'}
                              disabled={ocupado}
                              onClick={() => alternarSerie(item.serie)}
                            >
                              {estaVerificada ? 'Desmarcar' : 'Recibir'}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Sección de Insumos No Seriados con Cantidad Editable */}
        {lineasNoSeriadas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <span className={styles.sectionTitle}>
              Insumos y Materiales (Conteo por Cantidad)
            </span>
            {lineasNoSeriadas.map(l => {
              const cantActual = cantidadesNoSeriadas[l.productoId] ?? l.cantidad;
              return (
                <div key={l.productoId} className={styles.suppliesCard}>
                  <div style={{ flexGrow: 1, paddingRight: '12px' }}>
                    <div style={{ ...typographyStyles.body1Strong, color: tokens.colorNeutralForeground1 }}>
                      {l.producto}
                    </div>
                    <div style={{ ...typographyStyles.caption1, color: tokens.colorNeutralForeground3 }}>
                      Esperado en guía: {l.cantidad} {l.unidad || 'UND'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={typographyStyles.caption1}>Cant. recibida:</span>
                    <Input
                      type="number"
                      min={0}
                      max={l.cantidad}
                      className={styles.quantityInput}
                      value={String(cantActual)}
                      disabled={ocupado}
                      onChange={(_, d) => {
                        const num = Number(d.value);
                        setCantidadesNoSeriadas(prev => ({
                          ...prev,
                          [l.productoId]: isNaN(num) ? 0 : Math.max(0, num),
                        }));
                      }}
                    />
                    <span style={typographyStyles.caption1Strong}>{l.unidad || 'UND'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DrawerBody>

      <DrawerFooter className={styles.footer}>
        <div>
          {tieneProductosSerializados && !todasCompletadas ? (
            <span
              style={{
                ...typographyStyles.caption1,
                color: tokens.colorPaletteYellowForeground2,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Warning16Filled /> {totalSeries - cantidadVerificadas} series no pistoleadas
            </span>
          ) : (
            <span
              style={{
                ...typographyStyles.caption1,
                color: tokens.colorPaletteGreenForeground1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckmarkCircle16Filled /> Conforme para ingreso
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button disabled={ocupado} onClick={alCerrar}>
            Cancelar
          </Button>
          <Button
            appearance="primary"
            disabled={ocupado || totalGeneralUnidades <= 0}
            onClick={confirmarIngreso}
          >
            Confirmar recepción ({totalGeneralUnidades} unds)
          </Button>
        </div>
      </DrawerFooter>
    </OverlayDrawer>
  );
}
