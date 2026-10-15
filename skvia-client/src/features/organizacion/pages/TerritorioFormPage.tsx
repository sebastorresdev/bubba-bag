import { D365FormContent } from '../../../components/common/D365FormContent';
import { useValidationFocus } from '../../../hooks/useValidationFocus';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Input,
  Tab,
  TabList,
  Text,
  Badge,
  Toast,
  Toaster,
  ToastTitle,
  useToastController,
  useId,
  createTableColumn,
  type TableColumnDefinition,
  Skeleton,
  SkeletonItem,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  ArrowClockwise16Regular,
  LockClosed16Regular,
  Box16Regular,
  Building16Regular,
  Shield20Regular,
} from '@fluentui/react-icons';
import { OrganizacionService } from '../services/organizacion.service';
import type {
  CreateTerritorioDto,
  UnidadOrganizativaDto,
  RecursoDto,
} from '../types/organizacion.types';
import { AlmacenService } from '../../inventario/almacenes/services/almacen.service';
import type { AlmacenDto } from '../../inventario/almacenes/types/almacen.types';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { D365FormField } from '../../../components/common/D365FormField';
import { SelectorEntidadRelacionada } from '../../../components/common/SelectorEntidadRelacionada';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../components/common/D365EntityHeader';
import { D365SubGrid } from '../../../components/common/D365SubGrid';

