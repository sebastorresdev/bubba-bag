import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Select,
  Input,
  Text,
  Link,
  Badge,
  TabList,
  Tab,
  TableCellLayout,
  createTableColumn,
  Toast,
  Toaster,
  ToastTitle,
  useToastController,
  useId,
  Button,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  makeStyles,
  tokens,
  typographyStyles,
} from '@fluentui/react-components';
import type { TableColumnDefinition } from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  ArrowClockwise16Regular,
  Warning16Regular,
  BarcodeScanner20Regular,
  Save16Regular,
  Box16Regular,
  Delete16Regular,
  Add16Regular,
  Info16Regular,
  Dismiss16Regular,
  Warning16Filled,
  Print16Regular,
  ArrowDownload16Regular,
} from '@fluentui/react-icons';
import { D365CompartirButton } from '../../../../components/common/D365CompartirButton';
import { AlmacenService } from '../services/almacen.service';
import type {
  AlmacenDto,
  UbicacionInventarioDto,
  SerieDisponibleAlmacenDto,
  DeclararDoaItemDto,
  DocumentoDoaDto,
} from '../types/almacen.types';
import { MotivoRetiroEquipoService } from '../../../servicio-campo/motivos-retiro-equipo/services/motivoRetiroEquipo.service';
import type { MotivoRetiroEquipoDto } from '../../../servicio-campo/motivos-retiro-equipo/types/motivoRetiroEquipo.types';
import { TIPOS_RETIRO_EQUIPO_INFO, TIPOS_RETIRO_DOA } from '../../../servicio-campo/motivos-retiro-equipo/types/motivoRetiroEquipo.types';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365FormContent } from '../../../../components/common/D365FormContent';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { SelectorEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { TransferenciaEtapas } from '../../transferencias/components/TransferenciaEtapas';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';

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
    gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(220px, 1.6fr) 140px minmax(200px, 1.4fr) minmax(160px, 1.2fr) auto',
    gap: '12px',
    alignItems: 'end',
    '@media (max-width: 1100px)': {
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
    overflowX: 'auto',
    overflowY: 'hidden',
    marginTop: '8px',
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
  errorText: {
    ...typographyStyles.caption2,
    color: tokens.colorPaletteRedForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
  },
  infoBox: {
    padding: '8px 12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
});

interface DoaItemDraft {
  idTemp: string;
  serieId: string;
  numeroSerie: string;
  productoNombre: string;
  productoCodigo: string;
  ubicacionActualId: string;
  numeroSmartCard?: string | null;
  motivoRetiroId: string;
  observacionPrevia?: string | null;
  esDeOt: boolean;
  motivoDetectadoTexto?: string;
  observaciones: string;
}

export const DeclaracionDoaPage: React.FC = () => {
  const formStyles = useD365FormStyles();
  const classes = useStyles();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Si id existe y no es 'nuevo', la página opera en modo lectura de detalle del documento DOA
  const esDetalle = Boolean(id && id !== 'nuevo');

  const toasterId = useId('declaracion-doa-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const notifySuccess = useCallback(
    (title: string) => {
      dispatchToast(
        <Toast>
          <ToastTitle>{title}</ToastTitle>
        </Toast>,
        { intent: 'success', position: 'top-end' }
      );
    },
    [dispatchToast]
  );

  // Tab activo: 'general' | 'productos'
  const [selectedTab, setSelectedTab] = useState<'general' | 'productos'>('general');

  // Documento existente en modo Detalle
  const [docDetalle, setDocDetalle] = useState<DocumentoDoaDto | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState<boolean>(false);

  // Almacenes y catálogos
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [almacenId, setAlmacenId] = useState<string>('');
  const [busquedaAlmacen, setBusquedaAlmacen] = useState<string>('');
  const [ubicaciones, setUbicaciones] = useState<UbicacionInventarioDto[]>([]);
  const [motivosRetiro, setMotivosRetiro] = useState<MotivoRetiroEquipoDto[]>([]);

  // Series en Disponible del Almacén (modo creación)
  const [seriesDisponibles, setSeriesDisponibles] = useState<SerieDisponibleAlmacenDto[]>([]);
  const [loadingSeries, setLoadingSeries] = useState<boolean>(false);

  // Configuración de la Declaración DOA
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState<string>('');
  const [motivoPredeterminadoId, setMotivoPredeterminadoId] = useState<string>('');
  const [observacionesGenerales, setObservacionesGenerales] = useState<string>('');

  // Estados del Scanner / Barra de Producto
  const [scannerQuery, setScannerQuery] = useState<string>('');
  const [serieSeleccionadaScanner, setSerieSeleccionadaScanner] = useState<SerieDisponibleAlmacenDto | null>(null);
  const [motivoSeleccionadoScanner, setMotivoSeleccionadoScanner] = useState<string>('');
  const [origenTextoScanner, setOrigenTextoScanner] = useState<string>('');
  const [obsScanner, setObsScanner] = useState<string>('');
  const [scannerError, setScannerError] = useState<string | null>(null);

  // Lista de equipos a reclasificar como DOA
  const [draftItems, setDraftItems] = useState<DoaItemDraft[]>([]);

  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Encabezado estático D365 (solo cambia al guardar o al presionar 'Actualizar Series', NUNCA mientras se edita el formulario)
  const [savedHeader, setSavedHeader] = useState<{
    estado: string;
    numeroDocumento: string;
    almacenNombre: string;
    fecha: string;
    disponibles: string;
    aReclasificar: string;
  }>({
    estado: 'Borrador',
    numeroDocumento: '—',
    almacenNombre: '—',
    fecha: '—',
    disponibles: '—',
    aReclasificar: '0 equipos',
  });

  // Filtrar exclusivamente naturalezas aplicables a DOA y averías técnicas en almacén
  const motivosDoa = useMemo(() => {
    return motivosRetiro.filter((m) => TIPOS_RETIRO_DOA.includes(m.tipoRetiro));
  }, [motivosRetiro]);

  // Cargar documento en modo Detalle
  const cargarDetalleDocumento = useCallback(async (docId: string) => {
    try {
      setLoadingDetalle(true);
      setStatusMessage(null);
      const doc = await AlmacenService.obtenerDetalleDoa(docId);
      setDocDetalle(doc);
      if (doc.almacenId) {
        setAlmacenId(doc.almacenId);
      }
      if (doc.observaciones) {
        setObservacionesGenerales(doc.observaciones);
      }
      if (doc.items && doc.items.length > 0) {
        const mapped: DoaItemDraft[] = doc.items.map((it) => {
          let motivoTexto = it.motivo || 'Defecto técnico / DOA';
          let obsTexto = it.observaciones || '';
          if (obsTexto.startsWith('DOA:')) {
            const parts = obsTexto.split(' - ');
            motivoTexto = parts[0].replace('DOA:', '').trim();
            obsTexto = parts.slice(1).join(' - ').trim();
          }
          return {
            idTemp: it.id || crypto.randomUUID(),
            serieId: it.id,
            numeroSerie: it.numeroSerie,
            productoNombre: it.productoNombre || 'Equipo',
            productoCodigo: it.productoCodigo || '',
            ubicacionActualId: '',
            numeroSmartCard: it.numeroSmartCard,
            motivoRetiroId: it.motivo || '',
            motivoDetectadoTexto: motivoTexto,
            esDeOt: false,
            observaciones: obsTexto,
          };
        });
        setDraftItems(mapped);
      }

      setSavedHeader({
        estado: 'Reclasificado',
        numeroDocumento: doc.numero || '—',
        almacenNombre: doc.almacenNombre || '—',
        fecha: doc.fecha
          ? new Date(doc.fecha).toLocaleString('es-PE', {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          : '—',
        disponibles: '—',
        aReclasificar: `${doc.totalEquipos ?? doc.items?.length ?? 0} equipos`,
      });
    } catch (err: any) {
      console.error('Error al cargar detalle DOA:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al cargar el detalle del documento DOA.',
      });
    } finally {
      setLoadingDetalle(false);
    }
  }, []);

  useEffect(() => {
    if (esDetalle && id) {
      void cargarDetalleDocumento(id);
    }
  }, [esDetalle, id, cargarDetalleDocumento]);

  // 1. Cargar almacenes y catálogo de motivos
  useEffect(() => {
    AlmacenService.getAlmacenes(true)
      .then((alms) => {
        const bodegas = alms.filter((a) => a.tipo === 1);
        setAlmacenes(bodegas);
      })
      .catch((err) => console.error('Error al cargar almacenes:', err));

    MotivoRetiroEquipoService.getMotivos(undefined, true)
      .then((mots) => {
        setMotivosRetiro(mots);
        const filtrados = mots.filter((m) => TIPOS_RETIRO_DOA.includes(m.tipoRetiro));
        const doa = filtrados.find((m) => m.tipoRetiro === 'DefectoFabricaDOA') || filtrados[0] || mots[0];
        if (doa) {
          setMotivoPredeterminadoId(doa.id);
          setMotivoSeleccionadoScanner(doa.id);
        }
      })
      .catch((err) => console.error('Error al cargar motivos de retiro:', err));
  }, [esDetalle]);

  // 2. Al cambiar almacén (en modo creación), cargar ubicaciones y series en DISPONIBLE
  const cargarDatosAlmacen = useCallback(async (almId: string) => {
    if (!almId || esDetalle) {
      if (!esDetalle) {
        setUbicaciones([]);
        setSeriesDisponibles([]);
        setUbicacionDestinoId('');
        setDraftItems([]);
        setSerieSeleccionadaScanner(null);
      }
      return;
    }
    try {
      setLoadingSeries(true);
      setStatusMessage(null);

      const [ubics, sers] = await Promise.all([
        AlmacenService.getUbicaciones(almId),
        AlmacenService.getSeriesDisponiblesAlmacen(almId),
      ]);

      setUbicaciones(ubics || []);
      setSeriesDisponibles(sers || []);

      // Preseleccionar ubicación destino (devolución)
      const uDev = (ubics || []).find((u) => u.tipoUbicacionNombre === 'Devolucion' || u.tipoUbicacion === 2);
      if (uDev) {
        setUbicacionDestinoId(uDev.id);
      } else {
        setUbicacionDestinoId('');
      }
    } catch (err: any) {
      console.error('Error al cargar datos del almacén:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al conectar con el inventario del almacén.',
      });
    } finally {
      setLoadingSeries(false);
    }
  }, [esDetalle]);

  useEffect(() => {
    if (almacenId && !esDetalle) {
      void cargarDatosAlmacen(almacenId);
    }
  }, [almacenId, esDetalle, cargarDatosAlmacen]);

  // Actualizar series desde el servidor y refrescar metadatos del encabezado estático
  const handleActualizarSeries = async () => {
    if (!almacenId) return;
    try {
      setLoadingSeries(true);
      setStatusMessage(null);
      const [ubics, sers] = await Promise.all([
        AlmacenService.getUbicaciones(almacenId),
        AlmacenService.getSeriesDisponiblesAlmacen(almacenId),
      ]);
      setUbicaciones(ubics || []);
      setSeriesDisponibles(sers || []);

      const alm = almacenes.find((a) => a.id === almacenId);
      setSavedHeader((prev) => ({
        ...prev,
        almacenNombre: alm?.nombre || '—',
        disponibles: `${(sers || []).length} series`,
        aReclasificar: `${draftItems.length} equipos`,
      }));

      notifySuccess('Series y datos del almacén actualizados.');
    } catch (err: any) {
      console.error('Error al actualizar series:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al conectar con el inventario del almacén.',
      });
    } finally {
      setLoadingSeries(false);
    }
  };

  // Ubicaciones de destino en la rama DEVOLUCIÓN
  const ubicacionesDevolucion = useMemo(() => {
    return ubicaciones.filter(
      (u) => u.tipoUbicacionNombre === 'Devolucion' || u.tipoUbicacion === 2
    );
  }, [ubicaciones]);

  const almacenActual = useMemo(() => {
    return almacenes.find((a) => a.id === almacenId) || null;
  }, [almacenes, almacenId]);

  // TagPicker: opciones y selección de almacén
  const opcionesAlmacenes = useMemo(() => {
    return almacenes.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      detalle: a.codigo ? `Código: ${a.codigo}` : undefined,
    }));
  }, [almacenes]);

  const almacenSeleccionado = useMemo(() => {
    if (!almacenActual) return null;
    return {
      id: almacenActual.id,
      nombre: almacenActual.nombre,
      detalle: almacenActual.codigo ? `Código: ${almacenActual.codigo}` : undefined,
    };
  }, [almacenActual]);

  // Analizador inteligente de motivo previo de OT
  const analizarSerieParaDoa = useCallback(
    (serie: SerieDisponibleAlmacenDto): DoaItemDraft => {
      const obs = serie.observaciones?.trim() || '';
      const esDeOt = /OT|orden de trabajo|aver[íi]a|retiro/i.test(obs);

      let textoExtraido = '';
      let motivoMatchId = '';

      if (obs) {
        const matchOt = obs.match(/(?:Retirado por avería en OT:|Retiro en OT [^:]+:)\s*(.*)/i);
        if (matchOt && matchOt[1]) {
          textoExtraido = matchOt[1].trim();
        } else {
          textoExtraido = obs;
        }

        const norm = textoExtraido.toLowerCase();
        const match = motivosDoa.find(
          (m) =>
            norm.includes(m.nombre.toLowerCase()) ||
            m.nombre.toLowerCase().includes(norm) ||
            m.tipoRetiro.toLowerCase() === norm
        );
        if (match) {
          motivoMatchId = match.id;
        }
      }

      const finalMotivoId = motivoMatchId || motivoPredeterminadoId || (motivosDoa[0]?.id ?? '');

      return {
        idTemp: crypto.randomUUID(),
        serieId: serie.id,
        numeroSerie: serie.numeroSerie,
        productoNombre: serie.productoNombre,
        productoCodigo: serie.productoCodigo,
        ubicacionActualId: serie.ubicacionActualId,
        numeroSmartCard: serie.numeroSmartCard || serie.macAddress,
        motivoRetiroId: finalMotivoId,
        observacionPrevia: obs || null,
        esDeOt,
        motivoDetectadoTexto: textoExtraido || undefined,
        observaciones: '',
      };
    },
    [motivosDoa, motivoPredeterminadoId]
  );

  // Series disponibles no agregadas al draft
  const seriesDisponiblesFiltradas = useMemo(() => {
    const seriesEnDraft = new Set(draftItems.map((d) => d.numeroSerie.toUpperCase()));
    return seriesDisponibles.filter((s) => !seriesEnDraft.has(s.numeroSerie.toUpperCase()));
  }, [seriesDisponibles, draftItems]);

  // Selección de serie desde escáner o query
  const procesarScannerBusqueda = (queryText: string) => {
    setScannerError(null);
    if (!queryText.trim()) {
      setSerieSeleccionadaScanner(null);
      setOrigenTextoScanner('');
      setMotivoSeleccionadoScanner(motivoPredeterminadoId);
      return;
    }

    const q = queryText.trim().toUpperCase();
    const match = seriesDisponiblesFiltradas.find(
      (s) =>
        s.numeroSerie.toUpperCase() === q ||
        (s.numeroSmartCard && s.numeroSmartCard.toUpperCase() === q)
    );

    if (match) {
      setSerieSeleccionadaScanner(match);
      const analizado = analizarSerieParaDoa(match);
      setMotivoSeleccionadoScanner(analizado.motivoRetiroId);
      setOrigenTextoScanner(
        analizado.esDeOt
          ? analizado.motivoDetectadoTexto ? `OT: ${analizado.motivoDetectadoTexto}` : 'Retiro en OT'
          : 'Bodega'
      );
    } else {
      setSerieSeleccionadaScanner(null);
      setOrigenTextoScanner('');
    }
  };

  const seleccionarSerie = (serie: SerieDisponibleAlmacenDto) => {
    setSerieSeleccionadaScanner(serie);
    setScannerQuery(serie.numeroSerie);
    setScannerError(null);
    const analizado = analizarSerieParaDoa(serie);
    setMotivoSeleccionadoScanner(analizado.motivoRetiroId);
    setOrigenTextoScanner(
      analizado.esDeOt
        ? analizado.motivoDetectadoTexto ? `OT: ${analizado.motivoDetectadoTexto}` : 'Retiro en OT'
        : 'Bodega'
    );
  };

  const limpiarSeleccionScanner = () => {
    setSerieSeleccionadaScanner(null);
    setScannerQuery('');
    setOrigenTextoScanner('');
    setObsScanner('');
    setScannerError(null);
    setMotivoSeleccionadoScanner(motivoPredeterminadoId);
  };

  // Agregar serie desde la barra de escáner
  const agregarDesdeScanner = () => {
    setScannerError(null);

    let objetivo = serieSeleccionadaScanner;
    if (!objetivo && scannerQuery.trim()) {
      const q = scannerQuery.trim().toUpperCase();
      objetivo = seriesDisponiblesFiltradas.find(
        (s) =>
          s.numeroSerie.toUpperCase() === q ||
          (s.numeroSmartCard && s.numeroSmartCard.toUpperCase() === q)
      ) || null;
    }

    if (!objetivo) {
      setScannerError('Seleccione o pistolee una serie válida disponible en este almacén.');
      return;
    }

    if (draftItems.some((d) => d.numeroSerie.toUpperCase() === objetivo!.numeroSerie.toUpperCase())) {
      setScannerError(`La serie "${objetivo.numeroSerie}" ya está en la lista.`);
      return;
    }

    if (!motivoSeleccionadoScanner) {
      setScannerError('Seleccione un motivo de retiro para el producto.');
      return;
    }

    const analizado = analizarSerieParaDoa(objetivo);
    const nuevoDraft: DoaItemDraft = {
      ...analizado,
      motivoRetiroId: motivoSeleccionadoScanner,
      observaciones: obsScanner.trim(),
    };

    setDraftItems((prev) => [...prev, nuevoDraft]);
    limpiarSeleccionScanner();

    if (nuevoDraft.esDeOt && nuevoDraft.motivoDetectadoTexto) {
      notifySuccess(`Serie ${objetivo.numeroSerie} agregada (Motivo capturado de OT: "${nuevoDraft.motivoDetectadoTexto}").`);
    } else {
      notifySuccess(`Serie ${objetivo.numeroSerie} agregada.`);
    }
  };

  // Modificar motivo de retiro por fila
  const handleCambiarMotivoFila = (idTemp: string, nuevoMotivoId: string) => {
    setDraftItems((prev) =>
      prev.map((item) => ((item.idTemp || item.serieId) === idTemp ? { ...item, motivoRetiroId: nuevoMotivoId } : item))
    );
  };

  // Modificar observación por fila
  const handleCambiarObservacionFila = (idTemp: string, nuevaObs: string) => {
    setDraftItems((prev) =>
      prev.map((item) => ((item.idTemp || item.serieId) === idTemp ? { ...item, observaciones: nuevaObs } : item))
    );
  };

  // Quitar fila del draft
  const handleQuitarFila = (idTemp: string) => {
    setDraftItems((prev) => prev.filter((item) => (item.idTemp || item.serieId) !== idTemp));
  };

  // Confirmar Reclasificación DOA
  const handleConfirmarDoa = async () => {
    if (!almacenId) {
      setStatusMessage({ type: 'error', text: 'Seleccione un almacén base.' });
      return;
    }
    if (draftItems.length === 0) {
      setStatusMessage({ type: 'error', text: 'Agregue al menos un producto a la lista para reclasificar DOA.' });
      return;
    }
    if (!ubicacionDestinoId) {
      setStatusMessage({ type: 'error', text: 'El almacén no cuenta con una ubicación de Devolución configurada.' });
      return;
    }

    const sinMotivo = draftItems.find((d) => !d.motivoRetiroId);
    if (sinMotivo) {
      setStatusMessage({
        type: 'error',
        text: `La serie "${sinMotivo.numeroSerie}" no tiene un motivo de retiro asignado.`,
      });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const ubicOrigen = draftItems[0].ubicacionActualId;
      if (!ubicOrigen) {
        throw new Error('No se pudo identificar la ubicación de origen de los equipos seleccionados.');
      }

      const itemsPayload: DeclararDoaItemDto[] = draftItems.map((d) => ({
        serie: d.numeroSerie,
        motivoRetiroId: d.motivoRetiroId,
        observaciones:
          d.observaciones.trim() ||
          (d.observacionPrevia ? `[Origen OT] ${d.observacionPrevia}` : undefined),
      }));

      const res = await AlmacenService.declararDoa(almacenId, {
        ubicacionOrigenId: ubicOrigen,
        ubicacionDestinoId,
        motivoRetiroId: motivoPredeterminadoId || undefined,
        series: draftItems.map((d) => d.numeroSerie),
        items: itemsPayload,
        observaciones: observacionesGenerales.trim() || undefined,
      });

      const alm = almacenes.find((a) => a.id === almacenId);
      const totalReclasificados = draftItems.length;

      notifySuccess(res.mensaje || 'Equipos reclasificados a Devolución exitosamente.');
      setSavedHeader({
        estado: 'Reclasificado',
        numeroDocumento: res.numero || '—',
        almacenNombre: alm?.nombre || '—',
        fecha: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
        disponibles: '—',
        aReclasificar: `${totalReclasificados} equipos`,
      });

      setObservacionesGenerales('');
      setDraftItems([]);

      if (res.id) {
        navigate(`/servicio-campo/declaracion-doa/${res.id}`);
      } else {
        navigate('/servicio-campo/declaracion-doa');
      }
    } catch (err: any) {
      console.error('Error al declarar DOA:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al procesar la declaración DOA en el servidor.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Columnas para la DataGrid de Productos
  const columnasDoa: TableColumnDefinition<DoaItemDraft>[] = useMemo(() => {
    const cols: TableColumnDefinition<DoaItemDraft>[] = [
      createTableColumn<DoaItemDraft>({
        columnId: 'numeroSerie',
        renderHeaderCell: () => 'Número de Serie',
        renderCell: (item) => (
          <TableCellLayout truncate>
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
          </TableCellLayout>
        ),
      }),
      createTableColumn<DoaItemDraft>({
        columnId: 'productoNombre',
        renderHeaderCell: () => 'Producto / Modelo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text weight="medium">{item.productoNombre}</Text>
            <Text size={100} style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
              {item.productoCodigo}
            </Text>
          </TableCellLayout>
        ),
      }),
    ];

    if (!esDetalle) {
      cols.push(
        createTableColumn<DoaItemDraft>({
          columnId: 'origen',
          renderHeaderCell: () => 'Origen / Captura',
          renderCell: (item) => (
            <TableCellLayout truncate>
              {item.esDeOt ? (
                <Badge
                  appearance="tint"
                  color="warning"
                  icon={<Info16Regular />}
                  title={item.observacionPrevia || undefined}
                >
                  {item.motivoDetectadoTexto ? `OT: ${item.motivoDetectadoTexto}` : 'Retiro en OT'}
                </Badge>
              ) : (
                <Badge appearance="tint" color="informative">
                  Bodega
                </Badge>
              )}
            </TableCellLayout>
          ),
        })
      );
    }

    cols.push(
      createTableColumn<DoaItemDraft>({
        columnId: 'motivoRetiro',
        renderHeaderCell: () => 'Motivo de Retiro / Falla',
        renderCell: (item) => {
          if (esDetalle) {
            return (
              <TableCellLayout truncate>
                <Text weight="medium">
                  {item.motivoDetectadoTexto || item.motivoRetiroId || 'Defecto técnico / DOA'}
                </Text>
              </TableCellLayout>
            );
          }
          return (
            <TableCellLayout style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
              <Select
                size="small"
                appearance="outline"
                value={item.motivoRetiroId}
                onChange={(_, data) => handleCambiarMotivoFila(item.idTemp || item.serieId, data.value)}
                style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}
                aria-label={`Motivo de retiro para serie ${item.numeroSerie}`}
              >
                <option value="">Seleccione motivo...</option>
                {motivosDoa.map((m) => {
                  const info = TIPOS_RETIRO_EQUIPO_INFO[m.tipoRetiro];
                  return (
                    <option key={m.id} value={m.id}>
                      {m.nombre} [{info?.badgeLabel || m.tipoRetiro}]
                    </option>
                  );
                })}
              </Select>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<DoaItemDraft>({
        columnId: 'observaciones',
        renderHeaderCell: () => 'Observación Específica',
        renderCell: (item) => {
          if (esDetalle) {
            return (
              <TableCellLayout truncate>
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                  {item.observaciones || '—'}
                </Text>
              </TableCellLayout>
            );
          }
          return (
            <TableCellLayout style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
              <Input
                size="small"
                appearance="outline"
                placeholder="Detalle técnico de la falla..."
                value={item.observaciones}
                onChange={(_, data) => handleCambiarObservacionFila(item.idTemp || item.serieId, data.value)}
                style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}
              />
            </TableCellLayout>
          );
        },
      })
    );

    if (!esDetalle) {
      cols.push(
        createTableColumn<DoaItemDraft>({
          columnId: 'acciones',
          renderHeaderCell: () => 'Acción',
          renderCell: (item) => (
            <TableCellLayout style={{ justifyContent: 'center' }}>
              <Button
                appearance="subtle"
                icon={<Delete16Regular />}
                size="small"
                onClick={() => handleQuitarFila(item.idTemp || item.serieId)}
                title="Quitar equipo"
                aria-label="Quitar equipo"
              />
            </TableCellLayout>
          ),
        })
      );
    }

    return cols;
  }, [motivosDoa, esDetalle]);

  return (
    <div className={formStyles.root}>
      <Toaster toasterId={toasterId} position="top-end" />

      {/* 0. Notification Message Bar */}
      {statusMessage && (
        <D365MessageBar
          intent={statusMessage.type === 'success' ? 'success' : 'error'}
          className={formStyles.messageBarContainer}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage.text}
        </D365MessageBar>
      )}

      {/* 1. Dynamics 365 Standard Command Bar */}
      <D365CommandBar
        ariaLabel="Comandos de declaración DOA"
        busy={saving || loadingSeries || loadingDetalle}
        busyLabel={saving ? 'Procesando declaración DOA...' : 'Cargando...'}
        trailing={
          esDetalle ? (
            <D365CompartirButton
              onCompartirWhatsApp={() => {
                const num = docDetalle?.numero || id || 'DOA';
                const alm = docDetalle?.almacenNombre || savedHeader.almacenNombre;
                const total = docDetalle?.totalEquipos || draftItems.length || 0;
                const lineasTexto = [
                  `*DECLARACIÓN DOA / RECLASIFICACIÓN*`,
                  `*N° Documento:* ${num}`,
                  `*Almacén:* ${alm}`,
                  `*Total Equipos:* ${total}`,
                  `*Fecha:* ${docDetalle?.fecha ? new Date(docDetalle.fecha).toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE')}`,
                ];
                const mensaje = encodeURIComponent(lineasTexto.join('\n'));
                window.open(`https://api.whatsapp.com/send?text=${mensaje}`, '_blank');
              }}
              onCompartirCorreo={() => {
                const num = docDetalle?.numero || id || 'DOA';
                const alm = docDetalle?.almacenNombre || savedHeader.almacenNombre;
                const total = docDetalle?.totalEquipos || draftItems.length || 0;
                const asunto = `Declaración DOA / Reclasificación - ${num}`;
                const cuerpo = [
                  'Estimado(a),',
                  '',
                  'Se remite la constancia oficial de reclasificación técnica de equipos DOA:',
                  `• N° Documento: ${num}`,
                  `• Almacén: ${alm}`,
                  `• Total Equipos Reclasificados: ${total}`,
                  `• Fecha: ${new Date().toLocaleDateString('es-PE')}`,
                  '',
                  'Saludos cordiales,',
                  'Control de Calidad / Logística Inversa - SKVIA',
                ].join('\n');
                window.location.href = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
              }}
            />
          ) : undefined
        }
      >
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            onClick={() => navigate('/servicio-campo/declaracion-doa')}
            title="Volver al Historial"
            aria-label="Volver"
          />
          <D365CommandDivider />

          {!esDetalle && (
            <D365CommandButton
              icon={<Save16Regular />}
              tone="save"
              onClick={handleConfirmarDoa}
              disabled={saving || loadingSeries || draftItems.length === 0}
              appearance="subtle"
            >
              Confirmar Reclasificación DOA ({draftItems.length})
            </D365CommandButton>
          )}

          {!esDetalle ? (
            <D365CommandButton
              icon={<ArrowClockwise16Regular />}
              onClick={() => void handleActualizarSeries()}
              disabled={saving || loadingSeries || !almacenId}
              appearance="subtle"
            >
              Actualizar Series
            </D365CommandButton>
          ) : (
            <>
              <D365CommandButton
                icon={<ArrowClockwise16Regular />}
                onClick={() => {
                  if (id) {
                    void cargarDetalleDocumento(id);
                  }
                }}
                appearance="subtle"
              >
                Actualizar
              </D365CommandButton>
              <D365CommandDivider />
              <D365CommandButton
                icon={<ArrowDownload16Regular />}
                onClick={() => window.print()}
              >
                Cargo PDF
              </D365CommandButton>
              <D365CommandButton
                icon={<Print16Regular />}
                onClick={() => window.print()}
              >
                Imprimir
              </D365CommandButton>
            </>
          )}

          <D365CommandDivider />
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => {
              if (id && id !== 'nuevo') {
                navigate('/servicio-campo/declaracion-doa/nuevo');
              } else {
                window.location.href = '/servicio-campo/declaracion-doa/nuevo';
              }
            }}
          >
            Nuevo
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. D365 Entity Header con pestañas General / Productos */}
      <D365EntityHeader
        title={esDetalle ? (docDetalle?.numero || 'Detalle de Declaración DOA') : 'Nueva Declaración DOA / Reclasificación'}
        subtitle="Reclasificación interna de Disponible a Devolución (no devolución a proveedor)"
        avatarIcon={<Warning16Regular />}
        processFlow={<TransferenciaEtapas estado={esDetalle ? 'Cerrada' : 'Borrador'} tipoOperacion="DeclaracionDoa" embedded />}
        metadata={
          esDetalle
            ? [
                {
                  label: 'Estado',
                  value: <D365StatusBadge status={savedHeader.estado || 'Reclasificado'} />,
                },
                { label: 'N° Documento', value: savedHeader.numeroDocumento || docDetalle?.numero || '—' },
                { label: 'Almacén Base', value: savedHeader.almacenNombre || docDetalle?.almacenNombre || '—' },
                {
                  label: 'Fecha',
                  value: savedHeader.fecha || '—',
                },
                { label: 'Equipos Reclasificados', value: savedHeader.aReclasificar || `${docDetalle?.totalEquipos ?? 0} equipos` },
              ]
            : [
                {
                  label: 'Estado',
                  value: <D365StatusBadge status={savedHeader.estado} />,
                },
                { label: 'Almacén Base', value: savedHeader.almacenNombre },
                { label: 'Disponibles en Bodega', value: savedHeader.disponibles },
                { label: 'A Reclasificar', value: savedHeader.aReclasificar },
              ]
        }
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as 'general' | 'productos')}
          >
            <Tab value="general">General</Tab>
            <Tab value="productos">
              Productos ({draftItems.length})
            </Tab>
          </TabList>
        }
      />

      {/* 3. Form Content por Tab */}
      <D365FormContent busy={saving || loadingSeries || loadingDetalle} className={formStyles.contentBody}>
        {/* TAB 1: GENERAL */}
        {selectedTab === 'general' && (
          <div className={formStyles.card}>
            <div className={formStyles.cardSectionTitle}>
              {esDetalle ? '1. Información del Documento' : '1. Datos de la Reclasificación'}
            </div>

            <div className={formStyles.grid2Cols}>
              {esDetalle ? (
                <>
                  <D365FormField label="N° Documento">
                    <Input
                      readOnly
                      appearance="filled-darker"
                      value={docDetalle?.numero || '—'}
                      style={{ fontFamily: 'Consolas, monospace', fontWeight: 600, color: tokens.colorBrandForeground1 }}
                    />
                  </D365FormField>

                  <D365FormField label="Almacén Base">
                    {docDetalle?.almacenId ? (
                      <Link
                        onClick={() => navigate(`/servicio-campo/almacenes/${docDetalle.almacenId}`)}
                        style={{ fontWeight: 600 }}
                      >
                        {docDetalle?.almacenNombre || almacenActual?.nombre || '—'}
                      </Link>
                    ) : (
                      <Input
                        readOnly
                        appearance="filled-darker"
                        value={docDetalle?.almacenNombre || almacenActual?.nombre || '—'}
                      />
                    )}
                  </D365FormField>

                  <D365FormField label="Ubicación Origen">
                    <Input
                      readOnly
                      appearance="filled-darker"
                      value={docDetalle?.ubicacionOrigenNombre || 'Disponible'}
                    />
                  </D365FormField>

                  <D365FormField label="Ubicación Destino">
                    <Input
                      readOnly
                      appearance="filled-darker"
                      value={docDetalle?.ubicacionDestinoNombre || 'Devolución'}
                    />
                  </D365FormField>

                  <D365FormField label="Fecha de Ejecución">
                    <Input
                      readOnly
                      appearance="filled-darker"
                      value={
                        docDetalle?.fecha
                          ? new Date(docDetalle.fecha).toLocaleString('es-PE', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—'
                      }
                    />
                  </D365FormField>

                  <D365FormField label="Responsable">
                    <Input
                      readOnly
                      appearance="filled-darker"
                      value={docDetalle?.usuarioNombre || 'Almacenero'}
                    />
                  </D365FormField>

                  <div style={{ gridColumn: 'span 2' }}>
                    <D365FormField label="Observaciones">
                      <Input
                        readOnly
                        appearance="filled-darker"
                        value={observacionesGenerales || 'Sin observaciones registradas.'}
                        className={formStyles.d365ControlFull}
                      />
                    </D365FormField>
                  </div>
                </>
              ) : (
                <>
                  {/* Almacén Base */}
                  <D365FormField label="Almacén Base" required>
                    <SelectorEntidadRelacionada
                      etiquetaGrupo="Almacenes / Bodegas"
                      icono={<Box16Regular />}
                      deshabilitado={saving || loadingSeries}
                      tituloEnlace="Ver detalles del almacén"
                      alNavegar={(almId) => navigate(`/servicio-campo/almacenes/${almId}`)}
                      opciones={opcionesAlmacenes}
                      seleccionada={almacenSeleccionado}
                      textoBusqueda={busquedaAlmacen}
                      alCambiarBusqueda={setBusquedaAlmacen}
                      alSeleccionar={(almId) => setAlmacenId(almId || '')}
                    />
                  </D365FormField>

                  {/* Ubicación Destino dentro del Almacén (Devolución) */}
                  <D365FormField
                    label="Ubicación Destino (Devolución)"
                    required
                    htmlFor="doa-ubic-destino"
                  >
                    {ubicacionesDevolucion.length <= 1 ? (
                      <Input
                        readOnly
                        appearance="filled-darker"
                        value={ubicacionesDevolucion[0]?.nombre || ubicacionesDevolucion[0]?.codigo || 'Ubicación Devolución del Almacén'}
                      />
                    ) : (
                      <Select
                        id="doa-ubic-destino"
                        appearance="outline"
                        size="medium"
                        value={ubicacionDestinoId}
                        onChange={(_, data) => setUbicacionDestinoId(data.value)}
                        disabled={saving || loadingSeries}
                        className={formStyles.d365ControlFull}
                      >
                        <option value="">Seleccione ubicación destino...</option>
                        {ubicacionesDevolucion.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nombre} ({u.codigo})
                          </option>
                        ))}
                      </Select>
                    )}
                  </D365FormField>

                  {/* Motivo Predeterminado DOA */}
                  <D365FormField
                    label="Motivo Predeterminado"
                    htmlFor="doa-motivo-default"
                    info="Se asignará por defecto a los equipos agregados que no provengan de una OT con motivo previo."
                  >
                    <Select
                      id="doa-motivo-default"
                      appearance="outline"
                      size="medium"
                      value={motivoPredeterminadoId}
                      onChange={(_, data) => {
                        setMotivoPredeterminadoId(data.value);
                        if (!serieSeleccionadaScanner) {
                          setMotivoSeleccionadoScanner(data.value);
                        }
                      }}
                      disabled={saving || loadingSeries}
                      className={formStyles.d365ControlFull}
                    >
                      <option value="">Seleccione motivo predeterminado...</option>
                      {motivosDoa.map((m) => {
                        const info = TIPOS_RETIRO_EQUIPO_INFO[m.tipoRetiro];
                        return (
                          <option key={m.id} value={m.id}>
                            {m.nombre} [{info?.badgeLabel || m.tipoRetiro}]
                          </option>
                        );
                      })}
                    </Select>
                  </D365FormField>

                  {/* Observaciones generales */}
                  <D365FormField
                    label="Observaciones Generales"
                    htmlFor="doa-observaciones"
                  >
                    <Input
                      id="doa-observaciones"
                      appearance="outline"
                      value={observacionesGenerales}
                      onChange={(_, data) => setObservacionesGenerales(data.value)}
                      disabled={saving || loadingSeries}
                      placeholder="Observaciones generales para el lote de reclasificación..."
                      className={formStyles.d365ControlFull}
                    />
                  </D365FormField>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTOS */}
        {selectedTab === 'productos' && (
          <div className={formStyles.card}>
            <div className={formStyles.cardSectionTitle}>
              {esDetalle
                ? `2. Equipos Reclasificados (${draftItems.length} equipos)`
                : `2. Equipos y Series a Reclasificar (${draftItems.length} equipos)`}
            </div>

            {!esDetalle && !almacenId ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: tokens.colorNeutralForeground3 }}>
                <p style={{ margin: '0 0 12px 0' }}>
                  Seleccione primero el <strong>Almacén Base</strong> en la pestaña General para cargar los equipos disponibles en inventario.
                </p>
                <Button appearance="outline" onClick={() => setSelectedTab('general')}>
                  Ir a pestaña General
                </Button>
              </div>
            ) : (
              <>
                {/* Solo en modo creación mostramos el panel de scanner */}
                {!esDetalle && (
                  <div className={classes.scannerPanel}>
                    <div className={classes.scannerGrid}>
                      {/* Campo 1: Escáner / Búsqueda rápida */}
                      <div className={classes.scannerField}>
                        <label className={classes.scannerLabel}>Escáner / Búsqueda rápida</label>
                        <Input
                          appearance="outline"
                          placeholder="Pistolear serie o SmartCard..."
                          contentBefore={<BarcodeScanner20Regular style={{ color: tokens.colorBrandForeground1 }} />}
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
                        <label className={classes.scannerLabel}>Producto</label>
                        {serieSeleccionadaScanner ? (
                          <Input
                            readOnly
                            appearance="outline"
                            value={`${serieSeleccionadaScanner.productoNombre} (Serie: ${serieSeleccionadaScanner.numeroSerie})`}
                            contentAfter={
                              <Button
                                appearance="subtle"
                                size="small"
                                style={{ minWidth: 'auto', padding: '0 4px', height: '24px' }}
                                icon={<Dismiss16Regular />}
                                onClick={limpiarSeleccionScanner}
                              />
                            }
                          />
                        ) : (
                          <Select
                            appearance="outline"
                            value=""
                            onChange={(_, d) => {
                              const val = d.value;
                              if (!val) return;
                              const s = seriesDisponiblesFiltradas.find((x) => x.numeroSerie === val);
                              if (s) {
                                seleccionarSerie(s);
                              }
                            }}
                          >
                            <option value="">Seleccione equipo de la lista...</option>
                            {seriesDisponiblesFiltradas.length > 0 && (
                              <optgroup label="Series disponibles en bodega">
                                {seriesDisponiblesFiltradas.map((s) => (
                                  <option key={s.id} value={s.numeroSerie}>
                                    [Serie: {s.numeroSerie}] — {s.productoNombre} ({s.productoCodigo})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </Select>
                        )}
                      </div>

                      {/* Campo 3: Origen / Captura */}
                      <div className={classes.scannerField}>
                        <label className={classes.scannerLabel}>Origen / Captura</label>
                        <Input
                          readOnly
                          appearance="outline"
                          value={serieSeleccionadaScanner ? origenTextoScanner : ''}
                        />
                      </div>

                      {/* Campo 4: Motivo de Falla */}
                      <div className={classes.scannerField}>
                        <label className={classes.scannerLabel}>Motivo de Falla *</label>
                        <Select
                          appearance="outline"
                          value={motivoSeleccionadoScanner}
                          onChange={(_, d) => setMotivoSeleccionadoScanner(d.value)}
                        >
                          <option value="">Seleccione motivo de falla...</option>
                          {motivosDoa.map((m) => {
                            const info = TIPOS_RETIRO_EQUIPO_INFO[m.tipoRetiro];
                            return (
                              <option key={m.id} value={m.id}>
                                {m.nombre} [{info?.badgeLabel || m.tipoRetiro}]
                              </option>
                            );
                          })}
                        </Select>
                      </div>

                      {/* Campo 5: Observación */}
                      <div className={classes.scannerField}>
                        <label className={classes.scannerLabel}>Observación</label>
                        <Input
                          appearance="outline"
                          placeholder="Detalle técnico..."
                          value={obsScanner}
                          onChange={(_, d) => setObsScanner(d.value)}
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

                {/* TABLA DE PRODUCTOS AGREGADOS A RECLASIFICAR / PRODUCTOS DEL DOCUMENTO */}
                <div className={classes.tableWrapper}>
                  {draftItems.length === 0 ? (
                    <TableEmptyState
                      icon={<BarcodeScanner20Regular style={{ fontSize: 36, color: tokens.colorNeutralForeground4 }} />}
                      message={esDetalle ? "El documento no contiene productos registrados" : "No hay productos en la lista de reclasificación DOA"}
                    >
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {esDetalle
                          ? "Este registro de reclasificación no tiene series asociadas."
                          : "Pistolee una serie arriba o selecciónela en el desplegable de productos asignando su motivo de falla."}
                      </Text>
                    </TableEmptyState>
                  ) : (
                    <DataGrid
                      items={draftItems}
                      columns={columnasDoa}
                      getRowId={(item) => item.idTemp || item.serieId}
                      size="medium"
                      style={{ width: '100%', minWidth: '820px' }}
                    >
                      <DataGridHeader>
                        <DataGridRow
                          style={{
                            display: 'grid',
                            gridTemplateColumns: !esDetalle
                              ? 'minmax(150px, 1.2fr) minmax(180px, 1.4fr) 110px minmax(260px, 1.8fr) minmax(220px, 1.6fr) 60px'
                              : 'minmax(160px, 1.2fr) minmax(200px, 1.6fr) minmax(260px, 1.8fr) minmax(220px, 1.6fr)',
                            alignItems: 'center',
                          }}
                        >
                          {({ renderHeaderCell }) => (
                            <DataGridHeaderCell style={{ minWidth: 0, overflow: 'hidden' }}>
                              {renderHeaderCell()}
                            </DataGridHeaderCell>
                          )}
                        </DataGridRow>
                      </DataGridHeader>
                      <DataGridBody<DoaItemDraft>>
                        {({ item, rowId }) => (
                          <DataGridRow<DoaItemDraft>
                            key={rowId}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: !esDetalle
                                ? 'minmax(150px, 1.2fr) minmax(180px, 1.4fr) 110px minmax(260px, 1.8fr) minmax(220px, 1.6fr) 60px'
                                : 'minmax(160px, 1.2fr) minmax(200px, 1.6fr) minmax(260px, 1.8fr) minmax(220px, 1.6fr)',
                              alignItems: 'center',
                            }}
                          >
                            {({ renderCell }) => (
                              <DataGridCell style={{ minWidth: 0, overflow: 'hidden' }}>
                                {renderCell(item)}
                              </DataGridCell>
                            )}
                          </DataGridRow>
                        )}
                      </DataGridBody>
                    </DataGrid>
                  )}
                </div>

                {/* BARRA INFERIOR DE TOTALES */}
                {draftItems.length > 0 && (
                  <div className={classes.totalsBar}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                      Total de líneas registradas: <strong>{draftItems.length}</strong>
                    </Text>
                    <Text weight="semibold" size={300}>
                      {esDetalle
                        ? `Total de equipos reclasificados: ${draftItems.length}`
                        : `Total de equipos a reclasificar como DOA: ${draftItems.length}`}
                    </Text>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </D365FormContent>
    </div>
  );
};
