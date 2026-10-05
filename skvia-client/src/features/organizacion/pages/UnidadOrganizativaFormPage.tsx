import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Checkbox,
  Tab,
  TabList,
  Spinner,
  Text,
  Badge,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  ArrowClockwise16Regular,
  BuildingBank20Regular,
  Box16Regular,
  Shield16Regular,
  History16Regular,
  LockClosed16Regular,
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

export function UnidadOrganizativaFormPage() {
  const styles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  const cargarDatos = useCallback(async (unidadId: string) => {
    try {
      setLoading(true);
      const [unidad, terrs, alms] = await Promise.all([
        OrganizacionService.getUnidadOrganizativaById(unidadId),
        OrganizacionService.getTerritorios(unidadId),
        AlmacenService.getAlmacenes(),
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
    if (!formData.codigo.trim()) newErrors.codigo = 'El código de sede es obligatorio (ej. TRU, CHI).';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre de la unidad es obligatorio.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfterSave = false): Promise<void> => {
    if (!validate()) {
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
          esSedePrincipal: formData.esSedePrincipal,
        });

        setHeaderInfo((prev) => ({
          ...prev,
          nombre: formData.nombre.trim(),
          esSedePrincipal: formData.esSedePrincipal,
        }));

        const successMsg = `Sede "${formData.nombre.trim()}" actualizada exitosamente.`;
        setStatusMessage({ type: 'success', text: successMsg });

        if (closeAfterSave) {
          navigate('/servicio-campo/unidades-organizativas');
        }
      } else {
        const res = await OrganizacionService.createUnidadOrganizativa({
          codigo: formData.codigo.trim().toUpperCase(),
          nombre: formData.nombre.trim(),
          ciudad: formData.ciudad?.trim() || null,
          direccion: formData.direccion?.trim() || null,
          telefono: formData.telefono?.trim() || null,
          esSedePrincipal: formData.esSedePrincipal,
        });

        if (closeAfterSave) {
          navigate('/servicio-campo/unidades-organizativas');
        } else {
          navigate(`/servicio-campo/unidades-organizativas/${res.id}`, { replace: true });
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error al guardar la unidad organizativa.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.root}>
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

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner label="Cargando unidad organizativa..." size="large" />
        </div>
      ) : (
        <>
          <D365EntityHeader
            title={isEditMode ? headerInfo.nombre || 'Sede / Base' : 'Nueva Unidad Organizativa'}
            subtitle={headerInfo.esSedePrincipal ? 'Sede Principal de Operaciones' : 'Base Zonal'}
            avatarName={isEditMode ? headerInfo.nombre : 'Sede'}
            avatarIcon={<BuildingBank20Regular />}
            avatarSize={48}
            metadata={[
              { label: 'Jerarquía', value: formData.esSedePrincipal ? 'Sede Principal' : 'Base Zonal' },
              { label: 'Estado', value: headerInfo.activo ? 'Activo' : 'Inactivo' },
            ]}
            tabs={
              <TabList
                selectedValue={selectedTab}
                onTabSelect={(_, d) =>
                  setSelectedTab(d.value as 'general' | 'territorios' | 'almacenes' | 'detalle')
                }
              >
                <Tab value="general" icon={<BuildingBank20Regular />}>
                  General
                </Tab>
                <Tab value="territorios" disabled={!isEditMode} icon={<Shield16Regular />}>
                  Territorios
                </Tab>
                <Tab value="almacenes" disabled={!isEditMode} icon={<Box16Regular />}>
                  Almacenes
                </Tab>
                <Tab value="detalle" disabled={!isEditMode} icon={<History16Regular />}>
                  Detalle / Auditoría
                </Tab>
              </TabList>
            }
          />

          <div className={styles.contentBody}>
            {selectedTab === 'general' ? (
              <div className={styles.card}>
                <div className={styles.grid2Cols}>
                  <D365FormField label="Código de Sede" required error={errors.codigo}>
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.codigo}
                      maxLength={10}
                      disabled={isEditMode}
                      onChange={(_, d) => setFormData((p) => ({ ...p, codigo: d.value.toUpperCase() }))}
                    />
                  </D365FormField>

                  <D365FormField label="Nombre de la Unidad / Sede" required error={errors.nombre}>
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.nombre}
                      maxLength={150}
                      onChange={(_, d) => setFormData((p) => ({ ...p, nombre: d.value }))}
                    />
                  </D365FormField>

                  <D365FormField label="Ciudad">
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.ciudad || ''}
                      maxLength={100}
                      onChange={(_, d) => setFormData((p) => ({ ...p, ciudad: d.value }))}
                    />
                  </D365FormField>

                  <D365FormField label="Teléfono / Central">
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.telefono || ''}
                      maxLength={30}
                      onChange={(_, d) => setFormData((p) => ({ ...p, telefono: d.value }))}
                    />
                  </D365FormField>

                  <D365FormField label="Dirección de la base" align="top">
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.direccion || ''}
                      maxLength={200}
                      onChange={(_, d) => setFormData((p) => ({ ...p, direccion: d.value }))}
                    />
                  </D365FormField>

                  <D365FormField label="Configuración de Sede">
                    <Checkbox
                      label="Declarar como Sede Principal de la empresa"
                      checked={formData.esSedePrincipal}
                      onChange={(_, d) => setFormData((p) => ({ ...p, esSedePrincipal: Boolean(d.checked) }))}
                    />
                  </D365FormField>
                </div>
              </div>
            ) : selectedTab === 'territorios' ? (
              <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <Text weight="semibold">Territorios asignados a esta Sede</Text>
                  <D365CommandButton
                    icon={<Add16Regular />}
                    tone="create"
                    onClick={() => navigate('/servicio-campo/territorios/nuevo')}
                  >
                    Nuevo Territorio
                  </D365CommandButton>
                </div>
                {territorios.length === 0 ? (
                  <Text size={200} style={{ color: '#888' }}>
                    No hay territorios asignados.
                  </Text>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e0e0e0', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Código</th>
                        <th style={{ padding: '8px' }}>Territorio</th>
                        <th style={{ padding: '8px' }}>Almacén Predeterminado</th>
                        <th style={{ padding: '8px' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {territorios.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{t.codigo}</td>
                          <td style={{ padding: '8px' }}>{t.nombre}</td>
                          <td style={{ padding: '8px' }}>{t.almacenPredeterminadoNombre || '—'}</td>
                          <td style={{ padding: '8px' }}>
                            <Badge appearance="filled" color={t.activo ? 'success' : 'danger'}>
                              {t.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : selectedTab === 'almacenes' ? (
              <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <Text weight="semibold">Almacenes y bodegas de esta Sede</Text>
                  <D365CommandButton
                    icon={<Add16Regular />}
                    tone="create"
                    onClick={() => navigate('/servicio-campo/almacenes/nuevo')}
                  >
                    Nuevo Almacén
                  </D365CommandButton>
                </div>
                {almacenes.length === 0 ? (
                  <Text size={200} style={{ color: '#888' }}>
                    No hay almacenes asociados.
                  </Text>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e0e0e0', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Nombre</th>
                        <th style={{ padding: '8px' }}>Código</th>
                        <th style={{ padding: '8px' }}>Tipo</th>
                        <th style={{ padding: '8px' }}>Responsable / Custodio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {almacenes.map((a) => (
                        <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{a.nombre}</td>
                          <td style={{ padding: '8px' }}>{a.codigo || '—'}</td>
                          <td style={{ padding: '8px' }}>
                            <Badge appearance="tint" color={a.tipo === 2 ? 'warning' : 'informative'}>
                              {a.tipo === 2 ? 'Móvil / Campo' : 'Bodega Base'}
                            </Badge>
                          </td>
                          <td style={{ padding: '8px' }}>{a.recursoNombre || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className={styles.card}>
                <div className={styles.grid2Cols}>
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
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