export function TerritorioFormPage() {
  const styles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const toasterId = useId('territorio-toaster');
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

  const isEditMode = Boolean(id && id !== 'nuevo');

  // Form State
  const [formData, setFormData] = useState<CreateTerritorioDto>({
    codigo: '',
    nombre: '',
    unidadOrganizativaId: '',
    almacenPredeterminadoId: '',
    descripcionProveedor: '',
  });

  const [headerInfo, setHeaderInfo] = useState<{
    nombre: string;
    unidadOrganizativaNombre: string;
    activo: boolean;
  }>({
    nombre: '',
    unidadOrganizativaNombre: '',
    activo: true,
  });

  // Catálogos
  const [sedes, setSedes] = useState<UnidadOrganizativaDto[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [recursosAsignados, setRecursosAsignados] = useState<RecursoDto[]>([]);
  const [busquedaSede, setBusquedaSede] = useState('');
  const [busquedaAlmacen, setBusquedaAlmacen] = useState('');

  // UI state
  const [selectedTab, setSelectedTab] = useState<'general' | 'recursos' | 'detalle'>('general');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const focusValidation = useValidationFocus();
  const draft = useUnsavedChanges({ formData }, !loading);


  useEffect(() => {
    let activo = true;
    Promise.all([
      OrganizacionService.getUnidadesOrganizativas(true),
      AlmacenService.getAlmacenes(true),
    ])
      .then(([seds, alms]) => {
        if (!activo) return;
        setSedes(seds);
        setAlmacenes(
          alms.filter(
            (a) =>
              a.tipo === 1 ||
              String(a.tipo).toLowerCase().includes('bodega') ||
              (!a.tipo && !a.recursoId)
          )
        ); // Solo bodegas base para abastecimiento
      })
      .catch((e) => console.error(e));

    return () => {
      activo = false;
    };
  }, []);

  const cargarDatos = useCallback(async (terrId: string) => {
    try {
      setLoading(true);
      const [terr, recs] = await Promise.all([
        OrganizacionService.getTerritorioById(terrId),
        OrganizacionService.getRecursos(),
      ]);

      setFormData({
        codigo: terr.codigo,
        nombre: terr.nombre,
        unidadOrganizativaId: terr.unidadOrganizativaId,
        almacenPredeterminadoId: terr.almacenPredeterminadoId || '',
        descripcionProveedor: terr.descripcionProveedor || '',
      });

      setHeaderInfo({
        nombre: terr.nombre,
        unidadOrganizativaNombre: terr.unidadOrganizativaNombre,
        activo: terr.activo,
      });

      setRecursosAsignados(recs.filter((r) => r.zonaOperativaId === terrId));
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error al obtener datos del territorio.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      void cargarDatos(id);
    } else {
      setLoading(false);
    }
  }, [id, isEditMode, cargarDatos]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre del territorio es obligatorio.';
    if (!formData.unidadOrganizativaId) newErrors.unidadOrganizativaId = 'Debe seleccionar la sede a la que pertenece.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfterSave = false): Promise<void> => {
    const savedDraft = draft.capture();
    if (!validate()) {
      setSelectedTab('general'); focusValidation();
      setStatusMessage({ type: 'error', text: 'Por favor complete todos los campos obligatorios.' });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      if (isEditMode && id) {
        await OrganizacionService.updateTerritorio(id, {
          nombre: formData.nombre.trim(),
          unidadOrganizativaId: formData.unidadOrganizativaId,
          almacenPredeterminadoId: formData.almacenPredeterminadoId || null,
          descripcionProveedor: formData.descripcionProveedor?.trim() || null,
        });

        const sede = sedes.find((s) => s.id === formData.unidadOrganizativaId);
        setHeaderInfo((p) => ({
          ...p,
          nombre: formData.nombre.trim(),
          unidadOrganizativaNombre: sede?.nombre || p.unidadOrganizativaNombre,
        }));

        setStatusMessage(null);
        draft.markSaved(savedDraft);
        notifySuccess(`Territorio "${formData.nombre.trim()}" actualizado correctamente.`);
        if (closeAfterSave) { draft.markSaved(savedDraft);
navigate('/servicio-campo/territorios'); }
      } else {
        const res = await OrganizacionService.createTerritorio({
          codigo: formData.codigo?.trim() ? formData.codigo.trim().toUpperCase() : undefined,
          nombre: formData.nombre.trim(),
          unidadOrganizativaId: formData.unidadOrganizativaId,
          almacenPredeterminadoId: formData.almacenPredeterminadoId || null,
          descripcionProveedor: formData.descripcionProveedor?.trim() || null,
        });

        setStatusMessage(null);
        draft.markSaved(savedDraft);
        notifySuccess(`Territorio "${formData.nombre.trim()}" creado exitosamente.`);

        if (closeAfterSave) {
          draft.markSaved(savedDraft);
          navigate('/servicio-campo/territorios');
        } else {
          draft.markSaved(savedDraft);
          navigate(`/servicio-campo/territorios/${res.id}`, { replace: true });
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error al guardar el territorio.' });
    } finally {
      setSaving(false);
    }
  };

  const columnasRecursos: TableColumnDefinition<RecursoDto>[] = useMemo(
    () => [
      createTableColumn<RecursoDto>({
        columnId: 'codigo',
        compare: (a, b) => a.codigo.localeCompare(b.codigo),
        renderHeaderCell: () => 'Código',
        renderCell: (item) => <Text weight="semibold">{item.codigo}</Text>,
      }),
      createTableColumn<RecursoDto>({
        columnId: 'nombreCompleto',
        compare: (a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto),
        renderHeaderCell: () => 'Nombre Completo',
        renderCell: (item) => item.nombreCompleto,
      }),
      createTableColumn<RecursoDto>({
        columnId: 'tipo',
        renderHeaderCell: () => 'Tipo',
        renderCell: (item) => (
          <Badge appearance="tint" shape="rounded" color="informative">
            {item.tipoNombre}
          </Badge>
        ),
      }),
      createTableColumn<RecursoDto>({
        columnId: 'telefono',
        renderHeaderCell: () => 'Teléfono',
        renderCell: (item) => item.telefono || '—',
      }),
      createTableColumn<RecursoDto>({
        columnId: 'activo',
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <Badge appearance="ghost" shape="rounded" color={item.activo ? 'success' : 'danger'}>
            {item.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      }),
    ],
    []
  );

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} position="top-end" />
      {statusMessage && (
        <D365MessageBar intent={statusMessage.type} onDismiss={() => setStatusMessage(null)}>
          {statusMessage.text}
        </D365MessageBar>
      )}

      <D365CommandBar
        ariaLabel="Comandos de Territorio"
        busy={saving || loading}
        busyLabel={loading ? 'Cargando...' : 'Guardando...'}
      >
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            onClick={() => navigate('/servicio-campo/territorios')}
            title="Volver al listado"
          />
          <D365CommandDivider />
          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            disabled={saving || loading}
            onClick={() => void handleSave(false)}
          >
            Guardar
          </D365CommandButton>
          <D365CommandButton
            icon={<SaveMultiple16Regular />}
            tone="save"
            disabled={saving || loading}
            onClick={() => void handleSave(true)}
          >
            Guardar y cerrar
          </D365CommandButton>
          <D365CommandDivider />
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            disabled={saving}
            onClick={() => navigate('/servicio-campo/territorios/nuevo')}
          >
            Nuevo
          </D365CommandButton>
          {isEditMode && (
            <D365CommandButton
              icon={<ArrowClockwise16Regular />}
              disabled={saving || loading}
              onClick={() => {
                if (id) void cargarDatos(id);
              }}
            >
              Actualizar
            </D365CommandButton>
          )}
        </div>
      </D365CommandBar>

      <D365EntityHeader
        title={loading ? 'Cargando...' : isEditMode ? headerInfo.nombre || 'Territorio' : 'Nuevo Territorio'}
        subtitle={loading ? 'Cargando...' : headerInfo.unidadOrganizativaNombre ? `Sede: ${headerInfo.unidadOrganizativaNombre}` : 'Zona Operativa'}
        avatarName={isEditMode ? headerInfo.nombre : 'Territorio'}
        avatarIcon={<Shield20Regular />}
        avatarSize={48}
        metadata={
          loading
            ? [
                { label: 'Sede', value: 'Cargando...' },
                { label: 'Estado', value: '—' },
              ]
            : [
                { label: 'Sede', value: headerInfo.unidadOrganizativaNombre || 'Sin asignar' },
                { label: 'Estado', value: headerInfo.activo ? 'Activo' : 'Inactivo' },
              ]
        }
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, d) => setSelectedTab(d.value as 'general' | 'recursos' | 'detalle')}
          >
            <Tab value="general">General</Tab>
            <Tab value="recursos" disabled={!isEditMode || loading}>Técnicos Asignados</Tab>
            <Tab value="detalle" disabled={!isEditMode || loading}>Detalle / Auditoría</Tab>
          </TabList>
        }
      />

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
            {selectedTab === 'general' ? (
              <div style={{ maxWidth: '680px', width: '100%' }}>
                <Card className={styles.card}>
                  <Text className={styles.cardSectionTitle}>Información del Territorio y Zona</Text>

                  {isEditMode && formData.codigo && (
                    <D365FormField label="Código de Territorio">
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.codigo}
                        readOnly
                        appearance="filled-darker"
                      />
                    </D365FormField>
                  )}

                  <D365FormField label="Nombre del Territorio / Zona" required error={errors.nombre}>
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.nombre}
                      maxLength={150}
                      onChange={(_, d) => setFormData((p) => ({ ...p, nombre: d.value }))}
                    />
                  </D365FormField>

                  <D365FormField label="Unidad Organizativa (Sede)" required error={errors.unidadOrganizativaId}>
                    <SelectorEntidadRelacionada
                      etiquetaGrupo="Sedes"
                      icono={<Building16Regular />}
                      opciones={sedes.map((s) => ({
                        id: s.id,
                        nombre: `${s.nombre} (${s.codigo})`,
                      }))}
                      seleccionada={
                        formData.unidadOrganizativaId
                          ? (() => {
                              const s = sedes.find((item) => item.id === formData.unidadOrganizativaId);
                              return s ? { id: s.id, nombre: `${s.nombre} (${s.codigo})` } : null;
                            })()
                          : null
                      }
                      textoBusqueda={busquedaSede}
                      alCambiarBusqueda={setBusquedaSede}
                      alSeleccionar={(sedeId) => {
                        setFormData((p) => ({
                          ...p,
                          unidadOrganizativaId: sedeId || '',
                          almacenPredeterminadoId: '',
                        }));
                        if (errors.unidadOrganizativaId && sedeId) {
                          setErrors((e) => ({ ...e, unidadOrganizativaId: '' }));
                        }
                      }}
                      alNavegar={(sedeId) => navigate(`/administracion/unidades-organizativas/${sedeId}`)}
                      deshabilitado={saving}
                    />
                  </D365FormField>

                  <D365FormField label="Almacén Base de Abastecimiento">
                    <SelectorEntidadRelacionada
                      etiquetaGrupo="Almacenes"
                      icono={<Box16Regular />}
                      opciones={almacenes
                        .filter(
                          (a) =>
                            !formData.unidadOrganizativaId ||
                            !a.unidadOrganizativaId ||
                            a.unidadOrganizativaId === formData.unidadOrganizativaId ||
                            a.id === formData.almacenPredeterminadoId
                        )
                        .map((a) => ({
                          id: a.id,
                          nombre: a.nombre,
                        }))}
                      seleccionada={
                        formData.almacenPredeterminadoId
                          ? (() => {
                              const a = almacenes.find((item) => item.id === formData.almacenPredeterminadoId);
                              return a ? { id: a.id, nombre: a.nombre } : null;
                            })()
                          : null
                      }
                      textoBusqueda={busquedaAlmacen}
                      alCambiarBusqueda={setBusquedaAlmacen}
                      alSeleccionar={(almId) =>
                        setFormData((p) => ({ ...p, almacenPredeterminadoId: almId || '' }))
                      }
                      alNavegar={(almId) => navigate(`/almacenes/${almId}`)}
                      deshabilitado={saving}
                    />
                  </D365FormField>

                  <D365FormField label="Código de Operación Proveedor">
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.descripcionProveedor || ''}
                      maxLength={150}
                      onChange={(_, d) => setFormData((p) => ({ ...p, descripcionProveedor: d.value }))}
                    />
                  </D365FormField>
                </Card>
              </div>
            ) : selectedTab === 'recursos' ? (
              <D365SubGrid
                title="Técnicos asignados a este Territorio"
                items={recursosAsignados}
                columns={columnasRecursos}
                onAdd={() => navigate('/servicio-campo/recursos/nuevo')}
                addLabel="Nuevo Técnico"
                onRowClick={(r) => navigate(`/servicio-campo/recursos/${r.id}`)}
                emptyMessage="No hay técnicos asignados a este territorio."
              />
            ) : (
              <div className={styles.card}>
                <div className={styles.grid2Cols}>
                  <D365FormField label="Estado Operativo">
                    <Input
                      className={styles.d365ControlFull}
                      value={headerInfo.activo ? 'Activo para despacho' : 'Inactivo'}
                      readOnly
                      appearance="filled-darker"
                      contentAfter={<LockClosed16Regular />}
                    />
                  </D365FormField>
                </div>
              </div>
            )}
          </>
        )}
      </D365FormContent>
    </div>
  );
}
