import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Input,
  Select,
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
  TabList,
  Tab,
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
  CheckmarkCircle16Regular,
  Box16Regular,
  Tag16Regular,
  DocumentText16Regular,
  DocumentBulletList16Regular,
  Person16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { SelectorEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { WhatsAppIcon } from '../../../../components/common/WhatsAppIcon';
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
  scannerBox: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '20px',
    marginBottom: '16px',
  },
  scannerBar: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  productoField: {
    flex: '1 1 320px',
    minWidth: '260px',
  },
  cantidadField: {
    width: '120px',
    flexShrink: 0,
  },
  condicionField: {
    width: '160px',
    flexShrink: 0,
  },
  comboboxOption: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '4px 0',
  },
  comboboxOptionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  comboboxOptionCode: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  stockInfoBanner: {
    marginTop: '12px',
    padding: '10px 14px',
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  seriesSelectorBox: {
    marginTop: '16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  seriesBadgeList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '4px',
    maxHeight: '160px',
    overflowY: 'auto',
    padding: '4px',
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
    padding: '10px 14px',
    textAlign: 'left',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  td: {
    padding: '12px 14px',
    fontSize: '13px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    verticalAlign: 'middle',
  },
  totalsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 18px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
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
  const [tecnicoId, setTecnicoId] = useState('');
  const [busquedaTecnico, setBusquedaTecnico] = useState('');
  const [almacenDestinoId, setAlmacenDestinoId] = useState('');
  const [busquedaDestino, setBusquedaDestino] = useState('');
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState('');
  const [numeroGuiaRemision, setNumeroGuiaRemision] = useState('');
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

        if (id && id !== 'nuevo') {
          const det = await TransferenciaService.obtenerDetalle(id);
          setTransferenciaId(det.id);
          setNumeroTransferencia(det.numero);
          if (det.numeroGuiaRemision) setNumeroGuiaRemision(det.numeroGuiaRemision);
          setEstado(det.estado || 'Borrador');
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

  const custodiaTecnico = useMemo(() => {
    if (!tecnicoId) return null;
    return almacenes.find(a => a.recursoId === tecnicoId && a.tipo === 2);
  }, [tecnicoId, almacenes]);

  const opcionesTecnicos = useMemo(() => {
    return tecnicos.map(t => ({
      id: t.id,
      nombre: t.nombreCompleto,
      detalle: `${t.documentoIdentidad ? `DNI: ${t.documentoIdentidad} · ` : ''}${t.unidadOrganizativaNombre || 'Cuadrilla de Campo'}`,
    }));
  }, [tecnicos]);

  const tecnicoSeleccionado = useMemo(() => {
    return opcionesTecnicos.find(o => o.id === tecnicoId) || null;
  }, [opcionesTecnicos, tecnicoId]);

  const tecnicoObj = useMemo(() => {
    return tecnicos.find(t => t.id === tecnicoId) || null;
  }, [tecnicos, tecnicoId]);

  const opcionesBodegasDestino = useMemo(() => {
    const bodegas = almacenes.filter(a => a.tipo === 1);
    const filtradas = tecnicoObj?.unidadOrganizativaId
      ? bodegas.filter(b => !b.unidadOrganizativaId || b.unidadOrganizativaId === tecnicoObj.unidadOrganizativaId)
      : bodegas;

    return filtradas.map(b => ({
      id: b.id,
      nombre: b.nombre,
      detalle: `${b.codigo || 'BOD'} · ${b.unidadOrganizativaNombre || 'Central'}`,
    }));
  }, [almacenes, tecnicoObj]);

  const bodegaDestinoSeleccionada = useMemo(() => {
    return opcionesBodegasDestino.find(o => o.id === almacenDestinoId) || null;
  }, [opcionesBodegasDestino, almacenDestinoId]);

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
          setUbicacionDestinoId(prev => prev || principal.id);
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

    const cantidadExistente = lineas
      .filter(l => l.productoId === productoSeleccionado.productoId)
      .reduce((acc, l) => acc + l.cantidad, 0);
    const saldoDisponible = productoSeleccionado.cantidadDisponible - cantidadExistente;

    if (cantidadInput > saldoDisponible) {
      setMensaje({
        tipo: 'error',
        texto: `No puede devolver ${cantidadInput} unidades. Saldo restante en custodia: ${saldoDisponible} ${productoSeleccionado.nombreUnidadMedida || 'UND'}.`,
      });
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

    const indexExistente = lineas.findIndex(
      l => l.productoId === productoSeleccionado.productoId && l.condicion === condicionInput
    );

    if (indexExistente !== -1) {
      setLineas(prev => {
        const copia = [...prev];
        const actual = copia[indexExistente];
        copia[indexExistente] = {
          ...actual,
          cantidad: actual.cantidad + cantidadInput,
          series: [...actual.series, ...seriesSeleccionadas],
        };
        return copia;
      });
    } else {
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
    }

    setProductoSeleccionadoId('');
    setBusquedaProducto('');
    setCantidadInput(1);
    setSeriesSeleccionadas([]);
    setMensaje(null);
  };

  const handleEliminarLinea = (idTemp: string) => {
    setLineas(prev => prev.filter(l => l.idTemp !== idTemp));
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
        navigate('/servicio-campo/devolucion-tecnicos');
      } else {
        setSelectedTab('productos');
        setMensaje({
          tipo: 'success',
          texto: `Borrador guardado exitosamente (N° ${res.numero}${res.numeroGuiaRemision ? ` · Guía ${res.numeroGuiaRemision}` : ''}). Ya puede agregar los productos a devolver.`,
        });
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

      setDevolucionExitosa({
        id: res.id,
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
    setProductoSeleccionadoId('');
    setBusquedaProducto('');
    setSeriesSeleccionadas([]);
    setDevolucionExitosa(null);
    setSelectedTab('general');
  };

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
      {mensaje && (
        <D365MessageBar intent={mensaje.tipo} onDismiss={() => setMensaje(null)}>
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
            <Tab value="general" icon={<DocumentText16Regular />}>
              General
            </Tab>
            <Tab
              value="productos"
              icon={<DocumentBulletList16Regular />}
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
                <D365FormField label="Técnico de Campo" required info="Técnico que entrega el material que tenía bajo custodia">
                  <SelectorEntidadRelacionada
                    etiquetaGrupo="Técnicos de Campo"
                    opciones={opcionesTecnicos}
                    seleccionada={tecnicoSeleccionado}
                    textoBusqueda={busquedaTecnico}
                    alCambiarBusqueda={setBusquedaTecnico}
                    alSeleccionar={(id) => {
                      setTecnicoId(id || '');
                      if (id) {
                        const nuevoTec = tecnicos.find(t => t.id === id);
                        if (nuevoTec?.unidadOrganizativaId && almacenDestinoId) {
                          const bodegaActual = almacenes.find(a => a.id === almacenDestinoId);
                          if (bodegaActual && bodegaActual.unidadOrganizativaId && bodegaActual.unidadOrganizativaId !== nuevoTec.unidadOrganizativaId) {
                            setAlmacenDestinoId('');
                          }
                        }
                      }
                    }}
                    alNavegar={() => navigate(`/administracion/usuarios`)}
                    icono={<Person16Regular />}
                    tituloEnlace="Ver perfil del técnico"
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
                    alSeleccionar={(id) => setAlmacenDestinoId(id || '')}
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

            {estado !== 'Cerrada' && (
              <div className={classes.scannerBox}>
              <div className={classes.scannerBar}>
                <div className={`${classes.fieldGroup} ${classes.productoField}`}>
                  <label className={classes.fieldLabel}>
                    Material en Custodia del Técnico *
                  </label>
                  <Combobox
                    placeholder={
                      !custodiaTecnico
                        ? 'Seleccione primero un técnico con custodia'
                        : 'Escriba código SKU o nombre del material en custodia...'
                    }
                    disabled={!custodiaTecnico}
                    value={
                      productoSeleccionado
                        ? `${productoSeleccionado.codigoProducto} — ${productoSeleccionado.nombreProducto}`
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
                          text={`${p.codigoProducto} — ${p.nombreProducto}`}
                        >
                          <div className={classes.comboboxOption}>
                            <Text weight="semibold">{p.nombreProducto}</Text>
                            <span className={classes.comboboxOptionCode}>
                              SKU: {p.codigoProducto} {p.esSerializado ? '· 🏷️ Serializado' : ''}
                            </span>
                          </div>
                        </Option>
                      ))
                    )}
                  </Combobox>
                </div>

                <div className={`${classes.fieldGroup} ${classes.cantidadField}`}>
                  <label className={classes.fieldLabel}>Cantidad *</label>
                  <Input
                    type="number"
                    min={1}
                    value={cantidadInput.toString()}
                    onChange={(_, d) => setCantidadInput(Math.max(1, Number(d.value) || 1))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className={`${classes.fieldGroup} ${classes.condicionField}`}>
                  <label className={classes.fieldLabel}>Condición de Reingreso *</label>
                  <Select
                    value={condicionInput.toString()}
                    onChange={(_, d) => setCondicionInput(Number(d.value) as 1 | 2)}
                    style={{ width: '100%' }}
                  >
                    <option value="1">🟢 Utilizable</option>
                    <option value="2">🔴 Defectuoso</option>
                  </Select>
                </div>

                <div>
                  <Button
                    icon={<Add16Regular />}
                    appearance="primary"
                    onClick={handleAgregarLinea}
                    disabled={!productoSeleccionado}
                    style={{ minWidth: '110px' }}
                  >
                    Agregar
                  </Button>
                </div>
              </div>

              {productoSeleccionado && (
                <div className={classes.stockInfoBanner}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box16Regular style={{ color: tokens.colorBrandForeground1 }} />
                    <Text size={200} weight="semibold">
                      {productoSeleccionado.nombreProducto} ({productoSeleccionado.codigoProducto})
                    </Text>
                  </div>
                  <div>
                    {(() => {
                      const unidadTexto = productoSeleccionado.nombreUnidadMedida === 'Unidades' ? 'UND' : (productoSeleccionado.nombreUnidadMedida || 'UND');
                      return (
                        <Badge
                          appearance="tint"
                          shape="rounded"
                          color={productoSeleccionado.cantidadDisponible >= cantidadInput ? 'informative' : 'danger'}
                          size="medium"
                        >
                          Stock en custodia: {productoSeleccionado.cantidadDisponible} {unidadTexto}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              )}

            {productoSeleccionado?.esSerializado && (
              <div className={classes.seriesSelectorBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text weight="semibold" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag16Regular /> Seleccione las {cantidadInput} serie(s) que el técnico está devolviendo:
                  </Text>
                  <Badge appearance="tint" shape="rounded" color={seriesSeleccionadas.length === cantidadInput ? 'success' : 'warning'}>
                    {seriesSeleccionadas.length} de {cantidadInput} seleccionadas
                  </Badge>
                </div>
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
          )}

          {/* Tabla de ítems agregados */}
          {lineas.length === 0 ? (
            <div className={classes.emptyState}>
              <Box16Regular style={{ fontSize: '32px', color: tokens.colorNeutralForeground4 }} />
              <Text block weight="semibold" style={{ color: tokens.colorNeutralForeground2, marginTop: '8px' }}>
                Aún no ha agregado materiales a la devolución
              </Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Seleccione un producto en custodia arriba, configure la cantidad y haga clic en "Agregar".
              </Text>
            </div>
          ) : (
            <>
              <table className={classes.table}>
                <thead>
                  <tr>
                    <th className={classes.th}>#</th>
                    <th className={classes.th}>Código SKU</th>
                    <th className={classes.th}>Descripción del Producto</th>
                    <th className={classes.th}>Cantidad</th>
                    <th className={classes.th}>Unidad</th>
                    <th className={classes.th}>Condición</th>
                    <th className={classes.th}>Series Devueltas</th>
                    {estado !== 'Cerrada' && (
                      <th className={classes.th} style={{ textAlign: 'center' }}>Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l, idx) => (
                    <tr key={l.idTemp}>
                      <td className={classes.td}>{idx + 1}</td>
                      <td className={classes.td}><strong style={{ fontFamily: 'monospace' }}>{l.codigo}</strong></td>
                      <td className={classes.td}>{l.nombre}</td>
                      <td className={classes.td}><strong>{l.cantidad}</strong></td>
                      <td className={classes.td}>
                        <Badge appearance="tint" shape="rounded" color="informative" size="small">
                          {l.unidad}
                        </Badge>
                      </td>
                      <td className={classes.td}>
                        <Badge
                          appearance="tint"
                          shape="rounded"
                          color={l.condicion === 1 ? 'informative' : 'danger'}
                        >
                          {l.condicion === 1 ? 'Utilizable' : 'Defectuoso'}
                        </Badge>
                      </td>
                      <td className={classes.td}>
                        {l.series.length > 0 ? (
                          <div className={classes.seriesBadgeList}>
                            {l.series.map(s => (
                              <Badge key={s} appearance="tint" shape="rounded" color="brand">{s}</Badge>
                            ))}
                          </div>
                        ) : (
                          <Text style={{ color: tokens.colorNeutralForeground4 }}>—</Text>
                        )}
                      </td>
                      {estado !== 'Cerrada' && (
                        <td className={classes.td} style={{ textAlign: 'center' }}>
                          <Button
                            icon={<Delete16Regular />}
                            appearance="subtle"
                            size="small"
                            aria-label="Eliminar ítem"
                            onClick={() => handleEliminarLinea(l.idTemp)}
                          />
                        </td>
                      )}
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
        )}
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

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
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
                  <Button
                    appearance="outline"
                    icon={<WhatsAppIcon size={16} />}
                    onClick={() => void handleCompartirWhatsApp()}
                  >
                    Compartir por WhatsApp
                  </Button>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="subtle" onClick={resetFormulario}>
                Realizar otra devolución
              </Button>
              <Button appearance="secondary" onClick={() => navigate('/servicio-campo/devolucion-tecnicos')}>
                Ir al Historial
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
