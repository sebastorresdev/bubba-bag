import { D365FormContent } from '../../../../components/common/D365FormContent';
import { useValidationFocus } from '../../../../hooks/useValidationFocus';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { confirmAction } from '../../../../services/uiFeedback';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Checkbox,
  Textarea,
  Tab,
  TabList,
  Text,
  Badge,
  Button,
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
  Card,
  tokens,
  Skeleton,
  SkeletonItem,
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
import { ConfiguracionServicioService } from '../services/configuracionServicio.service';
import type {
  ConfiguracionServicioListadoDto,
  GuardarConfiguracionServicioDto,
  TareaDto,
} from '../types/configuracionServicio.types';
import { ProductoService } from '../../../inventario/productos/services/producto.service';
import type { ProductoDto } from '../../../inventario/productos/types/producto.types';
import { UnidadMedidaService } from '../../../inventario/unidades-medida/services/unidadMedida.service';
import type { UnidadMedidaDto } from '../../../inventario/unidades-medida/types/unidadMedida.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365SubGrid } from '../../../../components/common/D365SubGrid';
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

export function ConfiguracionServicioFormPage() {
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
  const [nombre, setNombre] = useState('');
  const [productoId, setProductoId] = useState('');
  const [duracionEstimadaMinutos, setDuracionEstimadaMinutos] = useState<number>(60);
  const [puntos, setPuntos] = useState<string>('1');
  const [slaHorasResolucion, setSlaHorasResolucion] = useState<number | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);

  // Títulos y tarjetas estáticas del encabezado (solo cambian al cargar o guardar)
  const [savedTitle, setSavedTitle] = useState(isEditMode ? '' : 'Nuevo');
  const [savedSubtitle, setSavedSubtitle] = useState('Receta Técnica • Ficha de configuración del servicio');
  const [savedServicioNombre, setSavedServicioNombre] = useState('');
  const [savedDuracionMinutos, setSavedDuracionMinutos] = useState(60);
  const [savedCantidadTareas, setSavedCantidadTareas] = useState(0);
  const [savedCantidadMateriales, setSavedCantidadMateriales] = useState(0);

  // Colecciones hijas
  const [tareas, setTareas] = useState<TareaLocalItem[]>([]);
  const [materiales, setMateriales] = useState<MaterialLocalItem[]>([]);

  // Catálogos
  const [catalogoProductos, setCatalogoProductos] = useState<ProductoDto[]>([]);
  const [catalogoTareas, setCatalogoTareas] = useState<TareaDto[]>([]);
  const [configuracionesExistentes, setConfiguracionesExistentes] = useState<ConfiguracionServicioListadoDto[]>([]);

  // UI state
  const [selectedTab, setSelectedTab] = useState<'general' | 'tareas' | 'materiales'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
  const [nuevoMaterialCantidad, setNuevoMaterialCantidad] = useState<string>('');
  const [nuevoMaterialUnidadId, setNuevoMaterialUnidadId] = useState<string>('');
  const [nuevoMaterialObligatorio, setNuevoMaterialObligatorio] = useState(false);
  const [nuevoMaterialObservaciones, setNuevoMaterialObservaciones] = useState('');
  const focusValidation = useValidationFocus();
  const draft = useUnsavedChanges({ nombre,productoId,duracionEstimadaMinutos,slaHorasResolucion,puntos,descripcion,tareas,materiales }, !loading);


  // Carga inicial
  const cargarCatalogosYDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [prods, tars, ums, plantilla, configs] = await Promise.all([
        ProductoService.getProductos(undefined, undefined, true),
        ConfiguracionServicioService.getTareas({ soloActivas: true }),
        UnidadMedidaService.getUnidadesMedida(undefined, true),
        isEditMode && id ? ConfiguracionServicioService.getPlantillaById(id) : Promise.resolve(null),
        ConfiguracionServicioService.getPlantillas({ soloActivos: true }),
      ]);
      setCatalogoProductos(prods);
      setCatalogoTareas(tars);
      setCatalogoUnidades(ums);
      setConfiguracionesExistentes(configs || []);

      if (plantilla) {
        setNombre(plantilla.nombre);
        setSavedTitle(plantilla.nombre);
        setSavedSubtitle('Receta Técnica • Ficha de configuración del servicio');
        setSavedDuracionMinutos(plantilla.duracionEstimadaMinutos);
        setSavedCantidadTareas(plantilla.tareas.length);
        setSavedCantidadMateriales(plantilla.materiales.length);
        setDuracionEstimadaMinutos(plantilla.duracionEstimadaMinutos);
        setPuntos((plantilla.puntos ?? 1).toString());
        setSlaHorasResolucion(plantilla.slaHorasResolucion ?? null);
        setDescripcion(plantilla.descripcion || '');
        setActivo(plantilla.activo);

        setProductoId(plantilla.productoId || '');
        const prodMatch = prods.find((p) => p.id === plantilla.productoId);
        setSavedServicioNombre(prodMatch?.nombre || plantilla.productoNombre || '');

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

  // Lista de servicios de catálogo que NO tienen configuración activa
  const productosServicio = useMemo(() => {
    const srvs = catalogoProductos.filter((p) => p.tipo === 'Servicio' || p.tipo === 3);
    const idsConConfig = new Set(
      configuracionesExistentes
        .filter((c) => c.activo && (!isEditMode || c.id !== id))
        .map((c) => c.productoId)
    );
    return srvs.filter((p) => !idsConConfig.has(p.id) || (isEditMode && p.id === productoId));
  }, [catalogoProductos, configuracionesExistentes, isEditMode, id, productoId]);

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
    if (!productoId) errs.productoId = 'Debe seleccionar un servicio técnico del catálogo.';
    if (!nombre.trim()) errs.nombre = 'El nombre de la configuración es obligatorio.';
    if (duracionEstimadaMinutos < 1) errs.duracion = 'La duración estimada debe ser al menos 1 minuto.';
    const ptsNum = parseFloat(puntos.replace(',', '.'));
    if (isNaN(ptsNum) || ptsNum <= 0) errs.puntos = 'Los puntos deben ser un número mayor a 0 (ej. 0.5 o 1).';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const guardar = async (cerrarAlFinal = false): Promise<string | null> => {
    const savedDraft = draft.capture();
    if (!validar()) {
      setSelectedTab('general'); focusValidation();
      setStatusMessage({ type: 'error', text: 'Complete los campos obligatorios del formulario.' });
      setSelectedTab('general');
      return null;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const ptsNum = parseFloat(puntos.replace(',', '.'));
      const dto: GuardarConfiguracionServicioDto = {
        nombre: nombre.trim(),
        productoId,
        duracionEstimadaMinutos,
        slaHorasResolucion: slaHorasResolucion ? Number(slaHorasResolucion) : null,
        puntos: !isNaN(ptsNum) && ptsNum > 0 ? ptsNum : 1.0,
        descripcion: descripcion.trim() || undefined,
        esPredeterminada: false,
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

      const prodMatch = catalogoProductos.find((p) => p.id === productoId);
      const servicioNombre = prodMatch?.nombre || '';

      let savedId = id;
      if (isEditMode && id) {
        await ConfiguracionServicioService.actualizarPlantilla(id, dto);
        setSavedTitle(nombre.trim());
        setSavedSubtitle('Receta Técnica • Ficha de configuración del servicio');
        setSavedServicioNombre(servicioNombre);
        setSavedDuracionMinutos(duracionEstimadaMinutos);
        setSavedCantidadTareas(tareas.length);
        setSavedCantidadMateriales(materiales.length);
        draft.markSaved(savedDraft);
        notifySuccess('Configuración del servicio actualizada con éxito.');
      } else {
        const res = await ConfiguracionServicioService.crearPlantilla(dto);
        savedId = res.id;
        setSavedTitle(nombre.trim());
        setSavedSubtitle('Receta Técnica • Ficha de configuración del servicio');
        setSavedServicioNombre(servicioNombre);
        setSavedDuracionMinutos(duracionEstimadaMinutos);
        setSavedCantidadTareas(tareas.length);
        setSavedCantidadMateriales(materiales.length);
        draft.markSaved(savedDraft);
        notifySuccess('Configuración del servicio creada con éxito.');
      }

      if (cerrarAlFinal) {
        draft.markSaved(savedDraft);
        navigate('/servicio-campo/configuraciones-servicio');
      } else if (!isEditMode && savedId) {
        draft.markSaved(savedDraft);
        navigate(`/servicio-campo/configuraciones-servicio/${savedId}`, { replace: true });
      }

      return savedId ?? null;
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al guardar la configuración.',
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
      await ConfiguracionServicioService.cambiarEstado(id, !activo);
      setActivo(!activo);
      notifySuccess(`Configuración ${!activo ? 'activada' : 'desactivada'} correctamente.`);
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
    if (!await confirmAction('¿Está seguro de eliminar esta configuración del servicio?')) return;
    try {
      setSaving(true);
      await ConfiguracionServicioService.eliminarPlantilla(id);
      (draft.markSaved(), navigate('/servicio-campo/configuraciones-servicio'));
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al eliminar la configuración.',
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
        const res = await ConfiguracionServicioService.crearTarea({
          nombre: nuevaTareaNombre.trim(),
          duracionEstimadaMinutos: 15,
          requiereEvidenciaFotografica: nuevaTareaEvidencia,
        });
        const updatedTars = await ConfiguracionServicioService.getTareas({ soloActivas: true });
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
      notifySuccess(`${nuevosItems.length} tarea(s) agregada(s) a la configuración.`);
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
  }, [primerProductoSeleccionado, unidadesDisponiblesDrawer, catalogoUnidades, nuevoMaterialUnidadId]);

  const agregarMaterialFila = () => {
    const cantidadNum = parseFloat(nuevoMaterialCantidad);
    if (materialesSeleccionados.size === 0 || !nuevoMaterialCantidad.trim() || isNaN(cantidadNum) || cantidadNum <= 0) return;

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
        cantidadPrevista: cantidadNum,
        esObligatorio: nuevoMaterialObligatorio,
        observaciones: nuevoMaterialObservaciones.trim(),
        unidadMedidaId: uId,
        unidadMedida: uNombre,
        esSerializado: prod.esSerializado,
      });
    }

    if (nuevos.length > 0) {
      setMateriales((prev) => [...prev, ...nuevos]);
      notifySuccess(`${nuevos.length} material(es) agregado(s) a la configuración.`);
    }

    setDialogMaterialOpen(false);
    setMaterialesSeleccionados(new Set());
    setFiltroBusquedaMaterial('');
    setNuevoMaterialCantidad('');
    setNuevoMaterialUnidadId('');
    setNuevoMaterialObligatorio(false);
    setNuevoMaterialObservaciones('');
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



  // Columnas DataGrid para Checklist de Tareas (Estilo Dynamics 365)
  const columnasTareas: TableColumnDefinition<TareaLocalItem>[] = useMemo(
    () => [
      createTableColumn<TareaLocalItem>({
        columnId: 'orden',
        renderHeaderCell: () => '#',
        renderCell: (item) => {
          const idx = tareas.findIndex((x) => x.id === item.id);
          return (
            <TableCellLayout>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text weight="semibold">{item.ordenSecuencia}</Text>
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
      createTableColumn<TareaLocalItem>({
        columnId: 'nombre',
        renderHeaderCell: () => 'Tarea / Verificación',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text weight="semibold">{item.tareaNombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaLocalItem>({
        columnId: 'duracion',
        renderHeaderCell: () => 'Duración',
        renderCell: (item) => (
          <TableCellLayout>
            <Text>{item.duracionEstimadaMinutos} min</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaLocalItem>({
        columnId: 'obligatoria',
        renderHeaderCell: () => 'Obligatoria',
        renderCell: (item) => (
          <TableCellLayout>
            <Badge appearance="tint" shape="rounded" color={item.esObligatoria ? 'danger' : 'subtle'}>
              {item.esObligatoria ? 'Obligatoria' : 'Opcional'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaLocalItem>({
        columnId: 'evidencia',
        renderHeaderCell: () => 'Foto Evidencia',
        renderCell: (item) => (
          <TableCellLayout>
            <Badge appearance="tint" shape="rounded" color={item.requiereEvidencia ? 'informative' : 'subtle'}>
              {item.requiereEvidencia ? 'Requiere foto' : 'No'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaLocalItem>({
        columnId: 'instrucciones',
        renderHeaderCell: () => 'Instrucciones Técnicas',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.instrucciones || '—'}</Text>
          </TableCellLayout>
        ),
      }),
    ],
    [tareas, moverTarea]
  );

  // Columnas DataGrid para Receta de Materiales (Estilo Dynamics 365)
  const columnasMateriales: TableColumnDefinition<MaterialLocalItem>[] = useMemo(
    () => [
      createTableColumn<MaterialLocalItem>({
        columnId: 'orden',
        renderHeaderCell: () => '#',
        renderCell: (item) => {
          const idx = materiales.findIndex((x) => x.id === item.id);
          return (
            <TableCellLayout>
              <Text weight="semibold">{idx + 1}</Text>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<MaterialLocalItem>({
        columnId: 'codigo',
        renderHeaderCell: () => 'Código',
        renderCell: (item) => (
          <TableCellLayout>
            <Text>{item.productoCodigo || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<MaterialLocalItem>({
        columnId: 'producto',
        renderHeaderCell: () => 'Material / Repuesto',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text weight="semibold">{item.productoNombre}</Text>
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
        renderHeaderCell: () => 'Cantidad Prevista',
        renderCell: (item) => (
          <TableCellLayout>
            <Text weight="semibold">{item.cantidadPrevista} {item.unidadMedida}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<MaterialLocalItem>({
        columnId: 'obligatorio',
        renderHeaderCell: () => 'Consumo',
        renderCell: (item) => (
          <TableCellLayout>
            <Badge appearance="tint" shape="rounded" color={item.esObligatorio ? 'danger' : 'subtle'}>
              {item.esObligatorio ? 'Obligatorio' : 'Sugerido'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<MaterialLocalItem>({
        columnId: 'observaciones',
        renderHeaderCell: () => 'Observaciones',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.observaciones || '—'}</Text>
          </TableCellLayout>
        ),
      }),
    ],
    [materiales]
  );

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} />

      {/* Barra de Comandos */}
      <D365CommandBar
        ariaLabel="Barra de comandos de configuración del servicio"
        busy={loading || saving}
        busyLabel={loading ? 'Cargando...' : 'Guardando...'}
      >
        <D365CommandButton
          icon={<ArrowLeft16Regular />}
          tone="brand"
          aria-label="Atrás"
          title="Atrás"
          disabled={loading || saving}
          onClick={() => navigate('/servicio-campo/configuraciones-servicio')}
        />
        <D365CommandDivider />
        <D365CommandButton
          icon={<Save16Regular />}
          tone="save"
          disabled={loading || saving}
          onClick={() => void guardar(false)}
        >
          Guardar
        </D365CommandButton>
        <D365CommandButton
          icon={<SaveMultiple16Regular />}
          tone="save"
          disabled={loading || saving}
          onClick={() => void guardar(true)}
        >
          Guardar y cerrar
        </D365CommandButton>
        <D365CommandDivider />
        <D365CommandButton
          icon={<Add16Regular />}
          tone="create"
          disabled={loading || saving}
          onClick={() => navigate('/servicio-campo/configuraciones-servicio/nuevo')}
        >
          Nuevo
        </D365CommandButton>
        {isEditMode && (
          <>
            <D365CommandButton
              disabled={loading || saving}
              onClick={() => void cambiarEstado()}
            >
              {activo ? 'Desactivar' : 'Activar'}
            </D365CommandButton>
            <D365CommandButton
              icon={<Delete16Regular />}
              tone="danger"
              disabled={loading || saving}
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
        title={loading ? 'Cargando...' : savedTitle || (isEditMode ? 'Configuración del servicio' : 'Nuevo')}
        subtitle={loading ? 'Cargando...' : savedSubtitle}
        avatarIcon={<DocumentBulletList20Regular />}
        avatarSize={48}
        metadata={
          loading
            ? [
                { label: 'Servicio Técnico', value: 'Cargando...' },
                { label: 'Duración Estimada', value: '—' },
                { label: 'Composición', value: '—' },
                { label: 'Estado', value: '—' },
              ]
            : [
                {
                  label: 'Servicio Técnico',
                  value: savedServicioNombre || (catalogoProductos.find((p) => p.id === productoId)?.nombre ?? 'Sin asignar'),
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
              ]
        }
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, d) => setSelectedTab(d.value as 'general' | 'tareas' | 'materiales')}
          >
            <Tab value="general">General</Tab>
            <Tab value="tareas" disabled={loading}>Tareas de Servicio</Tab>
            <Tab value="materiales" disabled={loading}>Materiales Previstos</Tab>
          </TabList>
        }
      />

      {/* Contenido de Pestañas */}
      <D365FormContent busy={saving} className={styles.contentBody}>
        {loading ? (
          <div className={styles.grid2Cols}>
            <Card className={styles.card}>
              <Skeleton animation="pulse">
                <SkeletonItem size={16} className={styles.skeletonHeader} />
                <div className={styles.fieldColumnFlex}>
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={72} className={styles.skeletonTextarea72} />
                </div>
              </Skeleton>
            </Card>
            <Card className={styles.card}>
              <Skeleton animation="pulse">
                <SkeletonItem size={16} className={styles.skeletonSub140} />
                <div className={styles.fieldColumnFlex}>
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                </div>
              </Skeleton>
            </Card>
          </div>
        ) : (
          <>
            {selectedTab === 'general' && (
              <div className={styles.halfCardWrapper}>
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>
                Identificación de la Configuración del Servicio
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                <D365FormField
                  label="Servicio Técnico"
                  required
                  error={errors.productoId}
                  info="Servicio del catálogo al que pertenece esta configuración técnica de tareas y materiales. Solo se listan servicios sin configuración activa previa."
                >
                  <Select
                    value={productoId}
                    onChange={(_, d) => {
                      setProductoId(d.value);
                      const prod = catalogoProductos.find((p) => p.id === d.value);
                      if (prod && !nombre) {
                        setNombre(`Configuración — ${prod.nombre}`);
                      }
                    }}
                    disabled={isEditMode}
                  >
                    <option value=""></option>
                    {productosServicio.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.codigo}] {p.nombre}
                      </option>
                    ))}
                  </Select>
                </D365FormField>

                <D365FormField
                  label="Nombre de la Configuración"
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
                  label="Puntos de trabajo"
                  required
                  error={errors.puntos}
                  info="Valor en puntos que acumula el técnico al realizar este tipo de servicio (ejemplo: 0.5, 1, 1.5)."
                >
                  <Input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={puntos}
                    onChange={(_, d) => setPuntos(d.value)}
                    onBlur={() => {
                      const val = parseFloat(puntos.replace(',', '.'));
                      if (isNaN(val) || val <= 0) {
                        setPuntos('1');
                      } else {
                        setPuntos(val.toString());
                      }
                    }}
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
                  label="SLA de Resolución (horas)"
                  info="Tiempo máximo comprometido para la atención o resolución del servicio (ej. 24, 48 o 72 horas). Dejar vacío si no aplica."
                >
                  <Input
                    type="number"
                    min={1}
                    value={slaHorasResolucion !== null && slaHorasResolucion !== undefined ? slaHorasResolucion.toString() : ''}
                    onChange={(_, d) => setSlaHorasResolucion(d.value ? Math.max(1, parseInt(d.value) || 0) : null)}
                  />
                </D365FormField>

                <D365FormField
                  label="Descripción"
                  info="Resumen de los lineamientos técnicos u objetivos de esta configuración."
                >
                  <Textarea
                    value={descripcion}
                    onChange={(_, d) => setDescripcion(d.value)}
                    rows={3}
                  />
                </D365FormField>
              </div>
            </Card>
          </div>
        )}

        {selectedTab === 'tareas' && (
          <D365SubGrid
            title="Checklist de Tareas Técnicas"
            count={tareas.length}
            items={tareas}
            columns={columnasTareas}
            getRowId={(t) => t.id}
            selectionMode="multiselect"
            selectedItems={Array.from(tareasSeleccionadasTabla)}
            onSelectionChange={(selected) => setTareasSeleccionadasTabla(new Set(selected.map(String)))}
            onAdd={() => setDialogTareaOpen(true)}
            addLabel="Nueva Tarea de Servicio..."
            actions={
              tareasSeleccionadasTabla.size > 0 ? (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Delete16Regular />}
                  onClick={eliminarTareasSeleccionadasTabla}
                >
                  Eliminar ({tareasSeleccionadasTabla.size})
                </Button>
              ) : undefined
            }
            emptyMessage="No hay tareas configuradas en esta plantilla."
          />
        )}

        {selectedTab === 'materiales' && (
          <D365SubGrid
            title="Receta de Materiales e Insumos"
            count={materiales.length}
            items={materiales}
            columns={columnasMateriales}
            getRowId={(m) => m.id}
            selectionMode="multiselect"
            selectedItems={Array.from(materialesSeleccionadosTabla)}
            onSelectionChange={(selected) => setMaterialesSeleccionadosTabla(new Set(selected.map(String)))}
            onAdd={() => {
              setMaterialesSeleccionados(new Set());
              setNuevoMaterialCantidad('');
              setNuevoMaterialUnidadId('');
              setNuevoMaterialObligatorio(false);
              setNuevoMaterialObservaciones('');
              setFiltroBusquedaMaterial('');
              setDialogMaterialOpen(true);
            }}
            addLabel="Nuevo Producto de Plantilla..."
            actions={
              materialesSeleccionadosTabla.size > 0 ? (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Delete16Regular />}
                  onClick={eliminarMaterialesSeleccionadosTabla}
                >
                  Eliminar ({materialesSeleccionadosTabla.size})
                </Button>
              ) : undefined
            }
            emptyMessage="No hay materiales o insumos previstos configurados."
          />
        )}
          </>
        )}
      </D365FormContent>



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
              placeholder=""
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
                        tareasFiltradas.forEach((t) => { copy.delete(t.id); });
                        return copy;
                      });
                    } else {
                      setTareasSeleccionadas((prev) => {
                        const copy = new Set(prev);
                        tareasFiltradas.forEach((t) => { copy.add(t.id); });
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
                              {t.nombre}
                            </Text>
                            {yaAgregada && (
                              <Text size={100} style={{ color: tokens.colorNeutralForeground4, display: 'block' }}>
                                (Ya agregada en la configuración)
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
              placeholder=""
              value={nuevaTareaNombre}
              onChange={(_, d) => setNuevaTareaNombre(d.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text weight="semibold" size={200}>Instrucciones Técnicas Predeterminadas</Text>
            <Input
              placeholder=""
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
              placeholder=""
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
                        materialesFiltrados.forEach((p) => { copy.delete(p.id); });
                        return copy;
                      });
                    } else {
                      setMaterialesSeleccionados((prev) => {
                        const copy = new Set(prev);
                        materialesFiltrados.forEach((p) => { copy.add(p.id); });
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
                                (Ya agregado en la configuración)
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text weight="semibold" size={200}>Cantidad Sugerida *</Text>
              <Input
                type="number"
                min={0.01}
                step="any"
                value={nuevoMaterialCantidad}
                onChange={(_, d) => setNuevoMaterialCantidad(d.value)}
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
                  <option value=""></option>
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
            disabled={
              materialesSeleccionados.size === 0 ||
              !nuevoMaterialCantidad.trim() ||
              isNaN(parseFloat(nuevoMaterialCantidad)) ||
              parseFloat(nuevoMaterialCantidad) <= 0
            }
            onClick={agregarMaterialFila}
          >
            Agregar
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
    </div>
  );
}
