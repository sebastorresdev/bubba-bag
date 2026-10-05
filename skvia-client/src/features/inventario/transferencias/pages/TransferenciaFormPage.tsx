import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Input,
  Select,
  Tab,
  TabList,
  Textarea,
  Text,
  Badge,
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
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import type { TableColumnDefinition } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowLeft16Regular,
  Delete16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Table16Regular,
  Box16Regular,
  Warning16Filled,
  LockClosed16Regular,
  CheckmarkCircle16Regular,
  VehicleTruckProfile16Regular,
  ArrowSync16Regular,
  History16Regular,
  Search16Regular,
  Dismiss16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { AlmacenService } from '../../almacenes/services/almacen.service';
import type { AlmacenDto } from '../../almacenes/types/almacen.types';
import { InventarioProductoService } from '../../inventario-productos/services/inventario-producto.service';
import type {
  InventarioProductoDto,
  ItemSeriadoStockDto,
} from '../../inventario-productos/types/inventario-producto.types';
import { ResolverDiferenciaDialog } from '../components/ResolverDiferenciaDialog';
import { TransferenciaService } from '../services/transferencia.service';
import type {
  RecepcionTransferenciaItemDto,
  TransferenciaDetalladaDto,
  TransferenciaDetalleLineaDto,
} from '../types/transferencia.types';

const useStyles = makeStyles({
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
  hintCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: '16px',
  },
  errorText: {
    ...typographyStyles.caption2,
    color: tokens.colorPaletteRedForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
  },
  emptyBox: {
    padding: '36px 16px',
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  modalTableWrapper: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: '12px',
    marginBottom: '16px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
});

interface LineaTransferenciaForm {
  clave: string;
  productoId: string;
  codigo: string;
  nombre: string;
  unidad: string;
  serie?: string | null;
  condicion: number;
  stockDisponible: number;
  cantidad: number;
  esSerializado: boolean;
}

interface LineaRecepcionForm {
  transferenciaDetalleId: string;
  productoNombre: string;
  codigoProducto: string;
  cantidadEnviada: number;
  cantidadRecibida: number;
  cantidadPendiente: number;
  cantidadARecibir: string;
  seriesEsperadas: string[];
  seriesCapturadas: string[];
}

