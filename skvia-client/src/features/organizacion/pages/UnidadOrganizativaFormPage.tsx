import { D365FormContent } from '../../../components/common/D365FormContent';
import { useValidationFocus } from '../../../hooks/useValidationFocus';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Input,
  Checkbox,
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
  BuildingBank20Regular,
} from '@fluentui/react-icons';
import { OrganizacionService } from '../services/organizacion.service';
import type {
  CreateUnidadOrganizativaDto,
  TerritorioDto,
} from '../types/organizacion.types';
import { AlmacenService } from '../../inventario/almacenes/services/almacen.service';
import type { AlmacenDto } from '../../inventario/almacenes/types/almacen.types';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { D365FormField } from '../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../components/common/D365EntityHeader';
import { D365SubGrid } from '../../../components/common/D365SubGrid';
import { useAuthSession } from '../../../services/authSession';

export function UnidadOrganizativaFormPage() {
  const styles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { permisos } = useAuthSession();
  const puedeEditar = permisos.includes('configuracion.sucursales.gestionar');
  const puedeCambiarPrincipal = permisos.includes('configuracion.sucursales.sede_principal.gestionar');
  const puedeConsultarInventario = permisos.includes('inventario.acceso');
  const puedeCrearRelacionados = permisos.includes('inventario.catalogos.gestionar');

  const toasterId = useId('unidad-toaster');
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
  const [formData, setFormData] = useState<CreateUnidadOrganizativaDto>({
    codigo: '',
    nombre: '',
    ciudad: '',
    direccion: '',
    telefono: '',
    esSedePrincipal: false,
  });

  const [headerInfo, setHeaderInfo] = useState<{
    nombre: string;
    esSedePrincipal: boolean;
    activo: boolean;
    createdAt?: string;
    updatedAt?: string | null;
  }>({
    nombre: '',
    esSedePrincipal: false,
    activo: true,
  });

  // Datos relacionados
  const [territorios, setTerritorios] = useState<TerritorioDto[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);

  // UI state
  const [selectedTab, setSelectedTab] = useState<'general' | 'territorios' | 'almacenes' | 'detalle'>('general');
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const focusValidation = useValidationFocus();
  const draft = useUnsavedChanges({ formData }, !loading);


  const cargarDatos = useCallback(async (unidadId: string) => {
    try {
      setLoading(true);
      const [unidad, terrs, alms] = await Promise.all([
        OrganizacionService.getUnidadOrganizativaById(unidadId),
        puedeConsultarInventario ? OrganizacionService.getTerritorios(unidadId) : Promise.resolve([]),
        puedeConsultarInventario ? AlmacenService.getAlmacenes() : Promise.resolve([]),
      ]);

      setFormData({
        codigo: unidad.codigo,
        nombre: unidad.nombre,
        ciudad: unidad.ciudad || '',
        direccion: unidad.direccion || '',
        telefono: unidad.telefono || '',
        esSedePrincipal: unidad.esSedePrincipal,
      });

      setHeaderInfo({
        nombre: unidad.nombre,
        esSedePrincipal: unidad.esSedePrincipal,
        activo: unidad.activo,
        createdAt: unidad.createdAt,
        updatedAt: unidad.updatedAt,
      });

      setTerritorios(terrs);
      setAlmacenes(alms.filter((a) => a.unidadOrganizativaId === unidadId));
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al obtener la información de la unidad organizativa.',
      });
    } finally {
      setLoading(false);
    }
  }, [puedeConsultarInventario]);

  useEffect(() => {
    if (isEditMode && id) {
      void cargarDatos(id);
    } else {
      setLoading(false);
    }
  }, [id, isEditMode, cargarDatos]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.codigo.trim()) newErrors.codigo = 'El código de sede es obligatorio (ej. TRU, CHI).';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre de la unidad es obligatorio.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfterSave = false): Promise<void> => {
    const savedDraft = draft.capture();
    if (!puedeEditar || saving) return;
    if (!validate()) {
      setSelectedTab('general'); focusValidation();
      setStatusMessage({ type: 'error', text: 'Por favor complete todos los campos obligatorios.' });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      if (isEditMode && id) {
        await OrganizacionService.updateUnidadOrganizativa(id, {
          nombre: formData.nombre.trim(),
          ciudad: formData.ciudad?.trim() || null,
          direccion: formData.direccion?.trim() || null,
          telefono: formData.telefono?.trim() || null,
          esSedePrincipal: puedeCambiarPrincipal ? formData.esSedePrincipal : undefined,
        });

        setHeaderInfo((prev) => ({
          ...prev,
          nombre: formData.nombre.trim(),
          esSedePrincipal: formData.esSedePrincipal,
        }));

        const successMsg = `Sede "${formData.nombre.trim()}" actualizada exitosamente.`;
        setStatusMessage(null);
        draft.markSaved(savedDraft);
        notifySuccess(successMsg);

        if (closeAfterSave) {
          draft.markSaved(savedDraft);
          navigate('/servicio-campo/unidades-organizativas');
        }
      } else {
        const res = await OrganizacionService.createUnidadOrganizativa({
          codigo: formData.codigo.trim().toUpperCase(),
          nombre: formData.nombre.trim(),
          ciudad: formData.ciudad?.trim() || null,
          direccion: formData.direccion?.trim() || null,
          telefono: formData.telefono?.trim() || null,
          esSedePrincipal: puedeCambiarPrincipal && formData.esSedePrincipal,
        });

        setStatusMessage(null);
        draft.markSaved(savedDraft);
        notifySuccess(`Sede "${formData.nombre.trim()}" creada exitosamente.`);

        if (closeAfterSave) {
          draft.markSaved(savedDraft);
          navigate('/servicio-campo/unidades-organizativas');
        } else {
          draft.markSaved(savedDraft);
          navigate(`/servicio-campo/unidades-organizativas/${res.id}`, { replace: true });
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error al guardar la unidad organizativa.' });
    } finally {
      setSaving(false);
    }
  };

  const columnasTerritorios: TableColumnDefinition<TerritorioDto>[] = useMemo(
    () => [
      createTableColumn<TerritorioDto>({
        columnId: 'codigo',
        compare: (a, b) => a.codigo.localeCompare(b.codigo),
        renderHeaderCell: () => 'Código',
        renderCell: (item) => <Text weight="semibold">{item.codigo}</Text>,
      }),
      createTableColumn<TerritorioDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Territorio',
        renderCell: (item) => item.nombre,
      }),
      createTableColumn<TerritorioDto>({
        columnId: 'almacen',
        renderHeaderCell: () => 'Almacén Predeterminado',
        renderCell: (item) => item.almacenPredeterminadoNombre || '—',
      }),
      createTableColumn<TerritorioDto>({
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

  const columnasAlmacenes: TableColumnDefinition<AlmacenDto>[] = useMemo(
    () => [
      createTableColumn<AlmacenDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre',
        renderCell: (item) => <Text weight="semibold">{item.nombre}</Text>,
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'codigo',
        renderHeaderCell: () => 'Código',
        renderCell: (item) => item.codigo || '—',
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'tipo',
        renderHeaderCell: () => 'Tipo',
        renderCell: (item) => (
          <Badge appearance="tint" shape="rounded" color={item.tipo === 2 ? 'warning' : 'informative'}>
            {item.tipo === 2 ? 'Móvil / Campo' : 'Bodega Base'}
          </Badge>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'recurso',
        renderHeaderCell: () => 'Responsable / Custodio',
        renderCell: (item) => item.recursoNombre || '—',
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
        ariaLabel="Comandos de Unidad Organizativa"
        busy={saving || loading}
        busyLabel={loading ? 'Cargando...' : 'Guardando...'}
      >
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            onClick={() => navigate('/servicio-campo/unidades-organizativas')}
            title="Volver al listado"
          />
          <D365CommandDivider />
          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            disabled={saving || loading || !puedeEditar}
            onClick={() => void handleSave(false)}
          >
            Guardar
          </D365CommandButton>
          <D365CommandButton
            icon={<SaveMultiple16Regular />}
            tone="save"
            disabled={saving || loading || !puedeEditar}
            onClick={() => void handleSave(true)}
          >
            Guardar y cerrar
          </D365CommandButton>
          <D365CommandDivider />
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            disabled={saving || !puedeEditar}
            onClick={() => navigate('/servicio-campo/unidades-organizativas/nuevo')}
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
        title={loading ? 'Cargando...' : isEditMode ? headerInfo.nombre || 'Sede / Base' : 'Nueva Unidad Organizativa'}
        subtitle={loading ? 'Cargando...' : headerInfo.esSedePrincipal ? 'Sede Principal de Operaciones' : 'Base Zonal'}
        avatarName={isEditMode ? headerInfo.nombre : 'Sede'}
        avatarIcon={<BuildingBank20Regular />}
        avatarSize={48}
        metadata={
          loading
            ? [
                { label: 'Jerarquía', value: 'Cargando...' },
                { label: 'Estado', value: '—' },
              ]
            : [
                { label: 'Jerarquía', value: formData.esSedePrincipal ? 'Sede Principal' : 'Base Zonal' },
                { label: 'Estado', value: headerInfo.activo ? 'Activo' : 'Inactivo' },
              ]
        }
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, d) =>
              setSelectedTab(d.value as 'general' | 'territorios' | 'almacenes' | 'detalle')
            }
          >
            <Tab value="general">General</Tab>
            <Tab value="territorios" disabled={!isEditMode || loading || !puedeConsultarInventario}>Territorios</Tab>
            <Tab value="almacenes" disabled={!isEditMode || loading || !puedeConsultarInventario}>Almacenes</Tab>
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
              <div className={styles.grid2Cols}>
                {/* Tarjeta 1: Información de la Sede */}
                <Card className={styles.card}>
                  <Text className={styles.cardSectionTitle}>Información de la Sede</Text>

                  <D365FormField label="Código de Sede" required error={errors.codigo}>
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.codigo}
                      maxLength={10}
                      disabled={isEditMode || !puedeEditar || saving}
                      onChange={(_, d) => setFormData((p) => ({ ...p, codigo: d.value.toUpperCase() }))}
                    />
                  </D365FormField>

                  <D365FormField label="Nombre de la Unidad / Sede" required error={errors.nombre}>
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.nombre}
                      disabled={!puedeEditar || saving}
                      maxLength={150}
                      onChange={(_, d) => setFormData((p) => ({ ...p, nombre: d.value }))}
                    />
                  </D365FormField>

                  <D365FormField label="Configuración de Sede">
                    <Checkbox
                      label="Declarar como Sede Principal de la empresa"
                      checked={formData.esSedePrincipal}
                      disabled={!puedeEditar || !puedeCambiarPrincipal || saving}
                      onChange={(_, d) => setFormData((p) => ({ ...p, esSedePrincipal: Boolean(d.checked) }))}
                    />
                  </D365FormField>
                </Card>

                {/* Tarjeta 2: Ubicación y Contacto */}
                <Card className={styles.card}>
                  <Text className={styles.cardSectionTitle}>Ubicación y Contacto</Text>

                  <D365FormField label="Ciudad">
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.ciudad || ''}
                      disabled={!puedeEditar || saving}
                      maxLength={100}
                      onChange={(_, d) => setFormData((p) => ({ ...p, ciudad: d.value }))}
                    />
                  </D365FormField>

                  <D365FormField label="Dirección de la base" align="top">
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.direccion || ''}
                      disabled={!puedeEditar || saving}
                      maxLength={200}
                      onChange={(_, d) => setFormData((p) => ({ ...p, direccion: d.value }))}
                    />
                  </D365FormField>

                  <D365FormField label="Teléfono / Central">
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.telefono || ''}
                      disabled={!puedeEditar || saving}
                      maxLength={30}
                      onChange={(_, d) => setFormData((p) => ({ ...p, telefono: d.value }))}
                    />
                  </D365FormField>
                </Card>
              </div>
            ) : selectedTab === 'territorios' ? (
              <D365SubGrid
                title="Territorios asignados a esta Sede"
                items={territorios}
                columns={columnasTerritorios}
                onAdd={puedeCrearRelacionados ? () => navigate('/servicio-campo/territorios/nuevo') : undefined}
                addLabel="Nuevo Territorio"
                onRowClick={(t) => navigate(`/servicio-campo/territorios/${t.id}`)}
                emptyMessage="No hay territorios asignados a esta sede."
              />
            ) : selectedTab === 'almacenes' ? (
              <D365SubGrid
                title="Almacenes y bodegas de esta Sede"
                items={almacenes}
                columns={columnasAlmacenes}
                onAdd={puedeCrearRelacionados ? () => navigate('/servicio-campo/almacenes/nuevo') : undefined}
                addLabel="Nuevo Almacén"
                onRowClick={(a) => navigate(`/servicio-campo/almacenes/${a.id}`)}
                emptyMessage="No hay almacenes asociados a esta sede."
              />
            ) : (
              <div className={styles.halfCardWrapper}>
                <Card className={styles.card}>
                  <Text className={styles.cardSectionTitle}>Información de Auditoría</Text>
                  <D365FormField label="Fecha de Registro">
                    <Input
                      className={styles.d365ControlFull}
                      value={headerInfo.createdAt ? new Date(headerInfo.createdAt).toLocaleString('es-PE') : '—'}
                      readOnly
                      appearance="filled-darker"
                      contentAfter={<LockClosed16Regular />}
                    />
                  </D365FormField>
                  <D365FormField label="Última Actualización">
                    <Input
                      className={styles.d365ControlFull}
                      value={headerInfo.updatedAt ? new Date(headerInfo.updatedAt).toLocaleString('es-PE') : '—'}
                      readOnly
                      appearance="filled-darker"
                      contentAfter={<LockClosed16Regular />}
                    />
                  </D365FormField>
                </Card>
              </div>
            )}
          </>
        )}
      </D365FormContent>
    </div>
  );
}
