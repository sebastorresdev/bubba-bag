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
  ArrowSync16Regular,
  Box16Regular,
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
    gridTemplateColumns: 'minmax(200px, 1.2fr) minmax(240px, 1.6fr) 90px 150px 110px auto',
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
  const { id } = useParams<{ id?: string }>();

  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [tecnicos, setTecnicos] = useState<RecursoDto[]>([]);
  const [, setUbicacionesDestino] = useState<UbicacionInventarioDto[]>([]);
  const [productosCustodia, setProductosCustodia] = useState<InventarioProductoDto[]>([]);

  // Form states
  const [transferenciaId, setTransferenciaId] = useState<string | null>(null);
  const [numeroTransferencia, setNumeroTransferencia] = useState('');
  const [estado, setEstado] = useState<string>('Borrador');
  const operacionIdRef = React.useRef(crypto.randomUUID());

  const [selectedTab, setSelectedTab] = useState<'general' | 'productos'>('general');
  const [almacenOrigenId, setAlmacenOrigenId] = useState('');
  const [busquedaAlmacenOrigen, setBusquedaAlmacenOrigen] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [almacenDestinoId, setAlmacenDestinoId] = useState('');
  const [busquedaDestino, setBusquedaDestino] = useState('');
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState('');
  const [numeroGuiaRemision, setNumeroGuiaRemision] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estados escáner Symbar
  const [todasSeriesCustodia, setTodasSeriesCustodia] = useState<ItemSeriadoStockDto[]>([]);
  const [scannerQuery, setScannerQuery] = useState('');
  const [scannerCantidad, setScannerCantidad] = useState('1');
  const [scannerCondicion, setScannerCondicion] = useState<1 | 2>(1); // 1: Utilizable, 2: Defectuoso
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerInputRef = React.useRef<HTMLInputElement>(null);
  const [productoSeleccionadoScanner, setProductoSeleccionadoScanner] = useState<InventarioProductoDto | null>(null);
  const [serieSeleccionadaScanner, setSerieSeleccionadaScanner] = useState<ItemSeriadoStockDto | null>(null);

  // Estados de eliminación de borrador
  const [dialogEliminarBorrador, setDialogEliminarBorrador] = useState(false);
  const [eliminandoBorrador, setEliminandoBorrador] = useState(false);

  const [lineas, setLineas] = useState<LineaDevolucion[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const toasterId = useId('devolucion-toaster');
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
  const [devolucionExitosa, setDevolucionExitosa] = useState<{
    id?: string;
    numero: string;
    tecnicoNombre?: string;
    almacenDestinoNombre?: string;
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
          setNumeroTransferencia(det.numero);
          if (det.numeroGuiaRemision) setNumeroGuiaRemision(det.numeroGuiaRemision);
          setEstado(det.estado || 'Borrador');
          setAlmacenOrigenId(det.almacenOrigenId);
          setAlmacenDestinoId(det.almacenDestinoId);
          setUbicacionDestinoId(det.ubicacionDestinoId || '');
          setObservaciones(det.observaciones || '');

          // Encontrar almacén de origen (custodia) y técnico asociado
          const almOrigen = alms.find(a => a.id === det.almacenOrigenId);
          if (almOrigen?.recursoId) {
            setTecnicoId(almOrigen.recursoId);
          } else {
            const tec = tecs.find(t => t.id === det.almacenOrigenId || t.nombreCompleto === det.almacenOrigenNombre);
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
                condicion: l.condicion === 'Defectuoso' ? (2 as const) : (1 as const),
                series: l.series ? l.series.map(s => s.numeroSerie) : [],
              }))
            );
            setSelectedTab('productos');
          }
        } else {
          const bodegas = alms.filter(a => a.tipo === 1);
          if (bodegas.length > 0) {
            setAlmacenDestinoId(bodegas[0].id);
          }
        }
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar los datos de la devolución.' });
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [id]);

  const opcionesAlmacenesOrigen = useMemo(() => {
    let lista = almacenes.filter((a) => a.tipo === 2 && a.id !== almacenDestinoId);
    if (lista.length === 0) {
      lista = almacenes.filter((a) => a.id !== almacenDestinoId);
    }
    return lista.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      detalle: null,
    }));
  }, [almacenes, almacenDestinoId]);

  const almacenOrigenSeleccionado = useMemo(() => {
    return opcionesAlmacenesOrigen.find((o) => o.id === almacenOrigenId) || null;
  }, [opcionesAlmacenesOrigen, almacenOrigenId]);

  const custodiaTecnico = useMemo(() => {
    if (!almacenOrigenId) {
      if (!tecnicoId) return null;
      return almacenes.find((a) => a.recursoId === tecnicoId && a.tipo === 2) || null;
    }
    return almacenes.find((a) => a.id === almacenOrigenId) || null;
  }, [almacenOrigenId, tecnicoId, almacenes]);

  const tecnicoObj = useMemo(() => {
    if (!custodiaTecnico) return null;
    if (custodiaTecnico.recursoId) {
      return tecnicos.find((t) => t.id === custodiaTecnico.recursoId) || null;
    }
    return (
      tecnicos.find(
        (t) =>
          t.nombreCompleto === custodiaTecnico.nombre ||
          t.nombreCompleto === custodiaTecnico.recursoNombre
      ) || null
    );
  }, [custodiaTecnico, tecnicos]);

  const opcionesBodegasDestino = useMemo(() => {
    const bodegas = almacenes.filter(a => a.tipo === 1);
    const orgId = custodiaTecnico?.unidadOrganizativaId || tecnicoObj?.unidadOrganizativaId;
    const filtradas = orgId
      ? bodegas.filter(b => !b.unidadOrganizativaId || b.unidadOrganizativaId === orgId)
      : bodegas;

    return filtradas.map(b => ({
      id: b.id,
      nombre: b.nombre,
      detalle: null,
    }));
  }, [almacenes, custodiaTecnico, tecnicoObj]);

  const bodegaDestinoSeleccionada = useMemo(() => {
    return opcionesBodegasDestino.find(o => o.id === almacenDestinoId) || null;
  }, [opcionesBodegasDestino, almacenDestinoId]);

  useEffect(() => {
    if (!custodiaTecnico) {
      setProductosCustodia([]);
      setTodasSeriesCustodia([]);
      return;
    }
    const cargarStockCustodia = async () => {
      try {
        const [stocks, sers] = await Promise.all([
          InventarioProductoService.obtener(custodiaTecnico.id),
          InventarioProductoService.obtenerSeries(custodiaTecnico.id),
        ]);
        setProductosCustodia(stocks);
        setTodasSeriesCustodia(sers);
      } catch (err: any) {
        console.error(err);
      }
    };
    void cargarStockCustodia();
  }, [custodiaTecnico]);

  useEffect(() => {
    if (!almacenDestinoId) {
      setUbicacionesDestino([]);
      setUbicacionDestinoId('');
      return;
    }
    const cargarDestino = async () => {
      try {
        const ubics = await AlmacenService.getUbicaciones(almacenDestinoId);
        setUbicacionesDestino(ubics);
        const principal = ubics.find(u => u.codigo === 'PRINCIPAL') || ubics[0];
        setUbicacionDestinoId(principal?.id || '');
      } catch (err: any) {
        console.error(err);
      }
    };
    void cargarDestino();
  }, [almacenDestinoId]);

  // Series libres en custodia del técnico (no agregadas aún a lineas)
  const seriesLibresCustodia = useMemo(() => {
    const seriesUsadas = new Set(lineas.flatMap((l) => l.series));
    return todasSeriesCustodia.filter((s) => !seriesUsadas.has(s.numeroSerie));
  }, [todasSeriesCustodia, lineas]);

  // PROCESAR BÚSQUEDA DEL SCANNER SYMBAR (SKU O SERIE) EN CUSTODIA
  const procesarScannerBusqueda = (query: string) => {
    const q = query.trim().toUpperCase();
    if (!q) {
      setScannerError(null);
      return;
    }

    setScannerError(null);

    // 1. Verificar si coincide con una serie en custodia del técnico
    const serieEncontrada = seriesLibresCustodia.find(
      (s) => s.numeroSerie.toUpperCase() === q
    );

    if (serieEncontrada) {
      setSerieSeleccionadaScanner(serieEncontrada);
      const prodOriginal = productosCustodia.find((p) => p.productoId === serieEncontrada.productoId);
      setProductoSeleccionadoScanner(
        prodOriginal || {
          stockId: '',
          productoId: serieEncontrada.productoId,
          codigoProducto: serieEncontrada.codigoProducto,
          nombreProducto: serieEncontrada.nombreProducto,
          almacenId: custodiaTecnico?.id || '',
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
          ubicacionId: ubicacionDestinoId || '',
          nombreUbicacion: '',
          condicion: 'Utilizable',
        }
      );
      setScannerCantidad('1');
      return;
    }

    // 2. Verificar si coincide con el SKU / código o nombre de producto en custodia
    const prodEncontrado = productosCustodia.find(
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

    setScannerError(`No se encontró "${query}" en existencias en custodia de este técnico.`);
  };

  // AGREGAR ÍTEM VÍA SYMBAR SCANNER (CON CONDICIÓN)
  const agregarDesdeScanner = () => {
    if (!productoSeleccionadoScanner) {
      if (scannerQuery.trim()) {
        procesarScannerBusqueda(scannerQuery);
      } else {
        setScannerError('Ingrese o escanee un SKU o Serie en custodia.');
      }
      return;
    }

    if (productoSeleccionadoScanner.esSerializado && !serieSeleccionadaScanner) {
      setScannerError('Este producto es serializado. Debe escanear o seleccionar el número de serie.');
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
        setScannerError(`La serie "${serieSeleccionadaScanner.numeroSerie}" ya está agregada para devolución.`);
        return;
      }

      setLineas((prev) => {
        const idx = prev.findIndex(
          (l) => l.productoId === productoSeleccionadoScanner.productoId && l.condicion === scannerCondicion
        );
        if (idx >= 0) {
          const clon = [...prev];
          clon[idx] = {
            ...clon[idx],
            cantidad: clon[idx].cantidad + 1,
            series: [...clon[idx].series, serieSeleccionadaScanner.numeroSerie],
          };
          return clon;
        }

        const nuevaLinea: LineaDevolucion = {
          idTemp: crypto.randomUUID(),
          productoId: productoSeleccionadoScanner.productoId,
          codigo: serieSeleccionadaScanner.codigoProducto || productoSeleccionadoScanner.codigoProducto || '',
          nombre: serieSeleccionadaScanner.nombreProducto || productoSeleccionadoScanner.nombreProducto,
          unidad: 'UND',
          cantidad: 1,
          condicion: scannerCondicion,
          series: [serieSeleccionadaScanner.numeroSerie],
        };
        return [...prev, nuevaLinea];
      });

      notifySuccess(`Serie ${serieSeleccionadaScanner.numeroSerie} agregada para devolución.`);
    } else {
      // Es producto no seriado
      const totalDevueltoMismoProducto = lineas
        .filter((l) => l.productoId === productoSeleccionadoScanner.productoId)
        .reduce((acc, l) => acc + l.cantidad, 0);

      if (totalDevueltoMismoProducto + cant > productoSeleccionadoScanner.cantidadDisponible) {
        setScannerError(
          `La cantidad a devolver (${totalDevueltoMismoProducto + cant}) supera el stock en custodia (${productoSeleccionadoScanner.cantidadDisponible} ${productoSeleccionadoScanner.nombreUnidadMedida || 'UND'}).`
        );
        return;
      }

      const lineaExistente = lineas.find(
        (l) => l.productoId === productoSeleccionadoScanner.productoId && l.condicion === scannerCondicion
      );

      if (lineaExistente) {
        setLineas((prev) =>
          prev.map((l) =>
            l.idTemp === lineaExistente.idTemp ? { ...l, cantidad: l.cantidad + cant } : l
          )
        );
      } else {
        const nuevaLinea: LineaDevolucion = {
          idTemp: crypto.randomUUID(),
          productoId: productoSeleccionadoScanner.productoId,
          codigo: productoSeleccionadoScanner.codigoProducto || '',
          nombre: productoSeleccionadoScanner.nombreProducto,
          unidad: productoSeleccionadoScanner.nombreUnidadMedida || 'UND',
          cantidad: cant,
          condicion: scannerCondicion,
          series: [],
        };
        setLineas((prev) => [...prev, nuevaLinea]);
      }

      notifySuccess(`Producto ${productoSeleccionadoScanner.nombreProducto} agregado para devolución.`);
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

  const resolverUbicaciones = async (): Promise<{ uOrig: string; uDest: string }> => {
    if (!custodiaTecnico) {
      throw new Error('El técnico seleccionado no tiene un almacén de custodia personal asociado en su sede.');
    }
    const ubicsOrigen = await AlmacenService.getUbicaciones(custodiaTecnico.id);
    const princOrigen = ubicsOrigen.find(u => u.codigo === 'PRINCIPAL') || ubicsOrigen[0];
    const uOrig = princOrigen?.id;
    if (!uOrig) {
      throw new Error('El almacén de custodia del técnico no tiene una ubicación principal configurada.');
    }

    let uDest = ubicacionDestinoId;
    const ubicsDestino = await AlmacenService.getUbicaciones(almacenDestinoId);
    if (!uDest || !ubicsDestino.some(u => u.id === uDest)) {
      const princDestino = ubicsDestino.find(u => u.codigo === 'PRINCIPAL') || ubicsDestino[0];
      uDest = princDestino?.id || '';
      if (uDest) setUbicacionDestinoId(uDest);
    }
    if (!uDest) {
      throw new Error('La bodega de destino seleccionada no tiene una ubicación principal configurada.');
    }

    return { uOrig, uDest };
  };

  const handleGuardar = async (cerrar: boolean) => {
    if (!tecnicoId || !custodiaTecnico) {
      setMensaje({ tipo: 'error', texto: 'Seleccione un técnico con almacén de custodia válido.' });
      return;
    }
    if (!almacenDestinoId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione la bodega de destino.' });
      return;
    }

    try {
      setSubmitting(true);
      setMensaje(null);

      const { uOrig, uDest } = await resolverUbicaciones();

      const res = await TransferenciaService.crear({
        transferenciaId: transferenciaId || undefined,
        almacenOrigenId: custodiaTecnico.id,
        almacenDestinoId,
        ubicacionOrigenId: uOrig,
        ubicacionDestinoId: uDest,
        modalidad: 1, // Inmediata
        operacionId: operacionIdRef.current,
        guiaRemision: numeroGuiaRemision.trim() || undefined,
        observacion: observaciones.trim() || undefined,
        esBorrador: true,
        lineas: lineas.map(l => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          series: l.series.length > 0 ? l.series : undefined,
          condicion: l.condicion,
        })),
      });

      setTransferenciaId(res.id || null);
      setNumeroTransferencia(res.numero);
      if (res.numeroGuiaRemision) setNumeroGuiaRemision(res.numeroGuiaRemision);
      if (res.estado) setEstado(res.estado);

      if (cerrar) {
        navigate('/servicio-campo/devolucion-tecnicos', {
          state: { successMessage: `Borrador guardado exitosamente (N° ${res.numero}${res.numeroGuiaRemision ? ` · Guía ${res.numeroGuiaRemision}` : ''}).` }
        });
      } else {
        setSelectedTab('productos');
        notifySuccess(`Borrador guardado exitosamente (N° ${res.numero}${res.numeroGuiaRemision ? ` · Guía ${res.numeroGuiaRemision}` : ''}). Ya puede agregar los productos a devolver.`);
      }
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar el borrador.' });
    } finally {
      setSubmitting(false);
    }
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

      const { uOrig, uDest } = await resolverUbicaciones();

      const res = await TransferenciaService.crear({
        transferenciaId: transferenciaId || undefined,
        almacenOrigenId: custodiaTecnico.id,
        almacenDestinoId,
        ubicacionOrigenId: uOrig,
        ubicacionDestinoId: uDest,
        modalidad: 1, // Inmediata
        operacionId: operacionIdRef.current,
        guiaRemision: numeroGuiaRemision.trim() || undefined,
        observacion: observaciones.trim() || undefined,
        esBorrador: false,
        lineas: lineas.map(l => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          series: l.series.length > 0 ? l.series : undefined,
          condicion: l.condicion,
        })),
      });

      setTransferenciaId(res.id || null);
      setNumeroTransferencia(res.numero);
      if (res.numeroGuiaRemision) setNumeroGuiaRemision(res.numeroGuiaRemision);
      setEstado(res.estado || 'Cerrada');

      const tecnicoObj = tecnicos.find((t) => t.id === tecnicoId);
      const almacenDestinoObj = almacenes.find((a) => a.id === almacenDestinoId);
      const cantTotal = lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);

      setDevolucionExitosa({
        id: res.id,
        numero: res.numero,
        tecnicoNombre: tecnicoObj?.nombreCompleto || 'Técnico',
        almacenDestinoNombre: almacenDestinoObj?.nombre || 'Bodega de destino',
        totalItems: cantTotal,
        totalLineas: lineas.length,
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

  const handleCompartirWhatsApp = async () => {
    const idCargo = devolucionExitosa?.id || transferenciaId;
    const numCargo = devolucionExitosa?.numero || numeroTransferencia;
    if (!idCargo) return;
    try {
      const tecnico = tecnicos.find((t) => t.id === tecnicoId);
      await TransferenciaService.compartirCargoWhatsapp(idCargo, numCargo, {
        tipoOperacion: 'Devolución de Técnico',
        destinatario: tecnico?.nombreCompleto,
        telefono: tecnico?.telefono || undefined,
      });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  const resetFormulario = () => {
    setTransferenciaId(null);
    setNumeroTransferencia('');
    setNumeroGuiaRemision('');
    setEstado('Borrador');
    operacionIdRef.current = crypto.randomUUID();
    setLineas([]);
    setObservaciones('');
    setScannerQuery('');
    setScannerCantidad('1');
    setScannerCondicion(1);
    setScannerError(null);
    setProductoSeleccionadoScanner(null);
    setSerieSeleccionadaScanner(null);
    setDevolucionExitosa(null);
    setSelectedTab('general');
  };

  const columnasDevolucion: TableColumnDefinition<LineaDevolucion>[] = useMemo(
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
        columnId: 'condicion',
        renderHeaderCell: () => 'Condición',
        renderCell: (linea) => (
          <TableCellLayout>
            <Badge
              appearance="tint"
              shape="rounded"
              color={linea.condicion === 1 ? 'informative' : 'danger'}
            >
              {linea.condicion === 1 ? 'Utilizable' : 'Defectuoso'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'series',
        renderHeaderCell: () => 'Series Devueltas',
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
            createTableColumn<LineaDevolucion>({
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
        <Spinner size="large" label="Cargando formulario de devolución..." />
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

      <D365CommandBar ariaLabel="Comandos de devolución de técnicos">
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Volver"
            title="Volver a Devoluciones"
            onClick={() => navigate('/servicio-campo/devolucion-tecnicos')}
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
                icon={<ArrowSync16Regular />}
                tone="create"
                onClick={() => void handleConfirmarDevolucion()}
                disabled={submitting || lineas.length === 0}
              >
                {submitting ? 'Procesando...' : 'Confirmar Devolución'}
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
        title={numeroTransferencia ? `${numeroTransferencia}` : 'Devolución de Material de Técnico'}
        subtitle="Reingreso a bodega de materiales sobrantes o equipos averiados retirados en campo"
        avatarIcon={<ArrowSync16Regular />}
        metadata={[
          ...(numeroTransferencia ? [{ label: 'N° Devolución', value: numeroTransferencia }] : []),
          ...(numeroGuiaRemision ? [{ label: 'Guía de Remisión', value: numeroGuiaRemision }] : []),
          { label: 'Estado', value: estado === 'Cerrada' ? 'Recibida' : estado },
        ]}
        processFlow={<TransferenciaEtapas estado={estado} tipoOperacion="Devolucion" embedded />}
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
              <div className={formStyles.cardSectionTitle}>Técnico que Devuelve y Bodega Receptora</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <D365FormField
                  label="Almacén que entrega"
                  required
                  info="Almacén móvil o de custodia personal asignado al técnico que realiza la devolución"
                >
                  <SelectorEntidadRelacionada
                    etiquetaGrupo="Almacenes de Custodia (Técnicos)"
                    opciones={opcionesAlmacenesOrigen}
                    seleccionada={almacenOrigenSeleccionado}
                    textoBusqueda={busquedaAlmacenOrigen}
                    alCambiarBusqueda={setBusquedaAlmacenOrigen}
                    alSeleccionar={(id) => {
                      setAlmacenOrigenId(id || '');
                      const alm = almacenes.find((a) => a.id === id);
                      if (alm?.recursoId) setTecnicoId(alm.recursoId);
                    }}
                    alNavegar={(id) => navigate(`/almacenes/${id}`)}
                    icono={<Box16Regular />}
                    tituloEnlace="Ver ficha del almacén"
                    textoVacio="No se encontraron almacenes de custodia disponibles"
                    deshabilitado={estado === 'Cerrada'}
                  />
                </D365FormField>

                <D365FormField
                  label="Bodega Destino"
                  required
                  info={tecnicoObj?.unidadOrganizativaNombre
                    ? `Solo se listan bodegas de la sede "${tecnicoObj.unidadOrganizativaNombre}" del técnico`
                    : "Almacén principal que recibe y resguarda los materiales"}
                >
                  <SelectorEntidadRelacionada
                    etiquetaGrupo="Bodegas Disponibles"
                    opciones={opcionesBodegasDestino}
                    seleccionada={bodegaDestinoSeleccionada}
                    textoBusqueda={busquedaDestino}
                    alCambiarBusqueda={setBusquedaDestino}
                    alSeleccionar={(id) => {
                      setAlmacenDestinoId(id || '');
                      setUbicacionDestinoId('');
                    }}
                    alNavegar={(id) => navigate(`/almacenes/${id}`)}
                    icono={<Box16Regular />}
                    tituloEnlace="Ver ficha del almacén"
                    textoVacio={tecnicoObj?.unidadOrganizativaNombre
                      ? `No hay bodegas disponibles en la sede ${tecnicoObj.unidadOrganizativaNombre}`
                      : "No se encontraron bodegas"}
                    deshabilitado={estado === 'Cerrada' || !tecnicoId}
                  />
                </D365FormField>

                <D365FormField label="Observaciones / Motivo" info="Información adicional o justificación del reingreso">
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
            <div className={formStyles.cardSectionTitle}>Materiales Retornados y Clasificación de Estado</div>

            {/* SECCIÓN DE ENTRADA / ESCANEO ESTILO SYMBAR */}
            {estado !== 'Cerrada' && (
              <div className={classes.scannerPanel}>
                <div className={classes.scannerGrid}>
                  {/* Campo 1: SKU / SERIE */}
                  <div className={classes.scannerField}>
                    <label className={classes.scannerLabel} htmlFor="symbar-devolucion-sku-serie">
                      SKU / SERIE
                    </label>
                    <Input
                      id="symbar-devolucion-sku-serie"
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
                      <label className={classes.scannerLabel}>Producto en Custodia</label>
                      {productoSeleccionadoScanner && !serieSeleccionadaScanner && (
                        <Text size={100} style={{ color: tokens.colorBrandForeground1 }}>
                          En custodia: {productoSeleccionadoScanner.cantidadDisponible} {productoSeleccionadoScanner.nombreUnidadMedida || 'UND'}
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
                        disabled={!custodiaTecnico}
                        onChange={(_, d) => {
                          const val = d.value;
                          if (val.startsWith('serie:')) {
                            const numSerie = val.replace('serie:', '');
                            const s = seriesLibresCustodia.find((x) => x.numeroSerie === numSerie);
                            if (s) {
                              setSerieSeleccionadaScanner(s);
                              const prod = productosCustodia.find((p) => p.productoId === s.productoId);
                              setProductoSeleccionadoScanner(
                                prod || {
                                  stockId: '',
                                  productoId: s.productoId,
                                  codigoProducto: s.codigoProducto,
                                  nombreProducto: s.nombreProducto,
                                  almacenId: custodiaTecnico?.id || '',
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
                                  ubicacionId: ubicacionDestinoId || '',
                                  nombreUbicacion: '',
                                  condicion: 'Utilizable',
                                }
                              );
                              setScannerQuery(s.numeroSerie);
                              setScannerCantidad('1');
                              setScannerError(null);
                            }
                          } else {
                            const prod = productosCustodia.find((p) => p.productoId === val);
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
                          {!custodiaTecnico
                            ? 'Seleccione primero un técnico con custodia'
                            : `Buscar en custodia (${productosCustodia.length} productos, ${seriesLibresCustodia.length} series)...`}
                        </option>
                        {productosCustodia.map((p) => (
                          <option key={p.productoId} value={p.productoId}>
                            {p.codigoProducto ? `${p.codigoProducto} — ` : ''}
                            {p.nombreProducto} (En custodia: {p.cantidadDisponible} {p.nombreUnidadMedida || 'UND'}{p.esSerializado ? ' · 🏷️ Serializado' : ''})
                          </option>
                        ))}
                        {seriesLibresCustodia.length > 0 && (
                          <optgroup label="Series en custodia del técnico">
                            {seriesLibresCustodia.slice(0, 50).map((s) => (
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

                  {/* Campo 4: Condición */}
                  <div className={classes.scannerField}>
                    <label className={classes.scannerLabel}>Condición</label>
                    <Select
                      value={scannerCondicion.toString()}
                      onChange={(_, d) => setScannerCondicion(Number(d.value) as 1 | 2)}
                    >
                      <option value="1">🟢 Utilizable</option>
                      <option value="2">🔴 Defectuoso</option>
                    </Select>
                  </div>

                  {/* Campo 5: Cantidad */}
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
                columns={columnasDevolucion}
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
                  <DataGridBody<LineaDevolucion>>
                    {({ item, rowId }) => (
                      <DataGridRow<LineaDevolucion> key={rowId}>
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
                    Total unidades devueltas:
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

      {/* Modal de éxito y descarga de acta estandarizado con Fluent UI */}
      <D365OperacionExitosaDialog
        open={Boolean(devolucionExitosa)}
        datos={
          devolucionExitosa
            ? {
                ...devolucionExitosa,
                tipoOperacion: 'Devolucion',
                personaNombre: devolucionExitosa.tecnicoNombre,
                almacenNombre: devolucionExitosa.almacenDestinoNombre,
              }
            : null
        }
        onClose={() => setDevolucionExitosa(null)}
        onDescargarPdf={() => void handleDescargarActa()}
        onImprimir={() => void handleImprimirActa()}
        onCompartirWhatsApp={() => void handleCompartirWhatsApp()}
        onNuevaOperacion={() => {
          setDevolucionExitosa(null);
          resetFormulario();
        }}
        onIrHistorial={() => navigate('/servicio-campo/devolucion-tecnicos')}
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
                    navigate('/servicio-campo/devolucion-tecnicos', {
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
