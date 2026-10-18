import { D365FormContent } from '../../../../components/common/D365FormContent';
import { useValidationFocus } from '../../../../hooks/useValidationFocus';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { confirmAction } from '../../../../services/uiFeedback';
import { useAuthSession } from '../../../../services/authSession';
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
  createTableColumn,
  type TableColumnDefinition,
  Card,
  Skeleton,
  SkeletonItem,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
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
  Person16Regular,
  Edit16Regular,
  Dismiss24Regular,
  Print16Regular,
  Box20Regular,
  Prohibited16Regular,
  MoreHorizontal20Regular,
} from '@fluentui/react-icons';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { SelectorEntidadRelacionada, type OpcionEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { D365SubGrid } from '../../../../components/common/D365SubGrid';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { D365StatusField } from '../../../../components/common/D365StatusField';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { WorkOrderEtapas } from '../components/WorkOrderEtapas';
import { OrdenTrabajoService } from '../services/ordenTrabajo.service';
import { ClienteService } from '../../../crm/clientes/services/cliente.service';
import { ProductoService } from '../../../inventario/productos/services/producto.service';
import type { ProductoDto } from '../../../inventario/productos/types/producto.types';
import { ConfiguracionServicioService } from '../../configuraciones-servicio/services/configuracionServicio.service';
import type {
  ConfiguracionServicioListadoDto,
  ConfiguracionServicioDetalleDto,
  ConfiguracionTareaItemDto,
  ConfiguracionMaterialItemDto,
} from '../../configuraciones-servicio/types/configuracionServicio.types';
import type { ClienteListadoItemDto } from '../../../crm/clientes/types/cliente.types';
import { ListaPreciosService } from '../../../inventario/listas-precios/services/listaPrecios.service';
import type { DetalleListaPreciosDto } from '../../../inventario/listas-precios/types/listaPrecios.types';
import { OrganizacionService } from '../../../organizacion/services/organizacion.service';
import type { RecursoDto, TerritorioDto, UnidadOrganizativaDto } from '../../../organizacion/types/organizacion.types';
import type {
  OrdenTrabajoDetalleDto,
  CrearOrdenTrabajoDto,
  ActualizarOrdenTrabajoDto,
  EstadoSistema,
  TipoOrdenTrabajoOpcion,
  OrdenTrabajoTareaDto,
  OrdenTrabajoMaterialDto,
  OrdenTrabajoVisitaDto,
  MotivoIncidenciaDto,
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
  referenciaEquipo?: string;
  productoNombre?: string;
  idTemp: string;
  id?: string;
  codigoTrabajo?: string;
  codigoExterno: string;
  productoId: string;
  configuracionServicioId?: string;
  configuracionServicioCodigo?: string;
  configuracionServicioNombre?: string;
  tarifaBase: number;
  observaciones: string;
  totalTareas?: number;
  totalMateriales?: number;
  estado?: string;
  servicios?: DrawerServicioItem[];
  tareas?: (OrdenTrabajoTareaDto | ConfiguracionTareaItemDto)[];
  materiales?: (OrdenTrabajoMaterialDto | ConfiguracionMaterialItemDto)[];
}

export interface LiquidacionConsumoDraft {
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  cantidadPrevista: number;
  cantidadUtilizada: number;
  esSerializado: boolean;
  numeroSerie: string;
  observaciones: string;
}

export interface LiquidacionRetiroDraft {
  idTemp: string;
  productoId: string;
  numeroSerie: string;
  motivo: string;
}

export const OrdenTrabajoFormPage: React.FC = () => {
  const { permisos } = useAuthSession();
  const puedeGestionar = permisos.includes('serviciocampo.ordenes.crear');
  const puedeAsignar = permisos.includes('serviciocampo.ordenes.asignar');
  const puedeCerrar = permisos.includes('serviciocampo.ordenes.cerrar');
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
  const [configuracionesServicio, setConfiguracionesServicio] = useState<ConfiguracionServicioListadoDto[]>([]);

  // Búsquedas para SelectorEntidadRelacionada (TagPicker)
  const [busquedaTipoOrden, setBusquedaTipoOrden] = useState('');
  const [busquedaClienteFact, setBusquedaClienteFact] = useState('');
  const [busquedaClienteServ, setBusquedaClienteServ] = useState('');

  // Trabajos / Trabajos de la orden
  const [trabajos, setTrabajos] = useState<TrabajoFormItem[]>([]);

  // Drawer lateral para ver / editar / crear trabajo técnico (Opción 1)
  const [drawerTrabajoOpen, setDrawerTrabajoOpen] = useState(false);
  const [trabajoEnEdicionIndex, setTrabajoEnEdicionIndex] = useState<number | null>(null);
  const [drawerServicios, setDrawerServicios] = useState<DrawerServicioItem[]>([]);
  const [drawerCodigoExterno, setDrawerCodigoExterno] = useState('');
  const [drawerProductoId, setDrawerProductoId] = useState('');
    const [drawerPlantillaId, setDrawerPlantillaId] = useState('');
  const [drawerPlantillaDetalle, setDrawerPlantillaDetalle] = useState<ConfiguracionServicioDetalleDto | null>(null);
    const [drawerTarifaBase, setDrawerTarifaBase] = useState(0);
  const [drawerObservaciones, setDrawerObservaciones] = useState('');
  const [drawerReferenciaEquipo, setDrawerReferenciaEquipo] = useState('');
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Drawer lateral de consulta/detalle técnico del trabajo (Servicios, Tareas, Materiales)
  const [drawerDetalleTrabajoOpen, setDrawerDetalleTrabajoOpen] = useState(false);
  const [trabajoSeleccionadoParaDetalle, setTrabajoSeleccionadoParaDetalle] = useState<TrabajoFormItem | null>(null);
  const [tabDetalleTrabajo, setTabDetalleTrabajo] = useState<'tareas' | 'materiales'>('tareas');
  const cargandoDetalleTrabajo = false;
  const [detalleTrabajoData, setDetalleTrabajoData] = useState<{
    tareas: any[];
    materiales: any[];
  } | null>(null);

  // Lista de Precios asociada al Tipo de Orden seleccionado
  const [listaPreciosActiva, setListaPreciosActiva] = useState<DetalleListaPreciosDto | null>(null);

  // Campos de la Orden
  const [orden, setOrden] = useState<OrdenTrabajoDetalleDto | null>(null);
  const [codigoWo, setCodigoWo] = useState('');
  const [tipoOrdenId, setTipoOrdenId] = useState('');
  const [listaPreciosId, setListaPreciosId] = useState('');
  const [listasPrecios, setListasPrecios] = useState<{id: string; nombre: string}[]>([]);
  useEffect(() => { ListaPreciosService.getListasPrecios(undefined, true).then(setListasPrecios).catch(e => setMensaje({tipo: 'error', texto: e.message})); }, []);
  const [clienteFacturacionId, setClienteFacturacionId] = useState('');
  const [clienteServicioId, setClienteServicioId] = useState('');
  const [unidadOrganizativaId, setUnidadOrganizativaId] = useState('');
  const [unidadOrganizativaNombre, setUnidadOrganizativaNombre] = useState('');
  const [unidadesOrganizativas, setUnidadesOrganizativas] = useState<UnidadOrganizativaDto[]>([]);
  const [zonaOperativaId, setZonaOperativaId] = useState('');
  const [zonaOperativaNombre, setZonaOperativaNombre] = useState('');
  const [zonasOperativas, setZonasOperativas] = useState<TerritorioDto[]>([]);
  const [recursosTecnicos, setRecursosTecnicos] = useState<RecursoDto[]>([]);
  const [numeroOrden, setNumeroOrden] = useState('');
  const [referenciaExterna, setReferenciaExterna] = useState('');
  const [codigoContrato, setCodigoContrato] = useState('');
  const [numeroPedido, setNumeroPedido] = useState('');
  const [estadoSistema, setEstadoSistema] = useState<EstadoSistema>('Borrador');
  const [estadoOperativo, setEstadoOperativo] = useState('Pendiente');
  const [observaciones, setObservaciones] = useState('');

  // Bloqueo estricto de edición: si la orden está cerrada/anulada no admite cambios
  const estaCerrada =
    estadoSistema === 'Cancelado' ||
    estadoSistema === 'Completado' ||
    estadoOperativo === 'Cancelada' ||
    estadoOperativo === 'Rechazada' ||
    estadoOperativo === 'Finalizada' ||
    estadoOperativo === 'Liquidada';

  const esEditable = !estaCerrada && puedeGestionar;

  // Drawer para Cancelar Orden de Trabajo con motivo estructurado
  const [drawerCancelarOrdenOpen, setDrawerCancelarOrdenOpen] = useState(false);
  const [motivoCancelarOrden, setMotivoCancelarOrden] = useState('ORD-CAN-01');
  const [obsCancelarOrden, setObsCancelarOrden] = useState('');

  // Programación y Despacho
  const [recursoTecnicoId, setRecursoTecnicoId] = useState('');
  const [recursoTecnicoNombre, setRecursoTecnicoNombre] = useState('');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [bloqueHorario, setBloqueHorario] = useState('09:00 - 13:00');

  // Estados para Reprogramar y Cancelar Visita
  const [visitaSeleccionada, setVisitaSeleccionada] = useState<OrdenTrabajoVisitaDto | null>(null);
  const [drawerReprogramarOpen, setDrawerReprogramarOpen] = useState(false);
  const [drawerCancelarVisitaOpen, setDrawerCancelarVisitaOpen] = useState(false);
  const [reprogramarFecha, setReprogramarFecha] = useState('');
  const [reprogramarBloque, setReprogramarBloque] = useState('08:00 - 12:00');
  const [reprogramarMotivo, setReprogramarMotivo] = useState('CLIENTE_SOLICITA_CAMBIO');
  const [reprogramarObservaciones, setReprogramarObservaciones] = useState('');
  const [cancelarMotivo, setCancelarMotivo] = useState('CLIENTE_DESISTE');
  const [cancelarObservaciones, setCancelarObservaciones] = useState('');

  // Estados para Cambiar Estado de Trabajo (Cancelar / Rechazar)
  const [motivosIncidenciaCatalogo, setMotivosIncidenciaCatalogo] = useState<MotivoIncidenciaDto[]>([]);
  const [drawerEstadoTrabajoOpen, setDrawerEstadoTrabajoOpen] = useState(false);
  const [trabajosParaEstado, setTrabajosParaEstado] = useState<TrabajoFormItem[]>([]);
  const [accionEstadoTrabajo, setAccionEstadoTrabajo] = useState<'cancelar' | 'rechazar'>('cancelar');
  const [motivoEstadoTrabajo, setMotivoEstadoTrabajo] = useState('');
  const [obsEstadoTrabajo, setObsEstadoTrabajo] = useState('');

  // Motivos filtrados dinámicamente según el catálogo configurado en el sistema
  const motivosDisponibles = useMemo(() => {
    if (!motivosIncidenciaCatalogo || motivosIncidenciaCatalogo.length === 0) {
      return accionEstadoTrabajo === 'cancelar'
        ? [
            { id: '1', codigo: 'ORD-CAN-01', nombre: 'Cliente desiste del servicio / contrato' },
            { id: '2', codigo: 'ORD-CAN-02', nombre: 'Desestimado por coordinación / duplicado' },
            { id: '3', codigo: 'ORD-CAN-03', nombre: 'No requerido en sitio tras evaluación' },
            { id: '4', codigo: 'OTRO', nombre: 'Otro motivo de cancelación' },
          ]
        : [
            { id: '5', codigo: 'ORD-RECH-01', nombre: 'Inviabilidad técnica o estructural en el predio' },
            { id: '6', codigo: 'ORD-RECH-02', nombre: 'Cliente no autoriza perforación / ruta de cableado' },
            { id: '7', codigo: 'ORD-RECH-03', nombre: 'Falta de facilidades o acceso denegado' },
            { id: '8', codigo: 'ORD-RECH-04', nombre: 'Riesgo de seguridad / Trabajo en altura no apto' },
            { id: '9', codigo: 'OTRO', nombre: 'Otro motivo de rechazo' },
          ];
    }

    const filtrados = motivosIncidenciaCatalogo.filter((m) => {
      const matchAmbito = !m.ambito || m.ambito === 'OrdenTrabajo' || m.ambito === 'Visita';
      if (!matchAmbito) return false;
      if (accionEstadoTrabajo === 'cancelar') {
        return m.codigo.includes('CAN') || m.nombre.toLowerCase().includes('cancel') || m.nombre.toLowerCase().includes('desist');
      }
      return m.codigo.includes('RECH') || m.nombre.toLowerCase().includes('rechaz') || m.nombre.toLowerCase().includes('inviab') || m.nombre.toLowerCase().includes('seguridad') || m.nombre.toLowerCase().includes('facilidades');
    });

    return filtrados.length > 0 ? filtrados : motivosIncidenciaCatalogo;
  }, [motivosIncidenciaCatalogo, accionEstadoTrabajo]);

  // Motivos específicos para cancelación de la Orden de Trabajo completa
  const motivosCancelacionOrden = useMemo(() => {
    if (!motivosIncidenciaCatalogo || motivosIncidenciaCatalogo.length === 0) {
      return [
        { id: '1', codigo: 'ORD-CAN-01', nombre: 'Cliente desiste del servicio / contrato' },
        { id: '2', codigo: 'ORD-CAN-02', nombre: 'Desestimado por coordinación / duplicado' },
        { id: '3', codigo: 'ORD-CAN-03', nombre: 'No requerido en sitio tras evaluación' },
        { id: '4', codigo: 'OTRO', nombre: 'Otro motivo de cancelación' },
      ];
    }
    const filtrados = motivosIncidenciaCatalogo.filter((m) => {
      const matchAmbito = !m.ambito || m.ambito === 'OrdenTrabajo';
      if (!matchAmbito) return false;
      return m.codigo.includes('CAN') || m.nombre.toLowerCase().includes('cancel') || m.nombre.toLowerCase().includes('desist');
    });
    return filtrados.length > 0 ? filtrados : motivosIncidenciaCatalogo;
  }, [motivosIncidenciaCatalogo]);

  // Selección en la cuadrícula de Trabajos (checkboxes múltiples)
  const [selectedTrabajoIds, setSelectedTrabajoIds] = useState<string[]>([]);
  const trabajosActivosSeleccionados = useMemo(() => {
    if (selectedTrabajoIds.length === 0) return [];
    const setIds = new Set(selectedTrabajoIds);
    return trabajos.filter(
      (t) => setIds.has(t.idTemp || t.id || '') && Boolean(t.id) && (t.estado === 'Pendiente' || t.estado === 'EnProgreso')
    );
  }, [selectedTrabajoIds, trabajos]);

  // Territorios filtrados estrictamente por la Sede (Unidad Organizativa) seleccionada
  const zonasOperativasFiltradas = useMemo(() => {
    if (!unidadOrganizativaId) return zonasOperativas;
    return zonasOperativas.filter((z) => z.unidadOrganizativaId === unidadOrganizativaId);
  }, [zonasOperativas, unidadOrganizativaId]);

  // Técnicos y cuadrillas filtrados estrictamente por la Sede (Unidad Organizativa) seleccionada
  const recursosTecnicosFiltrados = useMemo(() => {
    if (!unidadOrganizativaId) return [];
    return recursosTecnicos.filter((r) => r.unidadOrganizativaId === unidadOrganizativaId);
  }, [recursosTecnicos, unidadOrganizativaId]);

  // Estados para Liquidación de Materiales
  const [drawerLiquidacionOpen, setDrawerLiquidacionOpen] = useState(false);
  const [draftConsumos, setDraftConsumos] = useState<LiquidacionConsumoDraft[]>([]);
  const [draftRetiros, setDraftRetiros] = useState<LiquidacionRetiroDraft[]>([]);
  const [obsLiquidacion, setObsLiquidacion] = useState('');

  // Encabezado estático durante edición (solo cambia al cargar o al guardar)
  const [savedTitle, setSavedTitle] = useState(esNuevo ? 'Nuevo' : '');
  const [savedSubtitle, setSavedSubtitle] = useState(esNuevo ? 'Ficha de orden de trabajo' : '');
  const focusValidation = useValidationFocus();
  const draft = useUnsavedChanges({ tipoOrdenId,listaPreciosId,clienteFacturacionId,clienteServicioId,unidadOrganizativaId,zonaOperativaId,numeroOrden,referenciaExterna,codigoContrato,numeroPedido,observaciones,recursoTecnicoId,fechaProgramada,bloqueHorario,trabajos: trabajos.map(t => ({productoId:t.productoId,configuracionServicioId:t.configuracionServicioId,codigoExterno:t.codigoExterno,referenciaEquipo:t.referenciaEquipo,observaciones:t.observaciones})) }, !loading);


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
        const [tipos, clientesFact, clientesServ, todosClientes, prods, plants, motivos, territorios, recursos, sedes] = await Promise.all([
          OrdenTrabajoService.obtenerTiposOrden(),
          ClienteService.obtenerClientes({ soloFacturacion: true }),
          ClienteService.obtenerClientes({ soloServicio: true }),
          ClienteService.obtenerClientes({ soloActivos: true }),
          ProductoService.getProductos(undefined, undefined, true),
          ConfiguracionServicioService.getPlantillas({ soloActivos: true }),
          OrdenTrabajoService.obtenerMotivosIncidencia().catch(() => []),
          OrganizacionService.getTerritorios(undefined, true).catch(() => []),
          OrganizacionService.getRecursos(undefined, undefined, true).catch(() => []),
          OrganizacionService.getUnidadesOrganizativas(true).catch(() => []),
        ]);

        setTiposOrden(tipos);
        // Si no existen con el flag exclusivo, permitir seleccionar entre todos los clientes activos
        setClientesFacturacion(clientesFact.length > 0 ? clientesFact : todosClientes);
        setClientesServicio(clientesServ.length > 0 ? clientesServ : todosClientes);
        setProductosServicios(prods);
        setConfiguracionesServicio(plants);
        setMotivosIncidenciaCatalogo(motivos || []);
        setZonasOperativas(territorios || []);
        setRecursosTecnicos((recursos || []).filter((r) => r.tipo === 1 || r.tipo === 2 || !r.tipo));
        setUnidadesOrganizativas(sedes || []);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    };

    void cargarCatalogos();
  }, [esNuevo]);

  // Cargar Orden Existente
  const cargarOrden = useCallback(async () => {
    if (!id || esNuevo) return;

    try {
      setLoading(true);
      const data = await OrdenTrabajoService.obtenerOrdenPorId(id);
      setOrden(data);
      setSavedTitle(data.codigoWo || 'Orden de Trabajo');
      setSavedSubtitle(`${data.tipoOrdenNombre || 'Servicio'} — ${data.clienteServicioNombre || ''}`);
      setCodigoWo(data.codigoWo);
      setTipoOrdenId(data.tipoOrdenId);
      setListaPreciosId(data.listaPreciosId || '');
      setClienteFacturacionId(data.clienteFacturacionId);
      setClienteServicioId(data.clienteServicioId);
      setUnidadOrganizativaId(data.unidadOrganizativaId || '');
      setUnidadOrganizativaNombre(data.unidadOrganizativaNombre || '');
      setZonaOperativaId(data.zonaOperativaId || '');
      setZonaOperativaNombre(data.zonaOperativaNombre || '');
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
            productoNombre: t.productoNombre,
            referenciaEquipo: t.referenciaEquipo || '',
            codigoExterno: t.codigoExterno || '',
            productoId: t.productoId,
            configuracionServicioId: t.configuracionServicioId || '',
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
  }, [id, esNuevo]);

  useEffect(() => {
    void cargarOrden();
  }, [cargarOrden]);

  // Cargar Lista de Precios asociada al Tipo de Orden seleccionado
  useEffect(() => {
    if (esNuevo) setListaPreciosId(tiposOrden.find(t => t.id === tipoOrdenId)?.listaPreciosId || '');
  }, [tipoOrdenId, tiposOrden, esNuevo]);
  useEffect(() => {
    let vigente = true;
    setListaPreciosActiva(null);
    if (listaPreciosId) ListaPreciosService.getListaPreciosById(listaPreciosId).then(lista => {
      if (vigente) setListaPreciosActiva(lista);
    }).catch(e => { if (vigente) setMensaje({tipo: 'error', texto: e.message}); });
    return () => { vigente = false; };
  }, [listaPreciosId]);

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

    
  const resolverTarifa = useCallback((prodId: string): {tarifa: number; origen: string} => {
    const elemento = listaPreciosActiva?.elementos.find(e => e.productoId === prodId);
    return elemento ? {tarifa: elemento.monto, origen: `Lista: ${listaPreciosActiva!.nombre}`} : {tarifa: 0, origen: 'Sin precio configurado'};
  }, [listaPreciosActiva]);

  // Manejadores del Drawer de Trabajos
  
  // Cargar detalle completo de plantilla (para visualizar tareas y materiales en el Drawer)
  const cargarDetallePlantilla = useCallback(async (plantillaId: string): Promise<ConfiguracionServicioDetalleDto | null> => {
    if (!plantillaId) {
      setDrawerPlantillaDetalle(null);
      return null;
    }
    try {
      const det = await ConfiguracionServicioService.getPlantillaById(plantillaId);
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

  const handleSeleccionarServicio = async (productoId: string) => {
    setDrawerProductoId(productoId); setDrawerPlantillaDetalle(null); setDrawerServicios([]);
    const producto = productosServicios.find(p => p.id === productoId);
    const configuracion = configuracionesServicio.find(p => p.productoId === productoId && p.activo);
    setDrawerPlantillaId(configuracion?.id || '');
    const {tarifa} = resolverTarifa(productoId); setDrawerTarifaBase(tarifa);
    if (producto) setDrawerServicios([{id: producto.id, productoId, productoNombre: producto.nombre, productoCodigo: producto.codigo, tarifa, esPredeterminada: true}]);
    if (configuracion) await cargarDetallePlantilla(configuracion.id);
  };

  const handleAbrirDetalleTrabajo = async (
    item: TrabajoFormItem,
    tabInicial: 'tareas' | 'materiales' = 'tareas'
  ) => {
    setTrabajoSeleccionadoParaDetalle(item);
    setTabDetalleTrabajo(tabInicial);
    setDrawerDetalleTrabajoOpen(true);

    setDetalleTrabajoData({ tareas: item.tareas || [], materiales: item.materiales || [] });
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
    setDrawerReferenciaEquipo('');
    setDrawerError(null);
    setDrawerTrabajoOpen(true);
  };

  const handleAbrirDrawerEditarTrabajo = async (idx: number) => {
    const item = trabajos[idx];
    setTrabajoEnEdicionIndex(idx);
        setDrawerCodigoExterno(item.codigoExterno || '');
    setDrawerProductoId(item.productoId || '');
        setDrawerPlantillaId(item.configuracionServicioId || '');
    setDrawerTarifaBase(item.tarifaBase || 0);
    setDrawerObservaciones(item.observaciones || '');
    setDrawerReferenciaEquipo(item.referenciaEquipo || '');
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

    if (!item.id && item.configuracionServicioId) {
      await cargarDetallePlantilla(item.configuracionServicioId);
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
      const pl = configuracionesServicio.find((p) => p.id === drawerPlantillaId);
      if (pl?.productoId) {
        prodId = pl.productoId;
      }
    }

    if (!prodId) {
      setDrawerError('Debe seleccionar una plantilla o agregar al menos un servicio técnico en la pestaña "Servicios".');
      return;
    }

    if (!trabajos[trabajoEnEdicionIndex ?? -1]?.id && !listaPreciosActiva?.elementos.some(e => e.productoId === prodId)) {
      setDrawerError('Configure el precio del servicio en la lista seleccionada antes de agregar el trabajo.'); return;
    }
    const pl = drawerPlantillaId ? configuracionesServicio.find((p) => p.id === drawerPlantillaId) : undefined;
    const tareasEstimadas = drawerPlantillaDetalle?.tareas.length ?? pl?.cantidadTareas ?? 0;
    const materialesEstimados = drawerPlantillaDetalle?.materiales.length ?? pl?.cantidadMateriales ?? 0;

    const trabajoExistente = trabajoEnEdicionIndex !== null ? trabajos[trabajoEnEdicionIndex] : null;

    // Sincronizar tareas y materiales previstos
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
          configuracionServicioId: drawerPlantillaId || undefined,
          configuracionServicioCodigo: pl?.codigo || copia[trabajoEnEdicionIndex].configuracionServicioCodigo,
          configuracionServicioNombre: pl?.nombre || copia[trabajoEnEdicionIndex].configuracionServicioNombre,
          tarifaBase: drawerTarifaBase,
          observaciones: drawerObservaciones.trim(),
          referenciaEquipo: drawerReferenciaEquipo.trim(),
          productoNombre: productosServicios.find(p => p.id === prodId)?.nombre,
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
        configuracionServicioId: drawerPlantillaId || undefined,
        configuracionServicioCodigo: pl?.codigo,
        configuracionServicioNombre: pl?.nombre,
        tarifaBase: drawerTarifaBase,
        observaciones: drawerObservaciones.trim(),
          referenciaEquipo: drawerReferenciaEquipo.trim(),
          productoNombre: productosServicios.find(p => p.id === prodId)?.nombre,
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

  // Materiales Consolidados Realmente Liquidados de la Orden (Pestaña "Materiales")
  const materialesConsolidados = useMemo(() => {
    // Solo mostrar materiales cuando realmente existan registros liquidados en la orden
    if (orden?.materiales && orden.materiales.length > 0) {
      const liquidados = orden.materiales.filter((m) => (m.cantidadUtilizada ?? 0) > 0 || m.tipoAccion === 'Retiro');
      if (liquidados.length > 0) {
        return liquidados.map((m) => ({
          id: m.id,
          productoId: m.productoId,
          productoCodigo: m.codigoProducto || '-',
          productoNombre: m.nombreProducto,
          trabajoOrigen: m.trabajoCodigo || 'Orden principal',
          cantidad: m.cantidad,
          cantidadPrevista: m.cantidadPrevista ?? m.cantidad,
          cantidadUtilizada: m.cantidadUtilizada,
          tipoAccion: m.tipoAccion || 'Instalación',
          numeroSerie: m.numeroSerie || '-',
          observaciones: m.observaciones || '',
        }));
      }
    }
    // No copiar sugeridos/previstos a esta tabla (los previstos se gestionan en la pestaña Trabajos)
    return [];
  }, [orden?.materiales]);

  // Handlers Cancelar y Rechazar Trabajo (Individual o Múltiple)
  const handleAbrirEstadoTrabajo = (items: TrabajoFormItem | TrabajoFormItem[], accion: 'cancelar' | 'rechazar') => {
    const arr = Array.isArray(items) ? items : [items];
    if (arr.length === 0) return;
    setTrabajosParaEstado(arr);
    setAccionEstadoTrabajo(accion);
    setObsEstadoTrabajo('');
    setDrawerEstadoTrabajoOpen(true);
  };

  useEffect(() => {
    if (drawerEstadoTrabajoOpen && motivosDisponibles.length > 0) {
      if (!motivoEstadoTrabajo || !motivosDisponibles.some((m) => m.codigo === motivoEstadoTrabajo)) {
        setMotivoEstadoTrabajo(motivosDisponibles[0].codigo);
      }
    }
  }, [drawerEstadoTrabajoOpen, accionEstadoTrabajo, motivosDisponibles, motivoEstadoTrabajo]);

  const handleConfirmarEstadoTrabajo = async () => {
    if (!id || trabajosParaEstado.length === 0) return;
    const idsValidos = trabajosParaEstado.map((t) => t.id).filter(Boolean) as string[];
    if (idsValidos.length === 0) return;

    try {
      setSubmitting(true);
      const detalleMotivo = obsEstadoTrabajo.trim()
        ? `[${motivoEstadoTrabajo}] ${obsEstadoTrabajo.trim()}`
        : motivoEstadoTrabajo;

      if (accionEstadoTrabajo === 'cancelar') {
        await OrdenTrabajoService.cancelarTrabajosBatch(id, idsValidos, detalleMotivo);
        notifySuccess(
          idsValidos.length === 1
            ? `Trabajo ${trabajosParaEstado[0].codigoTrabajo || ''} cancelado.`
            : `${idsValidos.length} trabajos cancelados.`
        );
      } else {
        await OrdenTrabajoService.rechazarTrabajosBatch(id, idsValidos, detalleMotivo);
        notifySuccess(
          idsValidos.length === 1
            ? `Trabajo ${trabajosParaEstado[0].codigoTrabajo || ''} rechazado.`
            : `${idsValidos.length} trabajos rechazados.`
        );
      }

      setSelectedTrabajoIds([]);
      setTrabajosParaEstado([]);
      setDrawerEstadoTrabajoOpen(false);
      await cargarOrden();
    } catch (err: any) {
      dispatchToast(
        <Toast><ToastTitle>Error al cambiar estado: {err?.message || 'Error desconocido'}</ToastTitle></Toast>,
        { intent: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columnasTrabajos: TableColumnDefinition<TrabajoFormItem>[] = useMemo(
    () => [
      createTableColumn<TrabajoFormItem>({
        columnId: 'index',
        renderHeaderCell: () => '#',
        renderCell: (item) => {
          const idx = trabajos.indexOf(item);
          return <span style={{ color: tokens.colorNeutralForeground4, fontWeight: 600 }}>{idx + 1}</span>;
        },
      }),
      createTableColumn<TrabajoFormItem>({
        columnId: 'codigoTrabajo',
        renderHeaderCell: () => 'Código',
        renderCell: (item) => (
          <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: item.codigoTrabajo ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground4 }}>
            {item.codigoTrabajo || '(Al guardar)'}
          </span>
        ),
      }),
      createTableColumn<TrabajoFormItem>({
        columnId: 'codigoExterno',
        renderHeaderCell: () => 'Cód. Externo',
        renderCell: (item) => (
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: item.codigoExterno ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground4 }}>
            {item.codigoExterno || '—'}
          </span>
        ),
      }),
      createTableColumn<TrabajoFormItem>({
        columnId: 'tipoTrabajo',
        renderHeaderCell: () => 'Servicio',
        renderCell: (item) => {
          const producto = productosServicios.find((p) => p.id === item.productoId);
          return (
            <div>
              <Text weight="medium">{item.productoNombre || producto?.nombre || 'Servicio'}</Text>
              {item.referenciaEquipo ? (
                <Text block size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Ref: {item.referenciaEquipo}
                </Text>
              ) : null}
            </div>
          );
        },
      }),
      createTableColumn<TrabajoFormItem>({
        columnId: 'descripcion',
        renderHeaderCell: () => 'Descripción Breve',
        renderCell: (item) => (
          <Text style={{ color: item.observaciones ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground4, fontSize: '13px' }}>
            {item.observaciones || '(Sin descripción)'}
          </Text>
        ),
      }),
      createTableColumn<TrabajoFormItem>({
        columnId: 'tareas',
        renderHeaderCell: () => 'Tareas',
        renderCell: (item) => {
          const plantilla = configuracionesServicio.find((pl) => pl.id === item.configuracionServicioId);
          const cantTareas = item.totalTareas ?? (item.tareas?.length ?? plantilla?.cantidadTareas ?? 0);
          return (
            <div style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <Button
                appearance="subtle"
                size="small"
                onClick={() => handleAbrirDetalleTrabajo(item, 'tareas')}
              >
                <Badge appearance="tint" color="informative">{cantTareas}</Badge>
              </Button>
            </div>
          );
        },
      }),
      createTableColumn<TrabajoFormItem>({
        columnId: 'materiales',
        renderHeaderCell: () => 'Materiales Previstos',
        renderCell: (item) => {
          const plantilla = configuracionesServicio.find((pl) => pl.id === item.configuracionServicioId);
          const cantMat = item.totalMateriales ?? (item.materiales?.length ?? plantilla?.cantidadMateriales ?? 0);
          return (
            <div style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <Button
                appearance="subtle"
                size="small"
                onClick={() => handleAbrirDetalleTrabajo(item, 'materiales')}
              >
                <Badge appearance="tint" color="warning">{cantMat}</Badge>
              </Button>
            </div>
          );
        },
      }),
      createTableColumn<TrabajoFormItem>({
        columnId: 'estado',
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <D365StatusBadge
            status={item.estado || (item.id ? 'Pendiente' : 'Borrador')}
            size="small"
          />
        ),
      }),
      createTableColumn<TrabajoFormItem>({
        columnId: 'acciones',
        renderHeaderCell: () => 'Acciones',
        renderCell: (item) => {
          const idx = trabajos.indexOf(item);
          const esCreado = Boolean(item.id);
          const estado = item.estado || 'Pendiente';
          const esActivo = estado === 'Pendiente' || estado === 'EnProgreso';

          // Si es un borrador nuevo aún no guardado en la orden, se permite editarlo o quitarlo del formulario
          if (!esCreado) {
            return (
              <div style={{ display: 'inline-flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                <Button
                  icon={<Edit16Regular />}
                  size="small"
                  appearance="subtle"
                  disabled={!esEditable}
                  title="Editar borrador antes de guardar"
                  onClick={() => handleAbrirDrawerEditarTrabajo(idx)}
                />
                <Button
                  icon={<Delete16Regular />}
                  size="small"
                  appearance="subtle"
                  disabled={!esEditable}
                  style={{ color: tokens.colorStatusDangerForeground1 }}
                  title="Quitar borrador antes de guardar"
                  onClick={() => setTrabajos((prev) => prev.filter((_, i) => i !== idx))}
                />
              </div>
            );
          }

          // Si ya fue creado en la orden: NO se permite editar ni eliminar.
          // Solo se puede cambiar de estado (Cancelar o Rechazar) si sigue activo y la orden es editable.
          if (!esActivo || !esEditable) {
            return <span style={{ color: tokens.colorNeutralForeground4 }}>—</span>;
          }

          return (
            <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
              <Menu positioning="below-end">
                <MenuTrigger disableButtonEnhancement>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<MoreHorizontal20Regular />}
                    aria-label="Más acciones del trabajo"
                    title="Más acciones"
                  />
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem
                      icon={<DismissCircle16Regular style={{ color: tokens.colorPaletteRedForeground1 }} />}
                      onClick={() => handleAbrirEstadoTrabajo(item, 'cancelar')}
                    >
                      Cancelar Trabajo
                    </MenuItem>
                    <MenuItem
                      icon={<Prohibited16Regular style={{ color: tokens.colorPaletteDarkOrangeForeground1 }} />}
                      onClick={() => handleAbrirEstadoTrabajo(item, 'rechazar')}
                    >
                      Rechazar Trabajo
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            </div>
          );
        },
      }),
    ],
    [trabajos, configuracionesServicio, handleAbrirDrawerEditarTrabajo, handleAbrirEstadoTrabajo, puedeGestionar]
  );

  // Handler Acta de Servicio PDF
  const handleDescargarActaPdf = async () => {
    if (!id || esNuevo) return;
    try {
      setSubmitting(true);
      await OrdenTrabajoService.abrirActaPdf(id);
      notifySuccess('Generando Acta de Servicio en formato PDF...');
    } catch (err: any) {
      dispatchToast(
        <Toast><ToastTitle>Error al generar acta: {err?.message || 'Error desconocido'}</ToastTitle></Toast>,
        { intent: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers Reprogramar Visita
  const handleAbrirReprogramar = (v: OrdenTrabajoVisitaDto) => {
    setVisitaSeleccionada(v);
    setReprogramarFecha(v.fechaProgramada || new Date().toISOString().slice(0, 10));
    setReprogramarBloque(v.bloqueHorario || '08:00 - 12:00');
    setReprogramarMotivo('CLIENTE_SOLICITA_CAMBIO');
    setReprogramarObservaciones('');
    setDrawerReprogramarOpen(true);
  };

  const handleConfirmarReprogramar = async () => {
    if (!id || !visitaSeleccionada) return;
    if (!reprogramarFecha) {
      dispatchToast(<Toast><ToastTitle>Ingrese la fecha de reprogramación.</ToastTitle></Toast>, { intent: 'error' });
      return;
    }
    try {
      setSubmitting(true);
      await OrdenTrabajoService.reprogramarVisita(id, visitaSeleccionada.id, {
        fechaProgramada: reprogramarFecha,
        bloqueHorario: reprogramarBloque,
        motivoId: reprogramarMotivo,
        observaciones: reprogramarObservaciones,
      });
      notifySuccess('Visita reprogramada exitosamente.');
      setDrawerReprogramarOpen(false);
      await cargarOrden();
    } catch (err: any) {
      dispatchToast(<Toast><ToastTitle>Error al reprogramar: {err?.message || 'Error'}</ToastTitle></Toast>, { intent: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers Cancelar Visita
  const handleAbrirCancelarVisita = (v: OrdenTrabajoVisitaDto) => {
    setVisitaSeleccionada(v);
    setCancelarMotivo('CLIENTE_DESISTE');
    setCancelarObservaciones('');
    setDrawerCancelarVisitaOpen(true);
  };

  const handleConfirmarCancelarVisita = async () => {
    if (!id || !visitaSeleccionada) return;
    try {
      setSubmitting(true);
      await OrdenTrabajoService.cancelarVisita(id, visitaSeleccionada.id, {
        motivoId: cancelarMotivo || 'CLIENTE_DESISTE',
        observaciones: cancelarObservaciones,
      });
      notifySuccess('Visita técnica cancelada.');
      setDrawerCancelarVisitaOpen(false);
      await cargarOrden();
    } catch (err: any) {
      dispatchToast(<Toast><ToastTitle>Error al cancelar visita: {err?.message || 'Error'}</ToastTitle></Toast>, { intent: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Estados de control de liquidación
  const estaCompleta = orden?.estado === 'Completa' || orden?.estadoSistema === 'Completado';
  const yaLiquidada = orden?.estado === 'Liquidada' || orden?.estado === 'Finalizada' || orden?.descargaMaterialesConfirmada;

  // Handlers Liquidación de Materiales
  const handleAbrirLiquidacion = () => {
    if (!estaCompleta) {
      dispatchToast(
        <Toast><ToastTitle>La liquidación de materiales solo está permitida cuando la orden esté en estado 'Completa' (trabajo de campo realizado).</ToastTitle></Toast>,
        { intent: 'warning' }
      );
      return;
    }
    if (yaLiquidada) {
      dispatchToast(
        <Toast><ToastTitle>Los materiales de esta orden ya han sido liquidados.</ToastTitle></Toast>,
        { intent: 'info' }
      );
      return;
    }

    // Cargar los materiales previstos configurados en los trabajos para que el usuario valide las cantidades consumidas reales
    const consumosIniciales: LiquidacionConsumoDraft[] = [];
    trabajos.forEach((t) => {
      if (t.materiales && t.materiales.length > 0) {
        t.materiales.forEach((m: any) => {
          const prod = productosServicios.find((p) => p.id === m.productoId);
          consumosIniciales.push({
            productoId: m.productoId,
            productoCodigo: m.codigoProducto || m.productoCodigo || prod?.codigo || 'N/A',
            productoNombre: m.nombreProducto || m.productoNombre || prod?.nombre || 'Material',
            cantidadPrevista: m.cantidad || m.cantidadPrevista || 1,
            cantidadUtilizada: m.cantidadUtilizada ?? m.cantidadPrevista ?? m.cantidad ?? 1,
            esSerializado: prod?.esSerializado ?? false,
            numeroSerie: (m.numeroSerie && m.numeroSerie !== '-') ? m.numeroSerie : '',
            observaciones: m.observaciones || '',
          });
        });
      }
    });

    setDraftConsumos(consumosIniciales);
    setDraftRetiros([]);
    setObsLiquidacion('');
    setDrawerLiquidacionOpen(true);
  };

  const handleAgregarConsumoManual = () => {
    const productosFisicos = productosServicios.filter((p) => p.tipo !== 'Servicio' && p.tipo !== 3);
    const primerProd = productosFisicos[0];
    if (!primerProd) return;
    setDraftConsumos((prev) => [
      ...prev,
      {
        productoId: primerProd.id,
        productoCodigo: primerProd.codigo,
        productoNombre: primerProd.nombre,
        cantidadPrevista: 0,
        cantidadUtilizada: 1,
        esSerializado: primerProd.esSerializado ?? false,
        numeroSerie: '',
        observaciones: 'Consumo adicional de almacén móvil',
      },
    ]);
  };

  const handleEliminarConsumo = (index: number) => {
    setDraftConsumos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCambiarProductoConsumo = (index: number, productoId: string) => {
    const prod = productosServicios.find((p) => p.id === productoId);
    if (!prod) return;
    setDraftConsumos((prev) => {
      const copia = [...prev];
      copia[index] = {
        ...copia[index],
        productoId: prod.id,
        productoCodigo: prod.codigo,
        productoNombre: prod.nombre,
        esSerializado: prod.esSerializado ?? false,
      };
      return copia;
    });
  };

  const handleAgregarRetiro = () => {
    const productosFisicos = productosServicios.filter((p) => p.tipo !== 'Servicio' && p.tipo !== 3);
    const primerProd = productosFisicos[0]?.id || '';
    setDraftRetiros((prev) => [
      ...prev,
      {
        idTemp: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        productoId: primerProd,
        numeroSerie: '',
        motivo: 'Averiado / Chatarra técnica',
      },
    ]);
  };

  const handleEliminarRetiro = (index: number) => {
    setDraftRetiros((prev) => prev.filter((_, i) => i !== index));
  };

  const handleActualizarRetiro = (index: number, campo: keyof LiquidacionRetiroDraft, valor: string) => {
    setDraftRetiros((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  const handleActualizarConsumo = (index: number, campo: 'cantidadUtilizada' | 'numeroSerie' | 'observaciones', valor: any) => {
    setDraftConsumos((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  const handleConfirmarLiquidacion = async () => {
    if (!id) return;
    for (const c of draftConsumos) {
      if (c.cantidadUtilizada > 0 && c.esSerializado && !c.numeroSerie.trim()) {
        dispatchToast(
          <Toast><ToastTitle>El material serializado "{c.productoNombre}" requiere el número de serie instalado.</ToastTitle></Toast>,
          { intent: 'error' }
        );
        return;
      }
    }
    for (const r of draftRetiros) {
      if (!r.productoId) {
        dispatchToast(<Toast><ToastTitle>Seleccione el producto para el equipo retirado.</ToastTitle></Toast>, { intent: 'error' });
        return;
      }
      if (!r.numeroSerie.trim()) {
        dispatchToast(<Toast><ToastTitle>Ingrese el número de serie del equipo retirado (obligatorio para trazabilidad).</ToastTitle></Toast>, { intent: 'error' });
        return;
      }
    }

    try {
      setSubmitting(true);
      await OrdenTrabajoService.liquidarMateriales(id, {
        observaciones: obsLiquidacion.trim() || undefined,
        consumos: draftConsumos
          .filter((c) => c.cantidadUtilizada > 0)
          .map((c) => ({
            productoId: c.productoId,
            cantidad: Number(c.cantidadUtilizada),
            numeroSerie: c.numeroSerie.trim() || undefined,
            observaciones: c.observaciones.trim() || undefined,
          })),
        retiros: draftRetiros.map((r) => ({
          productoId: r.productoId,
          numeroSerie: r.numeroSerie.trim(),
          motivo: r.motivo.trim() || undefined,
        })),
      });

      notifySuccess('Materiales liquidados y stock descontado del almacén móvil con éxito.');
      setDrawerLiquidacionOpen(false);
      await cargarOrden();
    } catch (err: any) {
      dispatchToast(
        <Toast><ToastTitle>Error en liquidación: {err?.message || 'Error desconocido'}</ToastTitle></Toast>,
        { intent: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columnasVisitas: TableColumnDefinition<OrdenTrabajoVisitaDto>[] = useMemo(
    () => [
      createTableColumn<OrdenTrabajoVisitaDto>({
        columnId: 'codigoVisita',
        renderHeaderCell: () => 'Cita',
        renderCell: (v) => <Text weight="semibold">{v.codigoVisita}</Text>,
      }),
      createTableColumn<OrdenTrabajoVisitaDto>({
        columnId: 'recurso',
        renderHeaderCell: () => 'Técnico',
        renderCell: (v) => v.recursoNombre,
      }),
      createTableColumn<OrdenTrabajoVisitaDto>({
        columnId: 'fecha',
        renderHeaderCell: () => 'Fecha',
        renderCell: (v) => v.fechaProgramada,
      }),
      createTableColumn<OrdenTrabajoVisitaDto>({
        columnId: 'bloque',
        renderHeaderCell: () => 'Bloque Horario',
        renderCell: (v) => v.bloqueHorario || '—',
      }),
      createTableColumn<OrdenTrabajoVisitaDto>({
        columnId: 'estado',
        renderHeaderCell: () => 'Estado',
        renderCell: (v) => <D365StatusBadge status={v.estado} size="small" />,
      }),
      createTableColumn<OrdenTrabajoVisitaDto>({
        columnId: 'acciones',
        renderHeaderCell: () => 'Acciones',
        renderCell: (v) => {
          const esActiva = v.estado === 'Programada' || v.estado === 'Pendiente' || v.estado === 'EnRuta';
          if (!esActiva || !puedeAsignar) return <span style={{ color: tokens.colorNeutralForeground4 }}>—</span>;
          return (
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button
                size="small"
                appearance="subtle"
                icon={<CalendarClock16Regular />}
                title="Reprogramar Visita"
                onClick={() => handleAbrirReprogramar(v)}
              >
                Reprogramar
              </Button>
              <Button
                size="small"
                appearance="subtle"
                icon={<DismissCircle16Regular />}
                style={{ color: tokens.colorPaletteRedForeground1 }}
                title="Cancelar Visita"
                onClick={() => handleAbrirCancelarVisita(v)}
              >
                Cancelar
              </Button>
            </div>
          );
        },
      }),
    ],
    [puedeAsignar]
  );

  const columnasMaterialesConsolidados: TableColumnDefinition<any>[] = useMemo(
    () => [
      createTableColumn<any>({
        columnId: 'index',
        renderHeaderCell: () => '#',
        renderCell: (item) => {
          const idx = materialesConsolidados.indexOf(item);
          return <span style={{ color: tokens.colorNeutralForeground4, fontWeight: 600 }}>{idx + 1}</span>;
        },
      }),
      createTableColumn<any>({
        columnId: 'codigo',
        renderHeaderCell: () => 'Cód. Material',
        renderCell: (m) => <span style={{ fontFamily: 'monospace' }}>{m.productoCodigo || '—'}</span>,
      }),
      createTableColumn<any>({
        columnId: 'producto',
        renderHeaderCell: () => 'Producto / Insumo',
        renderCell: (m) => <Text weight="semibold">{m.productoNombre}</Text>,
      }),
      createTableColumn<any>({
        columnId: 'trabajo',
        renderHeaderCell: () => 'Trabajo Origen',
        renderCell: (m) => m.trabajoOrigen || 'Orden principal',
      }),
      createTableColumn<any>({
        columnId: 'cantidad',
        renderHeaderCell: () => 'Cant. Prevista',
        renderCell: (m) => <span style={{ fontWeight: 600 }}>{m.cantidadPrevista ?? m.cantidad}</span>,
      }),
      createTableColumn<any>({
        columnId: 'cantidadLiquidada',
        renderHeaderCell: () => 'Cant. Consumida',
        renderCell: (m) => (
          <span
            style={{
              fontWeight: 600,
              color:
                m.cantidadUtilizada !== undefined && m.cantidadUtilizada !== null
                  ? tokens.colorPaletteGreenForeground1
                  : tokens.colorNeutralForeground4,
            }}
          >
            {m.cantidadUtilizada !== undefined && m.cantidadUtilizada !== null ? m.cantidadUtilizada : '—'}
          </span>
        ),
      }),
      createTableColumn<any>({
        columnId: 'serie',
        renderHeaderCell: () => 'N° Serie',
        renderCell: (m) => m.numeroSerie || '—',
      }),
      createTableColumn<any>({
        columnId: 'accion',
        renderHeaderCell: () => 'Acción Logística',
        renderCell: (m) => (
          <Badge appearance="tint" shape="rounded" color={m.tipoAccion === 'Retiro' ? 'danger' : 'informative'}>
            {m.tipoAccion || 'Instalación'}
          </Badge>
        ),
      }),
      createTableColumn<any>({
        columnId: 'observaciones',
        renderHeaderCell: () => 'Observaciones',
        renderCell: (m) => m.observaciones || '—',
      }),
    ],
    [materialesConsolidados]
  );

  const handleGuardar = async (cerrar = false) => {
    const savedDraft = draft.capture();
    if (!listaPreciosId) {
      setSelectedTab('resumen'); focusValidation("Lista de Precios"); setMensaje({tipo: 'error', texto: 'Seleccione una lista de precios.'}); return; }
    if (!tipoOrdenId) {
      setSelectedTab('resumen'); focusValidation("Tipo de Orden de Trabajo");
      setMensaje({ tipo: 'error', texto: 'Seleccione un tipo de orden de trabajo.' });
      return;
    }
    if (!clienteFacturacionId) {
      setSelectedTab('resumen'); focusValidation("Cliente de Facturación");
      setMensaje({ tipo: 'error', texto: 'Seleccione un cliente de facturación.' });
      return;
    }
    if (!clienteServicioId) {
      setSelectedTab('resumen'); focusValidation("Cliente Receptor (Abonado)");
      setMensaje({ tipo: 'error', texto: 'Seleccione el cliente abonado para la atención.' });
      return;
    }
    if (!unidadOrganizativaId) {
      setSelectedTab('resumen'); focusValidation("Sede / Base Operativa");
      setMensaje({ tipo: 'error', texto: 'Seleccione la sede operativa donde se atenderá la orden de trabajo.' });
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
            configuracionServicioId: t.configuracionServicioId || undefined,
            referenciaEquipo: t.referenciaEquipo,
            observaciones: t.observaciones?.trim() || undefined,
          }));

        const dto: CrearOrdenTrabajoDto = {
          tipoOrdenId,
          listaPreciosId,
          clienteFacturacionId,
          clienteServicioId,
          unidadOrganizativaId: unidadOrganizativaId || undefined,
          zonaOperativaId: zonaOperativaId || undefined,
          numeroOrden: numeroOrden.trim() || undefined,
          referenciaExterna: referenciaExterna.trim() || undefined,
          codigoContrato: codigoContrato.trim() || undefined,
          numeroPedido: numeroPedido.trim() || undefined,
          recursoTecnicoId: puedeAsignar ? recursoTecnicoId || undefined : undefined,
          fechaProgramada: puedeAsignar ? fechaProgramada || undefined : undefined,
          bloqueHorario: puedeAsignar ? bloqueHorario || undefined : undefined,
          observaciones: observaciones.trim() || undefined,
          trabajos: trabajosValidos.length > 0 ? trabajosValidos : undefined,
        };

        const res = await OrdenTrabajoService.crearOrden(dto);
        const tipoNombre = tiposOrden.find((t) => t.id === tipoOrdenId)?.nombre || 'Servicio';
        const clienteNombre = clientesServicio.find((c) => c.id === clienteServicioId)?.nombreCompletoODenominacion || '';
        setSavedTitle(res.codigoWo || 'Orden de Trabajo');
        setSavedSubtitle(`${tipoNombre} — ${clienteNombre}`);
        draft.markSaved(savedDraft);
        notifySuccess('Orden de Trabajo registrada exitosamente.');
        if (cerrar) {
          draft.markSaved(savedDraft);
          navigate('/servicio-campo/ordenes');
        } else {
          draft.markSaved(savedDraft);
          navigate(`/servicio-campo/ordenes/${res.id}`, { replace: true });
        }
      } else {
        const dto: ActualizarOrdenTrabajoDto = {
          unidadOrganizativaId: unidadOrganizativaId || undefined,
          zonaOperativaId: zonaOperativaId || undefined,
          recursoTecnicoId: puedeAsignar ? recursoTecnicoId || undefined : undefined,
          fechaProgramada: puedeAsignar ? fechaProgramada || undefined : undefined,
          bloqueHorario: puedeAsignar ? bloqueHorario || undefined : undefined,
          observaciones: observaciones.trim() || undefined,
        };

        await OrdenTrabajoService.actualizarOrden(id, dto);

        for (const t of trabajos.filter(t => t.id)) {
          const original = orden?.trabajos?.find(x => x.id === t.id);
          if (original && ((original.referenciaEquipo || '') !== (t.referenciaEquipo || '') || (original.observaciones || '') !== t.observaciones || (original.codigoExterno || '') !== (t.codigoExterno || '')))
            await OrdenTrabajoService.actualizarTrabajo(id, t.id!, {referenciaEquipo: t.referenciaEquipo, observaciones: t.observaciones, codigoExterno: t.codigoExterno});
        }
        // Guardar trabajos pendientes por agregar
        const trabajosNuevos = trabajos.filter((t) => !t.id && Boolean(t.productoId));
        for (const t of trabajosNuevos) {
          const creado = await OrdenTrabajoService.agregarTrabajo(id, {
            codigoExterno: t.codigoExterno?.trim() || undefined,
            productoId: t.productoId,
            configuracionServicioId: t.configuracionServicioId || undefined,
            referenciaEquipo: t.referenciaEquipo,
            observaciones: t.observaciones?.trim() || undefined,
          });
          setTrabajos(prev => prev.map(x => x.idTemp === t.idTemp ? {...x, id: creado.id, codigoTrabajo: creado.codigoTrabajo} : x));
        }

        const tipoNombre = tiposOrden.find((t) => t.id === tipoOrdenId)?.nombre || 'Servicio';
        const clienteNombre = clientesServicio.find((c) => c.id === clienteServicioId)?.nombreCompletoODenominacion || '';
        setSavedTitle(codigoWo || 'Orden de Trabajo');
        setSavedSubtitle(`${tipoNombre} — ${clienteNombre}`);
        draft.markSaved(savedDraft);
        notifySuccess('Orden de Trabajo actualizada con éxito.');
        if (cerrar) {
          draft.markSaved(savedDraft);
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
                productoNombre: t.productoNombre, referenciaEquipo: t.referenciaEquipo || '',
                codigoExterno: t.codigoExterno || '',
                productoId: t.productoId,
                configuracionServicioId: t.configuracionServicioId || '',
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
      setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error al guardar la orden de trabajo.' });
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
        recursoTecnicoId: puedeAsignar ? recursoTecnicoId || undefined : undefined,
        fechaProgramada: puedeAsignar ? fechaProgramada || undefined : undefined,
        bloqueHorario: puedeAsignar ? bloqueHorario || undefined : undefined,
      });
      setEstadoSistema(nuevoEstado);
      notifySuccess(`Estado cambiado a: ${nuevoEstado}`);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'Error al cambiar de estado.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbrirCancelarOrden = () => {
    const primerMotivo = motivosCancelacionOrden[0]?.codigo || 'ORD-CAN-01';
    setMotivoCancelarOrden(primerMotivo);
    setObsCancelarOrden('');
    setDrawerCancelarOrdenOpen(true);
  };

  const handleConfirmarCancelarOrden = async () => {
    if (!id || esNuevo) return;
    try {
      setSubmitting(true);
      const detalle = obsCancelarOrden.trim()
        ? `[${motivoCancelarOrden}] ${obsCancelarOrden.trim()}`
        : motivoCancelarOrden;

      await OrdenTrabajoService.cambiarEstadoSistema(id, {
        nuevoEstadoSistema: 'Cancelado',
        observaciones: detalle,
      });

      setDrawerCancelarOrdenOpen(false);
      notifySuccess('Orden de trabajo cancelada correctamente.');
      await cargarOrden();
    } catch (err: any) {
      dispatchToast(
        <Toast><ToastTitle>Error al cancelar la orden: {err?.message || 'Error desconocido'}</ToastTitle></Toast>,
        { intent: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async () => {
    if (!id || esNuevo) return;
    if (!await confirmAction('¿Está seguro de eliminar esta orden de trabajo?')) return;
    try {
      setSubmitting(true);
      await OrdenTrabajoService.eliminarOrden(id);
      notifySuccess('Orden eliminada exitosamente.');
      (draft.markSaved(), navigate('/servicio-campo/ordenes'));
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
            disabled={submitting || !esEditable}
          >
            Guardar
          </D365CommandButton>

          <D365CommandButton
            icon={<SaveMultiple16Regular />}
            tone="save"
            onClick={() => void handleGuardar(true)}
            disabled={submitting || !esEditable}
          >
            Guardar y cerrar
          </D365CommandButton>

          {!esNuevo && (
            <>
              <D365CommandDivider />

              {/* Acciones de Flujo de Estados Dynamics 365 */}
              {estadoSistema === 'Borrador' && !estaCerrada && (
                <D365CommandButton
                  icon={<CalendarClock16Regular />}
                  tone="brand"
                  onClick={() => void handleCambiarEstado('PendienteProgramar')}
                  disabled={submitting || !puedeAsignar}
                >
                  Liberar para Programar
                </D365CommandButton>
              )}

              {estadoSistema === 'PendienteProgramar' && !estaCerrada && (
                <D365CommandButton
                  icon={<CalendarClock16Regular />}
                  tone="brand"
                  onClick={() => {
                    if (!recursoTecnicoId) {
                      setSelectedTab('programacion');
                      setMensaje({
                        tipo: 'error',
                        texto: 'Seleccione un técnico de campo en la pestaña "Visitas" antes de confirmar la programación.',
                      });
                      return;
                    }
                    if (!fechaProgramada) {
                      setFechaProgramada(new Date().toISOString().slice(0, 10));
                    }
                    void handleCambiarEstado('Programado');
                  }}
                  disabled={submitting || !puedeAsignar}
                >
                  Confirmar y Programar Cita
                </D365CommandButton>
              )}

              {estadoSistema === 'Programado' && !estaCerrada && (
                <D365CommandButton
                  icon={<Play16Regular />}
                  tone="brand"
                  onClick={() => void handleCambiarEstado('EnProgreso')}
                  disabled={submitting || !puedeAsignar}
                >
                  Iniciar Atención en Campo
                </D365CommandButton>
              )}

              {estadoSistema === 'EnProgreso' && !estaCerrada && (
                <D365CommandButton
                  icon={<CheckmarkCircle16Regular />}
                  tone="create"
                  onClick={() => void handleCambiarEstado('Completado')}
                  disabled={submitting || !puedeCerrar}
                >
                  Completar Orden
                </D365CommandButton>
              )}

              {estadoSistema !== 'Cancelado' && estadoSistema !== 'Completado' && !estaCerrada && (
                <D365CommandButton
                  icon={<DismissCircle16Regular />}
                  tone="danger"
                  onClick={handleAbrirCancelarOrden}
                  disabled={submitting || !puedeCerrar}
                >
                  Cancelar Orden
                </D365CommandButton>
              )}

              {estadoSistema === 'Borrador' && (
                <D365CommandButton
                  icon={<Delete16Regular />}
                  tone="danger"
                  onClick={() => void handleEliminar()}
                  disabled={submitting || !puedeGestionar}
                >
                  Eliminar
                </D365CommandButton>
              )}

              <D365CommandDivider />
              <D365CommandButton
                icon={<Print16Regular />}
                onClick={() => void handleDescargarActaPdf()}
                disabled={submitting || loading}
                title="Visualizar y descargar Acta de Servicio en PDF para firma del cliente"
              >
                Acta de Servicio (PDF)
              </D365CommandButton>
              <D365CommandButton
                icon={<Add16Regular />}
                tone="create"
                disabled={!puedeGestionar}
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
          { label: 'System Status', value: <D365StatusBadge status={estadoSistema} size="small" /> },
          { label: 'Estado Operativo', value: <D365StatusBadge status={estadoOperativo} size="small" /> },
          { label: 'Técnico', value: recursoTecnicoNombre || 'Sin Asignar' },
          { label: 'Fecha Cita', value: fechaProgramada ? `${fechaProgramada}${bloqueHorario ? ` (${bloqueHorario})` : ''}` : 'Sin Programar' },
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
            <Tab value="trabajos">
              Trabajos
              {trabajos.length > 0 && (
                <Badge
                  size="small"
                  appearance="tint"
                  color={trabajos.some((t) => !t.id) ? 'warning' : 'informative'}
                  style={{ marginLeft: '6px' }}
                >
                  {trabajos.length}
                  {trabajos.some((t) => !t.id) ? ' •' : ''}
                </Badge>
              )}
            </Tab>
            <Tab value="direcciones">Direcciones</Tab>
            <Tab value="programacion">
              Visitas
              {(orden?.visitas?.length ?? 0) > 0 && (
                <Badge size="small" appearance="tint" color="informative" style={{ marginLeft: '6px' }}>
                  {orden?.visitas?.length}
                </Badge>
              )}
            </Tab>
            <Tab value="materiales">
              Materiales
              {materialesConsolidados.length > 0 && (
                <Badge size="small" appearance="tint" color="informative" style={{ marginLeft: '6px' }}>
                  {materialesConsolidados.length}
                </Badge>
              )}
            </Tab>
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
      <D365FormContent busy={submitting} className={formStyles.contentBody}>
        {loading ? (
          <div className={formStyles.grid2Cols}>
            <Card className={formStyles.card}>
              <Skeleton animation="pulse">
                <SkeletonItem size={16} className={formStyles.skeletonHeader} />
                <div className={formStyles.fieldColumnFlex}>
                  <SkeletonItem size={32} className={formStyles.skeletonFull} />
                  <SkeletonItem size={32} className={formStyles.skeletonFull} />
                  <SkeletonItem size={32} className={formStyles.skeletonFull} />
                  <SkeletonItem size={72} className={formStyles.skeletonTextarea72} />
                </div>
              </Skeleton>
            </Card>
            <Card className={formStyles.card}>
              <Skeleton animation="pulse">
                <SkeletonItem size={16} className={formStyles.skeletonSub140} />
                <div className={formStyles.fieldColumnFlex}>
                  <SkeletonItem size={32} className={formStyles.skeletonFull} />
                  <SkeletonItem size={32} className={formStyles.skeletonFull} />
                  <SkeletonItem size={32} className={formStyles.skeletonFull} />
                  <SkeletonItem size={32} className={formStyles.skeletonFull} />
                </div>
              </Skeleton>
            </Card>
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

                  <D365FormField label="Estado del Sistema (Status)" htmlFor="wo-estado-sistema">
                    <D365StatusField
                      id="wo-estado-sistema"
                      value={estadoSistema}
                    />
                  </D365FormField>

                  <D365FormField label="Estado Operativo" htmlFor="wo-estado-operativo">
                    <D365StatusField
                      id="wo-estado-operativo"
                      value={estadoOperativo}
                    />
                  </D365FormField>

                  <D365FormField label="Cliente Receptor (Abonado)" required info="Service Account: cuenta receptora del servicio en campo">
                    <SelectorEntidadRelacionada
                      deshabilitado={!esEditable}
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
                      deshabilitado={!esEditable}
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
                      deshabilitado={!esEditable}
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
                    required
                    info="Price List: lista de precios y tarifario contractual vinculado a la orden. Se autocompleta con la lista del Tipo de Orden pero puede cambiarse."
                  >
                    <Select
                      aria-label="Lista de precios de la orden"
                      className={formStyles.d365ControlFull}
                      value={listaPreciosId}
                      disabled={!esNuevo || !esEditable}
                      onChange={(_, data) => setListaPreciosId(data.value)}
                    >
                      <option value="">Seleccione una lista de precios</option>
                      {listasPrecios.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nombre}
                        </option>
                      ))}
                      {listaPreciosId && !listasPrecios.some((l) => l.id === listaPreciosId) && (
                        <option value={listaPreciosId}>
                          {listaPreciosActiva?.nombre || 'Lista guardada en la orden'}
                        </option>
                      )}
                    </Select>
                  </D365FormField>

                  <D365FormField label="Sede / Base Operativa" htmlFor="wo-sede" required>
                    <Select
                      id="wo-sede"
                      className={formStyles.d365ControlFull}
                      disabled={!esEditable}
                      value={unidadOrganizativaId}
                      onChange={(_, d) => {
                        const newSedeId = d.value;
                        setUnidadOrganizativaId(newSedeId);
                        const sede = unidadesOrganizativas.find((u) => u.id === newSedeId);
                        setUnidadOrganizativaNombre(sede?.nombre || '');

                        // Si la zona operativa actual no pertenece a la nueva sede, limpiarla
                        if (zonaOperativaId) {
                          const perteneceZona = zonasOperativas.some(
                            (z) => z.id === zonaOperativaId && (!newSedeId || z.unidadOrganizativaId === newSedeId)
                          );
                          if (!perteneceZona) {
                            setZonaOperativaId('');
                            setZonaOperativaNombre('');
                          }
                        }

                        // Si el técnico actual no pertenece a la nueva sede, limpiarlo
                        if (recursoTecnicoId && newSedeId) {
                          const perteneceTecnico = recursosTecnicos.some(
                            (r) => r.id === recursoTecnicoId && r.unidadOrganizativaId === newSedeId
                          );
                          if (!perteneceTecnico) {
                            setRecursoTecnicoId('');
                            setRecursoTecnicoNombre('');
                            setMensaje({
                              tipo: 'error',
                              texto: 'La sede cambió; el técnico asignado previamente fue removido por no pertenecer a esta sede.',
                            });
                          }
                        }
                      }}
                    >
                      <option value="">Seleccione la sede operativa...</option>
                      {unidadesOrganizativas.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.codigo ? `${u.codigo} — ` : ''}{u.nombre} {u.ciudad ? `(${u.ciudad})` : ''}
                        </option>
                      ))}
                      {unidadOrganizativaId && !unidadesOrganizativas.some((u) => u.id === unidadOrganizativaId) && (
                        <option value={unidadOrganizativaId}>
                          {unidadOrganizativaNombre || 'Sede registrada en la orden'}
                        </option>
                      )}
                    </Select>
                  </D365FormField>

                  <D365FormField label="Zona Operativa / Territorio" htmlFor="wo-zona">
                    <Select
                      id="wo-zona"
                      className={formStyles.d365ControlFull}
                      disabled={!esEditable}
                      value={zonaOperativaId}
                      onChange={(_, d) => {
                        setZonaOperativaId(d.value);
                        const terr = zonasOperativas.find((z) => z.id === d.value);
                        setZonaOperativaNombre(terr?.nombre || '');
                        // Si aún no se había seleccionado sede y el territorio tiene sede asociada, sincronizarla
                        if (!unidadOrganizativaId && terr?.unidadOrganizativaId) {
                          setUnidadOrganizativaId(terr.unidadOrganizativaId);
                          setUnidadOrganizativaNombre(terr.unidadOrganizativaNombre || '');
                        }
                      }}
                    >
                      <option value="">(Sin delimitar / Cobertura general)</option>
                      {zonasOperativasFiltradas.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.codigo ? `${z.codigo} — ` : ''}{z.nombre}
                        </option>
                      ))}
                      {zonaOperativaId && !zonasOperativasFiltradas.some((z) => z.id === zonaOperativaId) && (
                        <option value={zonaOperativaId}>
                          {zonaOperativaNombre || 'Zona registrada en la orden'}
                        </option>
                      )}
                    </Select>
                  </D365FormField>

                  <D365FormField label="Observaciones" htmlFor="wo-obs" align="top">
                    <Textarea
                      id="wo-obs"
                      className={formStyles.d365ControlFull}
                      rows={3}
                      value={observaciones}
                      disabled={!esEditable}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder=""
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
                        disabled={!esEditable}
                        onChange={(e) => setNumeroOrden(e.target.value)}
                      />
                    </D365FormField>

                    <D365FormField label="Código de Contrato / Abonado" htmlFor="wo-contrato">
                      <Input
                        id="wo-contrato"
                        className={formStyles.d365ControlFull}
                        value={codigoContrato}
                        disabled={!esEditable}
                        onChange={(e) => setCodigoContrato(e.target.value)}
                      />
                    </D365FormField>

                    <D365FormField label="N° Pedido Comercial" htmlFor="wo-pedido">
                      <Input
                        id="wo-pedido"
                        className={formStyles.d365ControlFull}
                        value={numeroPedido}
                        disabled={!esEditable}
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
              <D365SubGrid
                title="Trabajos de la Orden de Trabajo"
                items={trabajos}
                columns={columnasTrabajos}
                selectionMode="multiselect"
                selectedItems={selectedTrabajoIds}
                onSelectionChange={(selected) => setSelectedTrabajoIds(selected.map(String))}
                getRowId={(item) => item.idTemp || item.id || ''}
                onAdd={handleAbrirDrawerNuevoTrabajo}
                addLabel="Agregar Trabajo"
                addDisabled={!esEditable}
                actions={
                  trabajosActivosSeleccionados.length > 0 && esEditable ? (
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<DismissCircle16Regular style={{ color: tokens.colorPaletteRedForeground1 }} />}
                        onClick={() => handleAbrirEstadoTrabajo(trabajosActivosSeleccionados, 'cancelar')}
                      >
                        Cancelar ({trabajosActivosSeleccionados.length})
                      </Button>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Prohibited16Regular style={{ color: tokens.colorPaletteDarkOrangeForeground1 }} />}
                        onClick={() => handleAbrirEstadoTrabajo(trabajosActivosSeleccionados, 'rechazar')}
                      >
                        Rechazar ({trabajosActivosSeleccionados.length})
                      </Button>
                    </div>
                  ) : undefined
                }
                onRowClick={(item) => handleAbrirDetalleTrabajo(item, 'tareas')}
                emptyMessage="No hay trabajos configurados para esta orden. Toda orden debe contener al menos un trabajo."
              />
            )}

            {/* ============================================================= */}
            {selectedTab === 'programacion' && (
              <div className={formStyles.grid2Cols}>
                <div className={formStyles.card}>
                  <div className={formStyles.cardSectionTitle}>Asignación de Visita y Técnico</div>

                  {!unidadOrganizativaId && (
                    <D365MessageBar intent="warning" style={{ marginBottom: 12 }}>
                      Debe seleccionar la <strong>Sede / Base Operativa</strong> en la pestaña "Resumen" para habilitar la lista de técnicos de campo de dicha sede.
                    </D365MessageBar>
                  )}

                  <D365FormField label="Técnico de Campo (Recurso)" htmlFor="wo-recurso">
                    <Select
                      id="wo-recurso"
                      className={formStyles.d365ControlFull}
                      disabled={!puedeAsignar || !unidadOrganizativaId}
                      value={recursoTecnicoId}
                      onChange={(_, d) => {
                        setRecursoTecnicoId(d.value);
                        const tec = recursosTecnicos.find((r) => r.id === d.value);
                        setRecursoTecnicoNombre(tec?.nombreCompleto || '');
                      }}
                    >
                      <option value="">
                        {!unidadOrganizativaId
                          ? '(Seleccione primero una sede operativa en Resumen)'
                          : recursosTecnicosFiltrados.length === 0
                          ? '(No hay técnicos registrados en esta sede)'
                          : 'Seleccione un técnico o cuadrilla responsable...'}
                      </option>
                      {recursosTecnicosFiltrados.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.codigo ? `${r.codigo} — ` : ''}{r.nombreCompleto} {r.unidadOrganizativaNombre ? `[${r.unidadOrganizativaNombre}]` : ''}
                        </option>
                      ))}
                      {recursoTecnicoId && !recursosTecnicosFiltrados.some((r) => r.id === recursoTecnicoId) && (
                        <option value={recursoTecnicoId}>
                          {recursoTecnicoNombre || 'Técnico asignado'}
                        </option>
                      )}
                    </Select>
                  </D365FormField>

                  <D365FormField label="Fecha Programada de Atención" htmlFor="wo-fecha-prog">
                    <DatePicker
                      id="wo-fecha-prog"
                      className={formStyles.d365ControlFull}
                      disabled={!puedeAsignar}
                      value={fechaProgramada ? new Date(fechaProgramada + 'T00:00:00') : undefined}
                      formatDate={(d) => d?.toLocaleDateString('es-PE') ?? ''}
                      onSelectDate={(d) => setFechaProgramada(d ? d.toISOString().split('T')[0] : '')}
                      placeholder="Seleccionar fecha de atención..."
                    />
                  </D365FormField>

                  <D365FormField label="Ventana / Bloque Horario" htmlFor="wo-bloque">
                    <Select
                      id="wo-bloque"
                      className={formStyles.d365ControlFull}
                      disabled={!puedeAsignar}
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

                <D365SubGrid
                  title="Historial de Visitas en Campo"
                  items={orden?.visitas || []}
                  columns={columnasVisitas}
                  emptyMessage="No se han agendado visitas técnicas aún para esta orden."
                />
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: MATERIALES CONSOLIDADOS                                 */}
            {/* ============================================================= */}
            {selectedTab === 'materiales' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {trabajos.some((t) => !t.id && t.configuracionServicioId) && (
                  <D365MessageBar intent="info">
                    Existen líneas de trabajo nuevas pendientes por guardar. Al pulsar "Guardar" en la barra de comandos se registrarán y confirmarán formalmente en el sistema.
                  </D365MessageBar>
                )}
                {(orden?.estado === 'Liquidada' || orden?.estado === 'Finalizada') && (
                  <D365MessageBar intent="success">
                    La liquidación de materiales de esta orden de trabajo se encuentra confirmada. Los consumos y series instaladas/retiradas fueron descontados y auditados en Kardex.
                  </D365MessageBar>
                )}
                <D365SubGrid
                  title="Materiales y Equipos Consolidados de la Orden"
                  items={materialesConsolidados}
                  columns={columnasMaterialesConsolidados}
                  emptyMessage="No hay materiales liquidados aún en esta orden. Los materiales sugeridos y previstos se configuran en la pestaña 'Trabajos'. La liquidación de consumos reales se efectúa cuando los trabajos han sido completados en campo por el técnico."
                  actions={
                    !esNuevo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!estaCompleta && !yaLiquidada && (
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            (Solo disponible cuando la orden esté Completa)
                          </Text>
                        )}
                        <Button
                          size="small"
                          appearance="primary"
                          icon={<Box20Regular />}
                          disabled={submitting || !estaCompleta || yaLiquidada}
                          onClick={handleAbrirLiquidacion}
                          title={
                            !estaCompleta
                              ? 'La liquidación solo está disponible cuando los trabajos están en estado Completa.'
                              : yaLiquidada
                              ? 'Los materiales de esta orden ya han sido liquidados.'
                              : 'Consolidar consumos, series instaladas y retiros de averías para descontar del almacén móvil del técnico'
                          }
                        >
                          {yaLiquidada ? 'Materiales Liquidados' : 'Liquidar Materiales'}
                        </Button>
                      </div>
                    ) : undefined
                  }
                />
              </div>
            )}
          </>
        )}
      </D365FormContent>

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
                {trabajoEnEdicionIndex !== null ? 'Editar Trabajo' : 'Agregar Trabajo'}
              </Text>
              <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, fontWeight: 400, marginTop: '2px' }}>
                Seleccione el servicio e identifique el equipo o lugar atendido
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

          {/* Código interno de trabajo si ya está guardado */}
          {trabajoEnEdicionIndex !== null && trabajos[trabajoEnEdicionIndex]?.codigoTrabajo && (
            <D365FormField label="Código de Trabajo">
              <Input
                className={formStyles.d365ControlFull}
                value={trabajos[trabajoEnEdicionIndex].codigoTrabajo}
                readOnly
                appearance="filled-darker"
              />
            </D365FormField>
          )}

          {/* Código Externo para Siebel, DirecTV, Claro, Telefónica, etc. */}
          <D365FormField
            label="Código Externo / Incidente"
            info="ID o código asignado por sistemas CRM/operativos externos (Siebel, Claro, DirecTV, Telefónica, etc.)"
          >
            <Input
              className={formStyles.d365ControlFull}
              value={drawerCodigoExterno}
              placeholder="Ej: SIEBEL-109482, CLARO-84920"
              onChange={(_, d) => setDrawerCodigoExterno(d.value)}
            />
          </D365FormField>

          {/* Campo 1: Servicio */}
          <D365FormField label="Servicio" required>
            <Select
              aria-label="Servicio del trabajo"
              className={formStyles.d365ControlFull}
              value={drawerProductoId}
              disabled={!!trabajos[trabajoEnEdicionIndex ?? -1]?.id}
              onChange={(_, data) => void handleSeleccionarServicio(data.value)}
            >
              <option value="">Seleccione un servicio</option>
              {productosServicios.filter((p) => p.tipo === 'Servicio' || p.tipo === 3).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.nombre}
                </option>
              ))}
            </Select>
          </D365FormField>
          <Text size={200}>{drawerPlantillaId ? 'Pasos y materiales según la configuración del servicio aplicada.' : 'Sin configuración activa: este trabajo se creará sin pasos ni materiales previstos.'}</Text>
          <D365FormField label="Equipo o ubicación"><Input value={drawerReferenciaEquipo} placeholder="" onChange={(_, d) => setDrawerReferenciaEquipo(d.value)} /></D365FormField>
          <D365FormField label="Precio del servicio"><Text>{listaPreciosActiva?.moneda || orden?.moneda || ''} {drawerTarifaBase.toFixed(2)} · {resolverTarifa(drawerProductoId).origen}</Text></D365FormField>

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
          <Button appearance="primary" disabled={!puedeGestionar} onClick={handleGuardarDrawerTrabajo}>
            {trabajoEnEdicionIndex !== null ? 'Guardar Cambios' : 'Agregar Trabajo'}
          </Button>
        </DrawerFooter>
      </OverlayDrawer>

      {/* 6. DRAWER LATERAL DE DETALLE TÉCNICO DEL INCIDENTE (SERVICIOS, TAREAS, MATERIALES) */}
      <OverlayDrawer
        open={drawerDetalleTrabajoOpen}
        position="end"
        size="medium"
        onOpenChange={(_, { open }) => setDrawerDetalleTrabajoOpen(open)}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDrawerDetalleTrabajoOpen(false)}
              />
            }
          >
            <div>
              <Text weight="semibold" style={{ fontSize: '16px' }}>
                {trabajoSeleccionadoParaDetalle?.codigoTrabajo ? `${trabajoSeleccionadoParaDetalle.codigoTrabajo} · ` : ''}
                {trabajoSeleccionadoParaDetalle?.productoNombre || 'Servicio Técnico'}
              </Text>
              <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, fontWeight: 400, marginTop: '2px' }}>
                {trabajoSeleccionadoParaDetalle?.referenciaEquipo ? `Equipo/Ubicación: ${trabajoSeleccionadoParaDetalle.referenciaEquipo} · ` : ''}
                {trabajoSeleccionadoParaDetalle?.configuracionServicioNombre ? `Configuración: ${trabajoSeleccionadoParaDetalle.configuracionServicioNombre}` : 'Sin configuración activa'}
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px' }}>
          {cargandoDetalleTrabajo ? (
            <div style={{ padding: '36px', textAlign: 'center' }}>
              <Spinner label="Cargando configuración de la plantilla..." />
            </div>
          ) : (
            <>
              <TabList
                selectedValue={tabDetalleTrabajo}
                onTabSelect={(_, data) => setTabDetalleTrabajo(data.value as 'tareas' | 'materiales')}
              >
                <Tab value="tareas">
                  Tareas Técnicas ({detalleTrabajoData?.tareas?.length ?? 0})
                </Tab>
                <Tab value="materiales">
                  Materiales Previstos ({detalleTrabajoData?.materiales?.length ?? 0})
                </Tab>
              </TabList>

              {tabDetalleTrabajo === 'tareas' && (
                <div>
                  {(!detalleTrabajoData?.tareas || detalleTrabajoData.tareas.length === 0) ? (
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
                        {detalleTrabajoData.tareas.map((t, idx) => (
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

              {tabDetalleTrabajo === 'materiales' && (
                <div>
                  {(!detalleTrabajoData?.materiales || detalleTrabajoData.materiales.length === 0) ? (
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
                        {detalleTrabajoData.materiales.map((m, idx) => (
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
          <Button appearance="secondary" onClick={() => setDrawerDetalleTrabajoOpen(false)}>
            Cerrar
          </Button>
        </DrawerFooter>
      </OverlayDrawer>

      {/* 7. DRAWER REPROGRAMAR VISITA */}
      <OverlayDrawer
        open={drawerReprogramarOpen}
        position="end"
        size="medium"
        onOpenChange={(_, { open }) => setDrawerReprogramarOpen(open)}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDrawerReprogramarOpen(false)}
              />
            }
          >
            <div>
              <Text weight="semibold" style={{ fontSize: '16px' }}>
                Reprogramar Cita Técnica ({visitaSeleccionada?.codigoVisita})
              </Text>
              <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                Modifique la fecha de atención y registre el motivo de la reprogramación.
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 20px' }}>
          <D365FormField label="Nueva Fecha de Atención" required>
            <DatePicker
              className={formStyles.d365ControlFull}
              value={reprogramarFecha ? new Date(reprogramarFecha + 'T00:00:00') : undefined}
              formatDate={(d) => d?.toLocaleDateString('es-PE') ?? ''}
              onSelectDate={(d) => setReprogramarFecha(d ? d.toISOString().split('T')[0] : '')}
              placeholder="Seleccionar nueva fecha..."
            />
          </D365FormField>

          <D365FormField label="Ventana / Bloque Horario">
            <Select
              className={formStyles.d365ControlFull}
              value={reprogramarBloque}
              onChange={(_, d) => setReprogramarBloque(d.value)}
            >
              <option value="08:00 - 12:00">08:00 - 12:00 (Mañana)</option>
              <option value="13:00 - 17:00">13:00 - 17:00 (Tarde)</option>
              <option value="17:00 - 20:00">17:00 - 20:00 (Vespertino)</option>
              <option value="JORNADA_COMPLETA">Jornada Completa</option>
            </Select>
          </D365FormField>

          <D365FormField label="Motivo de Reprogramación" required>
            <Select
              className={formStyles.d365ControlFull}
              value={reprogramarMotivo}
              onChange={(_, d) => setReprogramarMotivo(d.value)}
            >
              <option value="CLIENTE_SOLICITA_CAMBIO">Cliente solicita cambio de fecha/horario</option>
              <option value="FALTA_ACCESO_PREDIO">Falta de acceso al predio / Cliente ausente</option>
              <option value="PROBLEMA_LOGISTICO_TECNICO">Problema logístico o transporte del técnico</option>
              <option value="CLIMA_O_FUERZA_MAYOR">Condiciones climáticas / Fuerza mayor</option>
              <option value="OTRO">Otro motivo operativo</option>
            </Select>
          </D365FormField>

          <D365FormField label="Observaciones / Justificación" align="top">
            <Textarea
              className={formStyles.d365ControlFull}
              rows={3}
              value={reprogramarObservaciones}
              onChange={(e) => setReprogramarObservaciones(e.target.value)}
              placeholder="Detalle la justificación del cambio de cita..."
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
          <Button appearance="secondary" onClick={() => setDrawerReprogramarOpen(false)}>
            Cancelar
          </Button>
          <Button appearance="primary" disabled={submitting} onClick={handleConfirmarReprogramar}>
            Confirmar Reprogramación
          </Button>
        </DrawerFooter>
      </OverlayDrawer>

      {/* 8. DRAWER CANCELAR VISITA */}
      <OverlayDrawer
        open={drawerCancelarVisitaOpen}
        position="end"
        size="medium"
        onOpenChange={(_, { open }) => setDrawerCancelarVisitaOpen(open)}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDrawerCancelarVisitaOpen(false)}
              />
            }
          >
            <div>
              <Text weight="semibold" style={{ fontSize: '16px', color: tokens.colorPaletteRedForeground1 }}>
                Cancelar Cita Técnica ({visitaSeleccionada?.codigoVisita})
              </Text>
              <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                Esta acción cancelará la visita técnica programada.
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 20px' }}>
          <D365FormField label="Motivo de Cancelación" required>
            <Select
              className={formStyles.d365ControlFull}
              value={cancelarMotivo}
              onChange={(_, d) => setCancelarMotivo(d.value)}
            >
              <option value="CLIENTE_DESISTE">Cliente desiste del servicio</option>
              <option value="CLIENTE_AUSENTE">Cliente ausente en la dirección</option>
              <option value="DIRECCION_ERRONEA">Dirección errónea o fuera de cobertura</option>
              <option value="EQUIPO_YA_OPERATIVO">Problema resuelto previamente / Ya operativo</option>
              <option value="OTRO">Otro motivo</option>
            </Select>
          </D365FormField>

          <D365FormField label="Observaciones de Cancelación" align="top">
            <Textarea
              className={formStyles.d365ControlFull}
              rows={3}
              value={cancelarObservaciones}
              onChange={(e) => setCancelarObservaciones(e.target.value)}
              placeholder="Explique las circunstancias de la cancelación..."
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
          <Button appearance="secondary" onClick={() => setDrawerCancelarVisitaOpen(false)}>
            Cerrar
          </Button>
          <Button
            appearance="primary"
            style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: tokens.colorNeutralForegroundStaticInverted }}
            disabled={submitting}
            onClick={handleConfirmarCancelarVisita}
          >
            Confirmar Cancelación
          </Button>
        </DrawerFooter>
      </OverlayDrawer>

      {/* DRAWER: CANCELAR ORDEN DE TRABAJO */}
      <OverlayDrawer
        open={drawerCancelarOrdenOpen}
        position="end"
        size="medium"
        onOpenChange={(_, { open }) => setDrawerCancelarOrdenOpen(open)}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDrawerCancelarOrdenOpen(false)}
              />
            }
          >
            <div>
              <Text weight="semibold" style={{ fontSize: '16px', color: tokens.colorPaletteRedForeground1 }}>
                Cancelar Orden de Trabajo ({codigoWo || 'Sin código'})
              </Text>
              <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                Esta acción cancelará la orden de forma definitiva, interrumpiendo todas las visitas y tareas pendientes.
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 20px' }}>
          <MessageBar intent="warning">
            <MessageBarBody>
              Al cancelar la orden de trabajo, pasará al estado <strong>Cancelada</strong> y quedará bloqueada en modo de solo lectura. No se podrán realizar más cambios en los trabajos ni despachar visitas técnicas.
            </MessageBarBody>
          </MessageBar>

          <D365FormField label="Motivo de Cancelación" required>
            <Select
              className={formStyles.d365ControlFull}
              value={motivoCancelarOrden}
              onChange={(_, d) => setMotivoCancelarOrden(d.value)}
            >
              {motivosCancelacionOrden.map((m) => (
                <option key={m.id || m.codigo} value={m.codigo}>
                  [{m.codigo}] {m.nombre}
                </option>
              ))}
            </Select>
          </D365FormField>

          <D365FormField label="Observaciones / Justificación" align="top">
            <Textarea
              className={formStyles.d365ControlFull}
              rows={4}
              value={obsCancelarOrden}
              onChange={(e) => setObsCancelarOrden(e.target.value)}
              placeholder="Describa el motivo o justificación de la cancelación..."
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
          <Button appearance="secondary" onClick={() => setDrawerCancelarOrdenOpen(false)}>
            Cerrar
          </Button>
          <Button
            appearance="primary"
            style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: tokens.colorNeutralForegroundStaticInverted }}
            disabled={submitting}
            onClick={handleConfirmarCancelarOrden}
          >
            Confirmar Cancelación
          </Button>
        </DrawerFooter>
      </OverlayDrawer>

      {/* DRAWER: CANCELAR O RECHAZAR TRABAJO */}
      <OverlayDrawer
        open={drawerEstadoTrabajoOpen}
        position="end"
        size="medium"
        onOpenChange={(_, { open }) => setDrawerEstadoTrabajoOpen(open)}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDrawerEstadoTrabajoOpen(false)}
              />
            }
          >
            <div>
              <Text
                weight="semibold"
                style={{
                  fontSize: '16px',
                  color:
                    accionEstadoTrabajo === 'cancelar'
                      ? tokens.colorPaletteRedForeground1
                      : tokens.colorPaletteDarkOrangeForeground1,
                }}
              >
                {accionEstadoTrabajo === 'cancelar' ? 'Cancelar Trabajo' : 'Rechazar Trabajo'}{' '}
                {trabajosParaEstado.length === 1
                  ? `(${trabajosParaEstado[0].codigoTrabajo || trabajosParaEstado[0].productoNombre})`
                  : `(${trabajosParaEstado.length} seleccionados)`}
              </Text>
              <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                {accionEstadoTrabajo === 'cancelar'
                  ? (trabajosParaEstado.length === 1
                      ? 'El trabajo se marcará como Cancelado. Las tareas pendientes asociadas serán canceladas.'
                      : `Los ${trabajosParaEstado.length} trabajos seleccionados se marcarán como Cancelados. Si todos los trabajos quedan cancelados, la orden pasará automáticamente a Cancelada.`)
                  : (trabajosParaEstado.length === 1
                      ? 'El trabajo se marcará como Rechazado indicando el motivo de imposibilidad u objeción técnica.'
                      : `Los ${trabajosParaEstado.length} trabajos seleccionados se marcarán como Rechazados. Si todos los trabajos quedan rechazados, la orden pasará automáticamente a Rechazada.`)}
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 20px' }}>
          {trabajosParaEstado.length > 1 && (
            <div style={{ backgroundColor: tokens.colorNeutralBackground3, padding: '10px 14px', borderRadius: '4px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
              <Text size={200} weight="semibold">Trabajos seleccionados a afectar ({trabajosParaEstado.length}):</Text>
              <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: '12px', color: tokens.colorNeutralForeground2 }}>
                {trabajosParaEstado.map((t) => (
                  <li key={t.id || t.idTemp}>
                    <b style={{ fontFamily: 'monospace' }}>{t.codigoTrabajo || 'Trabajo'}</b> - {t.productoNombre || 'Servicio'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <D365FormField
            label={accionEstadoTrabajo === 'cancelar' ? 'Motivo de Cancelación' : 'Motivo de Rechazo'}
            required
          >
            <Select
              className={formStyles.d365ControlFull}
              value={motivoEstadoTrabajo}
              onChange={(_, d) => setMotivoEstadoTrabajo(d.value)}
            >
              {motivosDisponibles.map((m) => (
                <option key={m.id || m.codigo} value={m.codigo}>
                  [{m.codigo}] {m.nombre}
                </option>
              ))}
            </Select>
          </D365FormField>

          <D365FormField label="Detalle u Observaciones" align="top">
            <Textarea
              className={formStyles.d365ControlFull}
              rows={4}
              value={obsEstadoTrabajo}
              onChange={(e) => setObsEstadoTrabajo(e.target.value)}
              placeholder="Explique las razones o circunstancias..."
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
          <Button appearance="secondary" onClick={() => setDrawerEstadoTrabajoOpen(false)}>
            Cerrar
          </Button>
          <Button
            appearance="primary"
            style={{
              backgroundColor:
                accionEstadoTrabajo === 'cancelar'
                  ? tokens.colorPaletteRedBackground3
                  : tokens.colorPaletteDarkOrangeBackground3,
              color: tokens.colorNeutralForegroundStaticInverted,
            }}
            disabled={submitting}
            onClick={handleConfirmarEstadoTrabajo}
          >
            {accionEstadoTrabajo === 'cancelar' ? 'Confirmar Cancelación' : 'Confirmar Rechazo'}
          </Button>
        </DrawerFooter>
      </OverlayDrawer>

      {/* 9. DRAWER LIQUIDACIÓN DE MATERIALES E INVENTARIO */}
      <OverlayDrawer
        open={drawerLiquidacionOpen}
        position="end"
        size="large"
        onOpenChange={(_, { open }) => setDrawerLiquidacionOpen(open)}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDrawerLiquidacionOpen(false)}
              />
            }
          >
            <div>
              <Text weight="semibold" style={{ fontSize: '17px' }}>
                Liquidación Real de Materiales de Campo
              </Text>
              <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                Consolide consumos reales, ingrese series instaladas y registre equipos retirados/averiados. El stock se descontará del almacén móvil del técnico con Kardex.
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 20px' }}>
          {/* Tarjeta del Técnico Asignado y Almacén Móvil de Descarga */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: tokens.colorNeutralBackground3,
              borderRadius: '6px',
              border: `1px solid ${tokens.colorNeutralStroke2}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <Text weight="semibold" style={{ fontSize: '13px', display: 'block' }}>
                👨‍🔧 Técnico Responsable: {orden?.recursoTecnicoNombre || recursoTecnicoNombre || 'Técnico de Cuadrilla'}
              </Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                📦 Almacén Móvil de Descarga: {orden?.almacenTecnicoNombre || 'Custodia Móvil del Técnico (Kardex)'}
              </Text>
            </div>
            <Badge appearance="tint" color="success">
              Atención Completa
            </Badge>
          </div>

          {/* SECCIÓN 1: CONSUMOS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <Text weight="semibold" style={{ fontSize: '14px' }}>
                  1. Materiales e Insumos Consumidos / Instalados
                </Text>
                <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                  Materiales descontados de la custodia del técnico con registro de Kardex.
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge appearance="tint" color="brand">{draftConsumos.length} items</Badge>
                <Button
                  size="small"
                  appearance="outline"
                  icon={<Add16Regular />}
                  onClick={handleAgregarConsumoManual}
                >
                  + Material Adicional
                </Button>
              </div>
            </div>

            {draftConsumos.length === 0 ? (
              <D365MessageBar intent="info">
                No hay materiales previstos cargados para esta orden. Pulse "+ Material Adicional" si el técnico consumió insumos de su almacén móvil.
              </D365MessageBar>
            ) : (
              <Table size="small">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell style={{ width: '30px' }}>#</TableHeaderCell>
                    <TableHeaderCell style={{ width: '100px' }}>Código</TableHeaderCell>
                    <TableHeaderCell>Material / Producto</TableHeaderCell>
                    <TableHeaderCell style={{ width: '70px', textAlign: 'center' }}>Previsto</TableHeaderCell>
                    <TableHeaderCell style={{ width: '80px' }}>Cant. Real</TableHeaderCell>
                    <TableHeaderCell style={{ width: '150px' }}>N° Serie Instalado</TableHeaderCell>
                    <TableHeaderCell style={{ width: '40px' }}></TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draftConsumos.map((c, idx) => (
                    <TableRow key={c.productoId + idx}>
                      <TableCell style={{ color: tokens.colorNeutralForeground4, fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.productoCodigo}</TableCell>
                      <TableCell>
                        {c.cantidadPrevista === 0 ? (
                          <Select
                            size="small"
                            value={c.productoId}
                            onChange={(_, d) => handleCambiarProductoConsumo(idx, d.value)}
                            style={{ width: '100%' }}
                          >
                            {productosServicios
                              .filter((p) => p.tipo !== 'Servicio' && p.tipo !== 3)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.codigo} — {p.nombre}
                                </option>
                              ))}
                          </Select>
                        ) : (
                          <>
                            <Text weight="medium">{c.productoNombre}</Text>
                            {c.esSerializado && (
                              <Badge size="small" appearance="tint" shape="rounded" color="warning" style={{ marginLeft: '6px' }}>
                                Seriado
                              </Badge>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell style={{ textAlign: 'center', fontWeight: 600 }}>{c.cantidadPrevista}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          style={{ width: '70px' }}
                          value={String(c.cantidadUtilizada)}
                          onChange={(e) => handleActualizarConsumo(idx, 'cantidadUtilizada', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder={c.esSerializado ? 'Serie obligatoria' : 'Opcional'}
                          style={{ width: '100%' }}
                          value={c.numeroSerie}
                          onChange={(e) => handleActualizarConsumo(idx, 'numeroSerie', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        {c.cantidadPrevista === 0 && (
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Dismiss24Regular />}
                            title="Quitar material adicional"
                            onClick={() => handleEliminarConsumo(idx)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* SECCIÓN 2: RETIROS */}
          <div style={{ borderTop: `1px solid ${tokens.colorNeutralStroke2}`, paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <Text weight="semibold" style={{ fontSize: '14px' }}>
                  2. Equipos Retirados / Scrap del Cliente (Averías)
                </Text>
                <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                  Equipos desmontados que ingresarán al stock en condición de Defectuoso.
                </Text>
              </div>
              <Button
                size="small"
                appearance="outline"
                icon={<Add16Regular />}
                onClick={handleAgregarRetiro}
              >
                + Registrar Equipo Retirado
              </Button>
            </div>

            {draftRetiros.length === 0 ? (
              <Text style={{ fontSize: '13px', color: tokens.colorNeutralForeground4 }}>
                No se han registrado equipos retirados para esta atención.
              </Text>
            ) : (
              <Table size="small">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell style={{ width: '35px' }}>#</TableHeaderCell>
                    <TableHeaderCell style={{ width: '220px' }}>Equipo / Producto</TableHeaderCell>
                    <TableHeaderCell style={{ width: '160px' }}>N° Serie Retirado</TableHeaderCell>
                    <TableHeaderCell>Motivo / Estado</TableHeaderCell>
                    <TableHeaderCell style={{ width: '45px' }}></TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draftRetiros.map((r, idx) => (
                    <TableRow key={r.idTemp || idx}>
                      <TableCell style={{ color: tokens.colorNeutralForeground4, fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Select
                          style={{ width: '100%' }}
                          value={r.productoId}
                          onChange={(_, d) => handleActualizarRetiro(idx, 'productoId', d.value)}
                        >
                          <option value="">Seleccione equipo</option>
                          {productosServicios.filter((p) => p.tipo !== 'Servicio' && p.tipo !== 3).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.codigo} — {p.nombre}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Serie retirada (obligatoria)"
                          style={{ width: '100%' }}
                          value={r.numeroSerie}
                          onChange={(e) => handleActualizarRetiro(idx, 'numeroSerie', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Motivo de avería / retiro"
                          style={{ width: '100%' }}
                          value={r.motivo}
                          onChange={(e) => handleActualizarRetiro(idx, 'motivo', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          appearance="subtle"
                          icon={<Delete16Regular />}
                          onClick={() => handleEliminarRetiro(idx)}
                          title="Eliminar fila"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* SECCIÓN 3: OBSERVACIONES GENERALES */}
          <div style={{ borderTop: `1px solid ${tokens.colorNeutralStroke2}`, paddingTop: '16px' }}>
            <D365FormField label="Observaciones de Liquidación" align="top">
              <Textarea
                className={formStyles.d365ControlFull}
                rows={3}
                placeholder="Observaciones generales sobre la liquidación de materiales e inventario..."
                value={obsLiquidacion}
                onChange={(e) => setObsLiquidacion(e.target.value)}
              />
            </D365FormField>
          </div>
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
          <Button appearance="secondary" onClick={() => setDrawerLiquidacionOpen(false)}>
            Cancelar
          </Button>
          <Button
            appearance="primary"
            disabled={submitting}
            onClick={handleConfirmarLiquidacion}
          >
            Confirmar Liquidación y Descargar Stock
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
    </div>
  );
};
