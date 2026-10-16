import { D365FormContent } from '../../../../components/common/D365FormContent';
import { useValidationFocus } from '../../../../hooks/useValidationFocus';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { confirmAction } from '../../../../services/uiFeedback';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Textarea,
  Select,
  Spinner,
  TabList,
  Tab,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Badge,
  tokens,
  Card,
  Skeleton,
  SkeletonItem,
  makeStyles,
  Toast,
  Toaster,
  ToastTitle,
  useToastController,
  useId,
  Text,
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
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  Building16Regular,
  Checkmark16Regular,
  DismissCircle16Regular,
  Delete16Regular,
  LockClosed16Regular,
  Box16Regular,
  Person16Regular,
  Search16Regular,
  Dismiss24Regular,
  Copy16Regular,
  Tag16Regular,
} from '@fluentui/react-icons';
import { AlmacenConfiguracion } from '../components/AlmacenConfiguracion';
import { CrearUnidadOrganizativaDrawer } from '../components/CrearUnidadOrganizativaDrawer';
import { AlmacenService } from '../services/almacen.service';
import type {
  CreateAlmacenDto,
  UnidadOrganizativaDto,
  RecursoTecnicoDto,
  TipoAlmacen,
} from '../types/almacen.types';
import { InventarioProductoService } from '../../inventario-productos/services/inventario-producto.service';
import type {
  InventarioProductoDto,
  ItemSeriadoStockDto,
} from '../../inventario-productos/types/inventario-producto.types';
import { exportToExcel, type ExportColumn } from '../../../../utils/exportUtils';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { getCurrentUserSession } from '../../../../services/sessionService';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { LookupDropdownWithQuickCreate } from '../../../../components/common/LookupDropdownWithQuickCreate';
import { SelectorEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { useAuthSession } from '../../../../services/authSession';

export interface AlmacenFormPageProps {
  almacenId?: string | null;
  onBack?: () => void;
  onSaved?: (savedId: string) => void;
  onCreated?: (createdId: string) => void;
}

const useAlmacenPageStyles = makeStyles({
  halfCardWrapper: {
    maxWidth: '700px',
    width: '100%',
  },
  singleColumnFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
});

export const AlmacenFormPage: React.FC<AlmacenFormPageProps> = ({
  almacenId: propAlmacenId,
  onBack: propOnBack,
  onSaved: propOnSaved,
  onCreated: propOnCreated,
}) => {
  const { permisos } = useAuthSession();
  const styles = useD365FormStyles();
  const pageStyles = useAlmacenPageStyles();
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const toasterId = useId('almacen-toaster');
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

  const currentUser = useMemo(() => getCurrentUserSession(), []);
  const user = useCurrentUser();
  const esAdminAlmacenes =
    user.isAuthenticated &&
    user.roles.some((r) =>
      ['SuperAdmin', 'ServicioCampoAdmin', 'InventarioAdmin'].includes(r)
    );

  const effectiveId =
    propAlmacenId !== undefined
      ? propAlmacenId
      : routeId && routeId !== 'nuevo'
      ? routeId
      : null;

  const [currentId, setCurrentId] = useState<string | null>(effectiveId);
  const isEditMode = Boolean(currentId);

  // Tab State: standard D365 tabs
  const [selectedTab, setSelectedTab] = useState<
    'general' | 'existencias' | 'detalle' | 'configuracion' | 'ubicaciones' | 'autorizados'
  >('general');

  // Catálogos reales desde la API
  const [unidades, setUnidades] = useState<UnidadOrganizativaDto[]>([]);
  const [puedeSupervisar, setPuedeSupervisar] = useState(false);
  const [recursos, setRecursos] = useState<RecursoTecnicoDto[]>([]);

  // Form State
  const [formData, setFormData] = useState<CreateAlmacenDto>({
    nombre: '',
    descripcion: '',
    codigo: '',
    tipo: 1 as TipoAlmacen,
    unidadOrganizativaId: '',
    recursoId: '',
  });

  const [savedHeader, setSavedHeader] = useState<{
    id?: string;
    nombre: string;
    tipo: TipoAlmacen;
    activo: boolean;
    creadoPorNombre: string;
    fechaCreacion?: string;
  }>({
    nombre: '',
    tipo: 1,
    activo: true,
    creadoPorNombre: currentUser.nombre,
  });

  // Stock / Existencias en este almacén
  const [existencias, setExistencias] = useState<InventarioProductoDto[]>([]);
  const [cargandoExistencias, setCargandoExistencias] = useState<boolean>(false);
  const [filtroStock, setFiltroStock] = useState<string>('');

  // Drawer de Series del Almacén
  const [drawerSeriesOpen, setDrawerSeriesOpen] = useState(false);
  const [productoSeriesSeleccionado, setProductoSeriesSeleccionado] = useState<InventarioProductoDto | null>(null);
  const [seriesAlmacen, setSeriesAlmacen] = useState<ItemSeriadoStockDto[]>([]);
  const [cargandoSeries, setCargandoSeries] = useState(false);
  const [filtroSeries, setFiltroSeries] = useState('');
  const [serieCopiada, setSerieCopiada] = useState<string | null>(null);

  const handleCopiarSerie = async (serie: string) => {
    try {
      await navigator.clipboard.writeText(serie);
      setSerieCopiada(serie);
      setTimeout(() => setSerieCopiada(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleVerSeriesProducto = async (prod: InventarioProductoDto) => {
    if (!currentId) return;
    setProductoSeriesSeleccionado(prod);
    setFiltroSeries('');
    setDrawerSeriesOpen(true);
    setCargandoSeries(true);
    try {
      const data = await InventarioProductoService.obtenerSeries(currentId, prod.productoId);
      setSeriesAlmacen(data || []);
    } catch (err) {
      console.error('Error al cargar series:', err);
      setSeriesAlmacen([]);
    } finally {
      setCargandoSeries(false);
    }
  };

  const handleVerTodasSeriesAlmacen = async () => {
    if (!currentId) return;
    setProductoSeriesSeleccionado(null);
    setFiltroSeries('');
    setDrawerSeriesOpen(true);
    setCargandoSeries(true);
    try {
      const data = await InventarioProductoService.obtenerSeries(currentId);
      setSeriesAlmacen(data || []);
    } catch (err) {
      console.error('Error al cargar series del almacén:', err);
      setSeriesAlmacen([]);
    } finally {
      setCargandoSeries(false);
    }
  };

  const seriesFiltradas = useMemo(() => {
    if (!filtroSeries.trim()) return seriesAlmacen;
    const q = filtroSeries.trim().toUpperCase();
    return seriesAlmacen.filter(
      (s) =>
        s.numeroSerie.toUpperCase().includes(q) ||
        (s.codigoProducto && s.codigoProducto.toUpperCase().includes(q)) ||
        (s.nombreProducto && s.nombreProducto.toUpperCase().includes(q)) ||
        (s.macAddress && s.macAddress.toUpperCase().includes(q)) ||
        (s.numeroSmartCard && s.numeroSmartCard.toUpperCase().includes(q))
    );
  }, [seriesAlmacen, filtroSeries]);

  const handleExportarSeries = () => {
    const cols: ExportColumn<ItemSeriadoStockDto>[] = [
      { header: 'N° Serie', accessor: (x) => x.numeroSerie },
      { header: 'Código', accessor: (x) => x.codigoProducto },
      { header: 'Producto', accessor: (x) => x.nombreProducto },
      { header: 'SmartCard', accessor: (x) => x.numeroSmartCard || '' },
      { header: 'MAC Address', accessor: (x) => x.macAddress || '' },
      { header: 'Condición', accessor: (x) => x.condicion || 'Utilizable' },
      { header: 'Estado', accessor: (x) => x.estado || 'Disponible' },
      { header: 'Ubicación', accessor: (x) => x.nombreUbicacion || 'Principal' },
    ];
    const nombreAlm = (savedHeader.nombre || formData.nombre || 'Almacen').replace(/\s+/g, '_');
    const sufijo = productoSeriesSeleccionado ? `_${productoSeriesSeleccionado.codigoProducto}` : '_Todas';
    exportToExcel(
      seriesFiltradas,
      cols,
      `Series_${nombreAlm}${sufijo}_${new Date().toISOString().split('T')[0]}`
    );
  };

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busquedaSede, setBusquedaSede] = useState<string>('');
  const [busquedaRecurso, setBusquedaRecurso] = useState<string>('');
  const focusValidation = useValidationFocus();
  const draft = useUnsavedChanges({ formData }, !loading);

  // Si se está creando un almacén o es de tipo custodia personal, restringir pestañas inactivas
  useEffect(() => {
    if (!currentId && selectedTab !== 'general') {
      setSelectedTab('general');
    } else if (formData.tipo === 2 && selectedTab === 'autorizados') {
      setSelectedTab('general');
    }
  }, [currentId, formData.tipo, selectedTab]);

  // Cargar existencias cuando se selecciona la pestaña
  const cargarExistencias = useCallback(async (almacenId: string) => {
    if (!almacenId) return;
    try {
      setCargandoExistencias(true);
      const stock = await InventarioProductoService.obtener(almacenId);
      setExistencias(stock || []);
    } catch (err) {
      console.error('Error al cargar existencias del almacén:', err);
    } finally {
      setCargandoExistencias(false);
    }
  }, []);

  // Cargar catálogos reales y datos de almacén coordinadamente
  useEffect(() => {
    let activo = true;
    setLoading(true);

    const promises: [Promise<UnidadOrganizativaDto[]>, Promise<RecursoTecnicoDto[]>, Promise<any>] = [
      AlmacenService.getUnidadesOrganizativas().catch(() => []),
      AlmacenService.getRecursosTecnicos().catch(() => []),
      effectiveId ? AlmacenService.getAlmacenById(effectiveId) : Promise.resolve(null),
    ];

    Promise.all(promises)
      .then(([unids, recs, almacenData]) => {
        if (!activo) return;
        setUnidades(unids || []);
        setRecursos(recs || []);

        if (almacenData && effectiveId) {
          setCurrentId(effectiveId);
          setPuedeSupervisar(Boolean(almacenData.esSupervisor));
          setFormData({
            nombre: almacenData.nombre,
            descripcion: almacenData.descripcion || '',
            codigo: almacenData.codigo || '',
            tipo: (almacenData.tipo || 1) as TipoAlmacen,
            unidadOrganizativaId: almacenData.unidadOrganizativaId || '',
            recursoId: almacenData.recursoId || '',
          });
          setSavedHeader({
            id: almacenData.id,
            nombre: almacenData.nombre,
            tipo: (almacenData.tipo || 1) as TipoAlmacen,
            activo: almacenData.activo,
            creadoPorNombre: almacenData.creadoPorNombre || 'Sistema',
            fechaCreacion: almacenData.createdAt,
          });
          void cargarExistencias(effectiveId);
        } else {
          setCurrentId(null);
          setFormData({
            nombre: '',
            descripcion: '',
            codigo: '',
            tipo: 1,
            unidadOrganizativaId: '',
            recursoId: '',
          });
          setSavedHeader({
            nombre: '',
            tipo: 1,
            activo: true,
            creadoPorNombre: currentUser.nombre,
          });
          setExistencias([]);
          setStatusMessage(null);
          setErrors({});
        }
      })
      .catch((err) => {
        if (!activo) return;
        console.error('Error al inicializar formulario de almacén:', err);
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Error al obtener la información del almacén.',
        });
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [effectiveId, currentUser.nombre, cargarExistencias]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del almacén es obligatorio.';
    }

    if (!formData.unidadOrganizativaId) newErrors.unidadOrganizativaId = 'Seleccione una unidad organizativa.';
    if (formData.tipo === 2) {
      if (!formData.recursoId) {
        newErrors.recursoId = 'La custodia personal requiere un recurso técnico responsable.';
      } else {
        const rec = recursos.find((r) => r.id === formData.recursoId);
        if (rec?.almacenMovilId && rec.almacenMovilId !== currentId) {
          newErrors.recursoId = 'Este técnico ya cuenta con un almacén de custodia personal activo.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfterSave = false): Promise<string | null> => {
    const savedDraft = draft.capture();
    if (!validate()) {
      setSelectedTab('general'); focusValidation();
      setSelectedTab('general');
      setStatusMessage({
        type: 'error',
        text: 'Por favor complete todos los campos obligatorios en la pestaña General.',
      });
      return null;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        codigo: formData.codigo?.trim() || null,
        tipo: formData.tipo,
        unidadOrganizativaId: formData.unidadOrganizativaId || null,
        recursoId: formData.recursoId || null,
      };

      if (isEditMode && currentId) {
        await AlmacenService.updateAlmacen(currentId, payload);

        setSavedHeader((prev) => ({
          ...prev,
          nombre: formData.nombre.trim(),
          tipo: formData.tipo || 1,
        }));

        const successMessage = `Almacén "${formData.nombre.trim()}" actualizado correctamente.`;
        draft.markSaved(savedDraft);
        notifySuccess(successMessage);
        setStatusMessage(null);

        if (propOnSaved) propOnSaved(currentId);

        if (closeAfterSave) {
          if (propOnBack) propOnBack();
          else { draft.markSaved(savedDraft);
navigate('/servicio-campo/almacenes', { state: { successMessage } }); }
        }

        return currentId;
      } else {
        const res = await AlmacenService.createAlmacen(payload);

        setCurrentId(res.id);
        setSavedHeader({
          id: res.id,
          nombre: formData.nombre.trim(),
          tipo: formData.tipo || 1,
          activo: true,
          creadoPorNombre: currentUser.nombre,
          fechaCreacion: new Date().toISOString(),
        });

        const successMessage = `Almacén "${formData.nombre.trim()}" creado exitosamente.`;
        draft.markSaved(savedDraft);
        notifySuccess(successMessage);
        setStatusMessage(null);

        if (propOnCreated) propOnCreated(res.id);
        if (propAlmacenId !== undefined && propOnCreated) return res.id;

        if (closeAfterSave) {
          if (propOnBack) propOnBack();
          else { draft.markSaved(savedDraft);
navigate('/servicio-campo/almacenes', { state: { successMessage } }); }
        } else {
          draft.markSaved(savedDraft);
          navigate(`/servicio-campo/almacenes/${res.id}`, { replace: true });
        }

        return res.id;
      }
    } catch (err: any) {
      console.error('Error al guardar almacén:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al guardar el almacén.',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async () => {
    if (!currentId) return;
    try {
      setSaving(true);
      const nuevoEstado = !savedHeader.activo;
      await AlmacenService.cambiarEstado(currentId, nuevoEstado);
      setSavedHeader((prev) => ({ ...prev, activo: nuevoEstado }));
      notifySuccess(`Almacén ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`);
      setStatusMessage(null);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al cambiar el estado del almacén.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentId) return;
    const nombreAlm = savedHeader.nombre || formData.nombre || 'este almacén';
    if (!await confirmAction(`¿Está seguro de eliminar el almacén "${nombreAlm}"?`)) return;

    try {
      setSaving(true);
      setStatusMessage(null);
      await AlmacenService.eliminarAlmacen(currentId);
      if (propOnBack) {
        propOnBack();
      } else {
        (draft.markSaved(), navigate('/servicio-campo/almacenes', {
          state: { successMessage: `Almacén "${nombreAlm}" eliminado correctamente.` },
        }));
      }
    } catch (err: any) {
      console.error('Error al eliminar almacén:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al eliminar el almacén.',
      });
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (propOnBack) {
      propOnBack();
    } else {
      navigate('/servicio-campo/almacenes');
    }
  };

  const handleNew = () => {
    if (propAlmacenId !== undefined) {
      setCurrentId(null);
      setFormData({
        nombre: '',
        descripcion: '',
        codigo: '',
        tipo: 1,
        unidadOrganizativaId: '',
        recursoId: '',
      });
      setErrors({});
      setStatusMessage(null);
      setSelectedTab('general');
      return;
    }
    navigate('/servicio-campo/almacenes/nuevo');
  };

  // Filtrar recursos según el tipo de almacén y la unidad organizativa
  const recursosDisponibles = useMemo(() => {
    return recursos.filter((r) => {
      // Si el almacén es móvil, debe ser tipo 1 (Técnico)
      if (formData.tipo === 2 && (r as any).tipo && (r as any).tipo !== 1) {
        return false;
      }
      // Si tiene unidad seleccionada, dar preferencia o filtrar
      if (formData.unidadOrganizativaId && r.unidadOrganizativaId) {
        return r.unidadOrganizativaId === formData.unidadOrganizativaId;
      }
      return true;
    });
  }, [recursos, formData.tipo, formData.unidadOrganizativaId]);

  // Filtrar solo líneas con stock positivo real
  const existenciasConStock = useMemo(() => {
    return existencias.filter((e) => e.cantidadTotal > 0 || e.cantidadDisponible > 0);
  }, [existencias]);

  // Filtrado en memoria de existencias
  const existenciasFiltradas = useMemo(() => {
    if (!filtroStock.trim()) return existenciasConStock;
    const term = filtroStock.toLowerCase();
    return existenciasConStock.filter(
      (e) =>
        e.nombreProducto.toLowerCase().includes(term) ||
        (e.codigoProducto && e.codigoProducto.toLowerCase().includes(term))
    );
  }, [existenciasConStock, filtroStock]);

  const handleExportarExistenciasAlmacen = () => {
    const cols: ExportColumn<InventarioProductoDto>[] = [
      { header: 'Código', accessor: (x) => x.codigoProducto },
      { header: 'Producto', accessor: (x) => x.nombreProducto },
      { header: 'Ubicación', accessor: (x) => x.nombreUbicacion || 'Principal' },
      { header: 'Condición', accessor: (x) => x.condicion || 'Utilizable' },
      { header: 'Control', accessor: (x) => (x.esSerializado ? 'Seriado' : 'No seriado') },
      { header: 'Disponible', accessor: (x) => x.cantidadDisponible },
      { header: 'Reservado', accessor: (x) => x.cantidadReservada },
      { header: 'Total', accessor: (x) => x.cantidadTotal },
      { header: 'Unidad', accessor: (x) => x.nombreUnidadMedida || 'UND' },
    ];
    const nombreAlm = (savedHeader.nombre || formData.nombre || 'Almacen').replace(/\s+/g, '_');
    exportToExcel(
      existenciasFiltradas,
      cols,
      `Existencias_${nombreAlm}_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} position="top-end" />
      {statusMessage && (
        <D365MessageBar
          intent={statusMessage.type}
          className={styles.messageBarContainer}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage.text}
        </D365MessageBar>
      )}

      <D365CommandBar
        ariaLabel="Comandos de Almacén"
        busy={saving || loading}
        busyLabel={loading ? 'Cargando...' : 'Guardando...'}
      >
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            onClick={handleBack}
            title="Volver al listado"
            aria-label="Volver"
          />

          <D365CommandDivider />

          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            appearance="subtle"
            onClick={() => handleSave(false)}
            disabled={saving || loading}
          >
            Guardar
          </D365CommandButton>

          <D365CommandButton
            icon={<SaveMultiple16Regular />}
            tone="save"
            appearance="subtle"
            onClick={() => handleSave(true)}
            disabled={saving || loading}
          >
            Guardar y cerrar
          </D365CommandButton>

          <D365CommandDivider />

          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            appearance="subtle"
            onClick={handleNew}
            disabled={saving}
          >
            Nuevo
          </D365CommandButton>

          {isEditMode && (
            <D365CommandButton
              tone={savedHeader.activo ? 'danger' : 'create'}
              icon={savedHeader.activo ? <DismissCircle16Regular /> : <Checkmark16Regular />}
              appearance="subtle"
              onClick={handleToggleEstado}
              disabled={saving || loading}
            >
              {savedHeader.activo ? 'Desactivar' : 'Activar'}
            </D365CommandButton>
          )}

          {isEditMode && (
            <D365CommandButton
              tone="danger"
              icon={<Delete16Regular />}
              appearance="subtle"
              onClick={handleDelete}
              disabled={saving || loading}
            >
              Eliminar
            </D365CommandButton>
          )}

          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            appearance="subtle"
            onClick={() => {
              navigate(0);
            }}
            disabled={saving || loading}
            title="Actualizar registro"
          >
            Actualizar
          </D365CommandButton>
        </div>
      </D365CommandBar>

      <D365EntityHeader
        loading={loading}
        title={isEditMode ? savedHeader.nombre || 'Almacén' : 'Nuevo Almacén'}
        subtitle={savedHeader.tipo === 2 ? 'Custodia personal de Técnico de Campo' : 'Bodega'}
        avatarName={savedHeader.nombre || 'Almacén'}
        avatarIcon={<Building16Regular />}
        avatarSize={48}
        metadata={[
          {
            label: 'Tipo',
            value: savedHeader.tipo === 2 ? 'Custodia personal' : 'Bodega',
          },
          { label: 'Estado', value: savedHeader.activo ? 'Activo' : 'Inactivo' },
          ...(isEditMode
            ? [{ label: 'Artículos en stock', value: String(existenciasConStock.length) }]
            : []),
        ]}
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) =>
              setSelectedTab(
                data.value as
                  | 'general'
                  | 'existencias'
                  | 'detalle'
                  | 'configuracion'
                  | 'ubicaciones'
                  | 'autorizados'
              )
            }
          >
            <Tab value="general">
              General
            </Tab>
            {currentId && (
              <Tab value="existencias">
                Existencias / Stock
              </Tab>
            )}
            {currentId && (
              <Tab value="ubicaciones">
                Ubicaciones
              </Tab>
            )}
            {currentId && formData.tipo !== 2 && (esAdminAlmacenes || puedeSupervisar) && (
              <Tab value="autorizados">
                Usuarios autorizados
              </Tab>
            )}
            {currentId && (
              <Tab value="detalle">
                Detalle / Auditoría
              </Tab>
            )}
          </TabList>
        }
      />

      <D365FormContent busy={saving} className={styles.contentBody} aria-busy={loading}>
        {loading ? (
          <div className={pageStyles.halfCardWrapper}>
            <Card className={styles.card} role="status" aria-label="Cargando almacén">
              <Skeleton animation="pulse">
                <SkeletonItem size={16} className={styles.skeletonHeader} />
                <div className={pageStyles.singleColumnFields}>
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <SkeletonItem size={72} className={styles.skeletonTextarea72} />
                </div>
              </Skeleton>
            </Card>
          </div>
        ) : (
          <>
            {/* PESTAÑA: UBICACIONES */}
            {selectedTab === 'ubicaciones' && currentId && (
              <AlmacenConfiguracion
                almacenId={currentId}
                puedeSupervisar={puedeSupervisar}
                vista="ubicaciones"
                tipoAlmacen={formData.tipo}
              />
            )}

            {/* PESTAÑA: USUARIOS AUTORIZADOS */}
            {selectedTab === 'autorizados' && currentId && formData.tipo !== 2 && (
              <AlmacenConfiguracion
                almacenId={currentId}
                puedeSupervisar={puedeSupervisar}
                vista="autorizaciones"
                tipoAlmacen={formData.tipo}
              />
            )}

            {/* RETROCOMPATIBILIDAD CONFIGURACIÓN */}
            {selectedTab === 'configuracion' && currentId && (
              <AlmacenConfiguracion
                almacenId={currentId}
                puedeSupervisar={puedeSupervisar}
                vista="todas"
                tipoAlmacen={formData.tipo}
              />
            )}
            {/* PESTAÑA 1: GENERAL */}
            {selectedTab === 'general' && (
              <div className={pageStyles.halfCardWrapper}>
                <div className={styles.card}>
                  <div className={pageStyles.singleColumnFields}>
                    <D365FormField label="Nombre del almacén" required error={errors.nombre}>
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.nombre}
                        maxLength={150}
                        onChange={(_e, d) => {
                          setFormData((prev) => ({ ...prev, nombre: d.value }));
                          if (errors.nombre) {
                            setErrors((prev) => ({ ...prev, nombre: '' }));
                          }
                        }}
                      />
                    </D365FormField>

                    <D365FormField label="Tipo de almacén" required>
                      <Select
                        className={styles.d365ControlFull}
                        value={String(formData.tipo || 1)}
                        disabled={isEditMode}
                        onChange={(_e, d) => {
                          const nuevoTipo = Number(d.value) as TipoAlmacen;
                          setFormData((prev) => ({
                            ...prev,
                            tipo: nuevoTipo,
                            recursoId: nuevoTipo === 1 ? '' : prev.recursoId,
                          }));
                        }}
                      >
                        <option value="1">Bodega</option>
                        <option value="2">Custodia personal</option>
                      </Select>
                    </D365FormField>

                    <D365FormField
                      label="Unidad organizativa"
                      required
                      error={errors.unidadOrganizativaId}
                    >
                      <LookupDropdownWithQuickCreate
                        puedeCrear={permisos.includes('configuracion.sucursales.gestionar')}
                        idEntrada="almacen-unidad-org"
                        etiquetaGrupo="Unidades Organizativas (Sedes)"
                        icono={<Building16Regular />}
                        deshabilitado={isEditMode || saving}
                        tituloEnlace="Ver detalles de la sede"
                        alNavegar={(id) => navigate(`/servicio-campo/unidades-organizativas/${id}`)}
                        opciones={unidades.map((u) => ({
                          id: u.id,
                          nombre: `${u.nombre} (${u.codigo})`,
                          detalle: u.ciudad || undefined,
                        }))}
                        seleccionada={
                          formData.unidadOrganizativaId
                            ? (() => {
                                const u = unidades.find((item) => item.id === formData.unidadOrganizativaId);
                                return u ? { id: u.id, nombre: `${u.nombre} (${u.codigo})` } : null;
                              })()
                            : null
                        }
                        textoBusqueda={busquedaSede}
                        alCambiarBusqueda={setBusquedaSede}
                        alSeleccionar={(sedeId) => {
                          setFormData((prev) => ({
                            ...prev,
                            unidadOrganizativaId: sedeId || '',
                          }));
                          if (errors.unidadOrganizativaId && sedeId) {
                            setErrors((prev) => ({ ...prev, unidadOrganizativaId: '' }));
                          }
                        }}
                        renderizarCreacionRapida={({ abierto, cerrar }) => (
                          <CrearUnidadOrganizativaDrawer
                            abierto={abierto}
                            alCerrar={cerrar}
                            alGuardar={(nueva) => {
                              setUnidades((prev) => [...prev, nueva]);
                              setFormData((prev) => ({ ...prev, unidadOrganizativaId: nueva.id }));
                              if (errors.unidadOrganizativaId) {
                                setErrors((prev) => ({ ...prev, unidadOrganizativaId: '' }));
                              }
                              notifySuccess(`Sede "${nueva.nombre}" creada y seleccionada exitosamente.`);
                              setStatusMessage(null);
                              cerrar();
                            }}
                          />
                        )}
                      />
                    </D365FormField>

                    {formData.tipo === 2 && (
                      <D365FormField
                        label="Técnico responsable de custodia"
                        required
                        error={errors.recursoId}
                      >
                        <SelectorEntidadRelacionada
                          etiquetaGrupo="Técnicos de Campo"
                          icono={<Person16Regular />}
                          deshabilitado={isEditMode || saving}
                          tituloEnlace="Ver detalles del técnico"
                          alNavegar={(id) => navigate(`/servicio-campo/recursos/${id}`)}
                          opciones={recursosDisponibles.map((r) => {
                            const tieneCustodia = Boolean(r.almacenMovilId && r.almacenMovilId !== currentId);
                            return {
                              id: r.id,
                              nombre: `${r.nombreCompleto} (${r.codigo})`,
                              detalle: tieneCustodia ? 'Custodia activa' : undefined,
                            };
                          })}
                          seleccionada={
                            formData.recursoId
                              ? (() => {
                                  const r = recursos.find((item) => item.id === formData.recursoId);
                                  return r ? { id: r.id, nombre: `${r.nombreCompleto} (${r.codigo})` } : null;
                                })()
                              : null
                          }
                          textoBusqueda={busquedaRecurso}
                          alCambiarBusqueda={setBusquedaRecurso}
                          alSeleccionar={(recId) => {
                            setFormData((prev) => ({ ...prev, recursoId: recId || '' }));
                            if (errors.recursoId && recId) {
                              setErrors((prev) => ({ ...prev, recursoId: '' }));
                            }
                          }}
                        />
                      </D365FormField>
                    )}

                    <D365FormField label="Descripción u observaciones" align="top">
                      <Textarea
                        className={styles.d365ControlFull}
                        rows={4}
                        maxLength={500}
                        value={formData.descripcion || ''}
                        onChange={(_e, d) =>
                          setFormData((prev) => ({ ...prev, descripcion: d.value }))
                        }
                      />
                    </D365FormField>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: EXISTENCIAS / STOCK */}
            {selectedTab === 'existencias' && currentId && (
              <div className={styles.card}>
                {!isEditMode ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                    <Box16Regular style={{ fontSize: 32, marginBottom: 8 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Guarde el almacén para consultar existencias.</p>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontSize: 13, color: tokens.colorNeutralForeground3 }}>
                        Total líneas con stock: <strong>{existenciasFiltradas.length}</strong>
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Button
                          size="small"
                          icon={<Tag16Regular />}
                          onClick={handleVerTodasSeriesAlmacen}
                          disabled={existenciasFiltradas.length === 0}
                          title="Ver todas las series registradas en este almacén"
                        >
                          Ver Series
                        </Button>
                        <Button
                          size="small"
                          icon={<ArrowDownload16Regular />}
                          onClick={handleExportarExistenciasAlmacen}
                          disabled={existenciasFiltradas.length === 0}
                        >
                          Exportar a Excel
                        </Button>
                        <Input
                          contentBefore={<Search16Regular />}
                          placeholder="Buscar"
                          aria-label="Buscar producto o código"
                          value={filtroStock}
                          onChange={(_e, d) => setFiltroStock(d.value)}
                          style={{ width: 280 }}
                        />
                      </div>
                    </div>

                    {cargandoExistencias ? (
                      <div style={{ padding: 24, textAlign: 'center' }}>
                        <Spinner label="Cargando existencias..." size="small" />
                      </div>
                    ) : existenciasFiltradas.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                        <p style={{ margin: 0, fontWeight: 500 }}>{filtroStock ? 'Sin resultados.' : 'No hay existencias.'}</p>
                      </div>
                    ) : (
                      <Table aria-label="Existencias del almacén">
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Código</TableHeaderCell>
                            <TableHeaderCell>Producto</TableHeaderCell>
                            <TableHeaderCell>Ubicación</TableHeaderCell>
                            <TableHeaderCell>Condición</TableHeaderCell>
                            <TableHeaderCell>Control</TableHeaderCell>
                            <TableHeaderCell style={{ textAlign: 'right' }}>Disponible</TableHeaderCell>
                            <TableHeaderCell style={{ textAlign: 'right' }}>Reservado</TableHeaderCell>
                            <TableHeaderCell style={{ textAlign: 'right' }}>Total</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {existenciasFiltradas.map((item) => (
                            <TableRow key={item.stockId || item.productoId}>
                              <TableCell>
                                <TableCellLayout>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                    {item.codigoProducto || '—'}
                                  </span>
                                </TableCellLayout>
                              </TableCell>
                              <TableCell>
                                <TableCellLayout>
                                  <strong>{item.nombreProducto}</strong>
                                </TableCellLayout>
                              </TableCell>
                              <TableCell>{item.nombreUbicacion || '—'}</TableCell>
                              <TableCell>
                                {item.condicion === 'Utilizable' ? (
                                  <Badge appearance="tint" shape="rounded" color="success">
                                    Utilizable
                                  </Badge>
                                ) : item.condicion ? (
                                  <Badge appearance="tint" shape="rounded" color="danger">
                                    {item.condicion}
                                  </Badge>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                              <TableCell>
                                {item.esSerializado ? (
                                  <Button
                                    appearance="subtle"
                                    size="small"
                                    style={{ padding: '0 4px', height: '24px' }}
                                    onClick={() => handleVerSeriesProducto(item)}
                                    title="Haga clic para ver los números de serie"
                                  >
                                    <Badge appearance="tint" shape="rounded" color="brand" style={{ cursor: 'pointer' }}>
                                      Seriado ({item.cantidadDisponible}) 🔍
                                    </Badge>
                                  </Button>
                                ) : (
                                  <Badge appearance="tint" shape="rounded" color="subtle">
                                    No seriado
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell style={{ textAlign: 'right' }}>
                                {item.esSerializado ? (
                                  <Button
                                    appearance="subtle"
                                    size="small"
                                    style={{ padding: '0 4px', height: '24px', fontWeight: 600 }}
                                    onClick={() => handleVerSeriesProducto(item)}
                                    title="Ver números de serie disponibles"
                                  >
                                    <Badge
                                      appearance="tint"
                                      shape="rounded"
                                      color={item.cantidadDisponible > 0 ? 'success' : 'subtle'}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      {item.cantidadDisponible} {item.nombreUnidadMedida || 'UND'}
                                    </Badge>
                                  </Button>
                                ) : (
                                  <Badge
                                    appearance="tint"
                                    shape="rounded"
                                    color={item.cantidadDisponible > 0 ? 'success' : 'subtle'}
                                  >
                                    {item.cantidadDisponible} {item.nombreUnidadMedida || 'UND'}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell style={{ textAlign: 'right' }}>
                                {item.cantidadReservada > 0 ? (
                                  <Badge appearance="tint" shape="rounded" color="warning">
                                    {item.cantidadReservada} {item.nombreUnidadMedida || 'UND'}
                                  </Badge>
                                ) : (
                                  `0 ${item.nombreUnidadMedida || 'UND'}`
                                )}
                              </TableCell>
                              <TableCell style={{ textAlign: 'right', fontWeight: 600 }}>
                                {item.cantidadTotal} {item.nombreUnidadMedida || 'UND'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 3: DETALLE / AUDITORÍA */}
            {selectedTab === 'detalle' && currentId && (
              <div className={styles.card}>
                <div className={styles.grid2Cols}>
                  <D365FormField label="Creado por">
                    <Input
                      className={styles.d365ControlFull}
                      value={savedHeader.creadoPorNombre || currentUser.nombre || 'SuperAdmin'}
                      appearance="filled-darker"
                      readOnly
                      contentAfter={
                        <LockClosed16Regular
                          title="Campo de auditoría del sistema"
                          aria-label="Campo de solo lectura"
                        />
                      }
                    />
                  </D365FormField>

                  <D365FormField label="Estado del registro">
                    <Input
                      className={styles.d365ControlFull}
                      value={savedHeader.activo ? 'Activo' : 'Inactivo'}
                      appearance="filled-darker"
                      readOnly
                      contentAfter={
                        <LockClosed16Regular
                          title="Gestionado con los comandos de estado"
                          aria-label="Campo de solo lectura"
                        />
                      }
                    />
                  </D365FormField>

                  {savedHeader.fechaCreacion && (
                    <D365FormField label="Fecha de registro">
                      <Input
                        className={styles.d365ControlFull}
                        value={new Date(savedHeader.fechaCreacion).toLocaleString()}
                        appearance="filled-darker"
                        readOnly
                        contentAfter={
                          <LockClosed16Regular
                            title="Fecha generada por el sistema"
                            aria-label="Campo de solo lectura"
                          />
                        }
                      />
                    </D365FormField>
                  )}

                  {savedHeader.id && (
                    <D365FormField label="Identificador del sistema (ID)">
                      <Input
                        className={styles.d365ControlFull}
                        value={savedHeader.id}
                        appearance="filled-darker"
                        readOnly
                        contentAfter={
                          <LockClosed16Regular
                            title="Clave primaria única"
                            aria-label="Campo de solo lectura"
                          />
                        }
                      />
                    </D365FormField>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </D365FormContent>

      {/* DRAWER: DETALLE DE SERIES EN ALMACÉN / CUSTODIA */}
      <OverlayDrawer
        open={drawerSeriesOpen}
        position="end"
        size="large"
        onOpenChange={(_, { open }) => setDrawerSeriesOpen(open)}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDrawerSeriesOpen(false)}
              />
            }
          >
            <div>
              <Text weight="semibold" style={{ fontSize: '16px', color: tokens.colorBrandForeground1 }}>
                {productoSeriesSeleccionado
                  ? `Series: ${productoSeriesSeleccionado.nombreProducto}`
                  : `Series en ${savedHeader.nombre || formData.nombre || 'Almacén'}`}
              </Text>
              <Text block style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                {productoSeriesSeleccionado
                  ? `Código SKU: ${productoSeriesSeleccionado.codigoProducto} · Total: ${seriesFiltradas.length} series registradas`
                  : `Total: ${seriesFiltradas.length} series en custodia / stock de este almacén`}
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Input
              contentBefore={<Search16Regular />}
              placeholder="Buscar por N° de serie, SKU o MAC..."
              value={filtroSeries}
              onChange={(_, d) => setFiltroSeries(d.value)}
              style={{ width: 320 }}
            />
            <Button
              size="small"
              icon={<ArrowDownload16Regular />}
              onClick={handleExportarSeries}
              disabled={seriesFiltradas.length === 0}
            >
              Exportar Series a Excel
            </Button>
          </div>

          {cargandoSeries ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Spinner label="Cargando números de serie..." size="medium" />
            </div>
          ) : seriesFiltradas.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>
                {filtroSeries ? 'Sin resultados para la búsqueda.' : 'No hay series registradas en este almacén.'}
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
              <Table aria-label="Detalle de series">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell style={{ width: 40 }}>#</TableHeaderCell>
                    <TableHeaderCell>Número de Serie</TableHeaderCell>
                    {!productoSeriesSeleccionado && <TableHeaderCell>Producto</TableHeaderCell>}
                    <TableHeaderCell>MAC / SmartCard</TableHeaderCell>
                    <TableHeaderCell>Condición</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell>Ubicación</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seriesFiltradas.map((s, idx) => (
                    <TableRow key={s.id || s.numeroSerie}>
                      <TableCell style={{ color: tokens.colorNeutralForeground4, fontSize: '12px' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px' }}>
                            {s.numeroSerie}
                          </span>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Copy16Regular />}
                            title="Copiar número de serie"
                            onClick={() => handleCopiarSerie(s.numeroSerie)}
                            style={{ padding: 2, height: 22, minWidth: 22 }}
                          />
                          {serieCopiada === s.numeroSerie && (
                            <Badge appearance="filled" color="success" size="small">
                              Copiado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {!productoSeriesSeleccionado && (
                        <TableCell>
                          <div>
                            <Text weight="semibold" style={{ fontSize: '12px' }}>
                              {s.codigoProducto}
                            </Text>
                            <Text block style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                              {s.nombreProducto}
                            </Text>
                          </div>
                        </TableCell>
                      )}
                      <TableCell style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                        {s.macAddress || s.numeroSmartCard || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          appearance="tint"
                          shape="rounded"
                          color={s.condicion === 'Defectuoso' ? 'danger' : 'success'}
                        >
                          {s.condicion || 'Utilizable'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          appearance="tint"
                          shape="rounded"
                          color={s.estado === 'Disponible' ? 'success' : 'brand'}
                        >
                          {s.estado || 'En Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '12px' }}>
                        {s.nombreUbicacion || 'Principal'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DrawerBody>

        <DrawerFooter
          style={{
            borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Mostrando {seriesFiltradas.length} series
          </Text>
          <Button appearance="secondary" onClick={() => setDrawerSeriesOpen(false)}>
            Cerrar
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
    </div>
  );
};