export function TransferenciaFormPage() {
  const formStyles = useD365FormStyles();
  const styles = useStyles();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isViewMode = Boolean(id && id !== 'nuevo');

  // Catálogos y datos
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [stocksOrigen, setStocksOrigen] = useState<InventarioProductoDto[]>([]);
  const [seriesOrigen, setSeriesOrigen] = useState<ItemSeriadoStockDto[]>([]);
  const [cargandoStock, setCargandoStock] = useState(false);

  // Detalle cargado en modo consulta
  const [detalle, setDetalle] = useState<TransferenciaDetalladaDto | null>(null);

  // Campos de formulario en nuevo
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [destinos,setDestinos]=useState<AlmacenDto[]>([]);
  const [ubicacionesOrigen,setUbicacionesOrigen]=useState<import('../../almacenes/types/almacen.types').UbicacionInventarioDto[]>([]);
  const [ubicacionesDestino,setUbicacionesDestino]=useState<import('../../almacenes/types/almacen.types').UbicacionInventarioDto[]>([]);
  const [ubicacionOrigenId,setUbicacionOrigenId]=useState('');
  const [ubicacionDestinoId,setUbicacionDestinoId]=useState('');
  const [modalidad,setModalidad]=useState<1|2>(1);
  const [condicion,setCondicion]=useState<1|2>(1);
  const operacionId=useRef(crypto.randomUUID());
  const recepcionOperacionId=useRef(crypto.randomUUID());
  const [capturaRecepcion,setCapturaRecepcion]=useState('');
  const [cantidadCaptura,setCantidadCaptura]=useState('1');
  const [observacion, setObservacion] = useState('');
  const [fechaReal, setFechaReal] = useState('');
  const [fechaRecepcionReal, setFechaRecepcionReal] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState(() => new Date().toISOString().split('T')[0]);
  const [lineas, setLineas] = useState<LineaTransferenciaForm[]>([]);

  // Estado del Symbar Scanner Bar (Top)
  const [scannerQuery, setScannerQuery] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<InventarioProductoDto | null>(null);
  const [serieSeleccionada, setSerieSeleccionada] = useState<ItemSeriadoStockDto | null>(null);
  const [scannerCantidad, setScannerCantidad] = useState('1');
  const [scannerError, setScannerError] = useState<string | null>(null);

  const scannerInputRef = useRef<HTMLInputElement>(null);

  // Estados de interfaz
  const [selectedTab, setSelectedTab] = useState<'general' | 'productos' | 'recepciones'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [numeroGuardado, setNumeroGuardado] = useState<string | null>(null);

  // Estado para modal de recepción
  const [dialogRecepcionAbierto, setDialogRecepcionAbierto] = useState(false);
  const [lineasRecepcion, setLineasRecepcion] = useState<LineaRecepcionForm[]>([]);
  const [observacionRecepcion, setObservacionRecepcion] = useState('');
  const [guardandoRecepcion, setGuardandoRecepcion] = useState(false);

  // Cargar detalle
  const cargarDetalleTransferencia = useCallback(async (transfId: string) => {
    try {
      const data = await TransferenciaService.obtenerDetalle(transfId);
      setDetalle(data);
      setNumeroGuardado(data.numero);
      setOrigenId(data.almacenOrigenId);
      setUbicacionOrigenId(data.ubicacionOrigenId || '');
      setUbicacionDestinoId(data.ubicacionDestinoId || '');
      setDestinoId(data.almacenDestinoId);
      setObservacion(data.observaciones || '');
      setFechaRegistro(data.fechaRegistro ? data.fechaRegistro.split('T')[0] : '');
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar detalle de transferencia.');
      return null;
    }
  }, []);

  useEffect(() => {
    let activo = true;
    setLoading(true);

    Promise.all([
      AlmacenService.getAlmacenes(true),
      isViewMode && id ? cargarDetalleTransferencia(id) : Promise.resolve(null),
    ])
      .then(([alms]) => {
        if (!activo) return;
        setAlmacenes(alms.filter(a=>a.puedeDespachar));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar datos iniciales.'))
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [id, isViewMode, cargarDetalleTransferencia]);

  // Cargar existencias disponibles del almacén de origen
  const cargarStocksAlmacenOrigen = useCallback(async (almId: string) => {
    if (!almId) {
      setStocksOrigen([]);
      setSeriesOrigen([]);
      return;
    }
    try {
      setCargandoStock(true);
      const [prods, sers] = await Promise.all([
        InventarioProductoService.obtener(almId,undefined,ubicacionOrigenId),
        InventarioProductoService.obtenerSeries(almId,undefined,undefined,ubicacionOrigenId),
      ]);
      setStocksOrigen(prods.filter((s) => s.cantidadDisponible > 0 && s.condicion === (condicion===1?'Utilizable':'Defectuoso')));
      setSeriesOrigen(sers.filter((s) => s.condicion === (condicion===1?'Utilizable':'Defectuoso')));
    } catch {
      setStocksOrigen([]);
      setSeriesOrigen([]);
    } finally {
      setCargandoStock(false);
    }
  }, [ubicacionOrigenId,condicion]);

  useEffect(() => {
    if (origenId && !isViewMode) {
      void cargarStocksAlmacenOrigen(origenId);
    }
  }, [origenId, isViewMode, cargarStocksAlmacenOrigen]);

  // Filtrado de almacenes de destino
  const almacenOrigen = useMemo(() => almacenes.find((a) => a.id === origenId), [almacenes, origenId]);
  const almacenDestino = useMemo(() => destinos.find((a) => a.id === destinoId), [destinos, destinoId]);

  const almacenesDestinoDisponibles = useMemo(() => {
    if (!almacenOrigen) return [];

    return destinos.filter((cand) => {
      if (cand.id === almacenOrigen.id) return true;

      // Si el origen es Bodega Base (Tipo = 1)
      if (almacenOrigen.tipo === 1) {
        if (cand.tipo === 1) return true;
        if (cand.tipo === 2 && cand.unidadOrganizativaId === almacenOrigen.unidadOrganizativaId)
          return true;
        return false;
      }

      // Si el origen es Custodia personal (Tipo = 2)
      if (almacenOrigen.tipo === 2) {
        return cand.tipo === 1 && cand.unidadOrganizativaId === almacenOrigen.unidadOrganizativaId;
      }

      return true;
    });
  }, [almacenOrigen, destinos]);

  useEffect(()=>{
    if(!origenId || isViewMode)return;
    let vigente=true;
    setLineas([]);setProductoSeleccionado(null);setSerieSeleccionada(null);setUbicacionOrigenId('');setUbicacionDestinoId('');setDestinos([]);
    Promise.all([AlmacenService.getUbicaciones(origenId),AlmacenService.getDestinos(origenId)]).then(([us,ds])=>{if(vigente){setUbicacionesOrigen(us);setUbicacionOrigenId(us.find(u=>u.esPrincipal)?.id||'');setDestinos(ds);}}).catch(e=>{if(vigente)setError(String(e));});
    return()=>{vigente=false;};
  },[origenId,isViewMode]);
  useEffect(()=>{
    if(!destinoId || !origenId || isViewMode)return;
    let vigente=true;setUbicacionDestinoId('');
    AlmacenService.getUbicaciones(destinoId,origenId).then(us=>{if(vigente){setUbicacionesDestino(us);setUbicacionDestinoId(us.find(u=>u.esPrincipal)?.id||'');}}).catch(e=>{if(vigente)setError(String(e));});
    setModalidad(almacenOrigen?.unidadOrganizativaId!==almacenDestino?.unidadOrganizativaId?2:1);
    return()=>{vigente=false;};
  },[destinoId,origenId,isViewMode,almacenOrigen?.unidadOrganizativaId,almacenDestino?.unidadOrganizativaId]);

  const capturarRecepcion=()=>{
    const codigo=capturaRecepcion.trim().toUpperCase();
    const linea=lineasRecepcion.find(l=>l.seriesEsperadas.includes(codigo)) || lineasRecepcion.find(l=>l.codigoProducto.toUpperCase()===codigo && !l.seriesEsperadas.length);
    if(!linea){setError('La serie o SKU no está pendiente en este envío.');return;}
    if(linea.seriesEsperadas.length){
      if(linea.seriesCapturadas.includes(codigo)){setError('La serie ya está capturada.');return;}
      setLineasRecepcion(prev=>prev.map(l=>l===linea?{...l,seriesCapturadas:[...l.seriesCapturadas,codigo]}:l));
    }else{
      const n=Number(cantidadCaptura);const total=Number(linea.cantidadARecibir)+n;
      if(!Number.isFinite(n)||n<=0||total>linea.cantidadPendiente){setError('La cantidad excede el pendiente o no es válida.');return;}
      setLineasRecepcion(prev=>prev.map(l=>l===linea?{...l,cantidadARecibir:String(total)}:l));
    }
    setError(null);setCapturaRecepcion('');setCantidadCaptura('1');
  };

  // Modo operativo detectado
  const operacionModalidad = useMemo(() => {
    if (!almacenOrigen || !almacenDestino) return null;

    if (almacenOrigen.tipo === 1 && almacenDestino.tipo === 2) {
      return {
        tipo: 'DespachoTecnico',
        titulo: 'Despacho a técnico',
        badgeColor: 'informative' as const,
      };
    }

    if (almacenOrigen.tipo === 2 && almacenDestino.tipo === 1) {
      return {
        tipo: 'DevolucionTecnico',
        titulo: 'Devolución a bodega',
        badgeColor: 'informative' as const,
      };
    }

    if (modalidad===2) return {tipo:'ConTransito',titulo:'Despacho con tránsito',badgeColor:'warning' as const};
    if (almacenOrigen.tipo === 1 && almacenDestino.tipo === 1) {
      return {
        tipo: 'InterBodegas',
        titulo: 'Traslado entre ubicaciones',
        badgeColor: 'warning' as const,
      };
    }

    return null;
  }, [almacenOrigen, almacenDestino,modalidad]);

  // SYMBAR SCANNER: Manejar búsqueda / escaneo al escribir o presionar Enter
  const procesarScannerBusqueda = (query: string) => {
    const q = query.trim().toUpperCase();
    setScannerError(null);

    if (!q) {
      setProductoSeleccionado(null);
      setSerieSeleccionada(null);
      return;
    }

    // 1. Verificar si coincide exactamente con una serie física de este almacén
    const serieEncontrada = seriesOrigen.find((s) => s.numeroSerie.toUpperCase() === q);
    if (serieEncontrada) {
      // Verificar si ya fue agregada
      if (lineas.some((l) => l.serie?.toUpperCase() === serieEncontrada.numeroSerie.toUpperCase())) {
        setScannerError(`La serie "${serieEncontrada.numeroSerie}" ya está en la lista de transferencia.`);
        return;
      }

      setSerieSeleccionada(serieEncontrada);
      const prodInfo = stocksOrigen.find((p) => p.productoId === serieEncontrada.productoId);
      setProductoSeleccionado(
        prodInfo || {
          stockId: '',
          productoId: serieEncontrada.productoId,
          codigoProducto: serieEncontrada.codigoProducto,
          nombreProducto: serieEncontrada.nombreProducto,
          almacenId: origenId,
          nombreAlmacen: '',
          unidadMedidaId: null,
          nombreUnidadMedida: 'UND',
          cantidadDisponible: 1,
          cantidadReservada: 0,
          cantidadTotal: 1,
          costoActual: 0,
          valorInventario: 0,
          actualizadoEn: '',
          esSerializado: true, ubicacionId:ubicacionOrigenId,nombreUbicacion:'',condicion:condicion===1?'Utilizable':'Defectuoso',
        }
      );
      setScannerCantidad('1');
      return;
    }

    // 2. Verificar si coincide con el SKU / código o nombre de producto no seriado
    const prodEncontrado = stocksOrigen.find(
      (p) =>
        (p.codigoProducto && p.codigoProducto.toUpperCase() === q) ||
        p.nombreProducto.toUpperCase().includes(q)
    );

    if (prodEncontrado) {
      setSerieSeleccionada(null);
      setProductoSeleccionado(prodEncontrado);
      setScannerCantidad('1');
      return;
    }

    setScannerError(`No se encontró "${query}" en existencias disponibles de este almacén.`);
  };

  // AGREGAR ÍTEM VÍA SYMBAR SCANNER
  const agregarDesdeScanner = () => {
    if (!productoSeleccionado) {
      if (scannerQuery.trim()) {
        procesarScannerBusqueda(scannerQuery);
      } else {
        setScannerError('Ingrese o escanee un SKU o Serie.');
      }
      return;
    }

    const cant = Number(scannerCantidad);
    if (isNaN(cant) || cant <= 0) {
      setScannerError('La cantidad debe ser mayor a cero.');
      return;
    }

    if (serieSeleccionada) {
      // Es producto seriado individual
      if (lineas.some((l) => l.serie?.toUpperCase() === serieSeleccionada.numeroSerie.toUpperCase())) {
        setScannerError(`La serie "${serieSeleccionada.numeroSerie}" ya está agregada.`);
        return;
      }

      const nuevaLinea: LineaTransferenciaForm = {
        clave: crypto.randomUUID(),
        productoId: productoSeleccionado.productoId,
        codigo: serieSeleccionada.codigoProducto || productoSeleccionado.codigoProducto || '',
        nombre: serieSeleccionada.nombreProducto || productoSeleccionado.nombreProducto,
        unidad: 'UND',
        serie: serieSeleccionada.numeroSerie,
        condicion,
        stockDisponible: 1,
        cantidad: 1,
        esSerializado: true,
      };

      setLineas((prev) => [...prev, nuevaLinea]);
    } else {
      // Es producto no seriado
      const lineaExistente = lineas.find(
        (l) => l.productoId === productoSeleccionado.productoId && !l.serie
      );

      const yaAgregado = lineaExistente ? lineaExistente.cantidad : 0;
      if (yaAgregado + cant > productoSeleccionado.cantidadDisponible) {
        setScannerError(
          `La cantidad supera las existencias disponibles (${productoSeleccionado.cantidadDisponible} ${productoSeleccionado.nombreUnidadMedida || 'UND'}).`
        );
        return;
      }

      if (lineaExistente) {
        setLineas((prev) =>
          prev.map((l) =>
            l.clave === lineaExistente.clave ? { ...l, cantidad: l.cantidad + cant } : l
          )
        );
      } else {
        const nuevaLinea: LineaTransferenciaForm = {
          clave: crypto.randomUUID(),
          productoId: productoSeleccionado.productoId,
          codigo: productoSeleccionado.codigoProducto || '',
          nombre: productoSeleccionado.nombreProducto,
          unidad: productoSeleccionado.nombreUnidadMedida || 'UND',
          serie: null,
          condicion,
        stockDisponible: productoSeleccionado.cantidadDisponible,
          cantidad: cant,
          esSerializado: false,
        };
        setLineas((prev) => [...prev, nuevaLinea]);
      }
    }

    // Limpiar scanner y volver a enfocar para escaneo rápido
    setScannerQuery('');
    setProductoSeleccionado(null);
    setSerieSeleccionada(null);
    setScannerCantidad('1');
    setScannerError(null);
    setTimeout(() => {
      scannerInputRef.current?.focus();
    }, 50);
  };

  const eliminarLinea = (clave: string) => {
    setLineas((prev) => prev.filter((l) => l.clave !== clave));
  };

  // Validación y guardado
  const validarFormulario = (): boolean => {
    if (!origenId) {
      setError('Seleccione el almacén de origen en General.');
      setSelectedTab('general');
      return false;
    }
    if (!destinoId) {
      setError('Seleccione el almacén de destino en General.');
      setSelectedTab('general');
      return false;
    }
    if (!ubicacionOrigenId || !ubicacionDestinoId) {setError('Seleccione las ubicaciones de origen y destino.');return false;}
    if (ubicacionOrigenId === ubicacionDestinoId) {
      setError('El almacén de origen y destino deben ser diferentes.');
      setSelectedTab('general');
      return false;
    }

    if (lineas.length === 0) {
      setError('Debe agregar al menos un producto a la transferencia.');
      setSelectedTab('productos');
      return false;
    }

    return true;
  };

  const guardar = async (cerrar: boolean) => {
    if (isViewMode || numeroGuardado) {
      if (cerrar) navigate('/servicio-campo/transferencias');
      return;
    }

    if (!validarFormulario()) return;

    // Agrupar por productoId para la llamada al backend
    const lineasPayload: Array<{ productoId: string; cantidad: number; series?: string[] | null;condicion?:number }> = [];
    const agrupadoNoSeriados = new Map<string, number>();

    lineas.forEach((l) => {
      if (l.esSerializado && l.serie) {
        lineasPayload.push({
          productoId: l.productoId,
          cantidad: 1,
          series: [l.serie],condicion:l.condicion,
        });
      } else {
        const actual = agrupadoNoSeriados.get(l.productoId) || 0;
        agrupadoNoSeriados.set(l.productoId, actual + l.cantidad);
      }
    });

    agrupadoNoSeriados.forEach((cant, prodId) => {
      lineasPayload.push({
        productoId: prodId,
        cantidad: cant,
      });
    });

    try {
      setSaving(true);
      setError(null);
      const res = await TransferenciaService.crear({
        almacenOrigenId: origenId,
        almacenDestinoId: destinoId,
        observacion: observacion.trim() || null,
        lineas: lineasPayload.map(l=>({...l,condicion:l.condicion??condicion})),
        ubicacionOrigenId,ubicacionDestinoId,modalidad,operacionId:operacionId.current,fechaReal:fechaReal?new Date(fechaReal).toISOString():undefined,
      });

      setNumeroGuardado(res.numero);
      setMensaje(`Transferencia ${res.numero} registrada exitosamente.`);

      if (cerrar) {
        navigate('/servicio-campo/transferencias', {
          state: { successMessage: `Transferencia ${res.numero} registrada exitosamente.` },
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar la transferencia.');
    } finally {
      setSaving(false);
    }
  };

  // Abrir diálogo de recepción física
  const abrirDialogoRecepcion = () => {
    if (!detalle) return;

    const lineasPendientes = detalle.lineas
      .filter((l) => l.cantidadPendiente > 0)
      .map((l) => ({
        transferenciaDetalleId: l.id,
        productoNombre: l.productoNombre,
        codigoProducto: l.codigoProducto,
        cantidadEnviada: l.cantidadEnviada,
        cantidadRecibida: l.cantidadRecibida,
        cantidadPendiente: l.cantidadPendiente,
        cantidadARecibir: '0',seriesEsperadas:l.series.filter(s=>!s.recibida && !s.resuelta).map(s=>s.numeroSerie),seriesCapturadas:[],
      }));

    recepcionOperacionId.current=crypto.randomUUID();
    setCapturaRecepcion('');setFechaRecepcionReal('');
    setLineasRecepcion(lineasPendientes);
    setObservacionRecepcion('');
    setDialogRecepcionAbierto(true);
  };

  const confirmarRecepcion = async () => {
    if (!detalle) return;

    const lineasAProcesar = lineasRecepcion
      .map((l) => ({
        transferenciaDetalleId: l.transferenciaDetalleId,
        cantidad: l.seriesEsperadas.length ? l.seriesCapturadas.length : Number(l.cantidadARecibir),series:l.seriesCapturadas,
      }))
      .filter((l) => !isNaN(l.cantidad) && l.cantidad > 0);

    if (lineasAProcesar.length === 0) {
      setError('Debe especificar una cantidad mayor a cero a recepcionar.');
      return;
    }

    try {
      setGuardandoRecepcion(true);
      setError(null);

      const res = await TransferenciaService.recepcionar(detalle.id, {
        lineas: lineasAProcesar,operacionId:recepcionOperacionId.current,fechaReal:fechaRecepcionReal?new Date(fechaRecepcionReal).toISOString():undefined,
        observaciones: observacionRecepcion.trim() || null,
      });

      setMensaje(`Recepción ${res.numeroRecepcion} confirmada exitosamente.`);
      setDialogRecepcionAbierto(false);

      await cargarDetalleTransferencia(detalle.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al confirmar la recepción física.');
    } finally {
      setGuardandoRecepcion(false);
    }
  };

  const nuevo = () => {
    operacionId.current=crypto.randomUUID();
    setFechaReal('');setOrigenId('');
    setDestinoId('');
    setObservacion('');
    setLineas([]);
    setNumeroGuardado(null);
    setDetalle(null);
    setSelectedTab('general');
    setError(null);
    setMensaje(null);
    if (isViewMode) {
      navigate('/servicio-campo/transferencias/nuevo');
    }
  };

  const totalCantidad = useMemo(() => {
    if (isViewMode && detalle) {
      return detalle.lineas.reduce((acc, l) => acc + l.cantidadEnviada, 0);
    }
    return lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);
  }, [isViewMode, detalle, lineas]);

  const bloqueado = isViewMode || Boolean(numeroGuardado) || saving;
  const pestanaProductosHabilitada = Boolean(origenId && destinoId) || isViewMode;
  const puedeRecepcionar =
    isViewMode &&
    detalle && detalle.puedeRecepcionar &&
    (detalle.estado === 'EnTransito' || detalle.estado === 'ParcialmenteRecibida') &&
    detalle.lineas.some((l) => l.cantidadPendiente > 0);

  // Columnas DataGrid para la lista estilo Symbar en Creación
  const columnasProductosCreacion: TableColumnDefinition<LineaTransferenciaForm>[] = useMemo(
    () => [
      createTableColumn({
        columnId: 'producto',
        renderHeaderCell: () => 'Producto',
        renderCell: (linea) => (
          <TableCellLayout>
            <Text weight="semibold">{linea.nombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'sku',
        renderHeaderCell: () => 'SKU',
        renderCell: (linea) => (
          <TableCellLayout>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              {linea.codigo || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'uom',
        renderHeaderCell: () => 'UOM',
        renderCell: (linea) => (
          <TableCellLayout>
            <Badge appearance="tint" color="informative">
              {linea.unidad || 'UND'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'serie',
        renderHeaderCell: () => 'Serie',
        renderCell: (linea) => (
          <TableCellLayout>
            {linea.serie ? (
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: tokens.colorBrandForeground1 }}>
                {linea.serie}
              </span>
            ) : (
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                —
              </Text>
            )}
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
        columnId: 'acciones',
        renderHeaderCell: () => '',
        renderCell: (linea) => (
          <TableCellLayout style={{ width: '48px', justifyContent: 'center' }}>
            <Button
              appearance="subtle"
              icon={<Delete16Regular />}
              aria-label="Eliminar producto"
              onClick={() => eliminarLinea(linea.clave)}
            />
          </TableCellLayout>
        ),
      }),
    ],
    []
  );

  // Columnas DataGrid en modo detalle/vista
  const columnasProductosDetalle: TableColumnDefinition<TransferenciaDetalleLineaDto>[] = useMemo(
    () => [
      createTableColumn({
        columnId: 'producto',
        renderHeaderCell: () => 'Producto',
        renderCell: (item) => (
          <TableCellLayout>
            <div>
              <Text weight="semibold">{item.productoNombre}</Text>
              {item.codigoProducto && (
                <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                  Cód: {item.codigoProducto}
                </Text>
              )}
            </div>
          </TableCellLayout>
        ),
      }),
      createTableColumn({ columnId:'condicion', renderHeaderCell:()=> 'Condición', renderCell:l=>l.condicion }),
      createTableColumn({ columnId:'unidad', renderHeaderCell:()=> 'Unidad', renderCell:l=>l.unidadMedidaNombre ?? 'No registrada' }),
      createTableColumn({
        columnId: 'enviada',
        renderHeaderCell: () => 'Cantidad Enviada',
        renderCell: (item) => (
          <TableCellLayout>
            <Text weight="semibold">{item.cantidadEnviada.toLocaleString('es-PE')}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'recibida',
        renderHeaderCell: () => 'Cantidad Recibida',
        renderCell: (item) => (
          <TableCellLayout>
            <Badge
              appearance="tint"
              color={item.cantidadRecibida >= item.cantidadEnviada ? 'success' : 'informative'}
            >
              {item.cantidadRecibida.toLocaleString('es-PE')}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn({ columnId:'resuelta',renderHeaderCell:()=> 'Regularizada',renderCell:l=>l.cantidadResuelta.toLocaleString('es-PE') }),
      createTableColumn({
        columnId: 'pendiente',
        renderHeaderCell: () => 'Pendiente',
        renderCell: (item) => (
          <TableCellLayout>
            <Badge appearance="filled" color={item.cantidadPendiente > 0 ? 'warning' : 'success'}>
              {item.cantidadPendiente.toLocaleString('es-PE')}
            </Badge>
          </TableCellLayout>
        ),
      }),
    ],
    []
  );

  // Columnas para el historial de recepciones
  const columnasRecepciones: TableColumnDefinition<RecepcionTransferenciaItemDto>[] = useMemo(
    () => [
      createTableColumn({
        columnId: 'numero',
        renderHeaderCell: () => 'N° Recepción',
        renderCell: (r) => (
          <TableCellLayout>
            <Text weight="semibold">{r.numeroRecepcion}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'fecha',
        renderHeaderCell: () => 'Fecha',
        renderCell: (r) => (
          <TableCellLayout>{new Date(r.fechaRecepcion).toLocaleString('es-PE')}</TableCellLayout>
        ),
      }),
      createTableColumn({ columnId:'captura',renderHeaderCell:()=> 'Material recibido',renderCell:r=>r.lineas.map(l=>`${l.codigoProducto}: ${l.cantidad}${l.series.length?' · '+l.series.join(', '):''}`).join(' / ') }),
      createTableColumn({
        columnId: 'receptor',
        renderHeaderCell: () => 'Recibido Por',
        renderCell: (r) => <TableCellLayout>{r.recibidoPorNombre}</TableCellLayout>,
      }),
      createTableColumn({
        columnId: 'observaciones',
        renderHeaderCell: () => 'Observaciones',
        renderCell: (r) => <TableCellLayout truncate>{r.observaciones || '—'}</TableCellLayout>,
      }),
    ],
    []
  );

  if (loading) {
    return (
      <div
        className={formStyles.root}
        style={{ alignItems: 'center', justifyContent: 'center', minHeight: '360px' }}
      >
        <Spinner label="Cargando transferencia..." />
      </div>
    );
  }

  const estadoBadgeColor =
    detalle?.estado === 'Cerrada'
      ? 'success'
      : detalle?.estado === 'EnTransito'
      ? 'warning'
      : detalle?.estado === 'ParcialmenteRecibida'
      ? 'important'
      : detalle?.estado === 'Cancelada'
      ? 'danger'
      : 'informative';

  return (
    <div className={formStyles.root}>
      {error && (
        <D365MessageBar intent="error" onDismiss={() => setError(null)}>
          {error}
        </D365MessageBar>
      )}
      {mensaje && (
        <D365MessageBar intent="success" onDismiss={() => setMensaje(null)}>
          {mensaje}
        </D365MessageBar>
      )}

      <D365CommandBar
        ariaLabel="Comandos de transferencia"
        busy={saving || guardandoRecepcion}
        busyLabel="Procesando transferencia..."
      >
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Volver"
            title="Volver al listado"
            onClick={() => navigate('/servicio-campo/transferencias')}
          />
          <D365CommandDivider />

          {!bloqueado && (
            <>
              <D365CommandButton
                icon={<Save16Regular />}
                tone="save"
                disabled={saving || !origenId || !destinoId || lineas.length === 0}
                onClick={() => void guardar(false)}
              >
                Confirmar despacho
              </D365CommandButton>
              <D365CommandButton
                icon={<SaveMultiple16Regular />}
                tone="save"
                disabled={saving || !origenId || !destinoId || lineas.length === 0}
                onClick={() => void guardar(true)}
              >
                Confirmar despacho y cerrar
              </D365CommandButton>
              <D365CommandDivider />
            </>
          )}

          {puedeRecepcionar && (
            <>
              <D365CommandButton
                icon={<CheckmarkCircle16Regular />}
                tone="create"
                onClick={abrirDialogoRecepcion}
              >
                Recepcionar mercadería
              </D365CommandButton>
              <D365CommandDivider />
            </>
          )}

          {isViewMode && detalle && <ResolverDiferenciaDialog detalle={detalle} onResuelto={() => cargarDetalleTransferencia(detalle.id)} />}
          {isViewMode && (
            <D365CommandButton
              icon={<ArrowSync16Regular />}
              onClick={() => void cargarDetalleTransferencia(detalle!.id)}
            >
              Actualizar
            </D365CommandButton>
          )}

          <D365CommandButton icon={<Add16Regular />} tone="create" disabled={saving} onClick={nuevo}>
            Nuevo
          </D365CommandButton>
        </div>
      </D365CommandBar>

      <D365EntityHeader
        title={detalle?.numero ?? numeroGuardado ?? 'Nueva transferencia'}
        subtitle="Transferencia de inventario y despacho logístico"
        avatarName={detalle?.numero ?? numeroGuardado ?? 'Transferencia'}
        metadata={
          isViewMode && detalle
            ? [
                { label: 'Estado', value: detalle.estado },
                {
                  label: 'Modalidad',
                  value: detalle.modalidad === 'ConTransito' ? 'Con Tránsito' : 'Inmediata',
                },
                { label: 'Origen', value: detalle.almacenOrigenNombre },
                { label: 'Destino', value: detalle.almacenDestinoNombre },
                { label: 'Total Cantidad', value: totalCantidad.toLocaleString('es-PE') },
              ]
            : [
                { label: 'Estado', value: 'Borrador' },
                {
                  label: 'Origen',
                  value: almacenOrigen?.nombre ?? 'Sin seleccionar',
                },
                {
                  label: 'Destino',
                  value: almacenDestino?.nombre ?? 'Sin seleccionar',
                },
              ]
        }
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) =>
              setSelectedTab(data.value as 'general' | 'productos' | 'recepciones')
            }
          >
            <Tab value="general" icon={<Box16Regular />}>
              General
            </Tab>
            <Tab value="productos" disabled={!pestanaProductosHabilitada} icon={<Table16Regular />}>
              Productos
            </Tab>
            {isViewMode && (
              <Tab value="recepciones" icon={<History16Regular />}>
                Recepciones
              </Tab>
            )}
          </TabList>
        }
      />

      <div className={formStyles.contentBody}>
        {selectedTab === 'general' ? (
          <div className={formStyles.card}>
            {/* Modalidad operativa detectada */}
            {operacionModalidad && !isViewMode && (
              <div className={styles.hintCard}>
                <VehicleTruckProfile16Regular style={{ fontSize: '20px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <Text weight="semibold">{operacionModalidad.titulo}</Text>
                    <Badge appearance="tint" color={operacionModalidad.badgeColor} size="small">
                      {modalidad === 2 ? 'Con tránsito' : 'Inmediata'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {isViewMode && detalle && (
              <div className={styles.hintCard}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <Text weight="semibold">Estado actual: {detalle.estado}</Text>
                    <Badge appearance="filled" color={estadoBadgeColor} size="small">
                      {detalle.modalidad === 'ConTransito' ? 'Traslado Inter-Bodegas' : 'Despacho Directo'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <div className={formStyles.grid2Cols}>
              <D365FormField label="Número de transferencia">
                <Input
                  className={formStyles.d365ControlFull}
                  value={detalle?.numero ?? numeroGuardado ?? 'Automático al guardar'}
                  readOnly
                  appearance="filled-darker"
                  contentAfter={<LockClosed16Regular title="Generado automáticamente por el servidor" />}
                />
              </D365FormField>

              <D365FormField label="Fecha de registro">
                <Input
                  type="date"
                  className={formStyles.d365ControlFull}
                  value={fechaRegistro}
                  readOnly
                  appearance="filled-darker"
                  contentAfter={<LockClosed16Regular title="Fecha de movimiento" />}
                />
              </D365FormField>

              {/* Selector Almacén de Origen: SOLO el nombre */}
              <D365FormField label="Almacén de origen" required>
                {isViewMode && detalle ? (
                  <Input
                    className={formStyles.d365ControlFull}
                    value={detalle.almacenOrigenNombre}
                    readOnly
                    appearance="filled-darker"
                  />
                ) : (
                  <Select
                    className={formStyles.d365ControlFull}
                    value={origenId}
                    disabled={bloqueado}
                    onChange={(_, d) => {
                      setOrigenId(d.value);
                      setDestinoId('');
                      setLineas([]);
                    }}
                  >
                    <option value="">Seleccione almacén de origen...</option>
                    {almacenes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </Select>
                )}
              </D365FormField>

              {/* Selector Almacén de Destino: SOLO el nombre */}
              <D365FormField label="Almacén de destino" required>
                {isViewMode && detalle ? (
                  <Input
                    className={formStyles.d365ControlFull}
                    value={detalle.almacenDestinoNombre}
                    readOnly
                    appearance="filled-darker"
                  />
                ) : (
                  <Select
                    className={formStyles.d365ControlFull}
                    value={destinoId}
                    disabled={bloqueado || !origenId}
                    onChange={(_, d) => setDestinoId(d.value)}
                  >
                    <option value="">
                      {!origenId
                        ? 'Primero elija almacén de origen...'
                        : 'Seleccione almacén de destino...'}
                    </option>
                    {almacenesDestinoDisponibles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </Select>
                )}
              </D365FormField>
            </div>

            {!isViewMode && <div className={formStyles.grid2Cols}>
              <D365FormField label="Ubicación de origen" required><Select disabled={bloqueado} value={ubicacionOrigenId} onChange={(_,d)=>{setUbicacionOrigenId(d.value);setLineas([]);setProductoSeleccionado(null);setSerieSeleccionada(null);}}>{ubicacionesOrigen.map(u=><option key={u.id} value={u.id}>{u.nombre}</option>)}</Select></D365FormField>
              <D365FormField label="Ubicación de destino" required><Select disabled={bloqueado} value={ubicacionDestinoId} onChange={(_,d)=>setUbicacionDestinoId(d.value)}>{ubicacionesDestino.map(u=><option key={u.id} value={u.id}>{u.nombre}</option>)}</Select></D365FormField>
              <D365FormField label="Entrega"><Select value={String(modalidad)} onChange={(_,d)=>setModalidad(Number(d.value) as 1|2)} disabled={bloqueado || almacenOrigen?.unidadOrganizativaId!==almacenDestino?.unidadOrganizativaId}><option value="1">Presencial: confirmar salida e ingreso</option><option value="2">Con tránsito: el destino recepciona</option></Select></D365FormField>
              <D365FormField label="Condición del material"><Select disabled={bloqueado} value={String(condicion)} onChange={(_,d)=>{setCondicion(Number(d.value) as 1|2);setLineas([]);setProductoSeleccionado(null);setSerieSeleccionada(null);}}><option value="1">Utilizable</option><option value="2">Defectuoso</option></Select></D365FormField>
            </div>}
            {isViewMode && detalle ? <div className={formStyles.grid2Cols}><D365FormField label="Ubicación de origen"><Input readOnly value={detalle.ubicacionOrigenNombre ?? 'No registrada en el histórico'} /></D365FormField><D365FormField label="Ubicación de destino"><Input readOnly value={detalle.ubicacionDestinoNombre ?? 'No registrada en el histórico'} /></D365FormField><D365FormField label="Fecha real"><Input readOnly value={new Date(detalle.fechaReal).toLocaleString('es-PE')} /></D365FormField></div> : <D365FormField label="Fecha real del despacho (opcional)"><Input type="datetime-local" disabled={bloqueado} value={fechaReal} onChange={(_,d)=>setFechaReal(d.value)} /></D365FormField>}
            <D365FormField label="Motivo u observación" align="top">
              <Textarea
                className={formStyles.d365ControlFull}
                rows={3}
                value={observacion}
                disabled={bloqueado}
                maxLength={500}
                onChange={(_, d) => setObservacion(d.value)}
              />
            </D365FormField>
          </div>
        ) : selectedTab === 'productos' ? (
          <div className={formStyles.card}>
            {isViewMode && detalle ? (
              // Modo solo consulta de productos
              <>
                <div style={{ marginBottom: '8px' }}>
                  <Text weight="semibold" size={300}>
                    Líneas transferidas
                  </Text>
                </div>

                <div className={styles.tableWrapper}>
                  <DataGrid items={detalle.lineas} columns={columnasProductosDetalle} getRowId={(l) => l.id} size="medium">
                    <DataGridHeader>
                      <DataGridRow>
                        {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
                      </DataGridRow>
                    </DataGridHeader>
                    <DataGridBody<TransferenciaDetalleLineaDto>>
                      {({ item, rowId }) => (
                        <DataGridRow<TransferenciaDetalleLineaDto> key={rowId}>
                          {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                        </DataGridRow>
                      )}
                    </DataGridBody>
                  </DataGrid>
                </div>

                <div className={styles.totalsBar}>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Total ítems: {detalle.lineas.length}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Total unidades transferidas:
                    </Text>
                    <Text weight="bold" size={400}>
                      {totalCantidad.toLocaleString('es-PE')}
                    </Text>
                  </div>
                </div>
              </>
            ) : cargandoStock ? (
              <div className={styles.emptyBox}>
                <Spinner label="Consultando existencias disponibles en almacén de origen..." />
              </div>
            ) : (
              <>
                {/* 1. SECCIÓN DE ENTRADA / ESCANEO ESTILO SYMBAR */}
                {!bloqueado && (
                  <div className={styles.scannerPanel}>
                    <div className={styles.scannerGrid}>
                      {/* Campo 1: SKU / SERIE */}
                      <div className={styles.scannerField}>
                        <label className={styles.scannerLabel} htmlFor="symbar-sku-serie">
                          SKU / SERIE
                        </label>
                        <Input
                          id="symbar-sku-serie"
                          ref={scannerInputRef}
                          contentBefore={<Search16Regular />}
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

                      {/* Campo 2: Producto (Autocompletado / Selector) */}
                      <div className={styles.scannerField}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className={styles.scannerLabel}>Producto</label>
                          {productoSeleccionado && !serieSeleccionada && (
                            <Text size={100} style={{ color: tokens.colorBrandForeground1 }}>
                              Disp: {productoSeleccionado.cantidadDisponible} {productoSeleccionado.nombreUnidadMedida || 'UND'}
                            </Text>
                          )}
                        </div>
                        {productoSeleccionado ? (
                          <Input
                            readOnly
                            appearance="filled-darker"
                            value={
                              serieSeleccionada
                                ? `${productoSeleccionado.nombreProducto} (Serie: ${serieSeleccionada.numeroSerie})`
                                : productoSeleccionado.nombreProducto
                            }
                            contentAfter={
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Dismiss16Regular />}
                                onClick={() => {
                                  setProductoSeleccionado(null);
                                  setSerieSeleccionada(null);
                                  setScannerQuery('');
                                }}
                              />
                            }
                          />
                        ) : (
                          <Select
                            value=""
                            onChange={(_, d) => {
                              const prod = stocksOrigen.find((s) => s.productoId === d.value);
                              if (prod) {
                                setProductoSeleccionado(prod);
                                setSerieSeleccionada(null);
                                setScannerQuery(prod.codigoProducto || prod.nombreProducto);
                                setScannerCantidad('1');
                                setScannerError(null);
                              }
                            }}
                          >
                            <option value="">Buscar en lista de disponibles ({stocksOrigen.length + seriesOrigen.length} ítems)...</option>
                            {stocksOrigen.map((p) => (
                              <option key={p.productoId} value={p.productoId}>
                                {p.codigoProducto ? `${p.codigoProducto} — ` : ''}
                                {p.nombreProducto} (Disp: {p.cantidadDisponible} {p.nombreUnidadMedida || 'UND'})
                              </option>
                            ))}
                          </Select>
                        )}
                      </div>

                      {/* Campo 3: UOM */}
                      <div className={styles.scannerField}>
                        <label className={styles.scannerLabel}>UOM</label>
                        <Input
                          readOnly
                          appearance="filled-darker"
                          value={
                            serieSeleccionada
                              ? 'UND'
                              : productoSeleccionado?.nombreUnidadMedida || 'UND'
                          }
                        />
                      </div>

                      {/* Campo 4: Cantidad */}
                      <div className={styles.scannerField}>
                        <label className={styles.scannerLabel}>Cantidad</label>
                        <Input
                          type="number"
                          min={1}
                          max={
                            serieSeleccionada
                              ? 1
                              : productoSeleccionado?.cantidadDisponible || undefined
                          }
                          disabled={Boolean(serieSeleccionada)}
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
                      <span className={styles.errorText}>
                        <Warning16Filled /> {scannerError}
                      </span>
                    )}
                  </div>
                )}

                {/* 2. TABLA INFERIOR DE PRODUCTOS AGREGADOS (ESTILO SYMBAR) */}
                {lineas.length === 0 ? (
                  <div className={styles.emptyBox}>
                    <Text
                      weight="semibold"
                      style={{
                        display: 'block',
                        color: tokens.colorNeutralForeground2,
                        marginBottom: '6px',
                      }}
                    >
                      No se han agregado productos a la transferencia
                    </Text>
                  </div>
                ) : (
                  <>
                    <div className={styles.tableWrapper}>
                      <DataGrid
                        items={lineas}
                        columns={columnasProductosCreacion}
                        getRowId={(l) => l.clave}
                        size="medium"
                      >
                        <DataGridHeader>
                          <DataGridRow>
                            {({ renderHeaderCell }) => (
                              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                            )}
                          </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody<LineaTransferenciaForm>>
                          {({ item, rowId }) => (
                            <DataGridRow<LineaTransferenciaForm> key={rowId}>
                              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                            </DataGridRow>
                          )}
                        </DataGridBody>
                      </DataGrid>
                    </div>

                    <div className={styles.totalsBar}>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Líneas en transferencia: {lineas.length}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          Total unidades a transferir:
                        </Text>
                        <Text weight="bold" size={400}>
                          {totalCantidad.toLocaleString('es-PE')}
                        </Text>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          // Pestaña Recepciones
          <div className={formStyles.card}>
            <div style={{ marginBottom: '12px' }}>
              <Text weight="semibold" size={300}>
                Historial de recepciones físicas en destino
              </Text>
            </div>

            {detalle?.resoluciones?.length ? <div className={formStyles.card}><Text weight="semibold">Regularizaciones del supervisor</Text>{detalle.resoluciones.map(r=><div key={r.id} style={{marginTop:12}}><Text weight="semibold">{r.resultado === 'RestitucionAOrigen' ? 'Restituido al origen' : 'Ingreso en destino'} · {r.cantidad} · {r.supervisor} · {new Date(r.fecha).toLocaleString('es-PE')}</Text><p>{r.motivo} · Evidencia: {r.evidencia}</p>{r.series.length>0 && <p>Series: {r.series.join(', ')}</p>}</div>)}</div> : null}
            {detalle?.recepciones && detalle.recepciones.length > 0 ? (
              <div className={styles.tableWrapper}>
                <DataGrid
                  items={detalle.recepciones}
                  columns={columnasRecepciones}
                  getRowId={(r) => r.id}
                  size="medium"
                >
                  <DataGridHeader>
                    <DataGridRow>
                      {({ renderHeaderCell }) => (
                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                      )}
                    </DataGridRow>
                  </DataGridHeader>
                  <DataGridBody<RecepcionTransferenciaItemDto>>
                    {({ item, rowId }) => (
                      <DataGridRow<RecepcionTransferenciaItemDto> key={rowId}>
                        {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                </DataGrid>
              </div>
            ) : (
              <div className={styles.emptyBox}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  No se han registrado recepciones físicas para esta transferencia.
                </Text>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diálogo de confirmación de recepción física en destino */}
      <Dialog
        open={dialogRecepcionAbierto}
        onOpenChange={(_, data) => setDialogRecepcionAbierto(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Recepción física de mercadería en destino</DialogTitle>
            <DialogContent>
              {error && <D365MessageBar intent="error">{error}</D365MessageBar>}
              <Input type="datetime-local" aria-label="Fecha real de recepción (opcional)" value={fechaRecepcionReal} onChange={(_,d)=>setFechaRecepcionReal(d.value)} />

              <div className={styles.modalTableWrapper}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Producto</th>
                      <th style={{ padding: '8px' }}>Enviado</th>
                      <th style={{ padding: '8px' }}>Pendiente</th>
                      <th style={{ padding: '8px' }}>A Recepcionar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineasRecepcion.map((lr) => (
                      <tr key={lr.transferenciaDetalleId} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                        <td style={{ padding: '8px' }}>
                          <Text weight="semibold">{lr.productoNombre}</Text>
                          {lr.codigoProducto && (
                            <Text size={100} style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
                              {lr.codigoProducto}
                            </Text>
                          )}
                        </td>
                        <td style={{ padding: '8px' }}>{lr.cantidadEnviada}</td>
                        <td style={{ padding: '8px' }}>
                          <Badge appearance="tint" color="warning">
                            {lr.cantidadPendiente}
                          </Badge>
                        </td>
                        <td style={{ padding: '8px', width: '110px' }}>
                          {lr.seriesEsperadas.length>0 ? <div><Text>{lr.seriesCapturadas.length} capturadas</Text>{lr.seriesCapturadas.map(s=><Button key={s} size="small" onClick={()=>setLineasRecepcion(prev=>prev.map(l=>l===lr?{...l,seriesCapturadas:l.seriesCapturadas.filter(x=>x!==s)}:l))}>{s} ×</Button>)}</div> : <Input
                            type="number"
                            min={0}
                            max={lr.cantidadPendiente}
                            step="any"
                            value={lr.cantidadARecibir}
                            onChange={(_, d) => {
                              setLineasRecepcion((prev) =>
                                prev.map((item) =>
                                  item.transferenciaDetalleId === lr.transferenciaDetalleId
                                    ? { ...item, cantidadARecibir: d.value }
                                    : item
                                )
                              );
                            }}
                            style={{ width: '90px' }}
                          />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <D365FormField label="Capturar serie o SKU"><Input value={capturaRecepcion} onChange={(_,d)=>setCapturaRecepcion(d.value)} onKeyDown={e=>{if(e.key==='Enter')capturarRecepcion();}} /></D365FormField>
              <D365FormField label="Cantidad para no seriados"><Input type="number" value={cantidadCaptura} onChange={(_,d)=>setCantidadCaptura(d.value)} /></D365FormField>
              <Button onClick={capturarRecepcion}>Agregar captura</Button>
              <D365FormField label="Observaciones de recepción" align="top">
                <Textarea
                  rows={2}
                  value={observacionRecepcion}
                  onChange={(_, d) => setObservacionRecepcion(d.value)}
                  style={{ width: '100%' }}
                />
              </D365FormField>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                disabled={guardandoRecepcion}
                onClick={() => setDialogRecepcionAbierto(false)}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                disabled={guardandoRecepcion}
                onClick={() => void confirmarRecepcion()}
              >
                {guardandoRecepcion ? 'Confirmando...' : 'Confirmar ingreso'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
