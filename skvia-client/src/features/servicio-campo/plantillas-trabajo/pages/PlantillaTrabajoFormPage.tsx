import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Checkbox,
  Textarea,
  Tab,
  TabList,
  Spinner,
  Text,
  Badge,
  Button,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableCellLayout,
  createTableColumn,
  Select,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Toast,
  Toaster,
  ToastTitle,
  useToastController,
  useId,
  tokens,
} from '@fluentui/react-components';
import type { TableColumnDefinition } from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  Delete16Regular,
  DocumentBulletList20Regular,
  ArrowUp16Regular,
  ArrowDown16Regular,
  Checkmark16Regular,
  Dismiss24Regular,
  Search16Regular,
} from '@fluentui/react-icons';
import { PlantillaTrabajoService } from '../services/plantillaTrabajo.service';
import type {
  GuardarPlantillaTrabajoDto,
  TareaDto,
} from '../types/plantillaTrabajo.types';
import { ProductoService } from '../../../inventario/productos/services/producto.service';
import type { ProductoDto } from '../../../inventario/productos/types/producto.types';
import { UnidadMedidaService } from '../../../inventario/unidades-medida/services/unidadMedida.service';
import type { UnidadMedidaDto } from '../../../inventario/unidades-medida/types/unidadMedida.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';

interface TareaLocalItem {
  id: string; // temp id
  tareaId: string;
  tareaCodigo: string;
  tareaNombre: string;
  ordenSecuencia: number;
  esObligatoria: boolean;
  requiereEvidencia: boolean;
  instrucciones: string;
  duracionEstimadaMinutos: number;
}

interface ServicioLocalItem {
  id: string; // temp row id
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
}

interface MaterialLocalItem {
  id: string; // temp id
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  cantidadPrevista: number;
  esObligatorio: boolean;
  observaciones: string;
  unidadMedidaId?: string | null;
  unidadMedida: string;
  esSerializado: boolean;
}

