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
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  Delete16Regular,
  DocumentBulletList20Regular,
  ArrowUp16Regular,
  ArrowDown16Regular,
  Box16Regular,
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
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { SelectorEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';

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
  const [productoId, setProductoId] = useState('');
  const [busquedaServicio, setBusquedaServicio] = useState('');
  const [duracionEstimadaMinutos, setDuracionEstimadaMinutos] = useState<number>(60);
  const [descripcion, setDescripcion] = useState('');
  const [esPredeterminada, setEsPredeterminada] = useState(false);
  const [activo, setActivo] = useState(true);

  // Títulos estáticos del encabezado (solo cambian al cargar o guardar)
  const [savedTitle, setSavedTitle] = useState(isEditMode ? '' : 'Nuevo');
  const [savedSubtitle, setSavedSubtitle] = useState('Receta Técnica • Ficha de plantilla de trabajo');

  // Colecciones hijas
  const [tareas, setTareas] = useState<TareaLocalItem[]>([]);
  const [materiales, setMateriales] = useState<MaterialLocalItem[]>([]);

  // Catálogos
  const [catalogoProductos, setCatalogoProductos] = useState<ProductoDto[]>([]);
  const [catalogoTareas, setCatalogoTareas] = useState<TareaDto[]>([]);

  // UI state
  const [selectedTab, setSelectedTab] = useState<'general' | 'tareas' | 'materiales'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Diálogo para agregar tarea
  const [dialogTareaOpen, setDialogTareaOpen] = useState(false);
  const [tareasSeleccionadas, setTareasSeleccionadas] = useState<Set<string>>(new Set());
  const [filtroBusquedaTarea, setFiltroBusquedaTarea] = useState('');
  const [nuevaTareaNombre, setNuevaTareaNombre] = useState('');
  const [nuevaTareaObligatoria, setNuevaTareaObligatoria] = useState(true);
  const [nuevaTareaEvidencia, setNuevaTareaEvidencia] = useState(false);
  const [nuevaTareaInstrucciones, setNuevaTareaInstrucciones] = useState('');

  // Diálogo para agregar material
  const [dialogMaterialOpen, setDialogMaterialOpen] = useState(false);
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<Set<string>>(new Set());
  const [filtroBusquedaMaterial, setFiltroBusquedaMaterial] = useState('');
  const [nuevoMaterialCantidad, setNuevoMaterialCantidad] = useState<number>(1);
  const [nuevoMaterialObligatorio, setNuevoMaterialObligatorio] = useState(false);
  const [nuevoMaterialObservaciones, setNuevoMaterialObservaciones] = useState('');

  // Carga inicial
  const cargarCatalogosYDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [prods, tars] = await Promise.all([
        ProductoService.getProductos(undefined, undefined, true),
        PlantillaTrabajoService.getTareas({ soloActivas: true }),
      ]);
      setCatalogoProductos(prods);
      setCatalogoTareas(tars);

      if (isEditMode && id) {
        const plantilla = await PlantillaTrabajoService.getPlantillaById(id);
        setCodigo(plantilla.codigo);
        setNombre(plantilla.nombre);
        setSavedTitle(plantilla.nombre);
        setSavedSubtitle(`Receta Técnica • ${plantilla.codigo || 'Código autogenerado'}`);
        setProductoId(plantilla.productoId);
        setDuracionEstimadaMinutos(plantilla.duracionEstimadaMinutos);
        setDescripcion(plantilla.descripcion || '');
        setEsPredeterminada(plantilla.esPredeterminada);
        setActivo(plantilla.activo);

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
            unidadMedida: m.unidadMedida,
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
    const servicios = catalogoProductos.filter((p) => p.tipo === 'Servicio' || p.tipo === 2);
    return servicios.length > 0 ? servicios : catalogoProductos;
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

  const productoSeleccionado = useMemo(() => {
    return catalogoProductos.find((p) => p.id === productoId);
  }, [catalogoProductos, productoId]);

  const validar = (): boolean => {
    const errs: Record<string, string> = {};
    if (!nombre.trim()) errs.nombre = 'El nombre de la plantilla es obligatorio.';
    if (!productoId) errs.productoId = 'Debe seleccionar un producto o servicio de catálogo.';
    if (duracionEstimadaMinutos < 1) errs.duracion = 'La duración estimada debe ser al menos 1 minuto.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const guardar = async (cerrarAlFinal = false): Promise<string | null> => {
    if (!validar()) {
      setStatusMessage({ type: 'error', text: 'Complete los campos obligatorios del formulario.' });
      setSelectedTab('general');
      return null;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const dto: GuardarPlantillaTrabajoDto = {
        codigo: codigo.trim() || undefined,
        nombre: nombre.trim(),
        productoId,
        duracionEstimadaMinutos,
        descripcion: descripcion.trim() || undefined,
        esPredeterminada,
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
        })),
      };

      let savedId = id;
      if (isEditMode && id) {
        await PlantillaTrabajoService.actualizarPlantilla(id, dto);
        setSavedTitle(nombre.trim());
        setSavedSubtitle(`Receta Técnica • ${codigo.trim() || 'Código autogenerado'}`);
        notifySuccess('Plantilla de trabajo actualizada con éxito.');
      } else {
        const res = await PlantillaTrabajoService.crearPlantilla(dto);
        savedId = res.id;
        setSavedTitle(nombre.trim());
        setSavedSubtitle(`Receta Técnica • ${codigo.trim() || 'Código autogenerado'}`);
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

  const eliminarTareaFila = (index: number) => {
    setTareas((prev) => {
      const copy = prev.filter((_, i) => i !== index);
      return copy.map((t, idx) => ({ ...t, ordenSecuencia: idx + 1 }));
    });
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
  const agregarMaterialFila = () => {
    if (materialesSeleccionados.size === 0 || nuevoMaterialCantidad <= 0) return;

    const nuevos: MaterialLocalItem[] = [];
    for (const prodId of materialesSeleccionados) {
      // Evitar agregar si ya existe en la lista de materiales
      if (materiales.some((m) => m.productoId === prodId)) continue;
      const prod = catalogoProductos.find((p) => p.id === prodId);
      if (!prod) continue;

      nuevos.push({
        id: `tmp-mat-${prod.id}-${Date.now()}`,
        productoId: prod.id,
        productoCodigo: prod.codigo,
        productoNombre: prod.nombre,
        cantidadPrevista: nuevoMaterialCantidad,
        esObligatorio: nuevoMaterialObligatorio,
        observaciones: nuevoMaterialObservaciones.trim(),
        unidadMedida: prod.nombreUnidadMedidaDefecto || 'UND',
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
    setNuevoMaterialObligatorio(false);
    setNuevoMaterialObservaciones('');
  };

  const eliminarMaterialFila = (index: number) => {
    setMateriales((prev) => prev.filter((_, i) => i !== index));
  };

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
            label: 'Servicio',
            value: productoSeleccionado?.nombre || 'Sin servicio',
          },
          {
            label: 'Duración Estimada',
            value: `${duracionEstimadaMinutos} min`,
          },
          {
            label: 'Composición',
            value: `${tareas.length} tareas / ${materiales.length} materiales`,
          },
          {
            label: 'Estado',
            value: activo ? 'Activo' : 'Inactivo',
          },
        ]}
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, d) => setSelectedTab(d.value as 'general' | 'tareas' | 'materiales')}
          >
            <Tab value="general">Información General</Tab>
            <Tab value="tareas">Tareas Previstas</Tab>
            <Tab value="materiales">Materiales y Equipos</Tab>
          </TabList>
        }
      />

      {/* Contenido de Pestañas */}
      <div className={styles.contentBody}>
        {selectedTab === 'general' && (
          <div className={styles.halfCardWrapper}>
            <div className={styles.card}>
              <Text size={400} weight="semibold" style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, paddingBottom: 8, display: 'block' }}>
                Identificación y Servicio Asociado
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
                  label="Servicio Asociado"
                  required
                  error={errors.productoId}
                  info="Servicio de catálogo facturable al que aplica esta plantilla operativa."
                >
                  <SelectorEntidadRelacionada
                    etiquetaGrupo="Servicios"
                    icono={<Box16Regular />}
                    opciones={productosServicio.map((p) => ({
                      id: p.id,
                      nombre: `[${p.codigo}] ${p.nombre}`,
                      detalle: p.tipo === 'Servicio' ? 'Servicio facturable' : 'Inventario',
                    }))}
                    seleccionada={
                      productoSeleccionado
                        ? {
                            id: productoSeleccionado.id,
                            nombre: `[${productoSeleccionado.codigo}] ${productoSeleccionado.nombre}`,
                            detalle: productoSeleccionado.tipo === 'Servicio' ? 'Servicio facturable' : undefined,
                          }
                        : null
                    }
                    textoBusqueda={busquedaServicio}
                    alCambiarBusqueda={setBusquedaServicio}
                    alSeleccionar={(id) => setProductoId(id || '')}
                    textoVacio="No se encontraron servicios disponibles"
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <Checkbox
                checked={esPredeterminada}
                onChange={(_, d) => setEsPredeterminada(Boolean(d.checked))}
                label={
                  <Text>
                    <strong>Plantilla Predeterminada para este Servicio</strong> — Al agregar este servicio en una Orden de Trabajo, se precargarán automáticamente estas tareas y materiales.
                  </Text>
                }
              />
            </div>
          </div>
        </div>
        )}

        {selectedTab === 'tareas' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <Text size={400} weight="semibold">Checklist de Tareas Secuenciales</Text>
                <br />
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Pasos técnicos que el técnico en campo deberá marcar como realizados en la orden.
                </Text>
              </div>
              <Button
                appearance="primary"
                icon={<Add16Regular />}
                onClick={() => setDialogTareaOpen(true)}
              >
                Agregar Tarea
              </Button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${tokens.colorNeutralStroke2}`, color: tokens.colorNeutralForeground3 }}>
                    <th style={{ padding: '8px 4px', width: 40 }}>#</th>
                    <th style={{ padding: '8px 8px' }}>Tarea</th>
                    <th style={{ padding: '8px 8px', width: 100 }}>Duración</th>
                    <th style={{ padding: '8px 8px', width: 110 }}>Obligatoria</th>
                    <th style={{ padding: '8px 8px', width: 120 }}>Foto Evidencia</th>
                    <th style={{ padding: '8px 8px' }}>Instrucciones Técnicas</th>
                    <th style={{ padding: '8px 8px', width: 90, textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tareas.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px 16px' }}>
                        <TableEmptyState />
                      </td>
                    </tr>
                  ) : (
                    tareas.map((t, idx) => (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke3}` }}>
                        <td style={{ padding: '10px 4px', fontWeight: 600, color: tokens.colorBrandForeground1 }}>
                          {t.ordenSecuencia}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <strong>{t.tareaNombre}</strong>
                          {t.tareaCodigo && (
                            <span style={{ marginLeft: 6, fontSize: 11, color: tokens.colorNeutralForeground4 }}>
                              ({t.tareaCodigo})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          {t.duracionEstimadaMinutos} min
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Checkbox
                            checked={t.esObligatoria}
                            onChange={(_, d) =>
                              setTareas((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, esObligatoria: Boolean(d.checked) } : item))
                              )
                            }
                          />
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Checkbox
                            checked={t.requiereEvidencia}
                            onChange={(_, d) =>
                              setTareas((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, requiereEvidencia: Boolean(d.checked) } : item))
                              )
                            }
                          />
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Input
                            size="small"
                            value={t.instrucciones}
                            onChange={(_, d) =>
                              setTareas((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, instrucciones: d.value } : item))
                              )
                            }
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
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
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<Delete16Regular />}
                              onClick={() => eliminarTareaFila(idx)}
                              title="Eliminar"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'materiales' && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <Text size={400} weight="semibold">Receta de Materiales y Equipos Previstos</Text>
                <br />
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Repuestos, cables y equipos sugeridos u obligatorios para la liquidación del trabajo.
                </Text>
              </div>
              <Button
                appearance="primary"
                icon={<Add16Regular />}
                onClick={() => setDialogMaterialOpen(true)}
              >
                Agregar Material
              </Button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${tokens.colorNeutralStroke2}`, color: tokens.colorNeutralForeground3 }}>
                    <th style={{ padding: '8px 8px' }}>Producto / Material</th>
                    <th style={{ padding: '8px 8px', width: 120 }}>Cantidad Sugerida</th>
                    <th style={{ padding: '8px 8px', width: 90 }}>U.M.</th>
                    <th style={{ padding: '8px 8px', width: 110 }}>Obligatorio</th>
                    <th style={{ padding: '8px 8px' }}>Observaciones</th>
                    <th style={{ padding: '8px 8px', width: 60, textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {materiales.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px 16px' }}>
                        <TableEmptyState />
                      </td>
                    </tr>
                  ) : (
                    materiales.map((m, idx) => (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke3}` }}>
                        <td style={{ padding: '10px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <strong>{m.productoNombre}</strong>
                            <span style={{ fontSize: 11, color: tokens.colorNeutralForeground4 }}>
                              [{m.productoCodigo}]
                            </span>
                            {m.esSerializado && (
                              <Badge appearance="tint" shape="rounded" color="informative" size="small">
                                Seriado
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Input
                            size="small"
                            type="number"
                            min={0.01}
                            step="any"
                            value={m.cantidadPrevista.toString()}
                            onChange={(_, d) =>
                              setMateriales((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, cantidadPrevista: parseFloat(d.value) || 1 } : item
                                )
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td style={{ padding: '10px 8px', color: tokens.colorNeutralForeground3 }}>
                          {m.unidadMedida}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Checkbox
                            checked={m.esObligatorio}
                            onChange={(_, d) =>
                              setMateriales((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, esObligatorio: Boolean(d.checked) } : item))
                              )
                            }
                          />
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Input
                            size="small"
                            value={m.observaciones}
                            onChange={(_, d) =>
                              setMateriales((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, observaciones: d.value } : item))
                              )
                            }
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Delete16Regular />}
                            onClick={() => eliminarMaterialFila(idx)}
                            title="Eliminar"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
            {tareasSeleccionadas.size > 0
              ? `Agregar (${tareasSeleccionadas.size}) Tarea(s)`
              : 'Agregar a Checklist'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text weight="semibold" size={200}>Cantidad Sugerida / Prevista (por ítem) *</Text>
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
            {materialesSeleccionados.size > 0
              ? `Agregar (${materialesSeleccionados.size}) Material(es)`
              : 'Agregar Materiales'}
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
    </div>
  );
}
