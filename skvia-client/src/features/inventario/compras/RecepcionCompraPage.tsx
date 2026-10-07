import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Badge,
  Text,
  Spinner,
  makeStyles,
  tokens,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  createTableColumn,
  TableCellLayout,
  Tab,
  TabList,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Select,
} from '@fluentui/react-components';
import type { TableColumnDefinition } from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  Checkmark16Regular,
  Dismiss16Regular,
  Clock16Regular,
  CheckmarkCircle16Filled,
  CheckmarkCircle16Regular,
  Warning16Filled,
  ArrowClockwise16Regular,
  BarcodeScanner20Regular,
  ArrowUndo16Regular,
  Copy16Regular,
  ArrowDownload16Regular,
  Location16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../components/common/D365EntityHeader';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { CompraService } from './compra.service';
import type { CompraDto, LineaRecepcionDatos } from './compra.service';
import { ProductoService } from '../productos/services/producto.service';
import type { ProductoDto } from '../productos/types/producto.types';
import { AlmacenService } from '../almacenes/services/almacen.service';
import type { UbicacionInventarioDto } from '../almacenes/types/almacen.types';

const useStyles = makeStyles({
  scannerContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  scannerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
  },
  scannerHeaderTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  scannerRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'stretch',
  },
  scannerInput: {
    flexGrow: 1,
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: '14px',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.5px',
  },
  feedbackText: {
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: tokens.fontWeightMedium,
  },
  feedbackSuccess: {
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
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
  seriesToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tableWrapper: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  serieCode: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    letterSpacing: '0.5px',
  },
  serieRowClickable: {
    cursor: 'pointer',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px 16px',
    gap: '8px',
    color: tokens.colorNeutralForeground3,
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
  const [seriesVerificadas, setSeriesVerificadas] = useState<Set<string>>(new Set());
  const [cantidadesNoSeriadas, setCantidadesNoSeriadas] = useState<Record<string, number>>({});
  const [productosInfo, setProductosInfo] = useState<Record<string, ProductoDto>>({});
  const [popupRecibirTodoOpen, setPopupRecibirTodoOpen] = useState(false);
  const [popupRecibirTodoTopOpen, setPopupRecibirTodoTopOpen] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<UbicacionInventarioDto[]>([]);
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState<string>('');

  // Auto-eliminar mensaje de escaneo/recepción exitoso o aviso a los 3.5 segundos
  useEffect(() => {
    if (!feedback) return;
    if (feedback.tipo === 'ok' || feedback.tipo === 'aviso') {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const scannerRef = useRef<HTMLInputElement>(null);

  const cargarCompra = useCallback(async (compraId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await CompraService.obtenerPorId(compraId);
      setCompra(data);

      const yaRecepcionada = data.estado === 'Recibida' || data.estado === 'Recibida con faltantes';

      // Cargar ubicaciones del almacén destino
      if (data.almacenId) {
        try {
          const ubs = await AlmacenService.getUbicaciones(data.almacenId);
          setUbicaciones(ubs || []);
          const principal = ubs?.find(u => u.esPrincipal) || ubs?.[0];
          if (principal) {
            setUbicacionDestinoId(principal.id);
          }
        } catch (uErr) {
          console.error('Error cargando ubicaciones del almacén:', uErr);
        }
      }

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

      // Cargar información de los productos de la orden para reconocer códigos SKU y códigos de barra
      try {
        const productosConsultados = await Promise.all(
          data.lineas.map(l => ProductoService.getProductoById(l.productoId).catch(() => null))
        );
        const mapa: Record<string, ProductoDto> = {};
        productosConsultados.forEach(p => {
          if (p) mapa[p.id] = p;
        });
        setProductosInfo(mapa);
      } catch (err) {
        console.error('Error cargando información de productos para recepción:', err);
      }
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
      const prod = productosInfo[l.productoId];
      const nombreProducto = prod?.codigo ? `${prod.codigo} · ${l.producto}` : l.producto;
      l.series.forEach(s => {
        if (s.trim()) {
          lista.push({
            serie: s.trim().toUpperCase(),
            producto: nombreProducto,
            productoId: l.productoId,
          });
        }
      });
    });
    return lista;
  }, [compra, productosInfo]);

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

  // Lógica de pistola / escaneo: acepta número de serie directo O código SKU / código de barras
  const procesarEscaneo = (valor: string) => {
    const limpio = valor.trim().toUpperCase();
    if (!limpio) return;

    // 1. ¿Coincide directamente con un número de serie de la orden?
    const serieDirecta = todasLasSeries.find(x => x.serie === limpio);
    if (serieDirecta) {
      if (seriesVerificadas.has(limpio)) {
        setFeedback({ tipo: 'aviso', texto: `Serie ${limpio} ya se encuentra registrada (${serieDirecta.producto}).` });
        setSerieInput('');
        return;
      }
      setSeriesVerificadas(prev => new Set(prev).add(limpio));
      setFeedback({ tipo: 'ok', texto: `✓ Serie ${limpio} verificada correctamente (${serieDirecta.producto}).` });
      setSerieInput('');
      scannerRef.current?.focus();
      return;
    }

    // 2. ¿Coincide con el código SKU o código de barras de algún producto de la compra?
    if (compra) {
      const lineaCoincidente = compra.lineas.find(l => {
        const prod = productosInfo[l.productoId];
        const matchSku = prod?.codigo?.trim().toUpperCase() === limpio;
        const matchBarcode = prod?.codigoBarras?.trim().toUpperCase() === limpio;
        return matchSku || matchBarcode;
      });

      if (lineaCoincidente) {
        const prod = productosInfo[lineaCoincidente.productoId];
        const skuEtiqueta = prod?.codigo || 'SKU';
        const nombreProducto = prod?.nombre || lineaCoincidente.producto;

        // Si el producto es serializado: verifica la primera serie de esta línea que aún esté pendiente
        if (lineaCoincidente.series.length > 0) {
          const seriePendiente = lineaCoincidente.series.find(
            s => !seriesVerificadas.has(s.trim().toUpperCase())
          );

          if (seriePendiente) {
            const serieNormalizada = seriePendiente.trim().toUpperCase();
            setSeriesVerificadas(prev => new Set(prev).add(serieNormalizada));
            setFeedback({
              tipo: 'ok',
              texto: `✓ Unidad recibida por SKU [${skuEtiqueta}]: Serie ${serieNormalizada} verificada (${nombreProducto}).`,
            });
            setSerieInput('');
            scannerRef.current?.focus();
            return;
          } else {
            setFeedback({
              tipo: 'aviso',
              texto: `Todas las series de [${skuEtiqueta}] ${nombreProducto} ya fueron verificadas (${lineaCoincidente.series.length}/${lineaCoincidente.series.length}).`,
            });
            setSerieInput('');
            return;
          }
        }

        // Si el producto no es serializado: incrementa en 1 unidad la cantidad recibida
        const cantActual = cantidadesNoSeriadas[lineaCoincidente.productoId] ?? 0;
        const cantEsperada = lineaCoincidente.cantidad;

        if (cantActual < cantEsperada) {
          const nuevaCant = cantActual + 1;
          setCantidadesNoSeriadas(prev => ({
            ...prev,
            [lineaCoincidente.productoId]: nuevaCant,
          }));
          setFeedback({
            tipo: 'ok',
            texto: `✓ 1 unidad recibida de [${skuEtiqueta}] ${nombreProducto} (${nuevaCant} de ${cantEsperada}).`,
          });
          setSerieInput('');
          scannerRef.current?.focus();
          return;
        } else {
          setFeedback({
            tipo: 'aviso',
            texto: `El producto [${skuEtiqueta}] ${nombreProducto} ya completó las ${cantEsperada} unidades esperadas.`,
          });
          setSerieInput('');
          return;
        }
      }
    }

    setFeedback({ tipo: 'error', texto: `Código SKU o serie "${limpio}" no encontrado en esta orden.` });
    setSerieInput('');
  };

  const alternarSerie = (serie: string) => {
    if (soloLectura) return;
    setSeriesVerificadas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(serie)) {
        nuevo.delete(serie);
        setFeedback({ tipo: 'aviso', texto: `Serie ${serie} desmarcada.` });
      } else {
        nuevo.add(serie);
        setFeedback({ tipo: 'ok', texto: `Serie ${serie} verificada.` });
      }
      return nuevo;
    });
  };

  const confirmarRecibirTodo = () => {
    if (soloLectura) return;
    if (tieneSerializados) {
      setSeriesVerificadas(new Set(todasLasSeries.map(x => x.serie)));
    }
    if (lineasNoSeriadas.length > 0) {
      const nuevas: Record<string, number> = {};
      lineasNoSeriadas.forEach(l => {
        nuevas[l.productoId] = l.cantidad;
      });
      setCantidadesNoSeriadas(prev => ({ ...prev, ...nuevas }));
    }
    setFeedback({ tipo: 'ok', texto: 'Todas las series e insumos han sido marcados como recibidos.' });
    setPopupRecibirTodoOpen(false);
    setPopupRecibirTodoTopOpen(false);
  };

  const limpiarVerificacion = () => {
    if (soloLectura) return;
    setSeriesVerificadas(new Set());
    setFeedback(null);
  };

  const copiarSeries = () => {
    const seriesACopiar = seriesVisibles.map(s => s.serie);
    if (seriesACopiar.length === 0) {
      setFeedback({ tipo: 'aviso', texto: 'No hay series para copiar en la vista actual.' });
      return;
    }
    navigator.clipboard.writeText(seriesACopiar.join('\n')).then(() => {
      setFeedback({ tipo: 'ok', texto: `✓ ${seriesACopiar.length} series copiadas al portapapeles.` });
    }).catch(() => {
      setFeedback({ tipo: 'error', texto: 'No se pudo acceder al portapapeles.' });
    });
  };

  const exportarSeriesCsv = () => {
    if (todasLasSeries.length === 0) return;
    const lineasCsv = ['"NumeroSerie","Producto","Estado"'];
    todasLasSeries.forEach(s => {
      const recibida = seriesVerificadas.has(s.serie) ? 'Recibida' : 'Pendiente';
      lineasCsv.push(`"${s.serie}","${s.producto.replace(/"/g, '""')}","${recibida}"`);
    });
    const blob = new Blob([lineasCsv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Series_Recepcion_${compra?.numero || 'Compra'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtrado de series para la tabla
  const seriesVisibles = useMemo(() => {
    return todasLasSeries.filter(item => {
      const verif = seriesVerificadas.has(item.serie);
      return filtro === 'todas' ? true : filtro === 'recibidas' ? verif : !verif;
    });
  }, [todasLasSeries, seriesVerificadas, filtro]);

  const columnasSeries: TableColumnDefinition<SerieItem>[] = useMemo(() => [
    createTableColumn({
      columnId: 'estado',
      renderHeaderCell: () => 'Estado',
      renderCell: item => {
        const verif = seriesVerificadas.has(item.serie);
        return (
          <TableCellLayout>
            <Badge
              appearance={verif ? 'filled' : 'tint'}
              shape="rounded"
              color={verif ? 'success' : 'informative'}
              icon={verif ? <CheckmarkCircle16Filled /> : <Clock16Regular />}
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
      renderCell: item => (
        <TableCellLayout>
          <Text className={styles.serieCode}>{item.serie}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'producto',
      renderHeaderCell: () => 'Producto',
      renderCell: item => (
        <TableCellLayout truncate>
          <Text weight="semibold">{item.producto}</Text>
        </TableCellLayout>
      ),
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
              appearance={verif ? 'subtle' : 'primary'}
              icon={verif ? <ArrowUndo16Regular /> : <Checkmark16Regular />}
              onClick={(e) => {
                e.stopPropagation();
                alternarSerie(item.serie);
              }}
            >
              {verif ? 'Desmarcar' : 'Recibir'}
            </Button>
          </TableCellLayout>
        );
      },
    }),
  ], [seriesVerificadas, soloLectura, styles.serieCode]);

  const columnasNoSeriadas: TableColumnDefinition<CompraDto['lineas'][number]>[] = useMemo(() => [
    createTableColumn({
      columnId: 'producto',
      renderHeaderCell: () => 'Producto',
      renderCell: item => (
        <TableCellLayout truncate>
          <div>
            <Text weight="semibold" style={{ display: 'block' }}>{item.producto}</Text>
            {productosInfo[item.productoId]?.codigo && (
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Cód: {productosInfo[item.productoId].codigo}
              </Text>
            )}
          </div>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'unidad',
      renderHeaderCell: () => 'Unidad',
      renderCell: item => (
        <TableCellLayout>
          <Text>{item.unidad || 'UND'}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'esperado',
      renderHeaderCell: () => 'Cantidad esperada',
      renderCell: item => (
        <TableCellLayout>
          <Input
            type="number"
            size="small"
            readOnly
            value={String(item.cantidad)}
            style={{ width: '90px' }}
          />
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'recibido',
      renderHeaderCell: () => 'Cantidad recibida',
      renderCell: item => {
        const cant = cantidadesNoSeriadas[item.productoId] ?? item.cantidad;
        if (soloLectura) {
          return (
            <TableCellLayout>
              <Input
                type="number"
                size="small"
                readOnly
                value={String(cant)}
                style={{ width: '90px' }}
              />
            </TableCellLayout>
          );
        }
        return (
          <TableCellLayout>
            <Input
              type="number"
              size="small"
              min={0}
              value={String(cant)}
              disabled={saving}
              style={{ width: '90px' }}
              onChange={(_, d) => {
                const val = Number(d.value);
                setCantidadesNoSeriadas(prev => ({
                  ...prev,
                  [item.productoId]: isNaN(val) ? 0 : Math.max(0, val),
                }));
              }}
            />
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({
      columnId: 'estado',
      renderHeaderCell: () => 'Estado',
      renderCell: item => {
        const cant = cantidadesNoSeriadas[item.productoId] ?? item.cantidad;
        const esExcedente = cant > item.cantidad;
        const esCompleto = cant === item.cantidad;
        const diferencia = cant - item.cantidad;

        if (esExcedente) {
          return (
            <TableCellLayout>
              <Badge
                appearance="tint"
                shape="rounded"
                color="warning"
                icon={<Warning16Filled />}
              >
                Excedente (+{diferencia})
              </Badge>
            </TableCellLayout>
          );
        }

        return (
          <TableCellLayout>
            <Badge
              appearance="tint"
              shape="rounded"
              color={esCompleto ? 'success' : cant > 0 ? 'warning' : 'subtle'}
              icon={esCompleto ? <CheckmarkCircle16Filled /> : <Clock16Regular />}
            >
              {esCompleto ? 'Completo' : cant > 0 ? `${cant} de ${item.cantidad}` : 'Pendiente'}
            </Badge>
          </TableCellLayout>
        );
      },
    }),
  ], [cantidadesNoSeriadas, productosInfo, soloLectura, saving]);

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
        ubicacionId: ubicacionDestinoId || undefined,
        lineas: lineasARecepcionar,
      });
      setMensaje('Recepción registrada correctamente. El inventario ha sido actualizado.');
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
            tone="brand"
            title="Volver a la orden de compra"
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
          {!soloLectura && (cantidadVerificadas < totalSeries || lineasNoSeriadas.some(l => (cantidadesNoSeriadas[l.productoId] ?? l.cantidad) < l.cantidad)) && (
            <Popover
              open={popupRecibirTodoTopOpen}
              onOpenChange={(_, data) => setPopupRecibirTodoTopOpen(data.open)}
              positioning="below-start"
              withArrow
            >
              <PopoverTrigger disableButtonEnhancement>
                <D365CommandButton
                  icon={<CheckmarkCircle16Regular />}
                  disabled={saving}
                >
                  Recibir todo
                </D365CommandButton>
              </PopoverTrigger>
              <PopoverSurface
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxWidth: '280px',
                }}
              >
                <Text weight="semibold" size={300}>
                  ¿Recibir todos los ítems?
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                  Se marcarán todas las series y materiales pendientes como recibidos.
                </Text>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <Button size="small" appearance="subtle" onClick={() => setPopupRecibirTodoTopOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="small"
                    appearance="primary"
                    icon={<Checkmark16Regular />}
                    onClick={() => {
                      confirmarRecibirTodo();
                      setPopupRecibirTodoTopOpen(false);
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              </PopoverSurface>
            </Popover>
          )}
          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            disabled={saving || loading}
            onClick={() => {
              if (id) void cargarCompra(id);
            }}
          >
            Actualizar
          </D365CommandButton>
          {soloLectura && (
            <Badge appearance="tint" color="success" icon={<CheckmarkCircle16Filled />}>
              Recepción finalizada
            </Badge>
          )}
        </div>
      </D365CommandBar>

      <D365EntityHeader
        title={compra.numero}
        subtitle="Recepción física y control de series"
        avatarName={compra.proveedor || 'Recepción'}
        metadata={[
          { label: 'Estado', value: compra.estado },
          { label: 'Almacén Destino', value: compra.almacen },
          { label: 'Proveedor', value: compra.proveedor },
          { label: 'Comprobante', value: `${compra.tipoDocumento} ${compra.numeroDocumento || 'S/N'}` },
          { label: 'Fecha Emisión', value: compra.fechaDocumento || '---' },
          ...(compra.recibidoPor ? [{ label: 'Recibido por', value: compra.recibidoPor }] : []),
          ...(compra.fechaRecepcion ? [{ label: 'Fecha recepción', value: new Date(compra.fechaRecepcion).toLocaleString('es-PE') }] : []),
        ]}
      />

      <div className={formStyles.contentBody}>
        {/* Selector de Ubicación de Destino en el Almacén */}
        {ubicaciones.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: tokens.colorNeutralBackground1,
              border: `1px solid ${tokens.colorNeutralStroke2}`,
              borderRadius: tokens.borderRadiusMedium,
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Location16Regular style={{ color: tokens.colorBrandForeground1 }} />
              <div>
                <Text weight="semibold" size={300} style={{ display: 'block' }}>
                  Ubicación de destino en almacén:
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  El stock y las series ingresarán físicamente en esta ubicación
                </Text>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Select
                id="recepcion-ubicacion-destino"
                aria-label="Ubicación de destino"
                value={ubicacionDestinoId}
                disabled={soloLectura || saving}
                onChange={(_, d) => setUbicacionDestinoId(d.value)}
                style={{ minWidth: '240px' }}
              >
                {ubicaciones.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.codigo}) {u.esPrincipal ? '★ [Principal]' : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Recepción de Series con escáner y tabla integrados */}
        {tieneSerializados && (
          <div className={formStyles.card}>
            {/* Filtros de estado y badge de progreso arriba del input */}
            <div className={styles.seriesToolbar}>
              <TabList
                selectedValue={filtro}
                onTabSelect={(_, d) => setFiltro(d.value as 'todas' | 'recibidas' | 'pendientes')}
              >
                <Tab value="todas">
                  Todas <Badge appearance="tint" shape="rounded" size="small">{totalSeries}</Badge>
                </Tab>
                <Tab value="pendientes">
                  Pendientes <Badge appearance="tint" shape="rounded" color={totalSeries - cantidadVerificadas > 0 ? 'warning' : 'subtle'} size="small">{totalSeries - cantidadVerificadas}</Badge>
                </Tab>
                <Tab value="recibidas">
                  Recibidas <Badge appearance="tint" shape="rounded" color={cantidadVerificadas > 0 ? 'success' : 'subtle'} size="small">{cantidadVerificadas}</Badge>
                </Tab>
              </TabList>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Copy16Regular />}
                  onClick={copiarSeries}
                  title="Copiar series visibles al portapapeles"
                >
                  Copiar series
                </Button>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<ArrowDownload16Regular />}
                  onClick={exportarSeriesCsv}
                  title="Exportar todas las series a formato CSV"
                >
                  Exportar CSV
                </Button>
                <Badge
                  appearance="tint"
                  shape="rounded"
                  color={progresoPorcentaje === 100 ? 'success' : progresoPorcentaje > 0 ? 'brand' : 'subtle'}
                  size="small"
                >
                  {cantidadVerificadas} de {totalSeries} recibidas ({progresoPorcentaje}%)
                </Badge>
              </div>
            </div>

            {/* Input de escaneo directamente debajo del filtro */}
            {!soloLectura && (
              <div className={styles.scannerContainer}>
                <div className={styles.scannerRow}>
                  <Input
                    ref={scannerRef}
                    className={styles.scannerInput}
                    id="recepcion-compra-serie"
                    contentBefore={<BarcodeScanner20Regular />}
                    placeholder="Escanee o ingrese código SKU o serie..."
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
                    icon={<Checkmark16Regular />}
                    disabled={saving || !serieInput.trim()}
                    onClick={() => procesarEscaneo(serieInput)}
                  >
                    Registrar
                  </Button>
                  {cantidadVerificadas < totalSeries && (
                    <Popover
                      open={popupRecibirTodoOpen}
                      onOpenChange={(_, data) => setPopupRecibirTodoOpen(data.open)}
                      positioning="below-end"
                      withArrow
                    >
                      <PopoverTrigger disableButtonEnhancement>
                        <Button
                          appearance="outline"
                          icon={<CheckmarkCircle16Regular />}
                          disabled={saving}
                        >
                          Recibir todo
                        </Button>
                      </PopoverTrigger>
                      <PopoverSurface
                        style={{
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          maxWidth: '280px',
                        }}
                      >
                        <Text weight="semibold" size={300}>
                          ¿Recibir todas las series?
                        </Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                          Se marcarán las {totalSeries - cantidadVerificadas} series pendientes restantes como recibidas.
                        </Text>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                          <Button size="small" appearance="subtle" onClick={() => setPopupRecibirTodoOpen(false)}>
                            Cancelar
                          </Button>
                          <Button
                            size="small"
                            appearance="primary"
                            icon={<Checkmark16Regular />}
                            onClick={() => {
                              confirmarRecibirTodo();
                              setPopupRecibirTodoOpen(false);
                            }}
                          >
                            Confirmar
                          </Button>
                        </div>
                      </PopoverSurface>
                    </Popover>
                  )}
                  {cantidadVerificadas > 0 && (
                    <Button
                      appearance="subtle"
                      icon={<ArrowUndo16Regular />}
                      onClick={limpiarVerificacion}
                      disabled={saving}
                    >
                      Limpiar
                    </Button>
                  )}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
                      {feedback.tipo === 'ok' && <CheckmarkCircle16Filled />}
                      {feedback.tipo === 'aviso' && <Warning16Filled />}
                      {feedback.tipo === 'error' && <Dismiss16Regular />}
                      <span>{feedback.texto}</span>
                    </div>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Dismiss16Regular />}
                      aria-label="Cerrar mensaje"
                      onClick={() => setFeedback(null)}
                      style={{ minWidth: 'auto', padding: '2px', height: '20px' }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className={styles.tableWrapper}>
              {seriesVisibles.length === 0 ? (
                <div className={styles.emptyState}>
                  <BarcodeScanner20Regular style={{ fontSize: '24px', opacity: 0.5 }} />
                  <Text weight="medium">No hay series en esta categoría</Text>
                  <Text size={200}>Seleccione otra pestaña para ver series pendientes o recibidas.</Text>
                </div>
              ) : (
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
                      <DataGridRow<SerieItem>
                        key={rowId}
                        className={!soloLectura ? styles.serieRowClickable : undefined}
                        onClick={() => !soloLectura && alternarSerie(item.serie)}
                      >
                        {({ renderCell }) => (
                          <DataGridCell>{renderCell(item)}</DataGridCell>
                        )}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                </DataGrid>
              )}
            </div>
          </div>
        )}

        {/* Insumos no seriados */}
        {lineasNoSeriadas.length > 0 && (
          <div className={formStyles.card}>
            {!tieneSerializados && !soloLectura && (
              <div className={styles.scannerContainer}>
                <div className={styles.scannerHeader}>
                  <div className={styles.scannerHeaderTitle}>
                    <BarcodeScanner20Regular style={{ color: tokens.colorBrandForeground1 }} />
                    <Text weight="semibold" size={300}>
                      Lector de código de barras / SKU
                    </Text>
                  </div>
                </div>

                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Escanee con lector de código de barras o ingrese el código SKU del material y presione <b>Enter</b>.
                </Text>

                <div className={styles.scannerRow}>
                  <Input
                    ref={scannerRef}
                    className={styles.scannerInput}
                    id="recepcion-compra-sku"
                    contentBefore={<BarcodeScanner20Regular />}
                    placeholder="Escanee o ingrese código SKU..."
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
                    icon={<Checkmark16Regular />}
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
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <Text weight="semibold" size={300}>
                Insumos y materiales por cantidad
              </Text>
              <Badge appearance="tint" shape="rounded" color="brand" size="small">
                {lineasNoSeriadas.length} {lineasNoSeriadas.length === 1 ? 'producto' : 'productos'}
              </Badge>
            </div>

            <div className={styles.tableWrapper}>
              <DataGrid
                items={lineasNoSeriadas}
                columns={columnasNoSeriadas}
                getRowId={item => item.productoId}
                size="small"
              >
                <DataGridHeader>
                  <DataGridRow>
                    {({ renderHeaderCell }) => (
                      <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                    )}
                  </DataGridRow>
                </DataGridHeader>
                <DataGridBody<CompraDto['lineas'][number]>>
                  {({ item, rowId }) => (
                    <DataGridRow<CompraDto['lineas'][number]> key={rowId}>
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
      </div>
    </div>
  );
}
