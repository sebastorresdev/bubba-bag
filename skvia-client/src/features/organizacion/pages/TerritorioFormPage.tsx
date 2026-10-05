import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Select,
  Tab,
  TabList,
  Spinner,
  Text,
  Badge,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  ArrowClockwise16Regular,
  Shield20Regular,
  People16Regular,
  History16Regular,
  LockClosed16Regular,
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
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../components/common/D365EntityHeader';

export function TerritorioFormPage() {
  const styles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  // UI state
  const [selectedTab, setSelectedTab] = useState<'general' | 'recursos' | 'detalle'>('general');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!formData.codigo.trim()) newErrors.codigo = 'El código del territorio es obligatorio (ej. I280010).';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre del territorio es obligatorio.';
    if (!formData.unidadOrganizativaId) newErrors.unidadOrganizativaId = 'Debe seleccionar la sede a la que pertenece.';
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

        setStatusMessage({ type: 'success', text: `Territorio "${formData.nombre.trim()}" actualizado correctamente.` });
        if (closeAfterSave) navigate('/servicio-campo/territorios');
      } else {
        const res = await OrganizacionService.createTerritorio({
          codigo: formData.codigo.trim().toUpperCase(),
          nombre: formData.nombre.trim(),
          unidadOrganizativaId: formData.unidadOrganizativaId,
          almacenPredeterminadoId: formData.almacenPredeterminadoId || null,
          descripcionProveedor: formData.descripcionProveedor?.trim() || null,
        });

        if (closeAfterSave) {
          navigate('/servicio-campo/territorios');
        } else {
          navigate(`/servicio-campo/territorios/${res.id}`, { replace: true });
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error al guardar el territorio.' });
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

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner label="Cargando territorio..." size="large" />
        </div>
      ) : (
        <>
          <D365EntityHeader
            title={isEditMode ? headerInfo.nombre || 'Territorio' : 'Nuevo Territorio'}
            subtitle={headerInfo.unidadOrganizativaNombre ? `Sede: ${headerInfo.unidadOrganizativaNombre}` : 'Zona Operativa'}
            avatarName={isEditMode ? headerInfo.nombre : 'Territorio'}
            avatarIcon={<Shield20Regular />}
            avatarSize={48}
            metadata={[
              { label: 'Sede', value: headerInfo.unidadOrganizativaNombre || 'Sin asignar' },
              { label: 'Estado', value: headerInfo.activo ? 'Activo' : 'Inactivo' },
            ]}
            tabs={
              <TabList
                selectedValue={selectedTab}
                onTabSelect={(_, d) => setSelectedTab(d.value as 'general' | 'recursos' | 'detalle')}
              >
                <Tab value="general" icon={<Shield20Regular />}>
                  General
                </Tab>
                <Tab value="recursos" disabled={!isEditMode} icon={<People16Regular />}>
                  Técnicos Asignados
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
                  <D365FormField label="Código de Territorio" required error={errors.codigo}>
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.codigo}
                      maxLength={20}
                      disabled={isEditMode}
                      onChange={(_, d) => setFormData((p) => ({ ...p, codigo: d.value.toUpperCase() }))}
                    />
                  </D365FormField>

                  <D365FormField label="Nombre del Territorio / Zona" required error={errors.nombre}>
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.nombre}
                      maxLength={150}
                      onChange={(_, d) => setFormData((p) => ({ ...p, nombre: d.value }))}
                    />
                  </D365FormField>

                  <D365FormField label="Unidad Organizativa (Sede a la que pertenece)" required error={errors.unidadOrganizativaId}>
                    <Select
                      className={styles.d365ControlFull}
                      value={formData.unidadOrganizativaId}
                      onChange={(_, d) => {
                        setFormData((p) => ({ ...p, unidadOrganizativaId: d.value, almacenPredeterminadoId: '' }));
                        if (errors.unidadOrganizativaId) setErrors((e) => ({ ...e, unidadOrganizativaId: '' }));
                      }}
                    >
                      <option value="">Seleccione sede...</option>
                      {sedes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} ({s.codigo})
                        </option>
                      ))}
                    </Select>
                  </D365FormField>

                  <D365FormField label="Almacén Base de Abastecimiento">
                    <Select
                      className={styles.d365ControlFull}
                      value={formData.almacenPredeterminadoId || ''}
                      onChange={(_, d) => setFormData((p) => ({ ...p, almacenPredeterminadoId: d.value }))}
                    >
                      <option value="">Seleccione almacén predeterminado...</option>
                      {almacenes
                        .filter(
                          (a) =>
                            !formData.unidadOrganizativaId ||
                            !a.unidadOrganizativaId ||
                            a.unidadOrganizativaId === formData.unidadOrganizativaId ||
                            a.id === formData.almacenPredeterminadoId
                        )
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre}
                          </option>
                        ))}
                    </Select>
                  </D365FormField>

                  <D365FormField label="Código de Operación Proveedor (DIRECTV)" align="top">
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.descripcionProveedor || ''}
                      maxLength={150}
                      onChange={(_, d) => setFormData((p) => ({ ...p, descripcionProveedor: d.value }))}
                    />
                  </D365FormField>
                </div>
              </div>
            ) : selectedTab === 'recursos' ? (
              <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <Text weight="semibold">Técnicos asignados a este Territorio</Text>
                  <D365CommandButton
                    icon={<Add16Regular />}
                    tone="create"
                    onClick={() => navigate('/servicio-campo/recursos/nuevo')}
                  >
                    Nuevo Técnico
                  </D365CommandButton>
                </div>

                {recursosAsignados.length === 0 ? (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    No hay técnicos asignados.
                  </Text>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Código</th>
                        <th style={{ padding: '8px' }}>Nombre Completo</th>
                        <th style={{ padding: '8px' }}>Tipo</th>
                        <th style={{ padding: '8px' }}>Teléfono</th>
                        <th style={{ padding: '8px' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recursosAsignados.map((r) => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke3}` }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{r.codigo}</td>
                          <td style={{ padding: '8px' }}>{r.nombreCompleto}</td>
                          <td style={{ padding: '8px' }}>
                            <Badge appearance="tint" color="informative">
                              {r.tipoNombre}
                            </Badge>
                          </td>
                          <td style={{ padding: '8px' }}>{r.telefono || '—'}</td>
                          <td style={{ padding: '8px' }}>
                            <Badge appearance="filled" color={r.activo ? 'success' : 'danger'}>
                              {r.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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
          </div>
        </>
      )}
    </div>
  );
}
