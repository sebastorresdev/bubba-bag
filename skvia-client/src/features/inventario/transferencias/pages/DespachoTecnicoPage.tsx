import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Input,
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
  VehicleTruckProfile16Regular,
  CheckmarkCircle16Regular,
  Box16Regular,
  Tag16Regular,
  DocumentBulletList16Regular,
  DocumentText16Regular,
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
    flex: '1 1 360px',
    minWidth: '280px',
  },
  cantidadField: {
    width: '130px',
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
          setUbicacionOrigenId(prev => prev || principal.id);
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

    const cantidadExistente = lineas
      .filter(l => l.productoId === productoSeleccionado.productoId)
      .reduce((acc, l) => acc + l.cantidad, 0);

    const saldoDisponible = Math.max(0, productoSeleccionado.cantidadDisponible - cantidadExistente);

    if (cantidadInput > saldoDisponible) {
      setMensaje({
        tipo: 'error',
        texto: `No puede agregar ${cantidadInput} unidad(es). El saldo disponible actual es de ${saldoDisponible} ${productoSeleccionado.nombreUnidadMedida || 'UND'}.`,
      });
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

    setLineas(prev => {
      const idx = prev.findIndex(l => l.productoId === productoSeleccionado.productoId);
      if (idx >= 0) {
        const clon = [...prev];
        clon[idx] = {
          ...clon[idx],
          cantidad: clon[idx].cantidad + cantidadInput,
          series: [...clon[idx].series, ...seriesSeleccionadas],
        };
        return clon;
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
      return [...prev, nuevaLinea];
    });

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
        navigate('/servicio-campo/despacho-tecnicos');
      } else {
        setSelectedTab('productos');
        setMensaje({
          tipo: 'success',
          texto: `Borrador guardado exitosamente (N° ${res.numero}${res.numeroGuiaRemision ? ` · Guía ${res.numeroGuiaRemision}` : ''}). Ya puede agregar los productos a despachar.`,
        });
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

      setDespachoExitoso({
        id: res.id,
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
    setProductoSeleccionadoId('');
    setBusquedaProducto('');
    setSeriesSeleccionadas([]);
    setDespachoExitoso(null);
  };

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
      {mensaje && (
        <D365MessageBar intent={mensaje.tipo} onDismiss={() => setMensaje(null)}>
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

            {estado !== 'Cerrada' && (
              <div className={classes.scannerBox}>
              <div className={classes.scannerBar}>
                <div className={`${classes.fieldGroup} ${classes.productoField}`}>
                  <label className={classes.fieldLabel}>
                    Buscar Producto en Almacén *
                  </label>
                  <Combobox
                    placeholder="Escriba código SKU o nombre del material..."
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
                        {productosStock.length === 0
                          ? 'No hay existencias disponibles en esta bodega'
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
                      const agregada = lineas
                        .filter(l => l.productoId === productoSeleccionado.productoId)
                        .reduce((acc, l) => acc + l.cantidad, 0);
                      const remanente = Math.max(0, productoSeleccionado.cantidadDisponible - agregada);
                      const unidadTexto = productoSeleccionado.nombreUnidadMedida === 'Unidades' ? 'UND' : (productoSeleccionado.nombreUnidadMedida || 'UND');
                      return (
                        <Badge
                          appearance="tint"
                          shape="rounded"
                          color={remanente > 0 ? 'success' : 'danger'}
                          size="medium"
                        >
                          Stock disponible: {remanente} {unidadTexto}
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
                      <Tag16Regular /> Seleccione las {cantidadInput} serie(s) que entregará en mano:
                    </Text>
                    <Badge appearance="tint" shape="rounded" color={seriesSeleccionadas.length === cantidadInput ? 'success' : 'warning'}>
                      {seriesSeleccionadas.length} de {cantidadInput} seleccionadas
                    </Badge>
                  </div>
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
            )}

            {/* Tabla de ítems agregados */}
            {lineas.length === 0 ? (
              <div className={classes.emptyState}>
                <Box16Regular style={{ fontSize: '32px', color: tokens.colorNeutralForeground4 }} />
                <Text block weight="semibold" style={{ color: tokens.colorNeutralForeground2, marginTop: '8px' }}>
                  Aún no ha agregado materiales al despacho
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Seleccione un producto arriba, configure la cantidad y haga clic en "Agregar".
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
                      <th className={classes.th}>Series Asignadas</th>
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
                  <Text weight="semibold">Total de Ítems: {lineas.length}</Text>
                  <Text weight="bold" size={400}>Total de Unidades a Despachar: {totalCantidad}</Text>
                </div>
              </>
            )}
          </div>
        )}
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

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
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
                Realizar otro despacho
              </Button>
              <Button appearance="secondary" onClick={() => navigate('/servicio-campo/despacho-tecnicos')}>
                Ir al Historial
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
