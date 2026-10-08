import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  Toast,
  Toaster,
  ToastTitle,
  useId,
  useToastController,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  createTableColumn,
  TableCellLayout,
  type TableColumnDefinition,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  Delete16Regular,
  ArrowDownload16Regular,
  Print16Regular,
  VehicleTruckProfile16Regular,
  Box16Regular,
  Person16Regular,
  Search16Regular,
  Dismiss16Regular,
  Warning16Filled,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { SelectorEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { WhatsAppIcon } from '../../../../components/common/WhatsAppIcon';
import { D365OperacionExitosaDialog } from '../../../../components/common/D365OperacionExitosaDialog';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { AlmacenService } from '../../almacenes/services/almacen.service';
import type { AlmacenDto, UbicacionInventarioDto } from '../../almacenes/types/almacen.types';
import { OrganizacionService } from '../../../organizacion/services/organizacion.service';
import type { RecursoDto } from '../../../organizacion/types/organizacion.types';
import { InventarioProductoService } from '../../inventario-productos/services/inventario-producto.service';
import type { InventarioProductoDto, ItemSeriadoStockDto } from '../../inventario-productos/types/inventario-producto.types';
import { TransferenciaService } from '../services/transferencia.service';
import { TransferenciaEtapas } from '../components/TransferenciaEtapas';

const useStyles = makeStyles({
  gridRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    '@media (max-width: 1100px)': {
      gridTemplateColumns: '1fr',
    },
  },
  scannerPanel: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px',
    marginBottom: '16px',
  },
  scannerGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1.2fr) minmax(260px, 1.8fr) 100px 140px auto',
    gap: '12px',
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
    marginTop: '8px',
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
  errorText: {
    ...typographyStyles.caption2,
    color: tokens.colorPaletteRedForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
  },
  seriesBadgeList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    maxHeight: '120px',
    overflowY: 'auto',
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
  const { id } = useParams<{ id?: string }>();

  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [tecnicos, setTecnicos] = useState<RecursoDto[]>([]);
  const [, setUbicacionesOrigen] = useState<UbicacionInventarioDto[]>([]);
  const [productosStock, setProductosStock] = useState<InventarioProductoDto[]>([]);

  // Form states
  const [transferenciaId, setTransferenciaId] = useState<string | null>(null);
  const [numeroTransferencia, setNumeroTransferencia] = useState('');
  const [estado, setEstado] = useState<string>('Borrador');
  const operacionIdRef = React.useRef<string>(crypto.randomUUID());

  const [almacenOrigenId, setAlmacenOrigenId] = useState('');
  const [busquedaAlmacen, setBusquedaAlmacen] = useState('');
  const [ubicacionOrigenId, setUbicacionOrigenId] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [busquedaTecnico, setBusquedaTecnico] = useState('');
  const [numeroGuiaRemision, setNumeroGuiaRemision] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [selectedTab, setSelectedTab] = useState<'general' | 'productos'>('general');

  // Estados escáner Symbar
  const [todasSeriesStock, setTodasSeriesStock] = useState<ItemSeriadoStockDto[]>([]);
  const [scannerQuery, setScannerQuery] = useState('');
  const [scannerCantidad, setScannerCantidad] = useState('1');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerInputRef = React.useRef<HTMLInputElement>(null);

  // Estados de eliminación de borrador
  const [dialogEliminarBorrador, setDialogEliminarBorrador] = useState(false);
  const [eliminandoBorrador, setEliminandoBorrador] = useState(false);
  const [productoSeleccionadoScanner, setProductoSeleccionadoScanner] = useState<InventarioProductoDto | null>(null);
  const [serieSeleccionadaScanner, setSerieSeleccionadaScanner] = useState<ItemSeriadoStockDto | null>(null);

  const [lineas, setLineas] = useState<LineaDespacho[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const toasterId = useId('despacho-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const notifySuccess = useCallback((title: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  // Modal de éxito
  const [despachoExitoso, setDespachoExitoso] = useState<{
    id?: string;
    numero: string;
    tecnicoNombre?: string;
    almacenOrigenNombre?: string;
    guiaRemision?: string;
    totalItems?: number;
    totalLineas?: number;
  } | null>(null);

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

        if (id && id !== 'nuevo') {
          const det = await TransferenciaService.obtenerDetalle(id);
          setTransferenciaId(det.id);
          if (det.operacionId) operacionIdRef.current = det.operacionId;
          setNumeroTransferencia(det.numero);
          if (det.numeroGuiaRemision) setNumeroGuiaRemision(det.numeroGuiaRemision);
          setEstado(det.estado || 'Borrador');
          setAlmacenOrigenId(det.almacenOrigenId);
          setUbicacionOrigenId(det.ubicacionOrigenId || '');
          setObservaciones(det.observaciones || '');

          // Encontrar almacén de destino (custodia) y técnico asociado
          const almDestino = alms.find(a => a.id === det.almacenDestinoId);
          if (almDestino?.recursoId) {
            setTecnicoId(almDestino.recursoId);
          } else {
            const tec = tecs.find(t => t.id === det.almacenDestinoId || t.nombreCompleto === det.almacenDestinoNombre);
            if (tec) setTecnicoId(tec.id);
          }

          if (det.lineas && det.lineas.length > 0) {
            setLineas(
              det.lineas.map(l => ({
                idTemp: l.id,
                productoId: l.productoId,
                codigo: l.codigoProducto,
                nombre: l.productoNombre,
                unidad: l.unidadMedidaNombre || 'UND',
                cantidad: l.cantidadEnviada,
                series: l.series ? l.series.map(s => s.numeroSerie) : [],
              }))
            );
            setSelectedTab('productos');
          }
        } else {
          // Preseleccionar primera bodega si existe
          const bodegas = alms.filter(a => a.tipo === 1);
          if (bodegas.length > 0) {
            setAlmacenOrigenId(bodegas[0].id);
          }
        }
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar los datos del despacho.' });
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [id]);

  // Cargar ubicaciones y stock de la bodega origen
  useEffect(() => {
    if (!almacenOrigenId) {
      setUbicacionesOrigen([]);
      setProductosStock([]);
      setTodasSeriesStock([]);
      return;
    }
    const cargarOrigen = async () => {
      try {
        const [ubics, stocks, sers] = await Promise.all([
          AlmacenService.getUbicaciones(almacenOrigenId),
          InventarioProductoService.obtener(almacenOrigenId),
          InventarioProductoService.obtenerSeries(almacenOrigenId),
        ]);
        setUbicacionesOrigen(ubics);
        if (ubics.length > 0) {
          const principal = ubics.find(u => u.codigo === 'PRINCIPAL') || ubics[0];
          setUbicacionOrigenId(prev => prev || principal.id);
        }
        setProductosStock(stocks);
        setTodasSeriesStock(sers);
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

  const opcionesAlmacenes = useMemo(() => {
    const bodegas = almacenes.filter(a => a.tipo === 1);
    return bodegas.map(b => ({
      id: b.id,
      nombre: b.nombre,
      detalle: `${b.codigo || 'BOD'} · ${b.unidadOrganizativaNombre || 'Central'}`,
    }));
  }, [almacenes]);

  const almacenSeleccionado = useMemo(() => {
    return opcionesAlmacenes.find(o => o.id === almacenOrigenId) || null;
  }, [opcionesAlmacenes, almacenOrigenId]);

  const almacenOrigenObj = useMemo(() => {
    return almacenes.find(a => a.id === almacenOrigenId) || null;
  }, [almacenes, almacenOrigenId]);

  const tecnicosFiltrados = useMemo(() => {
    if (!almacenOrigenObj?.unidadOrganizativaId) {
      return tecnicos;
    }
    return tecnicos.filter(t => !t.unidadOrganizativaId || t.unidadOrganizativaId === almacenOrigenObj.unidadOrganizativaId);
  }, [tecnicos, almacenOrigenObj]);

  const opcionesTecnicos = useMemo(() => {
    return tecnicosFiltrados.map(t => ({
      id: t.id,
      nombre: t.nombreCompleto,
      detalle: `${t.documentoIdentidad ? `DNI: ${t.documentoIdentidad} · ` : ''}${t.unidadOrganizativaNombre || 'Cuadrilla de Campo'}`,
    }));
  }, [tecnicosFiltrados]);

  const tecnicoSeleccionado = useMemo(() => {
    const seleccionado = tecnicos.find(t => t.id === tecnicoId);
    if (!seleccionado) return null;
    return {
      id: seleccionado.id,
      nombre: seleccionado.nombreCompleto,
      detalle: `${seleccionado.documentoIdentidad ? `DNI: ${seleccionado.documentoIdentidad} · ` : ''}${seleccionado.unidadOrganizativaNombre || 'Cuadrilla de Campo'}`,
    };
  }, [tecnicos, tecnicoId]);

  // Series libres del almacén (que no están ya asignadas en lineas)
  const seriesLibresAlmacen = useMemo(() => {
    const seriesUsadas = new Set(lineas.flatMap((l) => l.series));
    return todasSeriesStock.filter((s) => !seriesUsadas.has(s.numeroSerie));
  }, [todasSeriesStock, lineas]);

  // PROCESAR BÚSQUEDA DEL SCANNER SYMBAR (SKU O SERIE)
  const procesarScannerBusqueda = (query: string) => {
    const q = query.trim().toUpperCase();
    if (!q) {
      setScannerError(null);
      return;
    }

    setScannerError(null);

    // 1. Verificar si coincide con una serie disponible en almacén
    const serieEncontrada = seriesLibresAlmacen.find(
      (s) => s.numeroSerie.toUpperCase() === q
    );

    if (serieEncontrada) {
      setSerieSeleccionadaScanner(serieEncontrada);
      const prodOriginal = productosStock.find((p) => p.productoId === serieEncontrada.productoId);
      setProductoSeleccionadoScanner(
        prodOriginal || {
          stockId: '',
          productoId: serieEncontrada.productoId,
          codigoProducto: serieEncontrada.codigoProducto,
          nombreProducto: serieEncontrada.nombreProducto,
          almacenId: almacenOrigenId,
          nombreAlmacen: '',
          unidadMedidaId: null,
          nombreUnidadMedida: 'UND',
          cantidadDisponible: 1,
          cantidadReservada: 0,
          cantidadTotal: 1,
          costoActual: 0,
          valorInventario: 0,
          actualizadoEn: '',
          esSerializado: true,
          ubicacionId: ubicacionOrigenId || '',
          nombreUbicacion: '',
          condicion: 'Utilizable',
        }
      );
      setScannerCantidad('1');
      return;
    }

    // 2. Verificar si coincide con el SKU / código o nombre de producto
    const prodEncontrado = productosStock.find(
      (p) =>
        (p.codigoProducto && p.codigoProducto.toUpperCase() === q) ||
        p.nombreProducto.toUpperCase().includes(q)
    );

    if (prodEncontrado) {
      setSerieSeleccionadaScanner(null);
      setProductoSeleccionadoScanner(prodEncontrado);
      setScannerCantidad('1');
      return;
    }

    setScannerError(`No se encontró "${query}" en existencias disponibles de este almacén.`);
  };

  // AGREGAR ÍTEM VÍA SYMBAR SCANNER
  const agregarDesdeScanner = () => {
    if (!productoSeleccionadoScanner) {
      if (scannerQuery.trim()) {
        procesarScannerBusqueda(scannerQuery);
      } else {
        setScannerError('Ingrese o escanee un SKU o Serie.');
      }
      return;
    }

    if (productoSeleccionadoScanner.esSerializado && !serieSeleccionadaScanner) {
      setScannerError('Este producto es serializado. Debe escanear o seleccionar una serie.');
      return;
    }

    const cant = Number(scannerCantidad);
    if (isNaN(cant) || cant <= 0) {
      setScannerError('La cantidad debe ser mayor a cero.');
      return;
    }

    if (serieSeleccionadaScanner) {
      // Es producto seriado individual
      if (lineas.some((l) => l.series.some((s) => s.toUpperCase() === serieSeleccionadaScanner.numeroSerie.toUpperCase()))) {
        setScannerError(`La serie "${serieSeleccionadaScanner.numeroSerie}" ya está agregada al despacho.`);
        return;
      }

      setLineas((prev) => {
        const idx = prev.findIndex((l) => l.productoId === productoSeleccionadoScanner.productoId);
        if (idx >= 0) {
          const clon = [...prev];
          clon[idx] = {
            ...clon[idx],
            cantidad: clon[idx].cantidad + 1,
            series: [...clon[idx].series, serieSeleccionadaScanner.numeroSerie],
          };
          return clon;
        }

        const nuevaLinea: LineaDespacho = {
          idTemp: crypto.randomUUID(),
          productoId: productoSeleccionadoScanner.productoId,
          codigo: serieSeleccionadaScanner.codigoProducto || productoSeleccionadoScanner.codigoProducto || '',
          nombre: serieSeleccionadaScanner.nombreProducto || productoSeleccionadoScanner.nombreProducto,
          unidad: 'UND',
          cantidad: 1,
          series: [serieSeleccionadaScanner.numeroSerie],
        };
        return [...prev, nuevaLinea];
      });

      notifySuccess(`Serie ${serieSeleccionadaScanner.numeroSerie} agregada.`);
    } else {
      // Es producto no seriado
      const lineaExistente = lineas.find(
        (l) => l.productoId === productoSeleccionadoScanner.productoId
      );

      const yaAgregado = lineaExistente ? lineaExistente.cantidad : 0;
      if (yaAgregado + cant > productoSeleccionadoScanner.cantidadDisponible) {
        setScannerError(
          `La cantidad supera las existencias disponibles (${productoSeleccionadoScanner.cantidadDisponible} ${productoSeleccionadoScanner.nombreUnidadMedida || 'UND'}).`
        );
        return;
      }

      if (lineaExistente) {
        setLineas((prev) =>
          prev.map((l) =>
            l.idTemp === lineaExistente.idTemp ? { ...l, cantidad: l.cantidad + cant } : l
          )
        );
      } else {
        const nuevaLinea: LineaDespacho = {
          idTemp: crypto.randomUUID(),
          productoId: productoSeleccionadoScanner.productoId,
          codigo: productoSeleccionadoScanner.codigoProducto || '',
          nombre: productoSeleccionadoScanner.nombreProducto,
          unidad: productoSeleccionadoScanner.nombreUnidadMedida || 'UND',
          cantidad: cant,
          series: [],
        };
        setLineas((prev) => [...prev, nuevaLinea]);
      }

      notifySuccess(`Producto ${productoSeleccionadoScanner.nombreProducto} agregado.`);
    }

    // Limpiar scanner y reenfocar
    setScannerQuery('');
    setProductoSeleccionadoScanner(null);
    setSerieSeleccionadaScanner(null);
    setScannerCantidad('1');
    setScannerError(null);
    setTimeout(() => {
      scannerInputRef.current?.focus();
    }, 50);
  };

  const handleEliminarLinea = (idTemp: string) => {
    setLineas((prev) => prev.filter((l) => l.idTemp !== idTemp));
  };

  const handleGuardar = async (cerrar: boolean) => {
    if (!almacenOrigenId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione la bodega de origen.' });
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

    try {
      setSubmitting(true);
      setMensaje(null);

      let ubicOrigenId = ubicacionOrigenId;
      if (!ubicOrigenId) {
        const ubicsOrigen = await AlmacenService.getUbicaciones(almacenOrigenId);
        const princOrigen = ubicsOrigen.find(u => u.codigo === 'PRINCIPAL') || ubicsOrigen[0];
        ubicOrigenId = princOrigen?.id || '';
        if (ubicOrigenId) setUbicacionOrigenId(ubicOrigenId);
      }
      if (!ubicOrigenId) {
        throw new Error('La bodega de origen seleccionada no tiene una ubicación principal configurada.');
      }

      const ubicsDestino = await AlmacenService.getUbicaciones(custodiaTecnico.id);
      const princDestino = ubicsDestino.find(u => u.codigo === 'PRINCIPAL') || ubicsDestino[0];
      const ubicacionDestinoId = princDestino?.id;
      if (!ubicacionDestinoId) {
        throw new Error('El almacén de custodia del técnico no tiene una ubicación principal configurada.');
      }

      const res = await TransferenciaService.crear({
        transferenciaId: transferenciaId || undefined,
        almacenOrigenId,
        almacenDestinoId: custodiaTecnico.id,
        ubicacionOrigenId: ubicOrigenId,
        ubicacionDestinoId,
        modalidad: 1, // Inmediata
        operacionId: operacionIdRef.current,
        observacion: observaciones.trim() || undefined,
        guiaRemision: numeroGuiaRemision.trim() || undefined,
        esBorrador: true,
        lineas: lineas.map(l => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          series: l.series.length > 0 ? l.series : undefined,
          condicion: 1, // Utilizable
        })),
      });

      setTransferenciaId(res.id || null);
      setNumeroTransferencia(res.numero);
      if (res.numeroGuiaRemision) setNumeroGuiaRemision(res.numeroGuiaRemision);
      if (res.estado) setEstado(res.estado);

      if (cerrar) {
        navigate('/servicio-campo/despacho-tecnicos', {
          state: { successMessage: `Borrador guardado exitosamente (N° ${res.numero}${res.numeroGuiaRemision ? ` · Guía ${res.numeroGuiaRemision}` : ''}).` }
        });
      } else {
        setSelectedTab('productos');
        notifySuccess(`Borrador guardado exitosamente (N° ${res.numero}${res.numeroGuiaRemision ? ` · Guía ${res.numeroGuiaRemision}` : ''}). Ya puede agregar los productos a despachar.`);
      }
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar el borrador.' });
    } finally {
      setSubmitting(false);
    }
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

      let ubicOrigenId = ubicacionOrigenId;
      if (!ubicOrigenId) {
        const ubicsOrigen = await AlmacenService.getUbicaciones(almacenOrigenId);
        const princOrigen = ubicsOrigen.find(u => u.codigo === 'PRINCIPAL') || ubicsOrigen[0];
        ubicOrigenId = princOrigen?.id || '';
        if (ubicOrigenId) setUbicacionOrigenId(ubicOrigenId);
      }
      if (!ubicOrigenId) {
        throw new Error('La bodega de origen seleccionada no tiene una ubicación principal configurada.');
      }

      const ubicsDestino = await AlmacenService.getUbicaciones(custodiaTecnico.id);
      const princDestino = ubicsDestino.find(u => u.codigo === 'PRINCIPAL') || ubicsDestino[0];
      const ubicacionDestinoId = princDestino?.id;
      if (!ubicacionDestinoId) {
        throw new Error('El almacén de custodia del técnico no tiene una ubicación principal configurada.');
      }

      const res = await TransferenciaService.crear({
        transferenciaId: transferenciaId || undefined,
        almacenOrigenId,
        almacenDestinoId: custodiaTecnico.id,
        ubicacionOrigenId: ubicOrigenId,
        ubicacionDestinoId,
        modalidad: 1, // Inmediata
        operacionId: operacionIdRef.current,
        observacion: observaciones.trim() || undefined,
        guiaRemision: numeroGuiaRemision.trim() || undefined,
        esBorrador: false,
        lineas: lineas.map(l => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          series: l.series.length > 0 ? l.series : undefined,
          condicion: 1, // Utilizable
        })),
      });

      setTransferenciaId(res.id || null);
      setNumeroTransferencia(res.numero);
      if (res.numeroGuiaRemision) setNumeroGuiaRemision(res.numeroGuiaRemision);
      setEstado(res.estado || 'Cerrada');

      const tecnicoObj = tecnicos.find((t) => t.id === tecnicoId);
      const almacenOrigenObj = almacenes.find((a) => a.id === almacenOrigenId);
      const cantTotal = lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);

      setDespachoExitoso({
        id: res.id,
        numero: res.numero,
        tecnicoNombre: tecnicoObj?.nombreCompleto || 'Técnico asignado',
        almacenOrigenNombre: almacenOrigenObj?.nombre || 'Almacén de despacho',
        guiaRemision: res.numeroGuiaRemision || numeroGuiaRemision || undefined,
        totalItems: cantTotal,
        totalLineas: lineas.length,
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

  const handleCompartirWhatsApp = async () => {
    const idCargo = despachoExitoso?.id || transferenciaId;
    const numCargo = despachoExitoso?.numero || numeroTransferencia;
    if (!idCargo) return;
    try {
      const tecnico = tecnicos.find((t) => t.id === tecnicoId);
      await TransferenciaService.compartirCargoWhatsapp(idCargo, numCargo, {
        tipoOperacion: 'Despacho a Técnico',
        destinatario: tecnico?.nombreCompleto,
        telefono: tecnico?.telefono || undefined,
      });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  const resetFormulario = () => {
    setLineas([]);
    setObservaciones('');
    setNumeroGuiaRemision('');
    setScannerQuery('');
    setScannerCantidad('1');
    setScannerError(null);
    setProductoSeleccionadoScanner(null);
    setSerieSeleccionadaScanner(null);
    setDespachoExitoso(null);
  };

  const columnasDespacho: TableColumnDefinition<LineaDespacho>[] = useMemo(
    () => [
      createTableColumn({
        columnId: 'numero',
        renderHeaderCell: () => '#',
        renderCell: (linea) => {
          const idx = lineas.findIndex((l) => l.idTemp === linea.idTemp);
          return (
            <TableCellLayout>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {idx + 1}
              </Text>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn({
        columnId: 'sku',
        renderHeaderCell: () => 'Código SKU',
        renderCell: (linea) => (
          <TableCellLayout>
            <strong style={{ fontFamily: 'monospace' }}>{linea.codigo || '—'}</strong>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'producto',
        renderHeaderCell: () => 'Descripción del Producto',
        renderCell: (linea) => (
          <TableCellLayout>
            <Text weight="semibold">{linea.nombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'cantidad',
        renderHeaderCell: () => 'Cantidad',
        renderCell: (linea) => (
          <TableCellLayout>
            <Text weight="bold">{linea.cantidad.toLocaleString('es-PE')}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'unidad',
        renderHeaderCell: () => 'Unidad',
        renderCell: (linea) => (
          <TableCellLayout>
            <Badge appearance="tint" shape="rounded" color="informative" size="small">
              {linea.unidad}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'series',
        renderHeaderCell: () => 'Series Asignadas',
        renderCell: (linea) => (
          <TableCellLayout>
            {linea.series.length > 0 ? (
              <div className={classes.seriesBadgeList}>
                {linea.series.map((s) => (
                  <Badge key={s} appearance="tint" shape="rounded" color="brand">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : (
              <Text style={{ color: tokens.colorNeutralForeground4 }}>—</Text>
            )}
          </TableCellLayout>
        ),
      }),
      ...(estado !== 'Cerrada'
        ? [
            createTableColumn<LineaDespacho>({
              columnId: 'acciones',
              renderHeaderCell: () => 'Acciones',
              renderCell: (linea) => (
                <TableCellLayout style={{ justifyContent: 'center' }}>
                  <Button
                    icon={<Delete16Regular />}
                    appearance="subtle"
                    size="small"
                    aria-label="Eliminar ítem"
                    onClick={() => handleEliminarLinea(linea.idTemp)}
                  />
                </TableCellLayout>
              ),
            }),
          ]
        : []),
    ],
    [lineas, estado, classes.seriesBadgeList]
  );

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
      <Toaster toasterId={toasterId} position="top-end" />

      {mensaje && mensaje.tipo === 'error' && (
        <D365MessageBar intent="error" onDismiss={() => setMensaje(null)}>
          {mensaje.texto}
        </D365MessageBar>
      )}

      <D365CommandBar ariaLabel="Comandos de despacho a técnicos">
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Volver"
            title="Volver a Despachos"
            onClick={() => navigate('/servicio-campo/despacho-tecnicos')}
          />
          {estado !== 'Cerrada' && (
            <>
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
              <D365CommandDivider />
              <D365CommandButton
                icon={<VehicleTruckProfile16Regular />}
                tone="create"
                onClick={() => void handleConfirmarDespacho()}
                disabled={submitting || lineas.length === 0}
              >
                {submitting ? 'Procesando...' : 'Confirmar Despacho'}
              </D365CommandButton>
              {transferenciaId && estado === 'Borrador' && (
                <D365CommandButton
                  icon={<Delete16Regular />}
                  tone="danger"
                  disabled={submitting}
                  onClick={() => setDialogEliminarBorrador(true)}
                >
                  Eliminar borrador
                </D365CommandButton>
              )}
            </>
          )}
          {transferenciaId && (
            <>
              <D365CommandDivider />
              <D365CommandButton
                icon={<ArrowDownload16Regular />}
                onClick={() => void TransferenciaService.descargarCargoPdf(transferenciaId, numeroTransferencia)}
              >
                Cargo PDF
              </D365CommandButton>
              <D365CommandButton
                icon={<Print16Regular />}
                onClick={() => void TransferenciaService.abrirCargoPdf(transferenciaId)}
              >
                Imprimir
              </D365CommandButton>
              <D365CommandButton
                icon={<WhatsAppIcon size={16} />}
                onClick={() => void handleCompartirWhatsApp()}
              >
                WhatsApp
              </D365CommandButton>
            </>
          )}
        </div>
      </D365CommandBar>

      <D365EntityHeader
        title={numeroTransferencia ? `${numeroTransferencia}` : 'Nuevo Despacho a Técnico'}
        subtitle="Abastecimiento y dotación de materiales y herramientas para cuadrillas de campo"
        avatarIcon={<VehicleTruckProfile16Regular />}
        metadata={[
          ...(numeroTransferencia ? [{ label: 'N° Despacho', value: numeroTransferencia }] : []),
          ...(numeroGuiaRemision ? [{ label: 'Guía de Remisión', value: numeroGuiaRemision }] : []),
          { label: 'Estado', value: estado === 'Cerrada' ? 'Recibida' : estado },
        ]}
        processFlow={<TransferenciaEtapas estado={estado} tipoOperacion="Despacho" embedded />}
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as 'general' | 'productos')}
          >
            <Tab value="general">
              General
            </Tab>
            <Tab
              value="productos"
              disabled={!transferenciaId && lineas.length === 0}
            >
              Productos
            </Tab>
          </TabList>
        }
      />

      <div className={formStyles.contentBody}>
        {selectedTab === 'general' && (
          <div style={{ maxWidth: '620px', width: '100%' }}>
            <div className={formStyles.card}>
              <div className={formStyles.cardSectionTitle}>Origen y Técnico Receptor</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <D365FormField label="Bodega de Origen" required info="Almacén físico desde donde se entrega el material">
                  <SelectorEntidadRelacionada
                    etiquetaGrupo="Bodegas Disponibles"
                    opciones={opcionesAlmacenes}
                    seleccionada={almacenSeleccionado}
                    textoBusqueda={busquedaAlmacen}
                    alCambiarBusqueda={setBusquedaAlmacen}
                    alSeleccionar={(id) => {
                      setAlmacenOrigenId(id || '');
                      setUbicacionOrigenId('');
                      if (id) {
                        const nuevaBodega = almacenes.find(a => a.id === id);
                        if (nuevaBodega?.unidadOrganizativaId && tecnicoId) {
                          const tecActual = tecnicos.find(t => t.id === tecnicoId);
                          if (tecActual && tecActual.unidadOrganizativaId && tecActual.unidadOrganizativaId !== nuevaBodega.unidadOrganizativaId) {
                            setTecnicoId('');
                          }
                        }
                      }
                    }}
                    alNavegar={(id) => navigate(`/almacenes/${id}`)}
                    icono={<Box16Regular />}
                    tituloEnlace="Ver ficha del almacén"
                    deshabilitado={estado === 'Cerrada'}
                  />
                </D365FormField>

                <D365FormField
                  label="Técnico Receptor"
                  required
                  info={almacenOrigenObj?.unidadOrganizativaNombre
                    ? `Solo se listan técnicos asignados a la sede "${almacenOrigenObj.unidadOrganizativaNombre}"`
                    : "Colaborador de campo que recibe y asume custodia del material"}
                >
                  <SelectorEntidadRelacionada
                    etiquetaGrupo="Técnicos de Campo"
                    opciones={opcionesTecnicos}
                    seleccionada={tecnicoSeleccionado}
                    textoBusqueda={busquedaTecnico}
                    alCambiarBusqueda={setBusquedaTecnico}
                    alSeleccionar={(id) => setTecnicoId(id || '')}
                    alNavegar={() => navigate(`/administracion/usuarios`)}
                    icono={<Person16Regular />}
                    tituloEnlace="Ver perfil del técnico"
                    textoVacio={almacenOrigenObj?.unidadOrganizativaNombre
                      ? `No hay técnicos asignados a la sede ${almacenOrigenObj.unidadOrganizativaNombre}`
                      : "No se encontraron técnicos"}
                    deshabilitado={estado === 'Cerrada' || !almacenOrigenId}
                  />
                </D365FormField>

                <D365FormField label="Observaciones / Motivo" info="Información adicional (Nro. de orden, proyecto o tarea)">
                  <Input
                    style={{ width: '100%' }}
                    value={observaciones}
                    onChange={(_, d) => setObservaciones(d.value)}
                    maxLength={500}
                    readOnly={estado === 'Cerrada'}
                  />
                </D365FormField>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'productos' && (
          <div className={formStyles.card}>
            <div className={formStyles.cardSectionTitle}>Materiales y Equipos a Despachar</div>

            {/* SECCIÓN DE ENTRADA / ESCANEO ESTILO SYMBAR */}
            {estado !== 'Cerrada' && (
              <div className={classes.scannerPanel}>
                <div className={classes.scannerGrid}>
                  {/* Campo 1: SKU / SERIE */}
                  <div className={classes.scannerField}>
                    <label className={classes.scannerLabel} htmlFor="symbar-despacho-sku-serie">
                      SKU / SERIE
                    </label>
                    <Input
                      id="symbar-despacho-sku-serie"
                      ref={scannerInputRef}
                      contentBefore={<Search16Regular />}
                      placeholder="Escanee o escriba SKU / Serie..."
                      value={scannerQuery}
                      onChange={(_, d) => {
                        setScannerQuery(d.value);
                        procesarScannerBusqueda(d.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          agregarDesdeScanner();
                        }
                      }}
                    />
                  </div>

                  {/* Campo 2: Producto */}
                  <div className={classes.scannerField}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className={classes.scannerLabel}>Producto</label>
                      {productoSeleccionadoScanner && !serieSeleccionadaScanner && (
                        <Text size={100} style={{ color: tokens.colorBrandForeground1 }}>
                          Disp: {productoSeleccionadoScanner.cantidadDisponible} {productoSeleccionadoScanner.nombreUnidadMedida || 'UND'}
                        </Text>
                      )}
                    </div>
                    {productoSeleccionadoScanner ? (
                      <Input
                        readOnly
                        appearance="filled-darker"
                        value={
                          serieSeleccionadaScanner
                            ? `${productoSeleccionadoScanner.nombreProducto} (Serie: ${serieSeleccionadaScanner.numeroSerie})`
                            : productoSeleccionadoScanner.nombreProducto
                        }
                        contentAfter={
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Dismiss16Regular />}
                            onClick={() => {
                              setProductoSeleccionadoScanner(null);
                              setSerieSeleccionadaScanner(null);
                              setScannerQuery('');
                            }}
                          />
                        }
                      />
                    ) : (
                      <Select
                        value=""
                        onChange={(_, d) => {
                          const val = d.value;
                          if (val.startsWith('serie:')) {
                            const numSerie = val.replace('serie:', '');
                            const s = seriesLibresAlmacen.find((x) => x.numeroSerie === numSerie);
                            if (s) {
                              setSerieSeleccionadaScanner(s);
                              const prod = productosStock.find((p) => p.productoId === s.productoId);
                              setProductoSeleccionadoScanner(
                                prod || {
                                  stockId: '',
                                  productoId: s.productoId,
                                  codigoProducto: s.codigoProducto,
                                  nombreProducto: s.nombreProducto,
                                  almacenId: almacenOrigenId,
                                  nombreAlmacen: '',
                                  unidadMedidaId: null,
                                  nombreUnidadMedida: 'UND',
                                  cantidadDisponible: 1,
                                  cantidadReservada: 0,
                                  cantidadTotal: 1,
                                  costoActual: 0,
                                  valorInventario: 0,
                                  actualizadoEn: '',
                                  esSerializado: true,
                                  ubicacionId: ubicacionOrigenId || '',
                                  nombreUbicacion: '',
                                  condicion: 'Utilizable',
                                }
                              );
                              setScannerQuery(s.numeroSerie);
                              setScannerCantidad('1');
                              setScannerError(null);
                            }
                          } else {
                            const prod = productosStock.find((p) => p.productoId === val);
                            if (prod) {
                              setProductoSeleccionadoScanner(prod);
                              setSerieSeleccionadaScanner(null);
                              setScannerQuery(prod.codigoProducto || prod.nombreProducto);
                              setScannerCantidad('1');
                              setScannerError(null);
                            }
                          }
                        }}
                      >
                        <option value="">
                          Buscar en disponibles ({productosStock.length} productos, {seriesLibresAlmacen.length} series)...
                        </option>
                        {productosStock.map((p) => (
                          <option key={p.productoId} value={p.productoId}>
                            {p.codigoProducto ? `${p.codigoProducto} — ` : ''}
                            {p.nombreProducto} (Disp: {p.cantidadDisponible} {p.nombreUnidadMedida || 'UND'}{p.esSerializado ? ' · 🏷️ Serializado' : ''})
                          </option>
                        ))}
                        {seriesLibresAlmacen.length > 0 && (
                          <optgroup label="Series individuales disponibles">
                            {seriesLibresAlmacen.slice(0, 50).map((s) => (
                              <option key={s.numeroSerie} value={`serie:${s.numeroSerie}`}>
                                🏷️ {s.numeroSerie} ({s.codigoProducto} - {s.nombreProducto})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </Select>
                    )}
                  </div>

                  {/* Campo 3: UOM */}
                  <div className={classes.scannerField}>
                    <label className={classes.scannerLabel}>UOM</label>
                    <Input
                      readOnly
                      appearance="filled-darker"
                      value={
                        serieSeleccionadaScanner
                          ? 'UND'
                          : productoSeleccionadoScanner?.nombreUnidadMedida || 'UND'
                      }
                    />
                  </div>

                  {/* Campo 4: Cantidad */}
                  <div className={classes.scannerField}>
                    <label className={classes.scannerLabel}>Cantidad</label>
                    <Input
                      type="number"
                      min={1}
                      max={
                        serieSeleccionadaScanner
                          ? 1
                          : productoSeleccionadoScanner?.cantidadDisponible || undefined
                      }
                      disabled={Boolean(serieSeleccionadaScanner)}
                      value={scannerCantidad}
                      onChange={(_, d) => setScannerCantidad(d.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          agregarDesdeScanner();
                        }
                      }}
                    />
                  </div>

                  {/* Botón AGREGAR */}
                  <div>
                    <Button
                      appearance="primary"
                      icon={<Add16Regular />}
                      style={{ width: '100%' }}
                      onClick={agregarDesdeScanner}
                    >
                      AGREGAR
                    </Button>
                  </div>
                </div>

                {scannerError && (
                  <span className={classes.errorText}>
                    <Warning16Filled /> {scannerError}
                  </span>
                )}
              </div>
            )}

            {/* TABLA INFERIOR DE PRODUCTOS AGREGADOS (ESTILO SYMBAR) */}
            <div className={classes.tableWrapper}>
              <DataGrid
                items={lineas}
                columns={columnasDespacho}
                getRowId={(l) => l.idTemp}
                size="medium"
              >
                <DataGridHeader>
                  <DataGridRow>
                    {({ renderHeaderCell }) => (
                      <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                    )}
                  </DataGridRow>
                </DataGridHeader>
                {lineas.length === 0 ? (
                  <TableEmptyState />
                ) : (
                  <DataGridBody<LineaDespacho>>
                    {({ item, rowId }) => (
                      <DataGridRow<LineaDespacho> key={rowId}>
                        {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                )}
              </DataGrid>
            </div>

            {lineas.length > 0 && (
              <div className={classes.totalsBar}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Total ítems: {lineas.length}
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Total unidades a despachar:
                  </Text>
                  <Text weight="bold" size={400}>
                    {totalCantidad.toLocaleString('es-PE')}
                  </Text>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de éxito y descarga de cargo estandarizado con Fluent UI */}
      <D365OperacionExitosaDialog
        open={Boolean(despachoExitoso)}
        datos={
          despachoExitoso
            ? {
                ...despachoExitoso,
                tipoOperacion: 'Despacho',
                personaNombre: despachoExitoso.tecnicoNombre,
                almacenNombre: despachoExitoso.almacenOrigenNombre,
              }
            : null
        }
        onClose={() => setDespachoExitoso(null)}
        onDescargarPdf={() => void handleDescargarCargo()}
        onImprimir={() => void handleImprimirCargo()}
        onCompartirWhatsApp={() => void handleCompartirWhatsApp()}
        onNuevaOperacion={() => {
          setDespachoExitoso(null);
          resetFormulario();
        }}
        onIrHistorial={() => navigate('/servicio-campo/despacho-tecnicos')}
      />

      <Dialog
        open={dialogEliminarBorrador}
        onOpenChange={(_, data) => {
          if (!data.open && !eliminandoBorrador) setDialogEliminarBorrador(false);
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Eliminar borrador</DialogTitle>
            <DialogContent>
              ¿Está seguro de que desea eliminar el borrador{' '}
              <strong>{numeroTransferencia}</strong>? Esta acción no se puede deshacer.
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                disabled={eliminandoBorrador}
                onClick={() => setDialogEliminarBorrador(false)}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: '#fff' }}
                disabled={eliminandoBorrador}
                onClick={async () => {
                  if (!transferenciaId) return;
                  try {
                    setEliminandoBorrador(true);
                    await TransferenciaService.eliminar(transferenciaId);
                    navigate('/servicio-campo/despacho-tecnicos', {
                      state: { successMessage: `Borrador ${numeroTransferencia} eliminado exitosamente.` },
                    });
                  } catch (e) {
                    dispatchToast(
                      <Toast>
                        <ToastTitle>{e instanceof Error ? e.message : 'Error al eliminar el borrador'}</ToastTitle>
                      </Toast>,
                      { intent: 'error', position: 'top-end' }
                    );
                  } finally {
                    setEliminandoBorrador(false);
                  }
                }}
              >
                {eliminandoBorrador ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
