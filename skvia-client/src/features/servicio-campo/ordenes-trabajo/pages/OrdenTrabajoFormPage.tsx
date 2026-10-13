import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Text,
  TabList,
  Tab,
  Textarea,
  Toast,
  Toaster,
  ToastTitle,
  useId,
  useToastController,
  Spinner,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Button,
  tokens,
  Select,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  DismissCircle16Regular,
  CheckmarkCircle16Regular,
  ClipboardTask24Regular,
  CalendarClock16Regular,
  Delete16Regular,
  Play16Regular,
  Wrench16Regular,
  Person16Regular,
  Edit16Regular,
  Eye16Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { SelectorEntidadRelacionada, type OpcionEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { WorkOrderEtapas } from '../components/WorkOrderEtapas';
import { OrdenTrabajoService } from '../services/ordenTrabajo.service';
import { ClienteService } from '../../../crm/clientes/services/cliente.service';
import { ProductoService } from '../../../inventario/productos/services/producto.service';
import type { ProductoDto } from '../../../inventario/productos/types/producto.types';
import { PlantillaTrabajoService } from '../../plantillas-trabajo/services/plantillaTrabajo.service';
import type {
  PlantillaTrabajoListadoDto,
  PlantillaTrabajoDetalleDto,
  PlantillaTareaItemDto,
  PlantillaMaterialItemDto,
} from '../../plantillas-trabajo/types/plantillaTrabajo.types';
import type { ClienteListadoItemDto } from '../../../crm/clientes/types/cliente.types';
import { ListaPreciosService } from '../../../inventario/listas-precios/services/listaPrecios.service';
import type { DetalleListaPreciosDto } from '../../../inventario/listas-precios/types/listaPrecios.types';
import type {
  OrdenTrabajoDetalleDto,
  CrearOrdenTrabajoDto,
  ActualizarOrdenTrabajoDto,
  EstadoSistema,
  TipoOrdenTrabajoOpcion,
  OrdenTrabajoTareaDto,
  OrdenTrabajoMaterialDto,
} from '../types/ordenTrabajo.types';

export interface DrawerServicioItem {
  id: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  tarifa: number;
  esPredeterminada: boolean;
}

export interface TrabajoFormItem {
  idTemp: string;
  id?: string;
  codigoTrabajo?: string;
  codigoExterno: string;
  productoId: string;
  plantillaTrabajoId?: string;
  plantillaTrabajoCodigo?: string;
  plantillaTrabajoNombre?: string;
  tarifaBase: number;
  observaciones: string;
  totalTareas?: number;
  totalMateriales?: number;
  estado?: string;
  servicios?: DrawerServicioItem[];
  tareas?: (OrdenTrabajoTareaDto | PlantillaTareaItemDto)[];
  materiales?: (OrdenTrabajoMaterialDto | PlantillaMaterialItemDto)[];
}

export const OrdenTrabajoFormPage: React.FC = () => {
  const formStyles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const esNuevo = !id || id === 'nuevo';

  const toasterId = useId('wo-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(!esNuevo);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'resumen' | 'trabajos' | 'direcciones' | 'programacion' | 'materiales'>('resumen');

  // Catálogos
  const [tiposOrden, setTiposOrden] = useState<TipoOrdenTrabajoOpcion[]>([]);
  const [clientesFacturacion, setClientesFacturacion] = useState<ClienteListadoItemDto[]>([]);
  const [clientesServicio, setClientesServicio] = useState<ClienteListadoItemDto[]>([]);
  const [productosServicios, setProductosServicios] = useState<ProductoDto[]>([]);
  const [plantillasTrabajo, setPlantillasTrabajo] = useState<PlantillaTrabajoListadoDto[]>([]);

  // Búsquedas para SelectorEntidadRelacionada (TagPicker)
  const [busquedaTipoOrden, setBusquedaTipoOrden] = useState('');
  const [busquedaClienteFact, setBusquedaClienteFact] = useState('');
  const [busquedaClienteServ, setBusquedaClienteServ] = useState('');

  // Trabajos / Incidentes de la orden
  const [trabajos, setTrabajos] = useState<TrabajoFormItem[]>([]);

  // Drawer lateral para ver / editar / crear trabajo técnico (Opción 1)
  const [drawerTrabajoOpen, setDrawerTrabajoOpen] = useState(false);
  const [trabajoEnEdicionIndex, setTrabajoEnEdicionIndex] = useState<number | null>(null);
  const [drawerServicios, setDrawerServicios] = useState<DrawerServicioItem[]>([]);
  const [drawerBusquedaPlantilla, setDrawerBusquedaPlantilla] = useState('');
  const [drawerCodigoExterno, setDrawerCodigoExterno] = useState('');
  const [drawerProductoId, setDrawerProductoId] = useState('');
    const [drawerPlantillaId, setDrawerPlantillaId] = useState('');
  const [drawerPlantillaDetalle, setDrawerPlantillaDetalle] = useState<PlantillaTrabajoDetalleDto | null>(null);
    const [drawerTarifaBase, setDrawerTarifaBase] = useState(0);
  const [drawerObservaciones, setDrawerObservaciones] = useState('');
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Drawer lateral de consulta/detalle técnico del incidente (Servicios, Tareas, Materiales)
  const [drawerDetalleIncidenteOpen, setDrawerDetalleIncidenteOpen] = useState(false);
  const [incidenteSeleccionadoParaDetalle, setIncidenteSeleccionadoParaDetalle] = useState<TrabajoFormItem | null>(null);
  const [tabDetalleIncidente, setTabDetalleIncidente] = useState<'servicios' | 'tareas' | 'materiales'>('servicios');
  const [cargandoDetalleIncidente, setCargandoDetalleIncidente] = useState(false);
  const [detalleIncidenteData, setDetalleIncidenteData] = useState<{
    servicios: any[];
    tareas: any[];
    materiales: any[];
  } | null>(null);

  // Lista de Precios asociada al Tipo de Orden seleccionado
  const [listaPreciosActiva, setListaPreciosActiva] = useState<DetalleListaPreciosDto | null>(null);

  // Campos de la Orden
  const [orden, setOrden] = useState<OrdenTrabajoDetalleDto | null>(null);
  const [codigoWo, setCodigoWo] = useState('');
  const [tipoOrdenId, setTipoOrdenId] = useState('');
  const [clienteFacturacionId, setClienteFacturacionId] = useState('');
  const [clienteServicioId, setClienteServicioId] = useState('');
  const [zonaOperativaNombre, setZonaOperativaNombre] = useState('');
  const [numeroOrden, setNumeroOrden] = useState('');
  const [referenciaExterna, setReferenciaExterna] = useState('');
  const [codigoContrato, setCodigoContrato] = useState('');
  const [numeroPedido, setNumeroPedido] = useState('');
  const [estadoSistema, setEstadoSistema] = useState<EstadoSistema>('Borrador');
  const [estadoOperativo, setEstadoOperativo] = useState('Pendiente');
  const [observaciones, setObservaciones] = useState('');

  // Programación y Despacho
  const [recursoTecnicoId, setRecursoTecnicoId] = useState('');
  const [recursoTecnicoNombre, setRecursoTecnicoNombre] = useState('');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [bloqueHorario, setBloqueHorario] = useState('09:00 - 13:00');

  // Encabezado estático durante edición (solo cambia al cargar o al guardar)
  const [savedTitle, setSavedTitle] = useState(esNuevo ? 'Nuevo' : '');
  const [savedSubtitle, setSavedSubtitle] = useState(esNuevo ? 'Ficha de orden de trabajo' : '');

  const notifySuccess = useCallback((title: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  // Cargar Catálogos Iniciales
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [tipos, clientesFact, clientesServ, todosClientes, prods, plants] = await Promise.all([
          OrdenTrabajoService.obtenerTiposOrden(),
          ClienteService.obtenerClientes({ soloFacturacion: true }),
          ClienteService.obtenerClientes({ soloServicio: true }),
          ClienteService.obtenerClientes({ soloActivos: true }),
          ProductoService.getProductos(undefined, undefined, true),
          PlantillaTrabajoService.getPlantillas({ soloActivos: true }),
        ]);

        setTiposOrden(tipos);
        // Si no existen con el flag exclusivo, permitir seleccionar entre todos los clientes activos
        setClientesFacturacion(clientesFact.length > 0 ? clientesFact : todosClientes);
        setClientesServicio(clientesServ.length > 0 ? clientesServ : todosClientes);
        setProductosServicios(prods);
        setPlantillasTrabajo(plants);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    };

    void cargarCatalogos();
  }, [esNuevo]);

  // Cargar Orden Existente
  useEffect(() => {
    if (esNuevo) return;

    const cargarOrden = async () => {
      try {
        setLoading(true);
        const data = await OrdenTrabajoService.obtenerOrdenPorId(id);
        setOrden(data);
        setSavedTitle(data.codigoWo || 'Orden de Trabajo');
        setSavedSubtitle(`${data.tipoOrdenNombre || 'Servicio'} — ${data.clienteServicioNombre || ''}`);
        setCodigoWo(data.codigoWo);
        setTipoOrdenId(data.tipoOrdenId);
        setClienteFacturacionId(data.clienteFacturacionId);
        setClienteServicioId(data.clienteServicioId);
        setZonaOperativaNombre(data.zonaOperativaNombre || 'Lima Metropolitana');
        setNumeroOrden(data.numeroOrden || '');
        setReferenciaExterna(data.referenciaExterna || '');
        setCodigoContrato(data.codigoContrato || '');
        setNumeroPedido(data.numeroPedido || '');
        setEstadoSistema((data.estadoSistema as EstadoSistema) || 'Borrador');
        setEstadoOperativo(data.estado || 'Pendiente');
        setObservaciones(data.observacionesGenerales || '');
        setRecursoTecnicoId(data.recursoTecnicoId || '');
        setRecursoTecnicoNombre(data.recursoTecnicoNombre || '');
        setFechaProgramada(data.fechaProgramada || '');
        setBloqueHorario(data.bloqueHorario || '09:00 - 13:00');

        if (data.trabajos && data.trabajos.length > 0) {
          setTrabajos(
            data.trabajos.map((t) => ({
              idTemp: t.id,
              id: t.id,
              codigoTrabajo: t.codigoTrabajo,
              codigoExterno: t.codigoExterno || '',
              productoId: t.productoId,
              plantillaTrabajoId: t.plantillaTrabajoId || '',
              tarifaBase: t.tarifaBaseCongelada ?? 0,
              observaciones: t.observaciones || '',
              totalTareas: t.totalTareas,
              totalMateriales: t.totalMateriales,
              estado: t.estado,
              tareas: t.tareas || [],
              materiales: t.materiales || [],
            }))
          );
        } else {
          setTrabajos([]);
        }
      } catch (e) {
        console.error(e);
        setMensaje({ tipo: 'error', texto: 'No se pudo cargar la orden de trabajo.' });
      } finally {
        setLoading(false);
      }
    };

    void cargarOrden();
  }, [id, esNuevo]);

  // Cargar Lista de Precios asociada al Tipo de Orden seleccionado
  useEffect(() => {
    if (!tipoOrdenId || tiposOrden.length === 0) {
      setListaPreciosActiva(null);
      return;
    }

    const tipoSel = tiposOrden.find((t) => t.id === tipoOrdenId);
    if (!tipoSel?.listaPreciosId) {
      setListaPreciosActiva(null);
      return;
    }

    const cargarListaPrecios = async () => {
      try {
        const lp = await ListaPreciosService.getListaPreciosById(tipoSel.listaPreciosId!);
        setListaPreciosActiva(lp);
      } catch (err) {
        console.warn('No se pudo cargar la lista de precios asignada al tipo de orden:', err);
        setListaPreciosActiva(null);
      }
    };

    void cargarListaPrecios();
  }, [tipoOrdenId, tiposOrden]);

  // Cliente de servicio seleccionado (para datos de dirección)
  const clienteServicioSeleccionado = useMemo(() => {
    return clientesServicio.find((c) => c.id === clienteServicioId);
  }, [clientesServicio, clienteServicioId]);

  // Opciones para SelectorEntidadRelacionada (TagPicker)
  const opcionesTiposOrden: OpcionEntidadRelacionada[] = useMemo(
    () =>
      tiposOrden.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        detalle: t.listaPreciosNombre
          ? `Tarifario: ${t.listaPreciosNombre}`
          : t.colorHex
          ? `Color: ${t.colorHex}`
          : undefined,
      })),
    [tiposOrden]
  );
  const tipoOrdenSeleccionado = useMemo(
    () => opcionesTiposOrden.find((t) => t.id === tipoOrdenId) || null,
    [opcionesTiposOrden, tipoOrdenId]
  );

  const opcionesClientesFacturacion: OpcionEntidadRelacionada[] = useMemo(
    () =>
      clientesFacturacion.map((c) => ({
        id: c.id,
        nombre: c.nombreCompletoODenominacion,
        detalle: c.documentoIdentidad ? `${c.tipoPersona}: ${c.documentoIdentidad}` : undefined,
      })),
    [clientesFacturacion]
  );
  const clienteFacturacionSeleccionado = useMemo(
    () => opcionesClientesFacturacion.find((c) => c.id === clienteFacturacionId) || null,
    [opcionesClientesFacturacion, clienteFacturacionId]
  );

  const opcionesClientesServicio: OpcionEntidadRelacionada[] = useMemo(
    () =>
      clientesServicio.map((c) => ({
        id: c.id,
        nombre: c.nombreCompletoODenominacion,
        detalle: c.documentoIdentidad ? `${c.tipoPersona}: ${c.documentoIdentidad}` : undefined,
      })),
    [clientesServicio]
  );
  const clienteServicioSeleccionadoObj = useMemo(
    () => opcionesClientesServicio.find((c) => c.id === clienteServicioId) || null,
    [opcionesClientesServicio, clienteServicioId]
  );

  const opcionesPlantillasTrabajo: OpcionEntidadRelacionada[] = useMemo(
    () =>
      plantillasTrabajo.map((pl) => ({
        id: pl.id,
        nombre: `[${pl.codigo}] ${pl.nombre}`,
        detalle: `${pl.cantidadTareas} tareas · ${pl.cantidadMateriales} materiales`,
      })),
    [plantillasTrabajo]
  );
  const plantillaSeleccionadaDrawerObj = useMemo(
    () => opcionesPlantillasTrabajo.find((pl) => pl.id === drawerPlantillaId) || null,
    [opcionesPlantillasTrabajo, drawerPlantillaId]
  );

    
  // Función para resolver tarifa automática según lista de precios o catálogo
  const resolverTarifa = useCallback(
    (prodId: string): { tarifa: number; origen: string } => {
      if (!prodId) return { tarifa: 0, origen: '' };

      // 1. Prioridad: Lista de precios asignada al Tipo de Orden
      if (listaPreciosActiva?.elementos && listaPreciosActiva.elementos.length > 0) {
        const elem = listaPreciosActiva.elementos.find((e) => e.productoId === prodId);
        if (elem && elem.monto > 0) {
          return {
            tarifa: elem.monto,
            origen: `Tarifa de lista: ${listaPreciosActiva.nombre} (S/ ${elem.monto.toFixed(2)})`,
          };
        }
      }

      // 2. Respaldo: Precio base de catálogo del producto
      const prod = productosServicios.find((p) => p.id === prodId);
      if (prod && (prod.precioBase || 0) > 0) {
        return {
          tarifa: prod.precioBase,
          origen: `Precio base de catálogo (S/ ${prod.precioBase.toFixed(2)})`,
        };
      }

      return {
        tarifa: 0,
        origen: 'Sin tarifa',
      };
    },
    [tipoOrdenId, listaPreciosActiva, productosServicios]
  );

  // Manejadores del Drawer de Trabajos
  
  // Cargar detalle completo de plantilla (para visualizar tareas y materiales en el Drawer)
  const cargarDetallePlantilla = useCallback(async (plantillaId: string): Promise<PlantillaTrabajoDetalleDto | null> => {
    if (!plantillaId) {
      setDrawerPlantillaDetalle(null);
      return null;
    }
    try {
      const det = await PlantillaTrabajoService.getPlantillaById(plantillaId);
      setDrawerPlantillaDetalle(det);
      return det;
    } catch (err) {
      console.warn('No se pudo cargar el detalle de la plantilla:', err);
      setDrawerPlantillaDetalle(null);
      return null;
    } finally {
      // finish
    }
  }, []);

  const handleDrawerSeleccionarPlantilla = async (plantillaId: string) => {
    setDrawerPlantillaId(plantillaId);
    if (!plantillaId) {
      setDrawerPlantillaDetalle(null);
      setDrawerServicios([]);
      return;
    }

    const det = await cargarDetallePlantilla(plantillaId);
    const plantilla = plantillasTrabajo.find((pl) => pl.id === plantillaId);

    if (det?.servicios && det.servicios.length > 0) {
      const servs: DrawerServicioItem[] = det.servicios.map((s, idx) => {
        const prod = productosServicios.find((p) => p.id === s.productoId);
        const { tarifa } = resolverTarifa(s.productoId);
        return {
          id: s.id || `serv-${idx}`,
          productoId: s.productoId,
          productoCodigo: s.productoCodigo || prod?.codigo || '-',
          productoNombre: s.productoNombre || prod?.nombre || 'Servicio',
          tarifa,
          esPredeterminada: s.esPredeterminada,
        };
      });
      setDrawerServicios(servs);
      const primary = servs.find((s) => s.esPredeterminada) || servs[0];
      setDrawerProductoId(primary.productoId);
      const totalTarifa = servs.reduce((acc, curr) => acc + (curr.tarifa || 0), 0);
      setDrawerTarifaBase(totalTarifa);
    } else if (plantilla && plantilla.productoId) {
      const prod = productosServicios.find((p) => p.id === plantilla.productoId);
      setDrawerProductoId(plantilla.productoId);
      const { tarifa } = resolverTarifa(plantilla.productoId);
      setDrawerServicios([
        {
          id: 'serv-base',
          productoId: plantilla.productoId,
          productoCodigo: plantilla.productoCodigo || prod?.codigo || '-',
          productoNombre: plantilla.productoNombre || prod?.nombre || 'Servicio',
          tarifa,
          esPredeterminada: true,
        },
      ]);
      setDrawerTarifaBase(tarifa);
    } else {
      setDrawerServicios([]);
    }
  };

  const handleAbrirDetalleIncidente = async (
    item: TrabajoFormItem,
    tabInicial: 'servicios' | 'tareas' | 'materiales' = 'servicios'
  ) => {
    setIncidenteSeleccionadoParaDetalle(item);
    setTabDetalleIncidente(tabInicial);
    setDrawerDetalleIncidenteOpen(true);

    if (
      item.servicios && item.servicios.length > 0 &&
      item.tareas && item.tareas.length > 0 &&
      item.materiales && item.materiales.length > 0
    ) {
      setDetalleIncidenteData({
        servicios: item.servicios,
        tareas: item.tareas,
        materiales: item.materiales,
      });
      return;
    }

    if (item.plantillaTrabajoId) {
      try {
        setCargandoDetalleIncidente(true);
        const det = await PlantillaTrabajoService.getPlantillaById(item.plantillaTrabajoId);
        setDetalleIncidenteData({
          servicios: (det.servicios && det.servicios.length > 0) ? det.servicios : (item.servicios || []),
          tareas: (det.tareas && det.tareas.length > 0) ? det.tareas : (item.tareas || []),
          materiales: (det.materiales && det.materiales.length > 0) ? det.materiales : (item.materiales || []),
        });
      } catch (e) {
        console.warn('Error al cargar detalle del incidente:', e);
        setDetalleIncidenteData({
          servicios: item.servicios || [],
          tareas: item.tareas || [],
          materiales: item.materiales || [],
        });
      } finally {
        setCargandoDetalleIncidente(false);
      }
    } else {
      setDetalleIncidenteData({
        servicios: item.servicios || [],
        tareas: item.tareas || [],
        materiales: item.materiales || [],
      });
    }
  };

  const handleAbrirDrawerNuevoTrabajo = () => {
    setTrabajoEnEdicionIndex(null);
        setDrawerCodigoExterno('');
    setDrawerProductoId('');
        setDrawerPlantillaId('');
    setDrawerPlantillaDetalle(null);
    setDrawerServicios([]);
    setDrawerTarifaBase(0);
    setDrawerObservaciones('');
    setDrawerError(null);
    setDrawerTrabajoOpen(true);
  };

  const handleAbrirDrawerEditarTrabajo = async (idx: number) => {
    const item = trabajos[idx];
    setTrabajoEnEdicionIndex(idx);
        setDrawerCodigoExterno(item.codigoExterno || '');
    setDrawerProductoId(item.productoId || '');
        setDrawerPlantillaId(item.plantillaTrabajoId || '');
    setDrawerTarifaBase(item.tarifaBase || 0);
    setDrawerObservaciones(item.observaciones || '');
    setDrawerError(null);

    if (item.servicios && item.servicios.length > 0) {
      setDrawerServicios(item.servicios);
    } else if (item.productoId) {
      const prod = productosServicios.find((p) => p.id === item.productoId);
      setDrawerServicios([
        {
          id: 'serv-0',
          productoId: item.productoId,
          productoCodigo: prod?.codigo || '-',
          productoNombre: prod?.nombre || 'Servicio Técnico',
          tarifa: item.tarifaBase || 0,
          esPredeterminada: true,
        },
      ]);
    } else {
      setDrawerServicios([]);
    }

    

    setDrawerTrabajoOpen(true);

    if (item.plantillaTrabajoId) {
      await cargarDetallePlantilla(item.plantillaTrabajoId);
    } else {
      setDrawerPlantillaDetalle(null);
    }
  };

  const handleGuardarDrawerTrabajo = () => {
    let prodId = drawerProductoId;

    if (!prodId && drawerServicios.length > 0) {
      const pred = drawerServicios.find((s) => s.esPredeterminada) || drawerServicios[0];
      prodId = pred.productoId;
    }

    if (!prodId && drawerPlantillaId) {
      const pl = plantillasTrabajo.find((p) => p.id === drawerPlantillaId);
      if (pl?.productoId) {
        prodId = pl.productoId;
      }
    }

    if (!prodId) {
      setDrawerError('Debe seleccionar una plantilla o agregar al menos un servicio técnico en la pestaña "Servicios".');
      return;
    }

    const pl = drawerPlantillaId ? plantillasTrabajo.find((p) => p.id === drawerPlantillaId) : undefined;
    const tareasEstimadas = drawerPlantillaDetalle?.tareas.length ?? pl?.cantidadTareas ?? 0;
    const materialesEstimados = drawerPlantillaDetalle?.materiales.length ?? pl?.cantidadMateriales ?? 0;

    const trabajoExistente = trabajoEnEdicionIndex !== null ? trabajos[trabajoEnEdicionIndex] : null;

    // Sincronizar subtareas y materiales previstos
    const tareasActualizadas = drawerPlantillaDetalle?.tareas
      ? drawerPlantillaDetalle.tareas.map((t) => ({
          id: t.id,
          nombreTarea: t.tareaNombre,
          estadoTarea: 'Pendiente',
          esObligatoria: t.esObligatoria,
          observaciones: t.instrucciones,
          trabajoCodigo: trabajoExistente?.codigoTrabajo,
        }))
      : trabajoExistente?.tareas || [];

    const materialesActualizados = drawerPlantillaDetalle?.materiales
      ? drawerPlantillaDetalle.materiales.map((m) => ({
          id: m.id,
          productoId: m.productoId,
          codigoProducto: m.productoCodigo,
          nombreProducto: m.productoNombre,
          cantidad: m.cantidadPrevista,
          tipoAccion: 'Instalación',
          numeroSerie: null,
          observaciones: m.observaciones,
          trabajoCodigo: trabajoExistente?.codigoTrabajo,
        }))
      : trabajoExistente?.materiales || [];

    if (trabajoEnEdicionIndex !== null) {
      setTrabajos((prev) => {
        const copia = [...prev];
        copia[trabajoEnEdicionIndex] = {
          ...copia[trabajoEnEdicionIndex],
          codigoExterno: drawerCodigoExterno.trim(),
          productoId: prodId,
          plantillaTrabajoId: drawerPlantillaId || undefined,
          plantillaTrabajoCodigo: pl?.codigo || copia[trabajoEnEdicionIndex].plantillaTrabajoCodigo,
          plantillaTrabajoNombre: pl?.nombre || copia[trabajoEnEdicionIndex].plantillaTrabajoNombre,
          tarifaBase: drawerTarifaBase,
          observaciones: drawerObservaciones.trim(),
          totalTareas: tareasEstimadas > 0 ? tareasEstimadas : copia[trabajoEnEdicionIndex].totalTareas,
          totalMateriales: materialesEstimados > 0 ? materialesEstimados : copia[trabajoEnEdicionIndex].totalMateriales,
          servicios: drawerServicios,
          tareas: tareasActualizadas,
          materiales: materialesActualizados,
        };
        return copia;
      });
      notifySuccess('Línea de trabajo modificada.');
    } else {
      const nuevoTrabajo: TrabajoFormItem = {
        idTemp: `temp-${Date.now()}-${Math.random()}`,
        codigoExterno: drawerCodigoExterno.trim(),
        productoId: prodId,
        plantillaTrabajoId: drawerPlantillaId || undefined,
        plantillaTrabajoCodigo: pl?.codigo,
        plantillaTrabajoNombre: pl?.nombre,
        tarifaBase: drawerTarifaBase,
        observaciones: drawerObservaciones.trim(),
        totalTareas: tareasEstimadas,
        totalMateriales: materialesEstimados,
        estado: 'Pendiente',
        servicios: drawerServicios,
        tareas: tareasActualizadas,
        materiales: materialesActualizados,
      };
      setTrabajos((prev) => [...prev, nuevoTrabajo]);
      notifySuccess('Línea de trabajo agregada a la orden.');
    }

    setDrawerTrabajoOpen(false);
  };

  // Materiales Descargados / Consumidos Reales de la Orden (Pestaña "Materiales Descargados")
  const materialesConsolidados = useMemo(() => {
    if (orden?.materiales && orden.materiales.length > 0) {
      return orden.materiales.map((m) => ({
        id: m.id,
        productoCodigo: m.codigoProducto || '-',
        productoNombre: m.nombreProducto,
        trabajoOrigen: m.trabajoCodigo || 'Orden principal',
        cantidad: m.cantidad,
        tipoAccion: m.tipoAccion || 'Instalación',
        numeroSerie: m.numeroSerie || '-',
        observaciones: m.observaciones || '',
      }));
    }
    // Solo se muestran materiales cuando la orden ha sido atendida/liquidada y se descargó inventario real
    return [];
  }, [orden?.materiales]);

  const handleEliminarFilaTrabajo = async (idx: number) => {
    const item = trabajos[idx];
    if (item.id && id && !esNuevo) {
      if (!window.confirm('¿Está seguro de eliminar este incidente/trabajo de la orden?')) return;
      try {
        await OrdenTrabajoService.eliminarTrabajo(id, item.id);
        notifySuccess('Trabajo eliminado de la orden.');
      } catch (err) {
        console.error(err);
        setMensaje({ tipo: 'error', texto: 'No se pudo eliminar el trabajo.' });
        return;
      }
    }
    setTrabajos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGuardar = async (cerrar = false) => {
    if (!tipoOrdenId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione un tipo de orden de trabajo.' });
      return;
    }
    if (!clienteFacturacionId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione un cliente de facturación.' });
      return;
    }
    if (!clienteServicioId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione el cliente abonado para la atención.' });
      return;
    }

    try {
      setSubmitting(true);
      setMensaje(null);

      if (esNuevo) {
        const trabajosValidos = trabajos
          .filter((t) => Boolean(t.productoId))
          .map((t) => ({
            codigoExterno: t.codigoExterno?.trim() || undefined,
            productoId: t.productoId,
            plantillaTrabajoId: t.plantillaTrabajoId || undefined,
            tarifaBase: t.tarifaBase > 0 ? t.tarifaBase : undefined,
            observaciones: t.observaciones?.trim() || undefined,
          }));

        const dto: CrearOrdenTrabajoDto = {
          tipoOrdenId,
          clienteFacturacionId,
          clienteServicioId,
          numeroOrden: numeroOrden.trim() || undefined,
          referenciaExterna: referenciaExterna.trim() || undefined,
          codigoContrato: codigoContrato.trim() || undefined,
          numeroPedido: numeroPedido.trim() || undefined,
          recursoTecnicoId: recursoTecnicoId || undefined,
          fechaProgramada: fechaProgramada || undefined,
          bloqueHorario: bloqueHorario || undefined,
          observaciones: observaciones.trim() || undefined,
          trabajos: trabajosValidos.length > 0 ? trabajosValidos : undefined,
        };

        const res = await OrdenTrabajoService.crearOrden(dto);
        const tipoNombre = tiposOrden.find((t) => t.id === tipoOrdenId)?.nombre || 'Servicio';
        const clienteNombre = clientesServicio.find((c) => c.id === clienteServicioId)?.nombreCompletoODenominacion || '';
        setSavedTitle(res.codigoWo || 'Orden de Trabajo');
        setSavedSubtitle(`${tipoNombre} — ${clienteNombre}`);
        notifySuccess('Orden de Trabajo registrada exitosamente.');
        if (cerrar) {
          navigate('/servicio-campo/ordenes');
        } else {
          navigate(`/servicio-campo/ordenes/${res.id}`, { replace: true });
        }
      } else {
        const dto: ActualizarOrdenTrabajoDto = {
          recursoTecnicoId: recursoTecnicoId || undefined,
          fechaProgramada: fechaProgramada || undefined,
          bloqueHorario: bloqueHorario || undefined,
          observaciones: observaciones.trim() || undefined,
        };

        await OrdenTrabajoService.actualizarOrden(id, dto);

        // Guardar trabajos pendientes por agregar
        const trabajosNuevos = trabajos.filter((t) => !t.id && Boolean(t.productoId));
        for (const t of trabajosNuevos) {
          await OrdenTrabajoService.agregarTrabajo(id, {
            codigoExterno: t.codigoExterno?.trim() || undefined,
            productoId: t.productoId,
            plantillaTrabajoId: t.plantillaTrabajoId || undefined,
            tarifaBase: t.tarifaBase > 0 ? t.tarifaBase : undefined,
            observaciones: t.observaciones?.trim() || undefined,
          });
        }

        const tipoNombre = tiposOrden.find((t) => t.id === tipoOrdenId)?.nombre || 'Servicio';
        const clienteNombre = clientesServicio.find((c) => c.id === clienteServicioId)?.nombreCompletoODenominacion || '';
        setSavedTitle(codigoWo || 'Orden de Trabajo');
        setSavedSubtitle(`${tipoNombre} — ${clienteNombre}`);
        notifySuccess('Orden de Trabajo actualizada con éxito.');
        if (cerrar) {
          navigate('/servicio-campo/ordenes');
        } else {
          const dataActualizada = await OrdenTrabajoService.obtenerOrdenPorId(id);
          setOrden(dataActualizada);
          if (dataActualizada.trabajos) {
            setTrabajos(
              dataActualizada.trabajos.map((t) => ({
                idTemp: t.id,
                id: t.id,
                codigoTrabajo: t.codigoTrabajo,
                codigoExterno: t.codigoExterno || '',
                productoId: t.productoId,
                plantillaTrabajoId: t.plantillaTrabajoId || '',
                tarifaBase: t.tarifaBaseCongelada ?? 0,
                observaciones: t.observaciones || '',
                totalTareas: t.totalTareas,
                totalMateriales: t.totalMateriales,
                estado: t.estado,
                tareas: t.tareas || [],
                materiales: t.materiales || [],
              }))
            );
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMensaje({ tipo: 'error', texto: 'Error al guardar la orden de trabajo.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: EstadoSistema) => {
    if (!id || esNuevo) return;
    try {
      setSubmitting(true);
      await OrdenTrabajoService.cambiarEstadoSistema(id, {
        nuevoEstadoSistema: nuevoEstado,
        recursoTecnicoId: recursoTecnicoId || undefined,
        fechaProgramada: fechaProgramada || undefined,
        bloqueHorario: bloqueHorario || undefined,
      });
      setEstadoSistema(nuevoEstado);
      notifySuccess(`Estado cambiado a: ${nuevoEstado}`);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al cambiar de estado.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async () => {
    if (!id || esNuevo) return;
    if (!window.confirm('¿Está seguro de eliminar esta orden de trabajo?')) return;
    try {
      setSubmitting(true);
      await OrdenTrabajoService.eliminarOrden(id);
      notifySuccess('Orden eliminada exitosamente.');
      navigate('/servicio-campo/ordenes');
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al eliminar la orden.' });
      setSubmitting(false);
    }
  };

  return (
    <div className={formStyles.root}>
      <Toaster toasterId={toasterId} />

      {/* 1. BARRA DE COMANDOS D365 */}
      <D365CommandBar ariaLabel="Comandos de Orden de Trabajo" busy={submitting || loading}>
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Atrás"
            title="Atrás"
            onClick={() => navigate('/servicio-campo/ordenes')}
          />
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

          {!esNuevo && (
            <>
              <D365CommandDivider />

              {/* Acciones de Flujo de Estados Dynamics 365 */}
              {estadoSistema === 'Borrador' && (
                <D365CommandButton
                  icon={<CalendarClock16Regular />}
                  tone="brand"
                  onClick={() => void handleCambiarEstado('PendienteProgramar')}
                  disabled={submitting}
                >
                  Liberar para Programar
                </D365CommandButton>
              )}

              {estadoSistema === 'PendienteProgramar' && (
                <D365CommandButton
                  icon={<CalendarClock16Regular />}
                  tone="brand"
                  onClick={() => {
                    if (!fechaProgramada) {
                      setFechaProgramada(new Date().toISOString().slice(0, 10));
                    }
                    void handleCambiarEstado('Programado');
                  }}
                  disabled={submitting}
                >
                  Confirmar y Programar Cita
                </D365CommandButton>
              )}

              {estadoSistema === 'Programado' && (
                <D365CommandButton
                  icon={<Play16Regular />}
                  tone="brand"
                  onClick={() => void handleCambiarEstado('EnProgreso')}
                  disabled={submitting}
                >
                  Iniciar Atención en Campo
                </D365CommandButton>
              )}

              {estadoSistema === 'EnProgreso' && (
                <D365CommandButton
                  icon={<CheckmarkCircle16Regular />}
                  tone="create"
                  onClick={() => void handleCambiarEstado('Completado')}
                  disabled={submitting}
                >
                  Completar Orden
                </D365CommandButton>
              )}

              {estadoSistema !== 'Cancelado' && estadoSistema !== 'Completado' && (
                <D365CommandButton
                  icon={<DismissCircle16Regular />}
                  tone="danger"
                  onClick={() => void handleCambiarEstado('Cancelado')}
                  disabled={submitting}
                >
                  Cancelar Orden
                </D365CommandButton>
              )}

              {(estadoSistema === 'Borrador' || estadoSistema === 'Cancelado') && (
                <D365CommandButton
                  icon={<Delete16Regular />}
                  tone="danger"
                  onClick={() => void handleEliminar()}
                  disabled={submitting}
                >
                  Eliminar
                </D365CommandButton>
              )}

              <D365CommandDivider />
              <D365CommandButton
                icon={<Add16Regular />}
                tone="create"
                onClick={() => navigate('/servicio-campo/ordenes/nuevo')}
              >
                Nuevo
              </D365CommandButton>
            </>
          )}
        </div>
      </D365CommandBar>

      {/* 2. ENTITY HEADER CON PROCESS FLOW EDGE-TO-EDGE Y TABS (SIN ICONOS NI NÚMEROS) */}
      <D365EntityHeader
        title={savedTitle || (esNuevo ? 'Nuevo' : 'Orden de Trabajo')}
        subtitle={savedSubtitle || 'Ficha de orden de trabajo'}
        avatarIcon={<ClipboardTask24Regular />}
        metadata={[
          { label: 'System Status', value: estadoSistema },
          { label: 'Estado Operativo', value: estadoOperativo },
          { label: 'Técnico', value: recursoTecnicoNombre || 'Sin Asignar' },
          { label: 'Fecha Cita', value: fechaProgramada || 'Sin Programar' },
        ]}
        processFlow={
          <WorkOrderEtapas
            estadoSistema={estadoSistema}
            embedded
          />
        }
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) =>
              setSelectedTab(
                data.value as 'resumen' | 'trabajos' | 'direcciones' | 'programacion' | 'materiales'
              )
            }
          >
            <Tab value="resumen">Resumen y Cliente</Tab>
            <Tab value="trabajos">Incidentes</Tab>
            <Tab value="direcciones">Direcciones</Tab>
            <Tab value="programacion">Programación y Despacho</Tab>
            <Tab value="materiales">Materiales Descargados</Tab>
          </TabList>
        }
      />

      {/* 3. ALERT FEEDBACK */}
      {mensaje && (
        <div style={{ padding: '0 24px', marginTop: '12px' }}>
          <D365MessageBar intent={mensaje.tipo} onDismiss={() => setMensaje(null)}>
            {mensaje.texto}
          </D365MessageBar>
        </div>
      )}

      {/* 4. CONTENIDO DE PESTAÑAS */}
      <div className={formStyles.contentBody}>
        {loading ? (
          <div style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}>
            <Spinner label="Cargando orden de trabajo..." />
          </div>
        ) : (
          <>
            {/* ============================================================= */}
            {/* TAB 1: RESUMEN Y CLIENTE                                      */}
            {/* ============================================================= */}
            {selectedTab === 'resumen' && (
              <div className={formStyles.grid2Cols}>
                {/* TARJETA 1 (IZQUIERDA): GENERAL - IDENTIFICACIÓN Y CUENTAS (EXACTO A DYNAMICS 365) */}
                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>General</div>

                  <D365FormField label="Código WO" htmlFor="wo-codigo">
                    <Input
                      id="wo-codigo"
                      className={formStyles.d365ControlFull}
                      value={codigoWo || 'Se generará automáticamente al guardar'}
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>

                  <D365FormField label="Cliente Receptor (Abonado)" required info="Service Account: cuenta receptora del servicio en campo">
                    <SelectorEntidadRelacionada
                      etiquetaGrupo="Abonados / Clientes de Servicio"
                      opciones={opcionesClientesServicio}
                      seleccionada={clienteServicioSeleccionadoObj}
                      textoBusqueda={busquedaClienteServ}
                      alCambiarBusqueda={setBusquedaClienteServ}
                      alSeleccionar={(nuevoId) => setClienteServicioId(nuevoId || '')}
                      alCrearNuevo={() => navigate('/crm/clientes/nuevo')}
                      alNavegar={(nuevoId) => navigate(`/crm/clientes/${nuevoId}`)}
                      icono={<Person16Regular />}
                      tituloEnlace="Ver ficha del abonado"
                      textoVacio="No hay clientes de servicio registrados"
                    />
                  </D365FormField>

                  <D365FormField label="Cliente de Facturación" required info="Billing Account: cuenta comercial de cobro y facturación">
                    <SelectorEntidadRelacionada
                      etiquetaGrupo="Clientes de Facturación"
                      opciones={opcionesClientesFacturacion}
                      seleccionada={clienteFacturacionSeleccionado}
                      textoBusqueda={busquedaClienteFact}
                      alCambiarBusqueda={setBusquedaClienteFact}
                      alSeleccionar={(nuevoId) => setClienteFacturacionId(nuevoId || '')}
                      alCrearNuevo={() => navigate('/crm/clientes/nuevo')}
                      alNavegar={(nuevoId) => navigate(`/crm/clientes/${nuevoId}`)}
                      icono={<Person16Regular />}
                      tituloEnlace="Ver ficha del cliente"
                      textoVacio="No hay clientes de facturación registrados"
                    />
                  </D365FormField>

                  <D365FormField label="Tipo de Orden de Trabajo" required info="Work Order Type: tipo de requerimiento técnico">
                    <SelectorEntidadRelacionada
                      etiquetaGrupo="Tipos de Orden Disponibles"
                      opciones={opcionesTiposOrden}
                      seleccionada={tipoOrdenSeleccionado}
                      textoBusqueda={busquedaTipoOrden}
                      alCambiarBusqueda={setBusquedaTipoOrden}
                      alSeleccionar={(nuevoId) => setTipoOrdenId(nuevoId || '')}
                      alCrearNuevo={() => navigate('/servicio-campo/tipos-orden/nuevo')}
                      alNavegar={(nuevoId) => navigate(`/servicio-campo/tipos-orden/${nuevoId}`)}
                      icono={<ClipboardTask24Regular />}
                      tituloEnlace="Ver ficha del tipo de orden"
                      textoVacio="No hay tipos de orden registrados"
                    />
                  </D365FormField>

                  <D365FormField
                    label="Lista de Precios"
                    info="Price List: lista de precios y tarifario contractual vinculado al tipo de orden."
                  >
                    <Input
                      className={formStyles.d365ControlFull}
                      value={listaPreciosActiva?.nombre || (tipoOrdenSeleccionado?.detalle?.replace('Tarifario: ', '') || 'Sin lista de precios asignada')}
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>

                  <D365FormField label="Zona Operativa / Territorio" htmlFor="wo-zona">
                    <Input
                      id="wo-zona"
                      className={formStyles.d365ControlFull}
                      value={zonaOperativaNombre}
                      onChange={(e) => setZonaOperativaNombre(e.target.value)}
                    />
                  </D365FormField>

                  <D365FormField label="Observaciones" htmlFor="wo-obs" align="top">
                    <Textarea
                      id="wo-obs"
                      className={formStyles.d365ControlFull}
                      rows={3}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Notas generales o instrucciones de la orden..."
                    />
                  </D365FormField>
                </div>

                {/* TARJETA 2 (DERECHA): DETALLE DEL CLIENTE Y REFERENCIAS (EXACTO A DYNAMICS 365) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={formStyles.card}>
                    <div className={formStyles.cardSectionTitle}>Detalle del Cliente (Customer Detail)</div>

                    {clienteServicioSeleccionado ? (
                      <>
                        <D365FormField label="Documento de Identidad">
                          <Input
                            className={formStyles.d365ControlFull}
                            value={`${clienteServicioSeleccionado.tipoPersona}: ${clienteServicioSeleccionado.documentoIdentidad}`}
                            readOnly
                            appearance="filled-darker"
                          />
                        </D365FormField>

                        <D365FormField label="Teléfono de Contacto">
                          <Input
                            className={formStyles.d365ControlFull}
                            value={clienteServicioSeleccionado.telefonoPrincipal || 'Sin teléfono'}
                            readOnly
                            appearance="filled-darker"
                          />
                        </D365FormField>

                        <D365FormField label="Correo Electrónico">
                          <Input
                            className={formStyles.d365ControlFull}
                            value={clienteServicioSeleccionado.email || 'Sin correo registrado'}
                            readOnly
                            appearance="filled-darker"
                          />
                        </D365FormField>
                      </>
                    ) : (
                      <div style={{ padding: '24px 12px', textAlign: 'center', background: tokens.colorNeutralBackground2, borderRadius: '4px' }}>
                        <Text style={{ fontSize: '13px', color: tokens.colorNeutralForeground4 }}>
                          Seleccione un Cliente Receptor (Abonado) en la tarjeta General para visualizar su contacto directo.
                        </Text>
                      </div>
                    )}
                  </div>

                  <div className={formStyles.card}>
                    <div className={formStyles.cardSectionTitle}>Referencias y Contrato</div>

                    <D365FormField
                      label="N° Orden Externa"
                      htmlFor="wo-num-orden"
                      info="Número de orden asignado por el sistema externo del cliente (ej. Siebel, SGA u otro)."
                    >
                      <Input
                        id="wo-num-orden"
                        className={formStyles.d365ControlFull}
                        value={numeroOrden}
                        onChange={(e) => setNumeroOrden(e.target.value)}
                        
                      />
                    </D365FormField>

                    <D365FormField label="Código de Contrato / Abonado" htmlFor="wo-contrato">
                      <Input
                        id="wo-contrato"
                        className={formStyles.d365ControlFull}
                        value={codigoContrato}
                        onChange={(e) => setCodigoContrato(e.target.value)}
                        
                      />
                    </D365FormField>

                    <D365FormField label="N° Pedido Comercial" htmlFor="wo-pedido">
                      <Input
                        id="wo-pedido"
                        className={formStyles.d365ControlFull}
                        value={numeroPedido}
                        onChange={(e) => setNumeroPedido(e.target.value)}
                        
                      />
                    </D365FormField>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB: DIRECCIONES (ADDRESS DE DYNAMICS 365)                    */}
            {/* ============================================================= */}
            {selectedTab === 'direcciones' && (
              <div className={formStyles.grid2Cols}>
                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Dirección del Servicio / Visita Técnica</div>
                  <Text block style={{ color: tokens.colorNeutralForeground3, fontSize: '12px', marginBottom: '16px' }}>
                    Esta dirección se obtiene automáticamente del abonado receptor seleccionado en la orden.
                  </Text>

                  <D365FormField label="Dirección de la Visita" htmlFor="dir-calle">
                    <Input
                      id="dir-calle"
                      className={formStyles.d365ControlFull}
                      value={orden?.direccionServicio || clienteServicioSeleccionado?.direccion || 'Sin dirección registrada'}
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>

                  <D365FormField label="Ubigeo / Distrito" htmlFor="dir-ubigeo">
                    <Input
                      id="dir-ubigeo"
                      className={formStyles.d365ControlFull}
                      value={
                        clienteServicioSeleccionado?.distrito
                          ? `${clienteServicioSeleccionado.distrito} (${clienteServicioSeleccionado.ubigeoCodigo || orden?.ubigeoTexto || ''})`
                          : orden?.ubigeoTexto || '150101'
                      }
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>

                  <D365FormField label="Provincia / Departamento" htmlFor="dir-prov">
                    <Input
                      id="dir-prov"
                      className={formStyles.d365ControlFull}
                      value={
                        clienteServicioSeleccionado
                          ? `${clienteServicioSeleccionado.provincia || '-'} / ${clienteServicioSeleccionado.departamento || '-'}`
                          : '-'
                      }
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>

                  <D365FormField label="Referencia de Ubicación" htmlFor="dir-ref">
                    <Input
                      id="dir-ref"
                      className={formStyles.d365ControlFull}
                      value={
                        orden?.referenciaUbicacion ||
                        (clienteServicioSeleccionado as any)?.referenciaUbicacion ||
                        'Sin referencia registrada'
                      }
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>
                </div>

                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Contacto en Sitio y Geolocalización</div>

                  <D365FormField label="Contacto Responsable en Sitio">
                    <Input
                      className={formStyles.d365ControlFull}
                      value={clienteServicioSeleccionado?.nombreCompletoODenominacion || 'Pendiente de asignar'}
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>

                  <D365FormField label="Teléfono de Coordinación">
                    <Input
                      className={formStyles.d365ControlFull}
                      value={clienteServicioSeleccionado?.telefonoPrincipal || 'Sin teléfono'}
                      readOnly
                      appearance="filled-darker"
                    />
                  </D365FormField>

                  <div
                    style={{
                      marginTop: '20px',
                      padding: '16px',
                      background: tokens.colorNeutralBackground2,
                      borderRadius: '6px',
                      border: `1px solid ${tokens.colorNeutralStroke2}`,
                    }}
                  >
                    <Text weight="semibold" block style={{ fontSize: '13px', color: tokens.colorNeutralForeground1, marginBottom: '6px' }}>
                      📍 Información para Despacho y Rutas
                    </Text>
                    <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, lineHeight: '18px' }}>
                      La dirección y zona operativa son utilizadas por el motor de programación y la aplicación móvil del técnico para navegación GPS y cálculo de tiempos de traslado.
                    </Text>
                  </div>
                </div>
              </div>
            )}
            {/* ============================================================= */}
            {selectedTab === 'trabajos' && (
              <div className={formStyles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div className={formStyles.cardSectionTitle} style={{ marginBottom: '4px' }}>
                      Incidentes de la Orden de Trabajo
                    </div>
                    <Text style={{ color: tokens.colorNeutralForeground3, fontSize: '12px' }}>
                      Cada incidente define el tipo de trabajo a realizar. Los servicios técnicos, subtareas de verificación y materiales previstos se derivan automáticamente de la plantilla vinculada.
                    </Text>
                  </div>
                  <Button
                    icon={<Add16Regular />}
                    appearance="primary"
                    size="small"
                    onClick={handleAbrirDrawerNuevoTrabajo}
                  >
                    Agregar Incidente
                  </Button>
                </div>

                {trabajos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 16px', background: tokens.colorNeutralBackground2, borderRadius: '4px' }}>
                    <Wrench16Regular style={{ fontSize: '28px', color: tokens.colorNeutralForeground4, marginBottom: '8px' }} />
                    <Text block style={{ color: tokens.colorNeutralForeground3, marginBottom: '12px', fontSize: '13px' }}>
                      No hay incidentes configurados para esta orden. Toda orden debe contener al menos un incidente de trabajo.
                    </Text>
                    <Button icon={<Add16Regular />} size="small" appearance="outline" onClick={handleAbrirDrawerNuevoTrabajo}>
                      Agregar el primer incidente
                    </Button>
                  </div>
                ) : (
                  <Table size="small">
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell style={{ width: '40px' }}>#</TableHeaderCell>
                        <TableHeaderCell style={{ minWidth: '220px' }}>Tipo de Incidente</TableHeaderCell>
                        <TableHeaderCell style={{ minWidth: '240px' }}>Descripción Breve</TableHeaderCell>
                        <TableHeaderCell style={{ width: '120px', textAlign: 'center' }}>Servicios</TableHeaderCell>
                        <TableHeaderCell style={{ width: '120px', textAlign: 'center' }}>Subtareas</TableHeaderCell>
                        <TableHeaderCell style={{ width: '120px', textAlign: 'center' }}>Materiales</TableHeaderCell>
                        <TableHeaderCell style={{ width: '100px', textAlign: 'center' }}>Acciones</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trabajos.map((item, index) => {
                        const plantilla = plantillasTrabajo.find((pl) => pl.id === item.plantillaTrabajoId);
                        const cantServicios = item.servicios?.length ?? (plantilla?.productoId ? 1 : 0);
                        const cantTareas = item.totalTareas ?? (item.tareas?.length ?? plantilla?.cantidadTareas ?? 0);
                        const cantMat = item.totalMateriales ?? (item.materiales?.length ?? plantilla?.cantidadMateriales ?? 0);
                        const codPl = plantilla?.codigo || item.plantillaTrabajoCodigo;
                        const nomPl = plantilla?.nombre || item.plantillaTrabajoNombre;

                        return (
                          <TableRow
                            key={item.idTemp || index}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleAbrirDetalleIncidente(item, 'servicios')}
                          >
                            <TableCell style={{ color: tokens.colorNeutralForeground4, fontWeight: 600 }}>
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              {codPl || nomPl ? (
                                <Text weight="medium">
                                  {codPl && (
                                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: tokens.colorBrandForeground1, marginRight: 6 }}>
                                      [{codPl}]
                                    </span>
                                  )}
                                  {nomPl || 'Incidente de Trabajo'}
                                </Text>
                              ) : (
                                <Text style={{ color: tokens.colorNeutralForeground4 }}>
                                  (Sin plantilla asociada)
                                </Text>
                              )}
                            </TableCell>
                            <TableCell>
                              <Text style={{ color: item.observaciones ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground4, fontSize: '13px' }}>
                                {item.observaciones || '(Sin descripción)'}
                              </Text>
                            </TableCell>
                            <TableCell style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="small"
                                appearance="subtle"
                                onClick={() => handleAbrirDetalleIncidente(item, 'servicios')}
                                title="Ver servicios en panel lateral"
                              >
                                <Badge appearance="tint" shape="rounded" color="brand">
                                  {cantServicios} serv.
                                </Badge>
                              </Button>
                            </TableCell>
                            <TableCell style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="small"
                                appearance="subtle"
                                onClick={() => handleAbrirDetalleIncidente(item, 'tareas')}
                                title="Ver subtareas en panel lateral"
                              >
                                <Badge appearance="tint" shape="rounded" color="subtle">
                                  {cantTareas} tareas
                                </Badge>
                              </Button>
                            </TableCell>
                            <TableCell style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="small"
                                appearance="subtle"
                                onClick={() => handleAbrirDetalleIncidente(item, 'materiales')}
                                title="Ver materiales previstos en panel lateral"
                              >
                                <Badge appearance="tint" shape="rounded" color="informative">
                                  {cantMat} mat.
                                </Badge>
                              </Button>
                            </TableCell>
                            <TableCell style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'inline-flex', gap: '4px' }}>
                                <Button
                                  icon={<Eye16Regular />}
                                  size="small"
                                  appearance="subtle"
                                  title="Ver desglose del incidente"
                                  aria-label="Ver desglose del incidente"
                                  onClick={() => handleAbrirDetalleIncidente(item, 'servicios')}
                                />
                                <Button
                                  icon={<Edit16Regular />}
                                  size="small"
                                  appearance="subtle"
                                  title="Editar descripción o plantilla"
                                  aria-label="Editar descripción o plantilla"
                                  onClick={() => handleAbrirDrawerEditarTrabajo(index)}
                                />
                                <Button
                                  icon={<Delete16Regular />}
                                  size="small"
                                  appearance="subtle"
                                  title="Eliminar incidente de la orden"
                                  aria-label="Eliminar incidente de la orden"
                                  onClick={() => void handleEliminarFilaTrabajo(index)}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {selectedTab === 'programacion' && (
              <div className={formStyles.grid2Cols}>
                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Asignación de Visita y Técnico</div>

                  <D365FormField label="Técnico de Campo (Recurso)" htmlFor="wo-recurso">
                    <Input
                      id="wo-recurso"
                      className={formStyles.d365ControlFull}
                      value={recursoTecnicoNombre}
                      onChange={(e) => setRecursoTecnicoNombre(e.target.value)}
                      placeholder="Nombre del técnico responsable..."
                    />
                  </D365FormField>

                  <D365FormField label="Fecha Programada de Atención" htmlFor="wo-fecha-prog">
                    <Input
                      id="wo-fecha-prog"
                      type="date"
                      className={formStyles.d365ControlFull}
                      value={fechaProgramada}
                      onChange={(e) => setFechaProgramada(e.target.value)}
                    />
                  </D365FormField>

                  <D365FormField label="Ventana / Bloque Horario" htmlFor="wo-bloque">
                    <Select
                      id="wo-bloque"
                      className={formStyles.d365ControlFull}
                      value={bloqueHorario}
                      onChange={(_, d) => setBloqueHorario(d.value)}
                    >
                      <option value="08:00 - 12:00">08:00 - 12:00 (Mañana)</option>
                      <option value="13:00 - 17:00">13:00 - 17:00 (Tarde)</option>
                      <option value="17:00 - 20:00">17:00 - 20:00 (Vespertino)</option>
                      <option value="JORNADA_COMPLETA">Jornada Completa</option>
                    </Select>
                  </D365FormField>
                </div>

                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Historial de Visitas en Campo</div>
                  {orden?.visitas && orden.visitas.length > 0 ? (
                    <Table size="small">
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Cita</TableHeaderCell>
                          <TableHeaderCell>Técnico</TableHeaderCell>
                          <TableHeaderCell>Fecha</TableHeaderCell>
                          <TableHeaderCell>Estado</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orden.visitas.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell>{v.codigoVisita}</TableCell>
                            <TableCell>{v.recursoNombre}</TableCell>
                            <TableCell>{v.fechaProgramada}</TableCell>
                            <TableCell>
                              <Badge appearance="tint" shape="rounded" color="brand">
                                {v.estado}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Text style={{ color: tokens.colorNeutralForeground4, fontSize: '13px' }}>
                      No se han agendado visitas técnicas aún para esta orden.
                    </Text>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: MATERIALES CONSOLIDADOS                                 */}
            {/* ============================================================= */}
            {selectedTab === 'materiales' && (
              <div className={formStyles.card}>
                <div style={{ marginBottom: '16px' }}>
                  <div className={formStyles.cardSectionTitle} style={{ marginBottom: '4px' }}>
                    Materiales y Equipos Consolidados de la Orden
                  </div>
                  <Text style={{ color: tokens.colorNeutralForeground3, fontSize: '12px' }}>
                    Resumen logístico de todos los materiales e insumos previstos y descargados en campo a través de los trabajos de esta orden de trabajo.
                  </Text>
                </div>

                {trabajos.some((t) => !t.id && t.plantillaTrabajoId) && (
                  <div style={{ marginBottom: '16px' }}>
                    <D365MessageBar intent="info">
                      Existen líneas de trabajo nuevas pendientes por guardar. Al pulsar "Guardar" en la barra de comandos se registrarán y confirmarán formalmente en el sistema.
                    </D365MessageBar>
                  </div>
                )}

                {materialesConsolidados.length > 0 ? (
                  <Table size="small">
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell style={{ width: '40px' }}>#</TableHeaderCell>
                        <TableHeaderCell style={{ width: '140px' }}>Cód. Material</TableHeaderCell>
                        <TableHeaderCell>Producto / Insumo</TableHeaderCell>
                        <TableHeaderCell style={{ width: '180px' }}>Incidente / Trabajo Origen</TableHeaderCell>
                        <TableHeaderCell style={{ width: '100px', textAlign: 'center' }}>Cant. Prevista</TableHeaderCell>
                        <TableHeaderCell style={{ width: '140px' }}>N° Serie</TableHeaderCell>
                        <TableHeaderCell style={{ width: '150px' }}>Acción Logística</TableHeaderCell>
                        <TableHeaderCell>Observaciones</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialesConsolidados.map((m, idx) => (
                        <TableRow key={m.id || idx}>
                          <TableCell style={{ color: tokens.colorNeutralForeground4, fontWeight: 600 }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>{m.productoCodigo}</Text>
                          </TableCell>
                          <TableCell>
                            <Text weight="medium">{m.productoNombre}</Text>
                          </TableCell>
                          <TableCell>
                            <Text style={{ fontFamily: 'monospace', fontSize: '12px', color: tokens.colorBrandForeground1 }}>
                              {m.trabajoOrigen}
                            </Text>
                          </TableCell>
                          <TableCell style={{ textAlign: 'center', fontWeight: 600 }}>{m.cantidad}</TableCell>
                          <TableCell>{m.numeroSerie || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              appearance="tint"
                              shape="rounded"
                              color={m.tipoAccion.includes('Retiro') ? 'danger' : 'informative'}
                            >
                              {m.tipoAccion}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Text style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                              {m.observaciones || '-'}
                            </Text>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: tokens.colorNeutralBackground2, borderRadius: '4px' }}>
                    <Text block weight="semibold" style={{ color: tokens.colorNeutralForeground1, fontSize: '14px', marginBottom: '6px' }}>
                      No hay materiales descargados todavía
                    </Text>
                    <Text block style={{ color: tokens.colorNeutralForeground3, fontSize: '13px', maxWidth: '640px', margin: '0 auto' }}>
                      Los materiales e insumos se registrarán y mostrarán en esta pestaña una vez que la orden haya sido atendida y liquidada en campo, reflejando el material descargado del inventario real.
                    </Text>
                    <Text block style={{ color: tokens.colorNeutralForeground4, fontSize: '12px', marginTop: '12px' }}>
                      ℹ Para consultar los materiales previstos según la plantilla técnica de cada trabajo, revise la pestaña <strong>"Trabajos a Realizar"</strong>.
                    </Text>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. DRAWER LATERAL QUICK CREATE (CREACIÓN/EDICIÓN DE INCIDENTE) */}
      <OverlayDrawer
        open={drawerTrabajoOpen}
        position="end"
        size="medium"
        onOpenChange={(_, { open }) => setDrawerTrabajoOpen(open)}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDrawerTrabajoOpen(false)}
              />
            }
          >
            <div>
              <Text weight="semibold" style={{ fontSize: '16px' }}>
                {trabajoEnEdicionIndex !== null ? 'Editar Incidente' : 'Agregar Incidente'}
              </Text>
              <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, fontWeight: 400, marginTop: '2px' }}>
                Seleccione el tipo de incidente y detalle la descripción breve
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 20px' }}>
          {drawerError && (
            <D365MessageBar intent="error" onDismiss={() => setDrawerError(null)}>
              {drawerError}
            </D365MessageBar>
          )}

          {/* Campo 1: Tipo de Incidente */}
          <D365FormField
            label="Tipo de Incidente"
            required
            info="Seleccione el tipo de incidente / plantilla técnica. Los servicios, tareas y materiales requeridos se cargarán automáticamente desde la plantilla."
          >
            <SelectorEntidadRelacionada
              etiquetaGrupo="Tipos de Incidente Disponibles"
              opciones={opcionesPlantillasTrabajo}
              seleccionada={plantillaSeleccionadaDrawerObj}
              textoBusqueda={drawerBusquedaPlantilla}
              alCambiarBusqueda={setDrawerBusquedaPlantilla}
              alSeleccionar={(nuevoId) => void handleDrawerSeleccionarPlantilla(nuevoId || '')}
              alCrearNuevo={() => navigate('/servicio-campo/plantillas-trabajo/nuevo')}
              alNavegar={(idPl) => navigate(`/servicio-campo/plantillas-trabajo/${idPl}`)}
              icono={<ClipboardTask24Regular />}
              tituloEnlace="Ver ficha de plantilla"
              textoVacio="No se encontraron tipos de incidente con ese nombre"
            />
          </D365FormField>

          {/* Campo 2: Descripción Breve */}
          <D365FormField label="Descripción Breve" htmlFor="drawer-obs" align="top">
            <Textarea
              id="drawer-obs"
              className={formStyles.d365ControlFull}
              rows={4}
              value={drawerObservaciones}
              onChange={(e) => setDrawerObservaciones(e.target.value)}
            />
          </D365FormField>
        </DrawerBody>

        <DrawerFooter
          style={{
            borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <Button appearance="secondary" onClick={() => setDrawerTrabajoOpen(false)}>
            Cancelar
          </Button>
          <Button appearance="primary" onClick={handleGuardarDrawerTrabajo}>
            {trabajoEnEdicionIndex !== null ? 'Guardar Cambios' : 'Agregar Incidente'}
          </Button>
        </DrawerFooter>
      </OverlayDrawer>

      {/* 6. DRAWER LATERAL DE DETALLE TÉCNICO DEL INCIDENTE (SERVICIOS, TAREAS, MATERIALES) */}
      <OverlayDrawer
        open={drawerDetalleIncidenteOpen}
        position="end"
        size="medium"
        onOpenChange={(_, { open }) => setDrawerDetalleIncidenteOpen(open)}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDrawerDetalleIncidenteOpen(false)}
              />
            }
          >
            <div>
              <Text weight="semibold" style={{ fontSize: '16px' }}>
                {incidenteSeleccionadoParaDetalle?.plantillaTrabajoCodigo
                  ? `[${incidenteSeleccionadoParaDetalle.plantillaTrabajoCodigo}] `
                  : ''}
                {incidenteSeleccionadoParaDetalle?.plantillaTrabajoNombre || 'Detalle del Incidente'}
              </Text>
              <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, fontWeight: 400, marginTop: '2px' }}>
                {incidenteSeleccionadoParaDetalle?.observaciones || 'Configuración técnica vinculada a la plantilla'}
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px' }}>
          {cargandoDetalleIncidente ? (
            <div style={{ padding: '36px', textAlign: 'center' }}>
              <Spinner label="Cargando configuración de la plantilla..." />
            </div>
          ) : (
            <>
              <TabList
                selectedValue={tabDetalleIncidente}
                onTabSelect={(_, data) => setTabDetalleIncidente(data.value as 'servicios' | 'tareas' | 'materiales')}
              >
                <Tab value="servicios">
                  Servicios ({detalleIncidenteData?.servicios?.length ?? 0})
                </Tab>
                <Tab value="tareas">
                  Subtareas Técnicas ({detalleIncidenteData?.tareas?.length ?? 0})
                </Tab>
                <Tab value="materiales">
                  Materiales Previstos ({detalleIncidenteData?.materiales?.length ?? 0})
                </Tab>
              </TabList>

              {tabDetalleIncidente === 'servicios' && (
                <div>
                  {(!detalleIncidenteData?.servicios || detalleIncidenteData.servicios.length === 0) ? (
                    <Text style={{ color: tokens.colorNeutralForeground4, fontSize: '13px' }}>
                      No hay servicios específicos asociados a esta plantilla.
                    </Text>
                  ) : (
                    <Table size="small">
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell style={{ width: '40px' }}>#</TableHeaderCell>
                          <TableHeaderCell style={{ width: '130px' }}>Código</TableHeaderCell>
                          <TableHeaderCell>Servicio Técnico</TableHeaderCell>
                          <TableHeaderCell style={{ width: '100px', textAlign: 'center' }}>Tipo</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detalleIncidenteData.servicios.map((s, idx) => (
                          <TableRow key={s.id || idx}>
                            <TableCell style={{ color: tokens.colorNeutralForeground4, fontWeight: 600 }}>{idx + 1}</TableCell>
                            <TableCell>
                              <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>{s.productoCodigo || '-'}</Text>
                            </TableCell>
                            <TableCell>
                              <Text weight="medium">{s.productoNombre}</Text>
                            </TableCell>
                            <TableCell style={{ textAlign: 'center' }}>
                              <Badge appearance="tint" color="brand">
                                {s.esPredeterminada ? 'Principal' : 'Adicional'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {tabDetalleIncidente === 'tareas' && (
                <div>
                  {(!detalleIncidenteData?.tareas || detalleIncidenteData.tareas.length === 0) ? (
                    <Text style={{ color: tokens.colorNeutralForeground4, fontSize: '13px' }}>
                      No hay tareas técnicas configuradas en esta plantilla.
                    </Text>
                  ) : (
                    <Table size="small">
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell style={{ width: '40px' }}>#</TableHeaderCell>
                          <TableHeaderCell>Subtarea / Verificación</TableHeaderCell>
                          <TableHeaderCell style={{ width: '100px', textAlign: 'center' }}>Obligatoria</TableHeaderCell>
                          <TableHeaderCell>Instrucciones</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detalleIncidenteData.tareas.map((t, idx) => (
                          <TableRow key={t.id || idx}>
                            <TableCell style={{ color: tokens.colorNeutralForeground4, fontWeight: 600 }}>{idx + 1}</TableCell>
                            <TableCell>
                              <Text weight="medium">{t.nombreTarea || t.tareaNombre}</Text>
                            </TableCell>
                            <TableCell style={{ textAlign: 'center' }}>
                              <Badge appearance="tint" color={t.esObligatoria ? 'danger' : 'subtle'}>
                                {t.esObligatoria ? 'Sí' : 'Opcional'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Text style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                                {t.observaciones || t.instrucciones || '-'}
                              </Text>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {tabDetalleIncidente === 'materiales' && (
                <div>
                  {(!detalleIncidenteData?.materiales || detalleIncidenteData.materiales.length === 0) ? (
                    <Text style={{ color: tokens.colorNeutralForeground4, fontSize: '13px' }}>
                      No hay materiales previstos configurados en esta plantilla.
                    </Text>
                  ) : (
                    <Table size="small">
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell style={{ width: '40px' }}>#</TableHeaderCell>
                          <TableHeaderCell style={{ width: '130px' }}>Código</TableHeaderCell>
                          <TableHeaderCell>Material / Insumo</TableHeaderCell>
                          <TableHeaderCell style={{ width: '100px', textAlign: 'center' }}>Cant. Prevista</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detalleIncidenteData.materiales.map((m, idx) => (
                          <TableRow key={m.id || idx}>
                            <TableCell style={{ color: tokens.colorNeutralForeground4, fontWeight: 600 }}>{idx + 1}</TableCell>
                            <TableCell>
                              <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>{m.codigoProducto || m.productoCodigo || '-'}</Text>
                            </TableCell>
                            <TableCell>
                              <Text weight="medium">{m.nombreProducto || m.productoNombre}</Text>
                            </TableCell>
                            <TableCell style={{ textAlign: 'center', fontWeight: 600 }}>
                              {m.cantidad || m.cantidadPrevista}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </>
          )}
        </DrawerBody>

        <DrawerFooter
          style={{
            borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button appearance="secondary" onClick={() => setDrawerDetalleIncidenteOpen(false)}>
            Cerrar
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
    </div>
  );
};
