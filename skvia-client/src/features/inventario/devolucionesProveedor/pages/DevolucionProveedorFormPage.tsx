import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Input,
  Select,
  Text,
  Badge,
  Spinner,
  makeStyles,
  tokens,
  typographyStyles,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  TabList,
  Tab,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  createTableColumn,
  TableCellLayout,
  type TableColumnDefinition,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  Delete16Regular,
  ArrowExit16Regular,
  ArrowReply16Regular,
  CheckmarkCircle16Filled,
  Warning16Filled,
  Building16Regular,
  BarcodeScanner20Regular,
  ArrowDownload16Regular,
  Print16Regular,
} from '@fluentui/react-icons';
import { WhatsAppIcon } from '../../../../components/common/WhatsAppIcon';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormContent } from '../../../../components/common/D365FormContent';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { SelectorEntidadRelacionada, type OpcionEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { AlmacenService } from '../../almacenes/services/almacen.service';
import type { AlmacenDto } from '../../almacenes/types/almacen.types';
import { ClienteService } from '../../../crm/clientes/services/cliente.service';
import type { ClienteListadoItemDto } from '../../../crm/clientes/types/cliente.types';
import { InventarioProductoService } from '../../inventario-productos/services/inventario-producto.service';
import type { InventarioProductoDto, ItemSeriadoStockDto } from '../../inventario-productos/types/inventario-producto.types';
import { DevolucionProveedorService } from '../services/devolucionProveedor.service';
import type { LineaDevolucionInput } from '../types/devolucionProveedor.types';
import { DocumentoRespaldoUpload } from '../../comun/DocumentoRespaldoUpload';
import { TransferenciaEtapas } from '../../transferencias/components/TransferenciaEtapas';

interface ItemRetiroDraft {
  idTemp: string;
  productoId: string;
  codigoProducto: string;
  nombreProducto: string;
  esSerializado: boolean;
  numeroSerie?: string;
  numeroSmartCard?: string | null;
  cantidad: number;
  condicion: 'Defectuoso' | 'Utilizable';
}

const useStyles = makeStyles({
  scannerPanel: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
  },
  scannerGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1.5fr) minmax(280px, 2fr) 120px auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'end',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  scannerField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  scannerLabel: {
    ...typographyStyles.caption1,
    fontWeight: 600,
    color: tokens.colorNeutralForeground2,
  },
  tableWrapper: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    marginTop: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  totalsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: '8px',
    borderRadius: tokens.borderRadiusMedium,
  },
});

export interface DevolucionProveedorFormPageProps {
  modo?: 'defectuoso' | 'ok';
}