export function PlantillaTrabajoFormPage() {
  const styles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id && id !== 'nuevo');

  const toasterId = useId('plantilla-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const notifySuccess = useCallback((title: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  // Estado del formulario principal
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [duracionEstimadaMinutos, setDuracionEstimadaMinutos] = useState<number>(60);
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);

  // Títulos y tarjetas estáticas del encabezado (solo cambian al cargar o guardar)
  const [savedTitle, setSavedTitle] = useState(isEditMode ? '' : 'Nuevo');
  const [savedSubtitle, setSavedSubtitle] = useState('Receta Técnica • Ficha de plantilla de trabajo');
  const [savedCantidadServicios, setSavedCantidadServicios] = useState(0);
  const [savedDuracionMinutos, setSavedDuracionMinutos] = useState(60);
  const [savedCantidadTareas, setSavedCantidadTareas] = useState(0);
  const [savedCantidadMateriales, setSavedCantidadMateriales] = useState(0);

  // Colecciones hijas
  const [servicios, setServicios] = useState<ServicioLocalItem[]>([]);
  const [tareas, setTareas] = useState<TareaLocalItem[]>([]);
  const [materiales, setMateriales] = useState<MaterialLocalItem[]>([]);

  // Catálogos
  const [catalogoProductos, setCatalogoProductos] = useState<ProductoDto[]>([]);
  const [catalogoTareas, setCatalogoTareas] = useState<TareaDto[]>([]);

  // UI state
  const [selectedTab, setSelectedTab] = useState<'general' | 'servicios' | 'tareas' | 'materiales'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Diálogo para agregar servicios
  const [dialogServicioOpen, setDialogServicioOpen] = useState(false);
  const [serviciosSeleccionadosDrawer, setServiciosSeleccionadosDrawer] = useState<Set<string>>(new Set());
  const [filtroBusquedaServicio, setFiltroBusquedaServicio] = useState('');
  const [serviciosSeleccionadosTabla, setServiciosSeleccionadosTabla] = useState<Set<string>>(new Set());

  // Diálogo y selección para tareas
  const [dialogTareaOpen, setDialogTareaOpen] = useState(false);
  const [tareasSeleccionadas, setTareasSeleccionadas] = useState<Set<string>>(new Set());
  const [tareasSeleccionadasTabla, setTareasSeleccionadasTabla] = useState<Set<string>>(new Set());
  const [filtroBusquedaTarea, setFiltroBusquedaTarea] = useState('');
  const [nuevaTareaNombre, setNuevaTareaNombre] = useState('');
  const [nuevaTareaObligatoria, setNuevaTareaObligatoria] = useState(true);
  const [nuevaTareaEvidencia, setNuevaTareaEvidencia] = useState(false);
  const [nuevaTareaInstrucciones, setNuevaTareaInstrucciones] = useState('');

  // Diálogo y selección para materiales
  const [dialogMaterialOpen, setDialogMaterialOpen] = useState(false);
  const [catalogoUnidades, setCatalogoUnidades] = useState<UnidadMedidaDto[]>([]);
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<Set<string>>(new Set());
  const [materialesSeleccionadosTabla, setMaterialesSeleccionadosTabla] = useState<Set<string>>(new Set());
  const [filtroBusquedaMaterial, setFiltroBusquedaMaterial] = useState('');
  const [nuevoMaterialCantidad, setNuevoMaterialCantidad] = useState<number>(1);
  const [nuevoMaterialUnidadId, setNuevoMaterialUnidadId] = useState<string>('');
  const [nuevoMaterialObligatorio, setNuevoMaterialObligatorio] = useState(false);
  const [nuevoMaterialObservaciones, setNuevoMaterialObservaciones] = useState('');

  // Carga inicial
  const cargarCatalogosYDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [prods, tars, ums] = await Promise.all([
        ProductoService.getProductos(undefined, undefined, true),
        PlantillaTrabajoService.getTareas({ soloActivas: true }),
        UnidadMedidaService.getUnidadesMedida(undefined, true),
      ]);
      setCatalogoProductos(prods);
      setCatalogoTareas(tars);
      setCatalogoUnidades(ums);

      if (isEditMode && id) {
        const plantilla = await PlantillaTrabajoService.getPlantillaById(id);
        setCodigo(plantilla.codigo);
        setNombre(plantilla.nombre);
        setSavedTitle(plantilla.nombre);
        setSavedSubtitle(`Receta Técnica • ${plantilla.codigo || 'Código autogenerado'}`);
        setSavedDuracionMinutos(plantilla.duracionEstimadaMinutos);
        setSavedCantidadTareas(plantilla.tareas.length);
        setSavedCantidadMateriales(plantilla.materiales.length);
        setDuracionEstimadaMinutos(plantilla.duracionEstimadaMinutos);
        setDescripcion(plantilla.descripcion || '');
        setActivo(plantilla.activo);

        if (plantilla.servicios && plantilla.servicios.length > 0) {
          const srvItems: ServicioLocalItem[] = plantilla.servicios.map((s) => ({
            id: s.id || `srv-${s.productoId}`,
            productoId: s.productoId,
            productoCodigo: s.productoCodigo || '',
            productoNombre: s.productoNombre || '',
          }));
          setServicios(srvItems);
          setSavedCantidadServicios(srvItems.length);
        } else if (plantilla.productoId) {
          const prodMatch = prods.find((p) => p.id === plantilla.productoId);
          const srvItems: ServicioLocalItem[] = [{
            id: `srv-${plantilla.productoId}`,
            productoId: plantilla.productoId,
            productoCodigo: plantilla.productoCodigo || '',
            productoNombre: prodMatch?.nombre || plantilla.productoNombre || '',
          }];
          setServicios(srvItems);
          setSavedCantidadServicios(1);
        } else {
          setServicios([]);
          setSavedCantidadServicios(0);
        }

        setTareas(
          plantilla.tareas.map((t) => ({
            id: t.id,
            tareaId: t.tareaId,
            tareaCodigo: t.tareaCodigo,
            tareaNombre: t.tareaNombre,
            ordenSecuencia: t.ordenSecuencia,
            esObligatoria: t.esObligatoria,
            requiereEvidencia: t.requiereEvidencia,
            instrucciones: t.instrucciones || '',
            duracionEstimadaMinutos: t.duracionEstimadaMinutos,
          }))
        );

        setMateriales(
          plantilla.materiales.map((m) => ({
            id: m.id,
            productoId: m.productoId,
            productoCodigo: m.productoCodigo,
            productoNombre: m.productoNombre,
            cantidadPrevista: m.cantidadPrevista,
            esObligatorio: m.esObligatorio,
            observaciones: m.observaciones || '',
            unidadMedidaId: m.unidadMedidaId || null,
            unidadMedida: m.unidadMedida || 'UND',
            esSerializado: m.esSerializado,
          }))
        );
      }
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al cargar los datos.',
      });
    } finally {
      setLoading(false);
    }
  }, [isEditMode, id]);

  useEffect(() => {
    void cargarCatalogosYDatos();
  }, [cargarCatalogosYDatos]);

  // Lista de servicios de catálogo (tipo === 'Servicio' o todos)
  const productosServicio = useMemo(() => {
    const srvs = catalogoProductos.filter((p) => p.tipo === 'Servicio' || p.tipo === 2);
    return srvs.length > 0 ? srvs : catalogoProductos;
  }, [catalogoProductos]);

  // Lista de materiales inventariables
  const productosMateriales = useMemo(() => {
    const inventariables = catalogoProductos.filter((p) => p.tipo === 'Inventario' || p.tipo === 1);
    return inventariables.length > 0 ? inventariables : catalogoProductos;
  }, [catalogoProductos]);

  // Materiales filtrados por la búsqueda en el Drawer
  const materialesFiltrados = useMemo(() => {
    const q = filtroBusquedaMaterial.trim().toLowerCase();
    if (!q) return productosMateriales;
    return productosMateriales.filter(
      (p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
    );
  }, [productosMateriales, filtroBusquedaMaterial]);

  // Tareas filtradas por la búsqueda en el Drawer
  const tareasFiltradas = useMemo(() => {
    const q = filtroBusquedaTarea.trim().toLowerCase();
    if (!q) return catalogoTareas;
    return catalogoTareas.filter(
      (t) => t.codigo.toLowerCase().includes(q) || t.nombre.toLowerCase().includes(q)
    );
  }, [catalogoTareas, filtroBusquedaTarea]);

  const validar = (): boolean => {
    const errs: Record<string, string> = {};
    if (!nombre.trim()) errs.nombre = 'El nombre de la plantilla es obligatorio.';
    if (servicios.length === 0) errs.servicios = 'Debe agregar al menos un servicio asociado a la plantilla.';
    if (duracionEstimadaMinutos < 1) errs.duracion = 'La duración estimada debe ser al menos 1 minuto.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const guardar = async (cerrarAlFinal = false): Promise<string | null> => {
    if (!validar()) {
      setStatusMessage({ type: 'error', text: 'Complete los campos obligatorios del formulario.' });
      if (!nombre.trim()) setSelectedTab('general');
      else if (servicios.length === 0) setSelectedTab('servicios');
      return null;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const primerServicio = servicios[0];
      const dto: GuardarPlantillaTrabajoDto = {
        codigo: codigo.trim() || undefined,
        nombre: nombre.trim(),
        productoId: primerServicio?.productoId || '',
        duracionEstimadaMinutos,
        descripcion: descripcion.trim() || undefined,
        esPredeterminada: false,
        servicios: servicios.map((s) => ({
          productoId: s.productoId,
          esPredeterminada: false,
        })),
        tareas: tareas.map((t, idx) => ({
          tareaId: t.tareaId,
          ordenSecuencia: idx + 1,
          esObligatoria: t.esObligatoria,
          requiereEvidencia: t.requiereEvidencia,
          instrucciones: t.instrucciones.trim() || undefined,
        })),
        materiales: materiales.map((m) => ({
          productoId: m.productoId,
          cantidadPrevista: m.cantidadPrevista,
          esObligatorio: m.esObligatorio,
          observaciones: m.observaciones.trim() || undefined,
          unidadMedidaId: m.unidadMedidaId || undefined,
        })),
      };

      let savedId = id;
      if (isEditMode && id) {
        await PlantillaTrabajoService.actualizarPlantilla(id, dto);
        setSavedTitle(nombre.trim());
        setSavedSubtitle(`Receta Técnica • ${codigo.trim() || 'Código autogenerado'}`);
        setSavedCantidadServicios(servicios.length);
        setSavedDuracionMinutos(duracionEstimadaMinutos);
        setSavedCantidadTareas(tareas.length);
        setSavedCantidadMateriales(materiales.length);
        notifySuccess('Plantilla de trabajo actualizada con éxito.');
      } else {
        const res = await PlantillaTrabajoService.crearPlantilla(dto);
        savedId = res.id;
        setSavedTitle(nombre.trim());
        setSavedSubtitle(`Receta Técnica • ${codigo.trim() || 'Código autogenerado'}`);
        setSavedCantidadServicios(servicios.length);
        setSavedDuracionMinutos(duracionEstimadaMinutos);
        setSavedCantidadTareas(tareas.length);
        setSavedCantidadMateriales(materiales.length);
        notifySuccess('Plantilla de trabajo creada con éxito.');
      }

      if (cerrarAlFinal) {
        navigate('/servicio-campo/plantillas-trabajo');
      } else if (!isEditMode && savedId) {
        navigate(`/servicio-campo/plantillas-trabajo/${savedId}`, { replace: true });
      }

      return savedId ?? null;
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al guardar la plantilla.',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async () => {
    if (!id || !isEditMode) return;
    try {
      setSaving(true);
      await PlantillaTrabajoService.cambiarEstado(id, !activo);
      setActivo(!activo);
      notifySuccess(`Plantilla ${!activo ? 'activada' : 'desactivada'} correctamente.`);
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al cambiar estado.',
      });
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!id || !isEditMode) return;
    if (!window.confirm('¿Está seguro de eliminar esta plantilla de trabajo?')) return;
    try {
      setSaving(true);
      await PlantillaTrabajoService.eliminarPlantilla(id);
      navigate('/servicio-campo/plantillas-trabajo');
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al eliminar la plantilla.',
      });
      setSaving(false);
    }
  };

  // Manejo de Tareas
  const agregarTareaFila = async () => {
    const nuevosItems: TareaLocalItem[] = [];

    // 1. Si hay tareas existentes seleccionadas por checkbox
    for (const tarId of tareasSeleccionadas) {
      if (tareas.some((t) => t.tareaId === tarId)) continue;
      const encontrada = catalogoTareas.find((t) => t.id === tarId);
      if (!encontrada) continue;

      nuevosItems.push({
        id: `tmp-${encontrada.id}-${Date.now()}`,
        tareaId: encontrada.id,
        tareaCodigo: encontrada.codigo,
        tareaNombre: encontrada.nombre,
        ordenSecuencia: tareas.length + nuevosItems.length + 1,
        esObligatoria: nuevaTareaObligatoria,
        requiereEvidencia: nuevaTareaEvidencia || encontrada.requiereEvidenciaFotografica,
        instrucciones: nuevaTareaInstrucciones.trim(),
        duracionEstimadaMinutos: encontrada.duracionEstimadaMinutos || 15,
      });
    }

    // 2. Si se ingresó una nueva tarea rápida
    if (nuevaTareaNombre.trim()) {
      try {
        const res = await PlantillaTrabajoService.crearTarea({
          nombre: nuevaTareaNombre.trim(),
          duracionEstimadaMinutos: 15,
          requiereEvidenciaFotografica: nuevaTareaEvidencia,
        });
        const updatedTars = await PlantillaTrabajoService.getTareas({ soloActivas: true });
        setCatalogoTareas(updatedTars);
        const creada = updatedTars.find((t) => t.id === res.id);

        nuevosItems.push({
          id: `tmp-${res.id}-${Date.now()}`,
          tareaId: res.id,
          tareaCodigo: creada?.codigo || 'TAR-NUEVA',
          tareaNombre: nuevaTareaNombre.trim(),
          ordenSecuencia: tareas.length + nuevosItems.length + 1,
          esObligatoria: nuevaTareaObligatoria,
          requiereEvidencia: nuevaTareaEvidencia,
          instrucciones: nuevaTareaInstrucciones.trim(),
          duracionEstimadaMinutos: 15,
        });
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Error al registrar tarea en el catálogo.',
        });
        return;
      }
    }

    if (nuevosItems.length > 0) {
      setTareas((prev) => [...prev, ...nuevosItems]);
      notifySuccess(`${nuevosItems.length} tarea(s) agregada(s) a la plantilla.`);
    }

    setDialogTareaOpen(false);
    setTareasSeleccionadas(new Set());
    setFiltroBusquedaTarea('');
    setNuevaTareaNombre('');
    setNuevaTareaObligatoria(true);
    setNuevaTareaEvidencia(false);
    setNuevaTareaInstrucciones('');
  };

  const moverTarea = (index: number, direccion: 'arriba' | 'abajo') => {
    if (direccion === 'arriba' && index === 0) return;
    if (direccion === 'abajo' && index === tareas.length - 1) return;

    setTareas((prev) => {
      const copy = [...prev];
      const targetIndex = direccion === 'arriba' ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((t, idx) => ({ ...t, ordenSecuencia: idx + 1 }));
    });
  };

  // Manejo de Materiales
  const primerProductoSeleccionado = useMemo(() => {
    if (materialesSeleccionados.size === 0) return null;
    const firstId = Array.from(materialesSeleccionados)[0];
    return catalogoProductos.find((p) => p.id === firstId) || null;
  }, [materialesSeleccionados, catalogoProductos]);

  const unidadesDisponiblesDrawer = useMemo(() => {
    if (!primerProductoSeleccionado || !primerProductoSeleccionado.grupoUnidadMedidaId) {
      return { unidadesGrupo: [], otrasUnidades: catalogoUnidades };
    }
    const grupoId = primerProductoSeleccionado.grupoUnidadMedidaId;
    const unidadesGrupo = catalogoUnidades.filter((u) => u.grupoUnidadMedidaId === grupoId);
    const otrasUnidades = catalogoUnidades.filter((u) => u.grupoUnidadMedidaId !== grupoId);
    return { unidadesGrupo, otrasUnidades };
  }, [primerProductoSeleccionado, catalogoUnidades]);

  useEffect(() => {
    if (primerProductoSeleccionado) {
      if (primerProductoSeleccionado.unidadMedidaDefectoId) {
        setNuevoMaterialUnidadId(primerProductoSeleccionado.unidadMedidaDefectoId);
      } else if (unidadesDisponiblesDrawer.unidadesGrupo.length > 0) {
        setNuevoMaterialUnidadId(unidadesDisponiblesDrawer.unidadesGrupo[0].id);
      } else if (catalogoUnidades.length > 0 && !nuevoMaterialUnidadId) {
        setNuevoMaterialUnidadId(catalogoUnidades[0].id);
      }
    }
  }, [primerProductoSeleccionado, unidadesDisponiblesDrawer, catalogoUnidades]);

  const agregarMaterialFila = () => {
    if (materialesSeleccionados.size === 0 || nuevoMaterialCantidad <= 0) return;

    const unidadSeleccionada = catalogoUnidades.find((u) => u.id === nuevoMaterialUnidadId);
    const nuevos: MaterialLocalItem[] = [];
    for (const prodId of materialesSeleccionados) {
      // Evitar agregar si ya existe en la lista de materiales
      if (materiales.some((m) => m.productoId === prodId)) continue;
      const prod = catalogoProductos.find((p) => p.id === prodId);
      if (!prod) continue;

      const uId = unidadSeleccionada?.id || prod.unidadMedidaDefectoId || null;
      const uNombre = unidadSeleccionada?.nombre || prod.nombreUnidadMedidaDefecto || 'UND';

      nuevos.push({
        id: `tmp-mat-${prod.id}-${Date.now()}`,
        productoId: prod.id,
        productoCodigo: prod.codigo,
        productoNombre: prod.nombre,
        cantidadPrevista: nuevoMaterialCantidad,
        esObligatorio: nuevoMaterialObligatorio,
        observaciones: nuevoMaterialObservaciones.trim(),
        unidadMedidaId: uId,
        unidadMedida: uNombre,
        esSerializado: prod.esSerializado,
      });
    }

    if (nuevos.length > 0) {
      setMateriales((prev) => [...prev, ...nuevos]);
      notifySuccess(`${nuevos.length} material(es) agregado(s) a la plantilla.`);
    }

    setDialogMaterialOpen(false);
    setMaterialesSeleccionados(new Set());
    setFiltroBusquedaMaterial('');
    setNuevoMaterialCantidad(1);
    setNuevoMaterialUnidadId('');
    setNuevoMaterialObligatorio(false);
    setNuevoMaterialObservaciones('');
  };

  // Manejo de Servicios
  const serviciosDisponiblesDrawer = useMemo(() => {
    const q = filtroBusquedaServicio.trim().toLowerCase();
    let list = productosServicio;
    if (q) {
      list = list.filter(
        (p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
      );
    }
    return list;
  }, [productosServicio, filtroBusquedaServicio]);

  const agregarServiciosFila = () => {
    if (serviciosSeleccionadosDrawer.size === 0) return;

    const nuevos: ServicioLocalItem[] = [];
    for (const prodId of serviciosSeleccionadosDrawer) {
      if (servicios.some((s) => s.productoId === prodId)) continue;
      const prod = catalogoProductos.find((p) => p.id === prodId);
      if (!prod) continue;

      nuevos.push({
        id: `srv-${prod.id}-${Date.now()}`,
        productoId: prod.id,
        productoCodigo: prod.codigo,
        productoNombre: prod.nombre,
      });
    }

    if (nuevos.length > 0) {
      setServicios((prev) => [...prev, ...nuevos]);
      notifySuccess('Servicios agregados a la plantilla.');
    }

    setDialogServicioOpen(false);
    setServiciosSeleccionadosDrawer(new Set());
    setFiltroBusquedaServicio('');
  };

  const eliminarServiciosSeleccionadosTabla = () => {
    if (serviciosSeleccionadosTabla.size === 0) return;
    setServicios((prev) => prev.filter((s) => !serviciosSeleccionadosTabla.has(s.id)));
    setServiciosSeleccionadosTabla(new Set());
  };

  const eliminarTareasSeleccionadasTabla = () => {
    if (tareasSeleccionadasTabla.size === 0) return;
    setTareas((prev) =>
      prev
        .filter((t) => !tareasSeleccionadasTabla.has(t.id))
        .map((t, idx) => ({ ...t, ordenSecuencia: idx + 1 }))
    );
    setTareasSeleccionadasTabla(new Set());
  };

  const eliminarMaterialesSeleccionadosTabla = () => {
    if (materialesSeleccionadosTabla.size === 0) return;
    setMateriales((prev) => prev.filter((m) => !materialesSeleccionadosTabla.has(m.id)));
    setMaterialesSeleccionadosTabla(new Set());
  };

  // Columnas DataGrid para Servicios Asociados (Estilo Dynamics 365)
  const columnasServicios: TableColumnDefinition<ServicioLocalItem>[] = useMemo(
    () => [
      createTableColumn<ServicioLocalItem>({
        columnId: 'select',
        renderHeaderCell: () => {
          const todosSeleccionados =
            servicios.length > 0 &&
            servicios.every((s) => serviciosSeleccionadosTabla.has(s.id));
          return (
            <Checkbox
              checked={todosSeleccionados}
              onChange={(_, d) => {
                if (d.checked) {
                  setServiciosSeleccionadosTabla(new Set(servicios.map((s) => s.id)));
                } else {
                  setServiciosSeleccionadosTabla(new Set());
                }
              }}
            />
          );
        },
        renderCell: (item) => (
          <TableCellLayout>
            <Checkbox
              checked={serviciosSeleccionadosTabla.has(item.id)}
              onChange={(_, d) => {
                setServiciosSeleccionadosTabla((prev) => {
                  const next = new Set(prev);
                  if (d.checked) next.add(item.id);
                  else next.delete(item.id);
                  return next;
                });
              }}
            />
          </TableCellLayout>
        ),
      }),
      createTableColumn<ServicioLocalItem>({
        columnId: 'servicio',
        renderHeaderCell: () => 'Servicio',
        renderCell: (item) => (
          <TableCellLayout>
            <span
              style={{
                color: '#0f6cbd',
                cursor: 'pointer',
                fontSize: 13,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              [{item.productoCodigo}] {item.productoNombre}
            </span>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ServicioLocalItem>({
        columnId: 'duracion',
        renderHeaderCell: () => 'Duración',
        renderCell: () => (
          <TableCellLayout>
            <span>{duracionEstimadaMinutos} min</span>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ServicioLocalItem>({
        columnId: 'orden',
        renderHeaderCell: () => 'Orden de Línea',
        renderCell: (item) => {
          const idx = servicios.findIndex((x) => x.id === item.id);
          return (
            <TableCellLayout>
              <span>{idx + 1}</span>
            </TableCellLayout>
          );
        },
      }),
    ],
    [servicios, serviciosSeleccionadosTabla, duracionEstimadaMinutos]
  );

  // Columnas DataGrid para Checklist de Tareas (Estilo Dynamics 365)
  const columnasTareas: TableColumnDefinition<TareaLocalItem>[] = useMemo(
    () => [
      createTableColumn<TareaLocalItem>({
        columnId: 'select',
        renderHeaderCell: () => {
          const todosSeleccionados =
            tareas.length > 0 &&
            tareas.every((t) => tareasSeleccionadasTabla.has(t.id));
          return (
            <Checkbox
              checked={todosSeleccionados}
              onChange={(_, d) => {
                if (d.checked) {
                  setTareasSeleccionadasTabla(new Set(tareas.map((t) => t.id)));
                } else {
                  setTareasSeleccionadasTabla(new Set());
                }
              }}
            />
          );
        },
        renderCell: (item) => (
          <TableCellLayout>
            <Checkbox
              checked={tareasSeleccionadasTabla.has(item.id)}
              onChange={(_, d) => {
                setTareasSeleccionadasTabla((prev) => {
                  const next = new Set(prev);
                  if (d.checked) next.add(item.id);
                  else next.delete(item.id);
                  return next;
                });
              }}
            />
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaLocalItem>({
        columnId: 'nombre',
        renderHeaderCell: () => 'Nombre',
        renderCell: (item) => (
          <TableCellLayout>
            <span
              style={{
                color: '#0f6cbd',
                cursor: 'pointer',
                fontSize: 13,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              {item.tareaNombre}
            </span>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaLocalItem>({
        columnId: 'tipoTarea',
        renderHeaderCell: () => 'Tipo de Tarea',
        renderCell: (item) => (
          <TableCellLayout>
            <span
              style={{
                color: '#0f6cbd',
                cursor: 'pointer',
                fontSize: 13,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              {item.tareaCodigo ? `[${item.tareaCodigo}] ${item.tareaNombre}` : item.tareaNombre}
            </span>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaLocalItem>({
        columnId: 'descripcion',
        renderHeaderCell: () => 'Descripción',
        renderCell: (item) => {
          const idx = tareas.findIndex((x) => x.id === item.id);
          return (
            <TableCellLayout style={{ width: '100%' }}>
              <Input
                size="small"
                value={item.instrucciones}
                onChange={(_, d) =>
                  setTareas((prev) =>
                    prev.map((t, i) => (i === idx ? { ...t, instrucciones: d.value } : t))
                  )
                }
                style={{ width: '100%' }}
              />
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<TareaLocalItem>({
        columnId: 'duracion',
        renderHeaderCell: () => 'Duración Estimada',
        renderCell: (item) => (
          <TableCellLayout>
            <span>{item.duracionEstimadaMinutos} min</span>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaLocalItem>({
        columnId: 'obligatoria',
        renderHeaderCell: () => 'Obligatoria',
        renderCell: (item) => {
          const idx = tareas.findIndex((x) => x.id === item.id);
          return (
            <TableCellLayout>
              <Checkbox
                checked={item.esObligatoria}
                onChange={(_, d) =>
                  setTareas((prev) =>
                    prev.map((t, i) => (i === idx ? { ...t, esObligatoria: Boolean(d.checked) } : t))
                  )
                }
                label={item.esObligatoria ? 'Sí' : 'No'}
              />
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<TareaLocalItem>({
        columnId: 'evidencia',
        renderHeaderCell: () => 'Foto Evidencia',
        renderCell: (item) => {
          const idx = tareas.findIndex((x) => x.id === item.id);
          return (
            <TableCellLayout>
              <Checkbox
                checked={item.requiereEvidencia}
                onChange={(_, d) =>
                  setTareas((prev) =>
                    prev.map((t, i) => (i === idx ? { ...t, requiereEvidencia: Boolean(d.checked) } : t))
                  )
                }
                label={item.requiereEvidencia ? 'Sí' : 'No'}
              />
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<TareaLocalItem>({
        columnId: 'orden',
        renderHeaderCell: () => 'Orden de Línea',
        renderCell: (item) => {
          const idx = tareas.findIndex((x) => x.id === item.id);
          return (
            <TableCellLayout>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{item.ordenSecuencia}</span>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<ArrowUp16Regular />}
                  disabled={idx === 0}
                  onClick={() => moverTarea(idx, 'arriba')}
                  title="Subir"
                />
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<ArrowDown16Regular />}
                  disabled={idx === tareas.length - 1}
                  onClick={() => moverTarea(idx, 'abajo')}
                  title="Bajar"
                />
              </div>
            </TableCellLayout>
          );
        },
      }),
    ],
    [tareas, tareasSeleccionadasTabla]
  );

  // Columnas DataGrid para Receta de Materiales (Estilo Dynamics 365)
  const columnasMateriales: TableColumnDefinition<MaterialLocalItem>[] = useMemo(
    () => [
      createTableColumn<MaterialLocalItem>({
        columnId: 'select',
        renderHeaderCell: () => {
          const todosSeleccionados =
            materiales.length > 0 &&
            materiales.every((m) => materialesSeleccionadosTabla.has(m.id));
          return (
            <Checkbox
              checked={todosSeleccionados}
              onChange={(_, d) => {
                if (d.checked) {
                  setMaterialesSeleccionadosTabla(new Set(materiales.map((m) => m.id)));
                } else {
                  setMaterialesSeleccionadosTabla(new Set());
                }
              }}
            />
          );
        },
        renderCell: (item) => (
          <TableCellLayout>
            <Checkbox
              checked={materialesSeleccionadosTabla.has(item.id)}
              onChange={(_, d) => {
                setMaterialesSeleccionadosTabla((prev) => {
                  const next = new Set(prev);
                  if (d.checked) next.add(item.id);
                  else next.delete(item.id);
                  return next;
                });
              }}
            />
          </TableCellLayout>
        ),
      }),
      createTableColumn<MaterialLocalItem>({
        columnId: 'producto',
        renderHeaderCell: () => 'Producto',
        renderCell: (item) => (
          <TableCellLayout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  color: '#0f6cbd',
                  cursor: 'pointer',
                  fontSize: 13,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                [{item.productoCodigo}] {item.productoNombre}
              </span>
              {item.esSerializado && (
                <Badge appearance="tint" shape="rounded" color="informative" size="small">
                  Seriado
                </Badge>
              )}
            </div>
          </TableCellLayout>
        ),
      }),
      createTableColumn<MaterialLocalItem>({
        columnId: 'cantidad',
        renderHeaderCell: () => 'Cantidad',
        renderCell: (item) => {
          const idx = materiales.findIndex((x) => x.id === item.id);
          return (
            <TableCellLayout>
              <Input
                size="small"
                type="number"
                min={0.01}
                step="any"
                value={item.cantidadPrevista.toString()}
                onChange={(_, d) =>
                  setMateriales((prev) =>
                    prev.map((m, i) =>
                      i === idx ? { ...m, cantidadPrevista: Math.max(0.01, parseFloat(d.value) || 1) } : m
                    )
                  )
                }
                style={{ width: 80 }}
              />
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<MaterialLocalItem>({
        columnId: 'um',
        renderHeaderCell: () => 'U.M.',
        renderCell: (item) => {
          const idx = materiales.findIndex((x) => x.id === item.id);
          const prod = catalogoProductos.find((p) => p.id === item.productoId);
          const unidadesGrupo = prod?.grupoUnidadMedidaId
            ? catalogoUnidades.filter((u) => u.grupoUnidadMedidaId === prod.grupoUnidadMedidaId)
            : [];
          const currentUnitId =
            item.unidadMedidaId ||
            catalogoUnidades.find((u) => u.nombre.toLowerCase() === item.unidadMedida.toLowerCase())?.id ||
            '';

          return (
            <TableCellLayout>
              <Select
                size="small"
                value={currentUnitId}
                onChange={(_, d) => {
                  const u = catalogoUnidades.find((x) => x.id === d.value);
                  setMateriales((prev) =>
                    prev.map((m, i) =>
                      i === idx
                        ? {
                            ...m,
                            unidadMedidaId: d.value || null,
                            unidadMedida: u?.nombre || m.unidadMedida,
                          }
                        : m
                    )
                  );
                }}
                style={{ minWidth: 105 }}
              >
                {!currentUnitId && (
                  <option value="">{item.unidadMedida || 'Seleccionar...'}</option>
                )}
                {unidadesGrupo.length > 0 ? (
                  <>
                    <optgroup label="Unidades de la familia">
                      {unidadesGrupo.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Otras unidades">
                      {catalogoUnidades
                        .filter((u) => u.grupoUnidadMedidaId !== prod?.grupoUnidadMedidaId)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nombre}
                          </option>
                        ))}
                    </optgroup>
                  </>
                ) : (
                  catalogoUnidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))
                )}
              </Select>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<MaterialLocalItem>({
        columnId: 'obligatorio',
        renderHeaderCell: () => 'Obligatorio',
        renderCell: (item) => {
          const idx = materiales.findIndex((x) => x.id === item.id);
          return (
            <TableCellLayout>
              <Checkbox
                checked={item.esObligatorio}
                onChange={(_, d) =>
                  setMateriales((prev) =>
                    prev.map((m, i) => (i === idx ? { ...m, esObligatorio: Boolean(d.checked) } : m))
                  )
                }
                label={item.esObligatorio ? 'Sí' : 'No'}
              />
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<MaterialLocalItem>({
        columnId: 'orden',
        renderHeaderCell: () => 'Orden de Línea',
        renderCell: (item) => {
          const idx = materiales.findIndex((x) => x.id === item.id);
          return (
            <TableCellLayout>
              <span>{idx + 1}</span>
            </TableCellLayout>
          );
        },
      }),
    ],
    [materiales, materialesSeleccionadosTabla, catalogoUnidades, catalogoProductos]
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Cargando plantilla de trabajo..." size="large" />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} />

      {/* Barra de Comandos */}
      <D365CommandBar ariaLabel="Barra de comandos de plantilla de trabajo">
        <D365CommandButton
          icon={<ArrowLeft16Regular />}
          tone="brand"
          aria-label="Atrás"
          title="Atrás"
          onClick={() => navigate('/servicio-campo/plantillas-trabajo')}
        />
        <D365CommandDivider />
        <D365CommandButton
          icon={<Save16Regular />}
          tone="save"
          disabled={saving}
          onClick={() => void guardar(false)}
        >
          Guardar
        </D365CommandButton>
        <D365CommandButton
          icon={<SaveMultiple16Regular />}
          tone="save"
          disabled={saving}
          onClick={() => void guardar(true)}
        >
          Guardar y cerrar
        </D365CommandButton>
        <D365CommandDivider />
        <D365CommandButton
          icon={<Add16Regular />}
          tone="create"
          onClick={() => navigate('/servicio-campo/plantillas-trabajo/nuevo')}
        >
          Nuevo
        </D365CommandButton>
        {isEditMode && (
          <>
            <D365CommandButton
              disabled={saving}
              onClick={() => void cambiarEstado()}
            >
              {activo ? 'Desactivar' : 'Activar'}
            </D365CommandButton>
            <D365CommandButton
              icon={<Delete16Regular />}
              tone="danger"
              disabled={saving}
              onClick={() => void eliminar()}
            >
              Eliminar
            </D365CommandButton>
          </>
        )}
      </D365CommandBar>

      {/* Alerta de Mensajes */}
      {statusMessage && (
        <div style={{ padding: '8px 16px' }}>
          <D365MessageBar intent={statusMessage.type} onDismiss={() => setStatusMessage(null)}>
            {statusMessage.text}
          </D365MessageBar>
        </div>
      )}

      {/* Encabezado Principal D365 */}
      <D365EntityHeader
        title={savedTitle || (isEditMode ? 'Plantilla de Trabajo' : 'Nuevo')}
        subtitle={savedSubtitle}
        avatarIcon={<DocumentBulletList20Regular />}
        avatarSize={48}
        metadata={[
          {
            label: 'Servicios',
            value: `${savedCantidadServicios} servicio${savedCantidadServicios === 1 ? '' : 's'}`,
          },
          {
            label: 'Duración Estimada',
            value: `${savedDuracionMinutos} min`,
          },
          {
            label: 'Composición',
            value: `${savedCantidadTareas} tareas / ${savedCantidadMateriales} materiales`,
          },
          {
            label: 'Estado',
            value: activo ? 'Activo' : 'Inactivo',
          },
        ]}
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, d) => setSelectedTab(d.value as 'general' | 'servicios' | 'tareas' | 'materiales')}
          >
            <Tab value="general">General</Tab>
            <Tab value="servicios">Servicios</Tab>
            <Tab value="tareas">Tareas de Servicio</Tab>
            <Tab value="materiales">Productos</Tab>
          </TabList>
        }
      />

      {/* Contenido de Pestañas */}
      <div className={styles.contentBody}>
        {selectedTab === 'general' && (
          <div className={styles.halfCardWrapper}>
            <div className={styles.card}>
              <Text size={400} weight="semibold" style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, paddingBottom: 8, display: 'block' }}>
                Identificación de la Plantilla
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                <D365FormField
                  label="Código de Plantilla"
                  info="Código único de la plantilla (dejar vacío para asignación automática)."
                >
                  <Input
                    value={codigo}
                    onChange={(_, d) => setCodigo(d.value)}
                  />
                </D365FormField>

                <D365FormField
                  label="Nombre de la Plantilla"
                  required
                  error={errors.nombre}
                  info="Nombre descriptivo de la receta técnica de trabajo."
                >
                  <Input
                    value={nombre}
                    onChange={(_, d) => setNombre(d.value)}
                  />
                </D365FormField>

                <D365FormField
                  label="Duración Estimada (min)"
                  required
                  error={errors.duracion}
                  info="Suma estimada de tiempos en campo para la ejecución de este servicio."
                >
                  <Input
                    type="number"
                    min={1}
                    value={duracionEstimadaMinutos.toString()}
                    onChange={(_, d) => setDuracionEstimadaMinutos(Math.max(1, parseInt(d.value) || 1))}
                  />
                </D365FormField>

                <D365FormField
                  label="Descripción"
                  info="Resumen de los lineamientos técnicos u objetivos de esta plantilla."
                >
                  <Textarea
                    value={descripcion}
                    onChange={(_, d) => setDescripcion(d.value)}
                    rows={3}
                  />
                </D365FormField>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'servicios' && (
          <div
            style={{
              backgroundColor: tokens.colorNeutralBackground1,
              border: `1px solid ${tokens.colorNeutralStroke2}`,
              borderRadius: '2px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Subgrid Command Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                minHeight: '38px',
                padding: '0 8px',
                borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                backgroundColor: tokens.colorNeutralBackground1,
                gap: '4px',
              }}
            >
              {serviciosSeleccionadosTabla.size > 0 && (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Delete16Regular />}
                  onClick={eliminarServiciosSeleccionadosTabla}
                >
                  Eliminar
                </Button>
              )}
              <Button
                appearance="subtle"
                size="small"
                icon={<Add16Regular />}
                onClick={() => setDialogServicioOpen(true)}
              >
                Nuevo Servicio de Plantilla...
              </Button>
            </div>

            {/* Subgrid Table */}
            <div style={{ overflowX: 'auto' }}>
              <DataGrid
                items={servicios}
                columns={columnasServicios}
                getRowId={(s) => s.id}
                style={{ width: '100%', minWidth: 650 }}
              >
                <DataGridHeader>
                  <DataGridRow>
                    {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
                  </DataGridRow>
                </DataGridHeader>
                {servicios.length === 0 ? (
                  <div
                    style={{
                      padding: '36px 16px',
                      textAlign: 'center',
                      color: tokens.colorNeutralForeground3,
                      fontSize: '13px',
                    }}
                  >
                    No hay datos disponibles
                  </div>
                ) : (
                  <DataGridBody<ServicioLocalItem>>
                    {({ item, rowId }) => (
                      <DataGridRow<ServicioLocalItem> key={rowId}>
                        {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                )}
              </DataGrid>
            </div>

            {/* Subgrid Footer */}
            <div
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                color: tokens.colorNeutralForeground3,
                borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
                backgroundColor: tokens.colorNeutralBackground1,
              }}
            >
              Filas: {servicios.length}
            </div>
          </div>
        )}

        {selectedTab === 'tareas' && (
          <div
            style={{
              backgroundColor: tokens.colorNeutralBackground1,
              border: `1px solid ${tokens.colorNeutralStroke2}`,
              borderRadius: '2px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Subgrid Command Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                minHeight: '38px',
                padding: '0 8px',
                borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                backgroundColor: tokens.colorNeutralBackground1,
                gap: '4px',
              }}
            >
              {tareasSeleccionadasTabla.size > 0 && (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Delete16Regular />}
                  onClick={eliminarTareasSeleccionadasTabla}
                >
                  Eliminar
                </Button>
              )}
              <Button
                appearance="subtle"
                size="small"
                icon={<Add16Regular />}
                onClick={() => setDialogTareaOpen(true)}
              >
                Nueva Tarea de Servicio...
              </Button>
            </div>

            {/* Subgrid Table */}
            <div style={{ overflowX: 'auto' }}>
              <DataGrid
                items={tareas}
                columns={columnasTareas}
                getRowId={(t) => t.id}
                style={{ width: '100%', minWidth: 650 }}
              >
                <DataGridHeader>
                  <DataGridRow>
                    {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
                  </DataGridRow>
                </DataGridHeader>
                {tareas.length === 0 ? (
                  <div
                    style={{
                      padding: '36px 16px',
                      textAlign: 'center',
                      color: tokens.colorNeutralForeground3,
                      fontSize: '13px',
                    }}
                  >
                    No hay datos disponibles
                  </div>
                ) : (
                  <DataGridBody<TareaLocalItem>>
                    {({ item, rowId }) => (
                      <DataGridRow<TareaLocalItem> key={rowId}>
                        {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                )}
              </DataGrid>
            </div>

            {/* Subgrid Footer */}
            <div
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                color: tokens.colorNeutralForeground3,
                borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
                backgroundColor: tokens.colorNeutralBackground1,
              }}
            >
              Filas: {tareas.length}
            </div>
          </div>
        )}

        {selectedTab === 'materiales' && (
          <div
            style={{
              backgroundColor: tokens.colorNeutralBackground1,
              border: `1px solid ${tokens.colorNeutralStroke2}`,
              borderRadius: '2px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Subgrid Command Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                minHeight: '38px',
                padding: '0 8px',
                borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                backgroundColor: tokens.colorNeutralBackground1,
                gap: '4px',
              }}
            >
              {materialesSeleccionadosTabla.size > 0 && (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Delete16Regular />}
                  onClick={eliminarMaterialesSeleccionadosTabla}
                >
                  Eliminar
                </Button>
              )}
              <Button
                appearance="subtle"
                size="small"
                icon={<Add16Regular />}
                onClick={() => setDialogMaterialOpen(true)}
              >
                Nuevo Producto de Plantilla...
              </Button>
            </div>

            {/* Subgrid Table */}
            <div style={{ overflowX: 'auto' }}>
              <DataGrid
                items={materiales}
                columns={columnasMateriales}
                getRowId={(m) => m.id}
                style={{ width: '100%', minWidth: 650 }}
              >
                <DataGridHeader>
                  <DataGridRow>
                    {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
                  </DataGridRow>
                </DataGridHeader>
                {materiales.length === 0 ? (
                  <div
                    style={{
                      padding: '36px 16px',
                      textAlign: 'center',
                      color: tokens.colorNeutralForeground3,
                      fontSize: '13px',
                    }}
                  >
                    No hay datos disponibles
                  </div>
                ) : (
                  <DataGridBody<MaterialLocalItem>>
                    {({ item, rowId }) => (
                      <DataGridRow<MaterialLocalItem> key={rowId}>
                        {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                )}
              </DataGrid>
            </div>

            {/* Subgrid Footer */}
            <div
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                color: tokens.colorNeutralForeground3,
                borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
                backgroundColor: tokens.colorNeutralBackground1,
              }}
            >
              Filas: {materiales.length}
            </div>
          </div>
        )}
      </div>

      {/* Panel Lateral (Drawer Derecho) para agregar servicios con Selección Múltiple */}
      <OverlayDrawer
        position="end"
        open={dialogServicioOpen}
        onOpenChange={(_, { open }) => setDialogServicioOpen(open)}
        style={{ width: 480, maxWidth: '95vw' }}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDialogServicioOpen(false)}
              />
            }
          >
            Agregar Servicios a la Plantilla
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px' }}>
          {/* Buscador de servicios */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text weight="semibold" size={200}>Buscar Servicio de Catálogo</Text>
            <Input
              contentBefore={<Search16Regular />}
              placeholder="Filtrar por código o nombre..."
              value={filtroBusquedaServicio}
              onChange={(_, d) => setFiltroBusquedaServicio(d.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Lista de servicios con Checkbox */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text weight="semibold" size={200}>
                Servicios Disponibles ({serviciosDisponiblesDrawer.length})
              </Text>
              {serviciosDisponiblesDrawer.length > 0 && (
                <Button
                  appearance="subtle"
                  size="small"
                  onClick={() => {
                    const todosSeleccionados = serviciosDisponiblesDrawer.every((s) => serviciosSeleccionadosDrawer.has(s.id));
                    if (todosSeleccionados) {
                      setServiciosSeleccionadosDrawer((prev) => {
                        const copy = new Set(prev);
                        serviciosDisponiblesDrawer.forEach((s) => copy.delete(s.id));
                        return copy;
                      });
                    } else {
                      setServiciosSeleccionadosDrawer((prev) => {
                        const copy = new Set(prev);
                        serviciosDisponiblesDrawer.forEach((s) => copy.add(s.id));
                        return copy;
                      });
                    }
                  }}
                >
                  {serviciosDisponiblesDrawer.every((s) => serviciosSeleccionadosDrawer.has(s.id))
                    ? 'Deseleccionar todas'
                    : 'Seleccionar todas'}
                </Button>
              )}
            </div>

            <div
              style={{
                maxHeight: 340,
                overflowY: 'auto',
                border: `1px solid ${tokens.colorNeutralStroke1}`,
                borderRadius: tokens.borderRadiusMedium,
                padding: '4px 8px',
                backgroundColor: tokens.colorNeutralBackground1,
              }}
            >
              {serviciosDisponiblesDrawer.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: tokens.colorNeutralForeground4, fontSize: 13 }}>
                  No se encontraron servicios en el catálogo.
                </div>
              ) : (
                serviciosDisponiblesDrawer.map((p) => {
                  const isChecked = serviciosSeleccionadosDrawer.has(p.id);
                  const yaAgregado = servicios.some((item) => item.productoId === p.id);
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 4px',
                        borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
                        opacity: yaAgregado ? 0.6 : 1,
                      }}
                    >
                      <Checkbox
                        checked={isChecked || yaAgregado}
                        disabled={yaAgregado}
                        onChange={(_, d) => {
                          setServiciosSeleccionadosDrawer((prev) => {
                            const next = new Set(prev);
                            if (d.checked) {
                              next.add(p.id);
                            } else {
                              next.delete(p.id);
                            }
                            return next;
                          });
                        }}
                        label={
                          <div>
                            <Text size={200} weight={isChecked ? 'semibold' : 'regular'}>
                              [{p.codigo}] {p.nombre}
                            </Text>
                            {yaAgregado && (
                              <Text size={100} style={{ color: tokens.colorNeutralForeground4, display: 'block' }}>
                                (Ya agregado en la plantilla)
                              </Text>
                            )}
                          </div>
                        }
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter style={{ borderTop: `1px solid ${tokens.colorNeutralStroke2}`, padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button appearance="secondary" onClick={() => setDialogServicioOpen(false)}>
            Cancelar
          </Button>
          <Button
            appearance="primary"
            icon={<Checkmark16Regular />}
            disabled={serviciosSeleccionadosDrawer.size === 0}
            onClick={agregarServiciosFila}
          >
            Agregar
          </Button>
        </DrawerFooter>
      </OverlayDrawer>

      {/* Panel Lateral (Drawer Derecho) para agregar tareas con Selección Múltiple */}
      <OverlayDrawer
        position="end"
        open={dialogTareaOpen}
        onOpenChange={(_, { open }) => setDialogTareaOpen(open)}
        style={{ width: 480, maxWidth: '95vw' }}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDialogTareaOpen(false)}
              />
            }
          >
            Agregar Tareas a la Plantilla
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px' }}>
          {/* Buscador de tareas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text weight="semibold" size={200}>Buscar Tarea del Catálogo</Text>
            <Input
              contentBefore={<Search16Regular />}
              placeholder="Filtrar por código o nombre..."
              value={filtroBusquedaTarea}
              onChange={(_, d) => setFiltroBusquedaTarea(d.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Lista de tareas con Checkbox */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text weight="semibold" size={200}>
                Catálogo de Tareas ({tareasFiltradas.length})
              </Text>
              {tareasFiltradas.length > 0 && (
                <Button
                  appearance="subtle"
                  size="small"
                  onClick={() => {
                    const todasSeleccionadas = tareasFiltradas.every((t) => tareasSeleccionadas.has(t.id));
                    if (todasSeleccionadas) {
                      setTareasSeleccionadas((prev) => {
                        const copy = new Set(prev);
                        tareasFiltradas.forEach((t) => copy.delete(t.id));
                        return copy;
                      });
                    } else {
                      setTareasSeleccionadas((prev) => {
                        const copy = new Set(prev);
                        tareasFiltradas.forEach((t) => copy.add(t.id));
                        return copy;
                      });
                    }
                  }}
                >
                  {tareasFiltradas.every((t) => tareasSeleccionadas.has(t.id))
                    ? 'Deseleccionar todas'
                    : 'Seleccionar todas'}
                </Button>
              )}
            </div>

            <div
              style={{
                maxHeight: 220,
                overflowY: 'auto',
                border: `1px solid ${tokens.colorNeutralStroke1}`,
                borderRadius: tokens.borderRadiusMedium,
                padding: '4px 8px',
                backgroundColor: tokens.colorNeutralBackground1,
              }}
            >
              {tareasFiltradas.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: tokens.colorNeutralForeground4, fontSize: 13 }}>
                  No se encontraron tareas en el catálogo.
                </div>
              ) : (
                tareasFiltradas.map((t) => {
                  const isChecked = tareasSeleccionadas.has(t.id);
                  const yaAgregada = tareas.some((item) => item.tareaId === t.id);
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 4px',
                        borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
                        opacity: yaAgregada ? 0.6 : 1,
                      }}
                    >
                      <Checkbox
                        checked={isChecked || yaAgregada}
                        disabled={yaAgregada}
                        onChange={(_, d) => {
                          setTareasSeleccionadas((prev) => {
                            const next = new Set(prev);
                            if (d.checked) {
                              next.add(t.id);
                            } else {
                              next.delete(t.id);
                            }
                            return next;
                          });
                        }}
                        label={
                          <div>
                            <Text size={200} weight={isChecked ? 'semibold' : 'regular'}>
                              [{t.codigo}] {t.nombre}
                            </Text>
                            {yaAgregada && (
                              <Text size={100} style={{ color: tokens.colorNeutralForeground4, display: 'block' }}>
                                (Ya agregada en la plantilla)
                              </Text>
                            )}
                          </div>
                        }
                      />
                      <Badge appearance="tint" color="informative" size="small">
                        {t.duracionEstimadaMinutos} min
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* O Crear Tarea Rápida adicional */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text weight="semibold" size={200}>O Crear Nueva Tarea Rápida</Text>
            <Input
              placeholder="Nombre de la nueva tarea..."
              value={nuevaTareaNombre}
              onChange={(_, d) => setNuevaTareaNombre(d.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text weight="semibold" size={200}>Instrucciones Técnicas Predeterminadas</Text>
            <Input
              placeholder="Instrucciones para el técnico..."
              value={nuevaTareaInstrucciones}
              onChange={(_, d) => setNuevaTareaInstrucciones(d.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            <Checkbox
              checked={nuevaTareaObligatoria}
              onChange={(_, d) => setNuevaTareaObligatoria(Boolean(d.checked))}
              label="Tarea obligatoria para finalizar el trabajo"
            />
            <Checkbox
              checked={nuevaTareaEvidencia}
              onChange={(_, d) => setNuevaTareaEvidencia(Boolean(d.checked))}
              label="Exigir fotografía / evidencia antes de marcar completada"
            />
          </div>
        </DrawerBody>

        <DrawerFooter style={{ borderTop: `1px solid ${tokens.colorNeutralStroke2}`, padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button appearance="secondary" onClick={() => setDialogTareaOpen(false)}>
            Cancelar
          </Button>
          <Button
            appearance="primary"
            icon={<Checkmark16Regular />}
            disabled={tareasSeleccionadas.size === 0 && !nuevaTareaNombre.trim()}
            onClick={() => void agregarTareaFila()}
          >
            Agregar
          </Button>
        </DrawerFooter>
      </OverlayDrawer>

      {/* Panel Lateral (Drawer Derecho) para agregar materiales con Selección Múltiple */}
      <OverlayDrawer
        position="end"
        open={dialogMaterialOpen}
        onOpenChange={(_, { open }) => setDialogMaterialOpen(open)}
        style={{ width: 480, maxWidth: '95vw' }}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDialogMaterialOpen(false)}
              />
            }
          >
            Agregar Materiales / Equipos
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px' }}>
          {/* Buscador de materiales */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text weight="semibold" size={200}>Buscar Producto / Repuesto / Equipo</Text>
            <Input
              contentBefore={<Search16Regular />}
              placeholder="Filtrar por código o nombre..."
              value={filtroBusquedaMaterial}
              onChange={(_, d) => setFiltroBusquedaMaterial(d.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Lista con checkboxes para seleccionar múltiples */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text weight="semibold" size={200}>
                Catálogo de Materiales ({materialesFiltrados.length})
              </Text>
              {materialesFiltrados.length > 0 && (
                <Button
                  appearance="subtle"
                  size="small"
                  onClick={() => {
                    const todosSeleccionados = materialesFiltrados.every((p) => materialesSeleccionados.has(p.id));
                    if (todosSeleccionados) {
                      setMaterialesSeleccionados((prev) => {
                        const copy = new Set(prev);
                        materialesFiltrados.forEach((p) => copy.delete(p.id));
                        return copy;
                      });
                    } else {
                      setMaterialesSeleccionados((prev) => {
                        const copy = new Set(prev);
                        materialesFiltrados.forEach((p) => copy.add(p.id));
                        return copy;
                      });
                    }
                  }}
                >
                  {materialesFiltrados.every((p) => materialesSeleccionados.has(p.id))
                    ? 'Deseleccionar todos'
                    : 'Seleccionar todos'}
                </Button>
              )}
            </div>

            <div
              style={{
                maxHeight: 240,
                overflowY: 'auto',
                border: `1px solid ${tokens.colorNeutralStroke1}`,
                borderRadius: tokens.borderRadiusMedium,
                padding: '4px 8px',
                backgroundColor: tokens.colorNeutralBackground1,
              }}
            >
              {materialesFiltrados.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: tokens.colorNeutralForeground4, fontSize: 13 }}>
                  No se encontraron materiales que coincidan con la búsqueda.
                </div>
              ) : (
                materialesFiltrados.map((p) => {
                  const isChecked = materialesSeleccionados.has(p.id);
                  const yaAgregado = materiales.some((m) => m.productoId === p.id);
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 4px',
                        borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
                        opacity: yaAgregado ? 0.6 : 1,
                      }}
                    >
                      <Checkbox
                        checked={isChecked || yaAgregado}
                        disabled={yaAgregado}
                        onChange={(_, d) => {
                          setMaterialesSeleccionados((prev) => {
                            const next = new Set(prev);
                            if (d.checked) {
                              next.add(p.id);
                            } else {
                              next.delete(p.id);
                            }
                            return next;
                          });
                        }}
                        label={
                          <div>
                            <Text size={200} weight={isChecked ? 'semibold' : 'regular'}>
                              [{p.codigo}] {p.nombre}
                            </Text>
                            {yaAgregado && (
                              <Text size={100} style={{ color: tokens.colorNeutralForeground4, display: 'block' }}>
                                (Ya agregado en la plantilla)
                              </Text>
                            )}
                          </div>
                        }
                      />
                      {p.esSerializado && (
                        <Badge appearance="tint" shape="rounded" color="informative" size="small">
                          Seriado
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Parámetros a aplicar al lote seleccionado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text weight="semibold" size={200}>Cantidad Sugerida *</Text>
              <Input
                type="number"
                min={0.01}
                step="any"
                value={nuevoMaterialCantidad.toString()}
                onChange={(_, d) => setNuevoMaterialCantidad(parseFloat(d.value) || 1)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text weight="semibold" size={200}>Unidad de Medida</Text>
              <Select
                value={nuevoMaterialUnidadId}
                onChange={(_, d) => setNuevoMaterialUnidadId(d.value)}
                style={{ width: '100%' }}
              >
                {!nuevoMaterialUnidadId && (
                  <option value="">Seleccionar U.M...</option>
                )}
                {unidadesDisponiblesDrawer.unidadesGrupo.length > 0 ? (
                  <>
                    <optgroup label="Unidades de la familia">
                      {unidadesDisponiblesDrawer.unidadesGrupo.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Otras unidades">
                      {unidadesDisponiblesDrawer.otrasUnidades.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  catalogoUnidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))
                )}
              </Select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text weight="semibold" size={200}>Observaciones / Aplicación</Text>
            <Input
              value={nuevoMaterialObservaciones}
              onChange={(_, d) => setNuevoMaterialObservaciones(d.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginTop: 4 }}>
            <Checkbox
              checked={nuevoMaterialObligatorio}
              onChange={(_, d) => setNuevoMaterialObligatorio(Boolean(d.checked))}
              label="Consumo obligatorio para liquidar la orden"
            />
          </div>
        </DrawerBody>

        <DrawerFooter style={{ borderTop: `1px solid ${tokens.colorNeutralStroke2}`, padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button appearance="secondary" onClick={() => setDialogMaterialOpen(false)}>
            Cancelar
          </Button>
          <Button
            appearance="primary"
            icon={<Checkmark16Regular />}
            disabled={materialesSeleccionados.size === 0 || nuevoMaterialCantidad <= 0}
            onClick={agregarMaterialFila}
          >
            Agregar
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
    </div>
  );
}