export const DevolucionProveedorFormPage: React.FC<DevolucionProveedorFormPageProps> = ({ modo = 'defectuoso' }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formStyles = useD365FormStyles();
  const styles = useStyles();

  const esNuevo = !id || id === 'nuevo';
  const baseRoute = modo === 'ok' ? '/servicio-campo/retiro-ok-proveedor' : '/servicio-campo/retiro-defectuoso-proveedor';

  const defaultTitle = modo === 'ok' ? 'Nuevo Retiro de Material OK hacia OL' : 'Nuevo Retiro de Material Defectuoso a OL';
  const defaultSubtitle = modo === 'ok' ? 'Retiro de material en buen estado hacia OL' : 'Retiro de material defectuoso hacia OL';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null);

  // Encabezado estático (solo cambia al guardar o al cargar desde la API, NUNCA mientras se escribe)
  const [savedHeader, setSavedHeader] = useState<{
    title: string;
    subtitle: string;
    numero: string;
    proveedor: string;
    numeroDocumento: string;
    totalUnidades: number;
    fechaEmision: string;
    estado: string;
  }>({
    title: esNuevo ? defaultTitle : '',
    subtitle: defaultSubtitle,
    numero: '',
    proveedor: '—',
    numeroDocumento: '—',
    totalUnidades: 0,
    fechaEmision: '—',
    estado: 'Borrador',
  });

  // Catálogos
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [cuentas, setCuentas] = useState<ClienteListadoItemDto[]>([]);
  const [busquedaCuenta, setBusquedaCuenta] = useState('');
  const [cuentaSeleccionadaId, setCuentaSeleccionadaId] = useState<string | null>(null);
  const [productosStock, setProductosStock] = useState<InventarioProductoDto[]>([]);
  const [seriesStock, setSeriesStock] = useState<ItemSeriadoStockDto[]>([]);

  // Datos del formulario - Sin valores prellenados por defecto ni placeholders
  const [numero, setNumero] = useState<string>('Nuevo');
  const [proveedor, setProveedor] = useState('');
  const [almacenId, setAlmacenId] = useState('');
  const [ubicacionId, setUbicacionId] = useState<string | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fechaDocumento, setFechaDocumento] = useState<Date | null>(null);
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [documentoRespaldoUrl, setDocumentoRespaldoUrl] = useState<string | null>(null);
  const [estado, setEstado] = useState<'Borrador' | 'Completada' | 'Anulada'>('Borrador');
  const [items, setItems] = useState<ItemRetiroDraft[]>([]);
  const [selectedTab, setSelectedTab] = useState<'general' | 'productos' | 'adjuntos'>('general');

  // Estados del Escáner / Pistoleo de Series
  const [scannerQuery, setScannerQuery] = useState('');
  const [scannerProductoId, setScannerProductoId] = useState('');
  const [scannerCantidad, setScannerCantidad] = useState('1');
  const [scannerCondicion, setScannerCondicion] = useState<'Defectuoso' | 'Utilizable'>(modo === 'ok' ? 'Utilizable' : 'Defectuoso');
  const [scannerFeedback, setScannerFeedback] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setScannerCondicion(modo === 'ok' ? 'Utilizable' : 'Defectuoso');
  }, [modo]);

  // ID de la devolución si ya existe o se guarda como borrador
  const [devolucionId, setDevolucionId] = useState<string | null>(id && id !== 'nuevo' ? id : null);
  const [dialogoEliminarBorrador, setDialogoEliminarBorrador] = useState(false);

  // Modal de éxito
  const [dialogoExito, setDialogoExito] = useState<{
    open: boolean;
    numero: string;
    totalUnidades: number;
  }>({ open: false, numero: '', totalUnidades: 0 });

  const esSoloLectura = estado === 'Completada' || estado === 'Anulada';
  const draft = useUnsavedChanges(
    { proveedor, almacenId, tipoDocumento, numeroDocumento, fechaDocumento, motivo, documentoRespaldoUrl, items },
    !loading && !esSoloLectura
  );

  // Carga inicial de almacenes (ÚNICAMENTE Bodegas físicas tipo === 1, NUNCA custodias tipo === 2) y Cuentas jurídicas
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [alms, cts] = await Promise.all([
          AlmacenService.getAlmacenes(true),
          ClienteService.obtenerClientes({ soloActivos: true }).catch(() => []),
        ]);
        setAlmacenes((alms || []).filter(a => a.tipo === 1));
        setCuentas(cts || []);

        if (id && id !== 'nuevo') {
          const dev = await DevolucionProveedorService.obtenerPorId(id);
          setDevolucionId(dev.id);
          setNumero(dev.numero);
          setProveedor(dev.proveedor);
          setAlmacenId(dev.almacenId);
          if (dev.ubicacionId) setUbicacionId(dev.ubicacionId);
          setTipoDocumento(dev.tipoDocumento);
          setNumeroDocumento(dev.numeroDocumento);
          setFechaDocumento(dev.fechaDocumento ? new Date(dev.fechaDocumento + 'T00:00:00') : null);
          setMotivo(dev.motivo);
          setObservaciones(dev.observaciones || '');
          setDocumentoRespaldoUrl(dev.documentoRespaldoUrl || null);
          setEstado(dev.estado as any);

          const mappedItems: ItemRetiroDraft[] = [];
          (dev.lineas || []).forEach(l => {
            if (l.series && l.series.length > 0) {
              l.series.forEach(serie => {
                mappedItems.push({
                  idTemp: crypto.randomUUID(),
                  productoId: l.productoId,
                  codigoProducto: l.codigoProducto,
                  nombreProducto: l.nombreProducto,
                  esSerializado: true,
                  numeroSerie: serie,
                  cantidad: 1,
                  condicion: (l.condicion as any) || (modo === 'ok' ? 'Utilizable' : 'Defectuoso'),
                });
              });
            } else {
              mappedItems.push({
                idTemp: crypto.randomUUID(),
                productoId: l.productoId,
                codigoProducto: l.codigoProducto,
                nombreProducto: l.nombreProducto,
                esSerializado: false,
                cantidad: l.cantidad,
                condicion: (l.condicion as any) || (modo === 'ok' ? 'Utilizable' : 'Defectuoso'),
              });
            }
          });
          setItems(mappedItems);

          // Encabezado estático cargado desde el registro existente
          setSavedHeader({
            title: modo === 'ok' ? `Retiro Material OK ${dev.numero}` : `Retiro Defectuoso ${dev.numero}`,
            subtitle: defaultSubtitle,
            numero: dev.numero,
            proveedor: dev.proveedor,
            numeroDocumento: dev.numeroDocumento,
            totalUnidades: dev.totalCantidad,
            fechaEmision: dev.fechaDocumento,
            estado: dev.estado,
          });

          draft.markSaved();
        }
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar la devolución a proveedor.' });
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [id]);

  // Cuando cambia la bodega de origen -> Cargar ÚNICAMENTE los productos y series de la ubicación correspondiente (Devolución vs Disponible)
  useEffect(() => {
    if (!almacenId) {
      setProductosStock([]);
      setSeriesStock([]);
      setUbicacionId(null);
      return;
    }

    const cargarStockAlmacen = async () => {
      try {
        const ubics = await AlmacenService.getUbicaciones(almacenId);

        let ubicOrigen: string | undefined;
        if (modo === 'defectuoso') {
          const uDev = (ubics || []).find(u =>
            u.tipoUbicacionNombre === 'Devolucion' ||
            u.tipoUbicacion === 2 ||
            /devoluci[oó]n|cuarentena|aver[íi]a/i.test(u.codigo || u.nombre || '')
          );
          ubicOrigen = uDev?.id;
        } else {
          const uOk = (ubics || []).find(u =>
            u.tipoUbicacionNombre === 'Disponible' ||
            u.tipoUbicacion === 1 ||
            u.codigo === 'PRINCIPAL' ||
            /disponible|principal/i.test(u.codigo || u.nombre || '')
          ) || ubics?.[0];
          ubicOrigen = uOk?.id;
        }

        setUbicacionId(ubicOrigen || null);

        const [stocks, sers] = await Promise.all([
          InventarioProductoService.obtener(almacenId, undefined, ubicOrigen),
          InventarioProductoService.obtenerSeries(almacenId, undefined, undefined, ubicOrigen),
        ]);
        // Solo productos con existencia en este almacén y ubicación específica
        setProductosStock(stocks || []);
        setSeriesStock(sers || []);
      } catch (err: any) {
        console.error('Error cargando stock del almacén seleccionado:', err);
      }
    };
    void cargarStockAlmacen();
  }, [almacenId, modo]);

  // Opciones de cuentas jurídicas para el selector de proveedor
  const opcionesCuentas: OpcionEntidadRelacionada[] = useMemo(() => {
    return cuentas.map(c => ({
      id: c.id,
      nombre: c.razonSocial || c.nombreCompletoODenominacion,
      detalle: c.documentoIdentidad ? `RUC ${c.documentoIdentidad}` : undefined,
    }));
  }, [cuentas]);

  const cuentaSeleccionada = useMemo(() => {
    if (cuentaSeleccionadaId) {
      const c = cuentas.find(x => x.id === cuentaSeleccionadaId);
      if (c) {
        return {
          id: c.id,
          nombre: c.razonSocial || c.nombreCompletoODenominacion,
          detalle: c.documentoIdentidad ? `RUC ${c.documentoIdentidad}` : undefined,
        };
      }
    }
    if (proveedor) {
      const provUpper = proveedor.trim().toUpperCase();
      const c = cuentas.find(x =>
        (x.razonSocial && x.razonSocial.toUpperCase() === provUpper) ||
        (x.nombreCompletoODenominacion && x.nombreCompletoODenominacion.toUpperCase() === provUpper) ||
        (x.nombres && x.nombres.toUpperCase() === provUpper)
      );
      if (c) {
        return {
          id: c.id,
          nombre: c.razonSocial || c.nombreCompletoODenominacion,
          detalle: c.documentoIdentidad ? `RUC ${c.documentoIdentidad}` : undefined,
        };
      }
      return {
        id: 'manual',
        nombre: proveedor,
        detalle: 'Proveedor ingresado manualmente',
      };
    }
    return null;
  }, [cuentas, cuentaSeleccionadaId, proveedor]);

  // Series que ya fueron agregadas en los ítems actuales para no duplicarlas
  const seriesYaAgregadas = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      if (it.esSerializado && it.numeroSerie) {
        set.add(it.numeroSerie.toUpperCase());
      }
    });
    return set;
  }, [items]);

  // Filtrar existencias de series según el modo de retiro (Defectuoso vs OK)
  const seriesAptasAlmacen = useMemo(() => {
    if (modo === 'defectuoso') {
      return seriesStock.filter(s =>
        s.condicion === 'Defectuoso' ||
        /devoluci[oó]n|cuarentena/i.test(s.nombreUbicacion || '')
      );
    }
    // modo === 'ok'
    return seriesStock.filter(s =>
      s.condicion !== 'Defectuoso' &&
      !/devoluci[oó]n|cuarentena/i.test(s.nombreUbicacion || '')
    );
  }, [seriesStock, modo]);

  // Series libres en el almacén (que aún no han sido agregadas a la devolución)
  const seriesLibresAlmacen = useMemo(() => {
    return seriesAptasAlmacen.filter(s => !seriesYaAgregadas.has(s.numeroSerie.toUpperCase()));
  }, [seriesAptasAlmacen, seriesYaAgregadas]);

  // Productos no seriados disponibles en el almacén
  const productosNoSeriadosStock = useMemo(() => {
    return productosStock.filter(p => !p.esSerializado && p.cantidadDisponible > 0);
  }, [productosStock]);

  // Totales
  const totalUnidades = useMemo(() => {
    return items.reduce((acc, it) => acc + it.cantidad, 0);
  }, [items]);

  // Procesar pistoleo de escáner (SERIE o SKU/CÓDIGO DE BARRAS)
  const procesarEscaneo = (texto: string) => {
    const q = texto.trim().toUpperCase();
    if (!q) return;

    setScannerFeedback(null);

    // 1. Verificar si coincide con una serie disponible en la bodega
    const serieEncontrada = seriesStock.find(s => s.numeroSerie.toUpperCase() === q);
    if (serieEncontrada) {
      if (seriesYaAgregadas.has(q)) {
        setScannerFeedback({ tipo: 'error', texto: `La serie '${q}' ya se encuentra agregada en la lista.` });
        setScannerQuery('');
        return;
      }

      // Validar coherencia con el modo actual (Defectuoso vs OK)
      const esDefectuosa = serieEncontrada.condicion === 'Defectuoso' || /devoluci[oó]n|cuarentena/i.test(serieEncontrada.nombreUbicacion || '');
      if (modo === 'defectuoso' && !esDefectuosa) {
        setScannerFeedback({
          tipo: 'error',
          texto: `La serie '${q}' está en estado 'Disponible'. Si el equipo está averiado o DOA, primero debe registrarse en 'Declaración DOA / Reclasificación'. Para devolver material operativo sin rotación, utilice 'Retiro Material OK hacia OL'.`
        });
        return;
      }
      if (modo === 'ok' && esDefectuosa) {
        setScannerFeedback({
          tipo: 'error',
          texto: `La serie '${q}' está clasificada como 'Defectuoso / Devolución'. Para devolver garantías o equipos averiados al proveedor, utilice 'Retiro Material Defectuoso a OL'.`
        });
        return;
      }

      const prodStock = productosStock.find(p => p.productoId === serieEncontrada.productoId);
      const nuevoItem: ItemRetiroDraft = {
        idTemp: crypto.randomUUID(),
        productoId: serieEncontrada.productoId,
        codigoProducto: serieEncontrada.codigoProducto,
        nombreProducto: serieEncontrada.nombreProducto || prodStock?.nombreProducto || 'Equipo',
        esSerializado: true,
        numeroSerie: serieEncontrada.numeroSerie,
        numeroSmartCard: serieEncontrada.numeroSmartCard,
        cantidad: 1,
        condicion: scannerCondicion,
      };
      setItems(prev => [...prev, nuevoItem]);

      setScannerFeedback({ tipo: 'ok', texto: `✓ Serie '${serieEncontrada.numeroSerie}' agregada (${serieEncontrada.nombreProducto}).` });
      setScannerQuery('');
      scannerInputRef.current?.focus();
      return;
    }

    // 2. Si no es serie directa, buscar por código de producto o código de barras
    const prodEncontrado = productosStock.find(
      p => (p.codigoProducto && p.codigoProducto.toUpperCase() === q) || p.nombreProducto.toUpperCase().includes(q)
    );

    if (prodEncontrado) {
      if (prodEncontrado.esSerializado) {
        setScannerFeedback({
          tipo: 'error',
          texto: `El producto '${prodEncontrado.nombreProducto}' es seriado. Escanee o seleccione el número de serie específico del equipo.`,
        });
        setScannerProductoId(prodEncontrado.productoId);
        return;
      }

      // Es insumo no seriado
      const cant = Math.max(1, parseInt(scannerCantidad, 10) || 1);
      setItems(prev => {
        const existente = prev.find(it => !it.esSerializado && it.productoId === prodEncontrado.productoId);
        if (existente) {
          return prev.map(it =>
            it.idTemp === existente.idTemp ? { ...it, cantidad: it.cantidad + cant } : it
          );
        }
        return [
          ...prev,
          {
            idTemp: crypto.randomUUID(),
            productoId: prodEncontrado.productoId,
            codigoProducto: prodEncontrado.codigoProducto,
            nombreProducto: prodEncontrado.nombreProducto,
            esSerializado: false,
            cantidad: cant,
            condicion: scannerCondicion,
          },
        ];
      });

      setScannerFeedback({ tipo: 'ok', texto: `✓ ${cant} unid. de '${prodEncontrado.nombreProducto}' agregadas.` });
      setScannerQuery('');
      setScannerCantidad('1');
      scannerInputRef.current?.focus();
      return;
    }

    setScannerFeedback({
      tipo: 'error',
      texto: `No se encontró serie ni producto con código '${q}' en las existencias de este almacén.`,
    });
  };

  // Agregar manualmente desde el selector de productos en existencias
  const handleAgregarSeleccionado = () => {
    if (!scannerProductoId) return;

    if (scannerProductoId.startsWith('serie:')) {
      const numSerie = scannerProductoId.replace('serie:', '');
      procesarEscaneo(numSerie);
      setScannerProductoId('');
      return;
    }

    const prod = productosStock.find(p => p.productoId === scannerProductoId);
    if (!prod) return;

    if (prod.esSerializado) {
      setScannerFeedback({
        tipo: 'error',
        texto: `El producto '${prod.nombreProducto}' es seriado. Seleccione una de sus series disponibles en el menú.`,
      });
      return;
    }

    const cant = Math.max(1, parseInt(scannerCantidad, 10) || 1);
    setItems(prev => {
      const existente = prev.find(it => !it.esSerializado && it.productoId === prod.productoId);
      if (existente) {
        return prev.map(it =>
          it.idTemp === existente.idTemp ? { ...it, cantidad: it.cantidad + cant } : it
        );
      }
      return [
        ...prev,
        {
          idTemp: crypto.randomUUID(),
          productoId: prod.productoId,
          codigoProducto: prod.codigoProducto,
          nombreProducto: prod.nombreProducto,
          esSerializado: false,
          cantidad: cant,
          condicion: scannerCondicion,
        },
      ];
    });

    setScannerFeedback({ tipo: 'ok', texto: `✓ ${cant} unid. de '${prod.nombreProducto}' agregadas.` });
    setScannerProductoId('');
    setScannerCantidad('1');
  };

  // Eliminar un ítem o serie individual
  const handleEliminarItem = (idTemp: string) => {
    setItems(prev => prev.filter(it => it.idTemp !== idTemp));
  };

  // Helper para convertir la lista plana de ítems al payload agrupado que espera el API
  const generarLineasPayload = (): LineaDevolucionInput[] => {
    const mapPorProducto = new Map<string, {
      productoId: string;
      cantidad: number;
      condicion: any;
      series: string[];
    }>();

    for (const it of items) {
      const existing = mapPorProducto.get(it.productoId);
      if (existing) {
        existing.cantidad += it.cantidad;
        if (it.esSerializado && it.numeroSerie) {
          existing.series.push(it.numeroSerie);
        }
      } else {
        mapPorProducto.set(it.productoId, {
          productoId: it.productoId,
          cantidad: it.cantidad,
          condicion: it.condicion,
          series: it.esSerializado && it.numeroSerie ? [it.numeroSerie] : [],
        });
      }
    }

    return Array.from(mapPorProducto.values());
  };

  // Definición de columnas D365 para la tabla de ítems
  const columnasItems: TableColumnDefinition<ItemRetiroDraft>[] = useMemo(() => {
    const cols: TableColumnDefinition<ItemRetiroDraft>[] = [
      createTableColumn<ItemRetiroDraft>({
        columnId: 'numeroSerie',
        renderHeaderCell: () => 'N° de Serie / Referencia',
        renderCell: (item) => (
          <TableCellLayout truncate>
            {item.esSerializado && item.numeroSerie ? (
              <div>
                <Text
                  weight="semibold"
                  style={{ fontFamily: 'Consolas, monospace', color: tokens.colorBrandForeground1 }}
                >
                  {item.numeroSerie}
                </Text>
                {item.numeroSmartCard && (
                  <Text
                    size={100}
                    style={{
                      display: 'block',
                      color: tokens.colorNeutralForeground3,
                      fontFamily: 'Consolas, monospace',
                    }}
                  >
                    SC/MAC: {item.numeroSmartCard}
                  </Text>
                )}
              </div>
            ) : (
              <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
                Material no seriado
              </Text>
            )}
          </TableCellLayout>
        ),
      }),
      createTableColumn<ItemRetiroDraft>({
        columnId: 'producto',
        renderHeaderCell: () => 'Producto / Modelo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text weight="medium">{item.nombreProducto}</Text>
            <Text size={100} style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
              {item.codigoProducto}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ItemRetiroDraft>({
        columnId: 'tipo',
        renderHeaderCell: () => 'Tipo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Badge appearance="tint" color={item.esSerializado ? 'brand' : 'informative'}>
              {item.esSerializado ? 'Equipo Seriado' : 'Insumo / Material'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ItemRetiroDraft>({
        columnId: 'cantidad',
        renderHeaderCell: () => 'Cantidad',
        renderCell: (item) => (
          <TableCellLayout>
            <Text weight="semibold">{item.cantidad}</Text>
          </TableCellLayout>
        ),
      }),
    ];

    if (!esSoloLectura) {
      cols.push(
        createTableColumn<ItemRetiroDraft>({
          columnId: 'acciones',
          renderHeaderCell: () => 'Acción',
          renderCell: (item) => (
            <TableCellLayout style={{ justifyContent: 'center' }}>
              <Button
                appearance="subtle"
                icon={<Delete16Regular />}
                size="small"
                onClick={() => handleEliminarItem(item.idTemp)}
                title="Quitar ítem"
                aria-label="Quitar ítem"
              />
            </TableCellLayout>
          ),
        })
      );
    }

    return cols;
  }, [esSoloLectura]);

  // Guardar Borrador (sin afectar inventario ni Kardex)
  const handleGuardar = async (cerrar: boolean) => {
    setMensaje(null);
    if (!proveedor.trim()) {
      setSelectedTab('general');
      setMensaje({ tipo: 'error', texto: 'Ingrese la empresa proveedora destinataria.' });
      return;
    }
    if (!almacenId) {
      setSelectedTab('general');
      setMensaje({ tipo: 'error', texto: 'Seleccione la bodega de origen de donde saldrá el material.' });
      return;
    }

    try {
      setSubmitting(true);
      const fechaStr = fechaDocumento ? fechaDocumento.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      const lineasPayload = generarLineasPayload();

      let currentId = devolucionId;

      if (currentId) {
        // Actualizar borrador existente
        await DevolucionProveedorService.actualizar(currentId, {
          proveedor: proveedor.trim(),
          almacenId,
          ubicacionId: ubicacionId || null,
          tipoDocumento: tipoDocumento.trim() || 'Guía de Remisión',
          numeroDocumento: numeroDocumento.trim() || 'POR DEFINIR',
          fechaDocumento: fechaStr,
          motivo: motivo.trim() || 'Garantía / Falla de Fábrica',
          observaciones: observaciones.trim() || null,
          documentoRespaldoUrl: documentoRespaldoUrl || null,
          lineas: lineasPayload,
        });
      } else {
        // Crear nuevo borrador
        const res = await DevolucionProveedorService.crear({
          proveedor: proveedor.trim(),
          almacenId,
          ubicacionId: ubicacionId || null,
          tipoDocumento: tipoDocumento.trim() || 'Guía de Remisión',
          numeroDocumento: numeroDocumento.trim() || 'POR DEFINIR',
          fechaDocumento: fechaStr,
          motivo: motivo.trim() || 'Garantía / Falla de Fábrica',
          observaciones: observaciones.trim() || null,
          documentoRespaldoUrl: documentoRespaldoUrl || null,
          lineas: lineasPayload,
          esBorrador: true,
        });
        currentId = res.id;
        setDevolucionId(res.id);
      }

      setSavedHeader({
        title: modo === 'ok' ? `Retiro Material OK ${numero !== 'Nuevo' ? numero : 'Borrador'}` : `Retiro Defectuoso ${numero !== 'Nuevo' ? numero : 'Borrador'}`,
        subtitle: defaultSubtitle,
        numero: numero !== 'Nuevo' ? numero : 'Borrador',
        proveedor: proveedor.trim(),
        numeroDocumento: numeroDocumento.trim() || '—',
        totalUnidades,
        fechaEmision: fechaStr,
        estado: 'Borrador',
      });

      draft.markSaved();

      if (cerrar) {
        navigate(baseRoute, {
          state: { successMessage: 'Borrador guardado exitosamente.' },
        });
      } else {
        setMensaje({ tipo: 'success', texto: 'Borrador guardado exitosamente.' });
        if (!devolucionId && currentId) {
          navigate(`${baseRoute}/${currentId}`, { replace: true });
        }
      }
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar el borrador.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Guardar y Completar Devolución (rebaja stock y registra Kardex)
  const handleConfirmarDevolucion = async () => {
    setMensaje(null);

    if (!proveedor.trim()) {
      setSelectedTab('general');
      setMensaje({ tipo: 'error', texto: 'Ingrese la empresa proveedora destinataria.' });
      return;
    }
    if (!almacenId) {
      setSelectedTab('general');
      setMensaje({ tipo: 'error', texto: 'Seleccione la bodega de origen de donde saldrá el material.' });
      return;
    }
    if (!tipoDocumento.trim()) {
      setSelectedTab('general');
      setMensaje({ tipo: 'error', texto: 'Seleccione el tipo de documento o acta de salida.' });
      return;
    }
    if (!numeroDocumento.trim()) {
      setSelectedTab('general');
      setMensaje({ tipo: 'error', texto: 'Ingrese el número de guía o acta de entrega firmada.' });
      return;
    }
    if (!fechaDocumento) {
      setSelectedTab('general');
      setMensaje({ tipo: 'error', texto: 'Seleccione la fecha de devolución / retiro.' });
      return;
    }
    if (!motivo.trim()) {
      setSelectedTab('general');
      setMensaje({ tipo: 'error', texto: 'Seleccione el motivo de la devolución.' });
      return;
    }
    if (items.length === 0) {
      setSelectedTab('productos');
      setMensaje({ tipo: 'error', texto: 'Agregue al menos un material o equipo para procesar la devolución.' });
      return;
    }

    try {
      setSubmitting(true);
      const fechaStr = fechaDocumento.toISOString().slice(0, 10);
      const lineasPayload = generarLineasPayload();

      let finalId = devolucionId;

      if (finalId) {
        // Actualizar primero los datos y líneas del borrador
        await DevolucionProveedorService.actualizar(finalId, {
          proveedor: proveedor.trim(),
          almacenId,
          ubicacionId: ubicacionId || null,
          tipoDocumento: tipoDocumento.trim(),
          numeroDocumento: numeroDocumento.trim(),
          fechaDocumento: fechaStr,
          motivo: motivo.trim(),
          observaciones: observaciones.trim() || null,
          documentoRespaldoUrl: documentoRespaldoUrl || null,
          lineas: lineasPayload,
        });
        // Completar la devolución (descuenta stock, kardex y series)
        await DevolucionProveedorService.completar(finalId);
      } else {
        // Crear directamente completada
        const res = await DevolucionProveedorService.crear({
          proveedor: proveedor.trim(),
          almacenId,
          ubicacionId: ubicacionId || null,
          tipoDocumento: tipoDocumento.trim(),
          numeroDocumento: numeroDocumento.trim(),
          fechaDocumento: fechaStr,
          motivo: motivo.trim(),
          observaciones: observaciones.trim() || null,
          documentoRespaldoUrl: documentoRespaldoUrl || null,
          lineas: lineasPayload,
          esBorrador: false,
        });
        finalId = res.id;
        setDevolucionId(res.id);
      }

      setEstado('Completada');

      // Actualizar encabezado estático ÚNICAMENTE al guardar exitosamente
      setSavedHeader({
        title: modo === 'ok' ? `Retiro Material OK ${numero !== 'Nuevo' ? numero : ''}` : `Retiro Defectuoso ${numero !== 'Nuevo' ? numero : ''}`,
        subtitle: defaultSubtitle,
        numero: numero !== 'Nuevo' ? numero : '',
        proveedor: proveedor.trim(),
        numeroDocumento: numeroDocumento.trim(),
        totalUnidades,
        fechaEmision: fechaStr,
        estado: 'Completada',
      });

      draft.markSaved();
      setDialogoExito({
        open: true,
        numero: numero !== 'Nuevo' ? numero : finalId || '',
        totalUnidades,
      });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al procesar la devolución a proveedor.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar borrador
  const handleEliminarBorrador = async () => {
    if (!devolucionId) return;
    try {
      setSubmitting(true);
      await DevolucionProveedorService.eliminar(devolucionId);
      draft.markSaved();
      navigate(baseRoute, {
        state: { successMessage: 'Borrador eliminado correctamente.' },
      });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al eliminar el borrador.' });
      setDialogoEliminarBorrador(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="large" label="Cargando formulario de devolución a proveedor..." />
      </div>
    );
  }

  return (
    <div className={formStyles.root}>
      {/* 1. Command Bar */}
      <D365CommandBar ariaLabel={modo === 'ok' ? 'Comandos de Retiro Material OK hacia OL' : 'Comandos de Retiro Material Defectuoso a OL'}>
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Volver"
            title="Volver"
            onClick={() => {
              if (esSoloLectura) draft.markSaved();
              navigate(baseRoute);
            }}
          />
          <D365CommandDivider />

          {!esSoloLectura && (
            <>
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
              <D365CommandDivider />
              <D365CommandButton
                icon={<ArrowExit16Regular />}
                tone="create"
                appearance="primary"
                onClick={() => void handleConfirmarDevolucion()}
                disabled={submitting || items.length === 0}
              >
                {submitting ? 'Procesando...' : (modo === 'ok' ? 'Completar Retiro OK' : 'Completar Retiro Defectuoso')}
              </D365CommandButton>
              {devolucionId && estado === 'Borrador' && (
                <D365CommandButton
                  icon={<Delete16Regular />}
                  tone="danger"
                  disabled={submitting}
                  onClick={() => setDialogoEliminarBorrador(true)}
                >
                  Eliminar borrador
                </D365CommandButton>
              )}
              <D365CommandDivider />
            </>
          )}

          {devolucionId && (
            <>
              <D365CommandButton
                icon={<ArrowDownload16Regular />}
                onClick={() => void DevolucionProveedorService.descargarCargoPdf(devolucionId, numero)}
              >
                Cargo PDF
              </D365CommandButton>
              <D365CommandButton
                icon={<Print16Regular />}
                onClick={() => void DevolucionProveedorService.abrirCargoPdf(devolucionId)}
              >
                Imprimir
              </D365CommandButton>
              <D365CommandButton
                icon={<WhatsAppIcon size={16} />}
                onClick={() => void DevolucionProveedorService.compartirCargoWhatsapp(devolucionId, numero, {
                  destinatario: proveedor,
                  tipoOperacion: modo === 'ok' ? 'Retiro Material OK hacia OL' : 'Retiro Material Defectuoso a OL',
                })}
              >
                WhatsApp
              </D365CommandButton>
              <D365CommandDivider />
            </>
          )}

          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            disabled={submitting}
            onClick={() => {
              if (esSoloLectura) draft.markSaved();
              if (id && id !== 'nuevo') {
                navigate(`${baseRoute}/nuevo`);
              } else {
                window.location.href = `${baseRoute}/nuevo`;
              }
            }}
          >
            Nuevo
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. Header Estático con Process Flow y Pestañas */}
      <D365EntityHeader
        title={savedHeader.title || (numero === 'Nuevo' ? defaultTitle : (modo === 'ok' ? `Retiro Material OK ${numero}` : `Retiro Defectuoso ${numero}`))}
        subtitle={savedHeader.subtitle || defaultSubtitle}
        avatarIcon={
          modo === 'ok' ? (
            <ArrowReply16Regular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
          ) : (
            <ArrowExit16Regular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
          )
        }
        metadata={[
          { label: 'Destinatario', value: savedHeader.proveedor },
          { label: 'N° Documento', value: savedHeader.numeroDocumento },
          { label: 'Total Unidades', value: String(savedHeader.totalUnidades) },
          { label: 'Fecha Emisión', value: savedHeader.fechaEmision },
          {
            label: 'Estado',
            value: (
              <Badge
                appearance="filled"
                shape="rounded"
                color={
                  estado === 'Completada' ? 'success' : estado === 'Anulada' ? 'danger' : 'warning'
                }
                size="small"
              >
                {estado}
              </Badge>
            ) as any,
          },
        ]}
        processFlow={
          <TransferenciaEtapas
            estado={estado}
            tipoOperacion={modo === 'ok' ? 'RetiroOk' : 'RetiroDefectuoso'}
            embedded
          />
        }
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as 'general' | 'productos' | 'adjuntos')}
          >
            <Tab value="general">General</Tab>
            <Tab value="productos">
              Productos {items.length > 0 ? `(${totalUnidades})` : ''}
            </Tab>
            <Tab value="adjuntos">
              Documentos y Fotos {documentoRespaldoUrl ? '(1)' : ''}
            </Tab>
          </TabList>
        }
      />

      {/* 3. Mensajes */}
      {mensaje && (
        <div style={{ margin: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}` }}>
          <D365MessageBar intent={mensaje.tipo === 'error' ? 'error' : 'success'} onDismiss={() => setMensaje(null)}>
            {mensaje.texto}
          </D365MessageBar>
        </div>
      )}

      {/* 4. Form Content estructurado por pestañas */}
      <D365FormContent busy={submitting} className={formStyles.contentBody}>
        {/* Pestaña 1: General */}
        {selectedTab === 'general' && (
          <div className={formStyles.card}>
            <div className={formStyles.cardSectionTitle}>1. Datos del Proveedor y Comprobante de Salida</div>
            <div className={formStyles.grid2Cols}>
              <D365FormField label="Empresa Proveedora (Cuenta Destinataria)" required info="Seleccione la cuenta jurídica del catálogo de clientes (ej: DIRECTV PERU S.R.L.)">
                <SelectorEntidadRelacionada
                  etiquetaGrupo="Cuentas y Proveedores"
                  opciones={opcionesCuentas}
                  seleccionada={cuentaSeleccionada}
                  textoBusqueda={busquedaCuenta}
                  alCambiarBusqueda={setBusquedaCuenta}
                  alSeleccionar={(id) => {
                    if (id && id !== 'manual') {
                      const c = cuentas.find(x => x.id === id);
                      setCuentaSeleccionadaId(id);
                      setProveedor(c?.razonSocial || c?.nombreCompletoODenominacion || '');
                    } else {
                      setCuentaSeleccionadaId(null);
                      setProveedor('');
                    }
                  }}
                  alCrearNuevo={(nombre) => {
                    setCuentaSeleccionadaId(null);
                    setProveedor(nombre);
                  }}
                  alNavegar={(id) => {
                    if (id && id !== 'manual') {
                      window.open(`/servicio-campo/cuentas/${id}`, '_blank');
                    }
                  }}
                  icono={<Building16Regular />}
                  tituloEnlace="Ver ficha de la cuenta"
                  deshabilitado={esSoloLectura || submitting}
                />
              </D365FormField>

              <D365FormField label="Bodega de Origen (Salida de Stock)" required>
                <Select
                  value={almacenId}
                  disabled={esSoloLectura || submitting}
                  onChange={(_, d) => {
                    setAlmacenId(d.value);
                    setItems([]);
                    setScannerFeedback(null);
                  }}
                >
                  <option value="">Seleccione bodega de origen...</option>
                  {almacenes.filter(a => a.tipo === 1).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </Select>
              </D365FormField>

              <D365FormField label="Tipo de Documento / Acta" required>
                <Select
                  value={tipoDocumento}
                  disabled={esSoloLectura || submitting}
                  onChange={(_, d) => setTipoDocumento(d.value)}
                >
                  <option value="">Seleccione tipo de documento...</option>
                  <option value="Guía de Remisión">Guía de Remisión</option>
                  <option value="Acta de Devolución">Acta de Devolución</option>
                  <option value="Constancia de Retiro">Constancia de Retiro</option>
                  <option value="Nota de Salida">Nota de Salida</option>
                </Select>
              </D365FormField>

              <D365FormField label="Número de Guía / Acta de la Empresa" required>
                <Input
                  value={numeroDocumento}
                  disabled={esSoloLectura || submitting}
                  onChange={(_, d) => setNumeroDocumento(d.value)}
                />
              </D365FormField>

              <D365FormField label="Fecha de Devolución / Retiro" required>
                <DatePicker
                  value={fechaDocumento}
                  onSelectDate={d => setFechaDocumento(d || null)}
                  formatDate={d => (d ? d.toLocaleDateString('es-PE') : '')}
                  disabled={esSoloLectura || submitting}
                />
              </D365FormField>

              <D365FormField label={modo === 'ok' ? 'Motivo del Retiro (Material OK)' : 'Motivo del Retiro (Material Defectuoso)'} required>
                <Select
                  value={motivo}
                  disabled={esSoloLectura || submitting}
                  onChange={(_, d) => setMotivo(d.value)}
                >
                  <option value="">Seleccione motivo...</option>
                  {modo === 'ok' ? (
                    <>
                      <option value="Retiro Material OK (>60 días sin activación)">Retiro Material OK (&gt;60 días sin activación)</option>
                      <option value="Exceso de Inventario / Sobrestock">Exceso de Inventario / Sobrestock</option>
                      <option value="Desmovilización de Material">Desmovilización de Material</option>
                      <option value="Devolución por Cese de Contrato">Devolución por Cese de Contrato</option>
                    </>
                  ) : (
                    <>
                      <option value="Garantía por Falla / Avería (DOA)">Garantía por Falla / Avería (DOA)</option>
                      <option value="Equipo Inoperativo Irreparable / Daño">Equipo Inoperativo Irreparable / Daño</option>
                      <option value="Defecto de Fábrica / Retiro de Lote Averiado">Defecto de Fábrica / Retiro de Lote Averiado</option>
                    </>
                  )}
                </Select>
              </D365FormField>

              <D365FormField label="Observaciones">
                <Input
                  value={observaciones}
                  disabled={esSoloLectura || submitting}
                  onChange={(_, d) => setObservaciones(d.value)}
                />
              </D365FormField>
            </div>
          </div>
        )}

        {/* Pestaña 2: Productos */}
        {selectedTab === 'productos' && (
          <div className={formStyles.card}>
            <div className={formStyles.cardSectionTitle}>
              2. Materiales y Equipos a Devolver ({items.length} ítems, {totalUnidades} unidades)
            </div>

            {!almacenId ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: tokens.colorNeutralForeground3 }}>
                <p style={{ margin: '0 0 12px 0' }}>
                  Seleccione primero la <strong>Bodega de Origen</strong> en la pestaña General para cargar los materiales y series disponibles en inventario.
                </p>
                <Button appearance="outline" onClick={() => setSelectedTab('general')}>
                  Ir a pestaña General
                </Button>
              </div>
            ) : (
              <>
                {/* Panel de Pistoleo y Selección rápida */}
                {!esSoloLectura && (
                  <div className={styles.scannerPanel}>
                    <div className={styles.scannerGrid}>
                      {/* Campo 1: Pistoleo directo de Serie / SKU */}
                      <div className={styles.scannerField}>
                        <label className={styles.scannerLabel}>
                          Pistola / Escaneo de Serie o SKU
                        </label>
                        <Input
                          ref={scannerInputRef}
                          contentBefore={<BarcodeScanner20Regular style={{ color: tokens.colorBrandForeground1 }} />}
                          value={scannerQuery}
                          onChange={(_, d) => setScannerQuery(d.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              procesarEscaneo(scannerQuery);
                            }
                          }}
                        />
                      </div>

                      {/* Campo 2: Menú de selección de materiales en existencias */}
                      <div className={styles.scannerField}>
                        <label className={styles.scannerLabel}>
                          O seleccionar de existencias ({productosNoSeriadosStock.length} materiales, {seriesLibresAlmacen.length} series)
                        </label>
                        <Select
                          value={scannerProductoId}
                          onChange={(_, d) => {
                            setScannerProductoId(d.value);
                            setScannerFeedback(null);
                          }}
                        >
                          <option value="">Seleccione material o serie...</option>
                          {productosNoSeriadosStock.length > 0 && (
                            <optgroup label={modo === 'ok' ? 'Insumos / Materiales Disponibles' : 'Materiales Averiados en Devolución'}>
                              {productosNoSeriadosStock.map(p => (
                                <option key={p.productoId} value={p.productoId}>
                                  {p.codigoProducto} — {p.nombreProducto} (Cant: {p.cantidadDisponible} {p.nombreUnidadMedida || 'UND'})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {seriesLibresAlmacen.length > 0 && (
                            <optgroup label={modo === 'ok' ? 'Series Disponibles en Almacén' : 'Equipos Averiados en Devolución'}>
                              {seriesLibresAlmacen.map(s => (
                                <option key={s.id} value={`serie:${s.numeroSerie}`}>
                                  [Serie: {s.numeroSerie}] — {s.nombreProducto}{modo === 'ok' && s.diasEnAlmacen != null ? ` (${s.diasEnAlmacen} d en almacén)` : ''}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </Select>
                      </div>

                      {/* Campo: Cantidad (para insumos) */}
                      <div className={styles.scannerField}>
                        <label className={styles.scannerLabel}>Cantidad</label>
                        <Input
                          type="number"
                          min="1"
                          value={scannerCantidad}
                          onChange={(_, d) => setScannerCantidad(d.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (scannerProductoId) handleAgregarSeleccionado();
                              else if (scannerQuery) procesarEscaneo(scannerQuery);
                            }
                          }}
                        />
                      </div>

                      {/* Botón Agregar */}
                      <Button
                        appearance="primary"
                        icon={<Add16Regular />}
                        onClick={() => {
                          if (scannerProductoId) handleAgregarSeleccionado();
                          else if (scannerQuery) procesarEscaneo(scannerQuery);
                        }}
                        disabled={!scannerQuery.trim() && !scannerProductoId}
                      >
                        Agregar
                      </Button>
                    </div>

                    {/* Feedback del escaneo */}
                    {scannerFeedback && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: tokens.fontSizeBase200,
                          color: scannerFeedback.tipo === 'ok' ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: tokens.fontWeightSemibold,
                        }}
                      >
                        {scannerFeedback.tipo === 'ok' ? <CheckmarkCircle16Filled /> : <Warning16Filled />}
                        <span>{scannerFeedback.texto}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tabla DataGrid Estándar D365 */}
                <div className={styles.tableWrapper}>
                  {items.length === 0 ? (
                    <TableEmptyState
                      icon={<BarcodeScanner20Regular style={{ fontSize: 36, color: tokens.colorNeutralForeground4 }} />}
                      message="No se han agregado materiales al retiro"
                    >
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Pistolee una serie o seleccione un material arriba para agregarlo al documento.
                      </Text>
                    </TableEmptyState>
                  ) : (
                    <DataGrid
                      items={items}
                      columns={columnasItems}
                      getRowId={(item) => item.idTemp}
                      size="medium"
                      style={{ width: '100%' }}
                    >
                      <DataGridHeader>
                        <DataGridRow>
                          {({ renderHeaderCell }) => (
                            <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                          )}
                        </DataGridRow>
                      </DataGridHeader>
                      <DataGridBody<ItemRetiroDraft>>
                        {({ item, rowId }) => (
                          <DataGridRow<ItemRetiroDraft> key={rowId}>
                            {({ renderCell }) => (
                              <DataGridCell>{renderCell(item)}</DataGridCell>
                            )}
                          </DataGridRow>
                        )}
                      </DataGridBody>
                    </DataGrid>
                  )}
                </div>

                {items.length > 0 && (
                  <div className={styles.totalsBar}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                      Total de líneas registradas: <strong>{items.length}</strong>
                    </Text>
                    <Text weight="semibold" size={300}>
                      Total unidades a retirar: {totalUnidades}
                    </Text>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Pestaña 3: Documentos y Fotos de Respaldo */}
        {selectedTab === 'adjuntos' && (
          <div>
            <DocumentoRespaldoUpload
              url={documentoRespaldoUrl}
              onUrlChange={setDocumentoRespaldoUrl}
              disabled={esSoloLectura || submitting}
              titulo="Documento de Respaldo Firmado (Guía / Acta de Entrega)"
              descripcion="Adjunte la fotografía o escaneo PDF del documento firmado por la empresa que recoge el material devuelto como respaldo legal."
            />
          </div>
        )}
      </D365FormContent>

      {/* Diálogo de Operación Exitosa */}
      <Dialog
        open={dialogoExito.open}
        onOpenChange={(_, data) => {
          if (!data.open) {
            setDialogoExito({ open: false, numero: '', totalUnidades: 0 });
            navigate(baseRoute);
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {modo === 'ok' ? '¡Retiro de Material OK Completado!' : '¡Retiro de Material Defectuoso Completado!'}
            </DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, marginTop: tokens.spacingVerticalM }}>
                <Text>
                  {modo === 'ok'
                    ? 'Se ha registrado exitosamente el retiro de material OK '
                    : 'Se ha registrado exitosamente el retiro de material defectuoso '}
                  <strong>{dialogoExito.numero}</strong>.
                </Text>
                <div style={{ backgroundColor: tokens.colorNeutralBackground3, padding: tokens.spacingVerticalM, borderRadius: tokens.borderRadiusMedium }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', fontSize: tokens.fontSizeBase200 }}>
                    <span style={{ color: tokens.colorNeutralForeground3 }}>Proveedor:</span>
                    <strong>{proveedor}</strong>
                    <span style={{ color: tokens.colorNeutralForeground3 }}>N° Documento:</span>
                    <strong>{numeroDocumento}</strong>
                    <span style={{ color: tokens.colorNeutralForeground3 }}>Total Unidades:</span>
                    <strong>{dialogoExito.totalUnidades} unidades</strong>
                    <span style={{ color: tokens.colorNeutralForeground3 }}>Estado Equipos:</span>
                    <span style={{ color: tokens.colorPaletteGreenForeground1 }}>Devuelto a Proveedor (Permite reingreso si retorna)</span>
                  </div>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                onClick={() => {
                  setDialogoExito({ open: false, numero: '', totalUnidades: 0 });
                  navigate(baseRoute);
                }}
              >
                Aceptar y Volver al Listado
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Diálogo Confirmar Eliminación de Borrador */}
      <Dialog open={dialogoEliminarBorrador} onOpenChange={(_, data) => setDialogoEliminarBorrador(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Eliminar borrador</DialogTitle>
            <DialogContent>
              ¿Está seguro de que desea eliminar este borrador de devolución a proveedor? Esta acción no se puede deshacer.
            </DialogContent>
            <DialogActions>
              <Button appearance="subtle" onClick={() => setDialogoEliminarBorrador(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                onClick={handleEliminarBorrador}
                disabled={submitting}
                style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: 'white' }}
              >
                {submitting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

