import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  Spinner,
  Tab,
  TabList,
  Text,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Delete16Regular,
  ShieldKeyhole20Regular,
  Dismiss16Regular,
  LockClosed16Regular,
  Key16Regular,
  Key20Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../components/common/D365FormField';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { useAuthSession } from '../../../services/authSession';
import {
  SeguridadService,
  type PermisoDefinicionDto,
  type RolDto,
} from '../services/seguridad.service';
import { ManageRolePermissionsDialog } from '../components/ManageRolePermissionsDialog';

export function RolFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const styles = useD365FormStyles();
  const session = useAuthSession();

  const isNew = !id;
  const canEdit = session.permisos.includes('seguridad.roles.gestionar');

  const [rolGuardado, setRolGuardado] = useState<RolDto | null>(null);
  const [catalogoPermisos, setCatalogoPermisos] = useState<PermisoDefinicionDto[]>([]);

  const [nombreVisible, setNombreVisible] = useState('');
  const [codigo, setCodigo] = useState('');
  const [modulo, setModulo] = useState('Personalizado');
  const [descripcion, setDescripcion] = useState('');
  const [permisosSeleccionados, setPermisosSeleccionados] = useState<string[]>([]);

  const [tab, setTab] = useState<'general' | 'permisos'>('general');
  const [managePermisosOpen, setManagePermisosOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);

  const esSuperAdmin = rolGuardado?.codigo.toLowerCase() === 'superadmin' || codigo.toLowerCase() === 'superadmin';
  const esSistema = !!rolGuardado?.esSistema;
  const isEditable = canEdit && !esSistema;

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    setSuccess('');

    void Promise.all([
      SeguridadService.permisos(),
      id ? SeguridadService.rol(id) : Promise.resolve(null),
    ])
      .then(([permisosCatalog, rolData]) => {
        if (!current) return;
        setCatalogoPermisos(permisosCatalog);

        if (rolData) {
          setRolGuardado(rolData);
          setNombreVisible(rolData.nombreVisible);
          setCodigo(rolData.codigo);
          setModulo(rolData.modulo);
          setDescripcion(rolData.descripcion);
          setPermisosSeleccionados(rolData.permisos ?? []);
        } else {
          setRolGuardado(null);
          setNombreVisible('');
          setCodigo('');
          setModulo('Personalizado');
          setDescripcion('');
          setPermisosSeleccionados([]);
        }
      })
      .catch((e) => {
        if (current) setError(e instanceof Error ? e.message : 'Error al cargar datos del rol.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [id]);

  const permisosAsignadosCompletos = useMemo(() => {
    const seleccionadosSet = new Set(permisosSeleccionados);
    return catalogoPermisos.filter((p) => seleccionadosSet.has(p.codigo));
  }, [catalogoPermisos, permisosSeleccionados]);

  const togglePermiso = (permisoCodigo: string) => {
    if (!canEdit || esSuperAdmin || busy) return;
    setPermisosSeleccionados((prev) =>
      prev.includes(permisoCodigo)
        ? prev.filter((p) => p !== permisoCodigo)
        : [...prev, permisoCodigo]
    );
  };

  const save = async (close: boolean) => {
    setError('');
    setSuccess('');

    if (!isEditable) {
      setError('Los roles predefinidos del sistema son de solo lectura y no pueden modificarse.');
      return;
    }

    if (!nombreVisible.trim()) {
      setError('Ingrese un nombre para el rol.');
      return;
    }

    setBusy(true);
    try {
      if (id) {
        await SeguridadService.actualizarRol(id, {
          nombreVisible: nombreVisible.trim(),
          modulo: modulo.trim() || 'Personalizado',
          descripcion: descripcion.trim(),
          permisos: permisosSeleccionados,
        });

        const guardado = await SeguridadService.rol(id);
        setRolGuardado(guardado);
        setNombreVisible(guardado.nombreVisible);
        setCodigo(guardado.codigo);
        setModulo(guardado.modulo);
        setDescripcion(guardado.descripcion);
        setPermisosSeleccionados(guardado.permisos ?? []);
        setSuccess('Rol y permisos actualizados correctamente.');

        if (close) navigate('/configuracion/roles');
      } else {
        const resultado = await SeguridadService.crearRol({
          nombreVisible: nombreVisible.trim(),
          codigo: codigo.trim() || undefined,
          modulo: modulo.trim() || 'Personalizado',
          descripcion: descripcion.trim(),
          permisos: permisosSeleccionados,
        });

        setSuccess('Rol creado con éxito.');
        navigate(close ? '/configuracion/roles' : `/configuracion/roles/${resultado.rolId}`, {
          replace: true,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el rol.');
    } finally {
      setBusy(false);
    }
  };

  const eliminar = async () => {
    if (!id || esSistema || busy) return;
    setBusy(true);
    setError('');
    try {
      await SeguridadService.eliminarRol(id);
      setDeleteDialog(false);
      navigate('/configuracion/roles');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el rol.');
      setDeleteDialog(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.root}>
      <D365CommandBar ariaLabel="Acciones de rol">
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Volver"
            title="Volver a la lista de roles"
            disabled={busy}
            onClick={() => navigate('/configuracion/roles')}
          />
          <D365CommandDivider />
          {isEditable && (
            <>
              <D365CommandButton
                tone="save"
                icon={<Save16Regular />}
                disabled={busy || loading}
                onClick={() => void save(false)}
              >
                Guardar
              </D365CommandButton>
              <D365CommandButton
                tone="save"
                icon={<SaveMultiple16Regular />}
                disabled={busy || loading}
                onClick={() => void save(true)}
              >
                Guardar y cerrar
              </D365CommandButton>
              <D365CommandButton
                icon={<Key16Regular />}
                disabled={esSuperAdmin || busy || loading}
                onClick={() => setManagePermisosOpen(true)}
              >
                Administrar permisos
              </D365CommandButton>
              {id && (
                <D365CommandButton
                  tone="danger"
                  icon={<Delete16Regular />}
                  disabled={busy || loading || (rolGuardado?.usuariosCount ?? 0) > 0}
                  title={
                    (rolGuardado?.usuariosCount ?? 0) > 0
                      ? 'No se puede eliminar porque tiene usuarios asignados'
                      : 'Eliminar rol'
                  }
                  onClick={() => setDeleteDialog(true)}
                >
                  Eliminar
                </D365CommandButton>
              )}
            </>
          )}
        </div>
      </D365CommandBar>

      {esSistema && (
        <D365MessageBar intent="info">
          <strong>Rol del sistema predefinido:</strong> Este rol y sus capacidades están protegidos contra modificaciones y son de solo lectura.
        </D365MessageBar>
      )}

      {error && <D365MessageBar intent="error">{error}</D365MessageBar>}
      {success && (
        <D365MessageBar intent="success" onDismiss={() => setSuccess('')}>
          {success}
        </D365MessageBar>
      )}

      {loading ? (
        <Spinner label="Cargando configuración del rol..." />
      ) : (
        <>
          <D365EntityHeader
            title={isNew ? 'Nuevo rol de seguridad' : rolGuardado?.nombreVisible || 'Rol'}
            subtitle={
              isNew
                ? 'Defina las capacidades y permisos asociados a esta función'
                : `Código: ${rolGuardado?.codigo} · Módulo: ${rolGuardado?.modulo}`
            }
            avatarName={rolGuardado?.nombreVisible || 'Rol'}
            avatarIcon={<ShieldKeyhole20Regular />}
            metadata={[
              {
                label: 'Tipo',
                value: (
                  <Badge appearance="tint" color={esSistema ? 'informative' : 'subtle'}>
                    {esSistema ? 'Rol del sistema' : 'Personalizado'}
                  </Badge>
                ),
              },
              {
                label: 'Permisos otorgados',
                value: (
                  <Badge appearance="filled" color={esSuperAdmin ? 'warning' : 'brand'}>
                    {esSuperAdmin
                      ? 'Bypass Total (Todos)'
                      : `${permisosSeleccionados.length} de ${catalogoPermisos.length}`}
                  </Badge>
                ),
              },
              ...(id
                ? [
                    {
                      label: 'Usuarios asignados',
                      value: <Text weight="semibold">{rolGuardado?.usuariosCount ?? 0}</Text>,
                    },
                  ]
                : []),
            ]}
            tabs={
              <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as 'general' | 'permisos')}>
                <Tab value="general">Información general</Tab>
                <Tab value="permisos">Permisos asignados</Tab>
              </TabList>
            }
          />

          <div className={styles.contentBody}>
            {tab === 'general' ? (
              <div style={{ maxWidth: '680px', width: '100%' }}>
                <div className={styles.card}>
                  <div className={styles.cardSectionTitle}>Definición del rol</div>

                  <D365FormField label="Nombre del rol" required htmlFor="rol-nombre">
                    <Input
                      id="rol-nombre"
                      className={styles.d365ControlFull}
                      maxLength={150}
                      value={nombreVisible}
                      disabled={!isEditable || busy}
                      contentAfter={!isEditable ? <LockClosed16Regular /> : undefined}
                      onChange={(_, d) => setNombreVisible(d.value)}
                    />
                  </D365FormField>

                  {!isNew && (
                    <D365FormField label="Código identificador" htmlFor="rol-codigo">
                      <Input
                        id="rol-codigo"
                        className={styles.d365ControlFull}
                        value={codigo}
                        disabled
                        contentAfter={<LockClosed16Regular />}
                      />
                    </D365FormField>
                  )}

                  <D365FormField
                    label="Categoría"
                    htmlFor="rol-modulo"
                    info="Área funcional o departamento para clasificar este rol en el catálogo (por defecto: Personalizado)."
                  >
                    <Input
                      id="rol-modulo"
                      className={styles.d365ControlFull}
                      maxLength={100}
                      value={modulo}
                      disabled={!isEditable || busy}
                      contentAfter={!isEditable ? <LockClosed16Regular /> : undefined}
                      onChange={(_, d) => setModulo(d.value)}
                    />
                  </D365FormField>

                  <D365FormField label="Descripción" htmlFor="rol-desc">
                    <Input
                      id="rol-desc"
                      className={styles.d365ControlFull}
                      maxLength={500}
                      value={descripcion}
                      disabled={!isEditable || busy}
                      contentAfter={!isEditable ? <LockClosed16Regular /> : undefined}
                      onChange={(_, d) => setDescripcion(d.value)}
                    />
                  </D365FormField>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {esSuperAdmin && (
                  <D365MessageBar intent="info">
                    <strong>Super Administrador:</strong> Este rol cuenta con bypass absoluto de seguridad
                    y posee todos los permisos del sistema de forma automática e inmutable.
                  </D365MessageBar>
                )}

                <div className={styles.card}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <Text weight="semibold" size={400}>
                          Permisos asignados al rol
                        </Text>
                        <div
                          style={{
                            color: 'var(--colorNeutralForeground3)',
                            fontSize: '12px',
                          }}
                        >
                          {esSuperAdmin
                            ? 'Acceso total y bypass a todas las capacidades del sistema'
                            : permisosSeleccionados.length === 0
                            ? 'Sin capacidades ni permisos asignados'
                            : `${permisosSeleccionados.length} de ${catalogoPermisos.length} capacidad(es) asignada(s)`}
                        </div>
                      </div>
                      {isEditable && !esSuperAdmin && (
                        <Button
                          appearance="outline"
                          icon={<Key20Regular />}
                          disabled={busy}
                          onClick={() => setManagePermisosOpen(true)}
                        >
                          Administrar permisos
                        </Button>
                      )}
                    </div>

                    <div
                      style={{
                        border: '1px solid var(--colorNeutralStroke2)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1.2fr 1.8fr 40px',
                          padding: '10px 16px',
                          backgroundColor: 'var(--colorNeutralBackground3)',
                          fontWeight: 600,
                          fontSize: '12px',
                          color: 'var(--colorNeutralForeground2)',
                          borderBottom: '1px solid var(--colorNeutralStroke2)',
                        }}
                      >
                        <span>Capacidad / Permiso</span>
                        <span>Módulo</span>
                        <span>Código técnico</span>
                        <span />
                      </div>

                      {permisosAsignadosCompletos.length === 0 ? (
                        <div
                          style={{
                            padding: '32px 16px',
                            textAlign: 'center',
                            color: 'var(--colorNeutralForeground3)',
                          }}
                        >
                          Este rol no tiene ningún permiso asignado. Haga clic en{' '}
                          <strong>Administrar permisos</strong> para seleccionar capacidades del catálogo.
                        </div>
                      ) : (
                        permisosAsignadosCompletos.map((p) => (
                          <div
                            key={p.codigo}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '2fr 1.2fr 1.8fr 40px',
                              alignItems: 'center',
                              padding: '10px 16px',
                              borderBottom: '1px solid var(--colorNeutralStroke3)',
                              fontSize: '13px',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 500 }}>{p.titulo}</div>
                              {p.descripcion && (
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--colorNeutralForeground3)',
                                  }}
                                >
                                  {p.descripcion}
                                </div>
                              )}
                            </div>
                            <div>
                              <Badge appearance="tint" color="subtle">
                                {p.modulo}
                              </Badge>
                            </div>
                            <div
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                color: 'var(--colorNeutralForeground3)',
                              }}
                            >
                              {p.codigo}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {isEditable && !esSuperAdmin && (
                                <Button
                                  size="small"
                                  appearance="subtle"
                                  icon={<Dismiss16Regular />}
                                  title="Quitar permiso"
                                  disabled={busy}
                                  onClick={() => togglePermiso(p.codigo)}
                                />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={deleteDialog} onOpenChange={(_, d) => setDeleteDialog(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Eliminar rol de seguridad</DialogTitle>
            <DialogContent>
              ¿Está seguro de que desea eliminar el rol <strong>{rolGuardado?.nombreVisible}</strong>?
              Esta acción es irreversible y desvinculará todas las capacidades configuradas.
            </DialogContent>
            <DialogActions>
              <Button disabled={busy} onClick={() => setDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button appearance="primary" disabled={busy} onClick={() => void eliminar()}>
                Eliminar definitivamente
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <ManageRolePermissionsDialog
        open={managePermisosOpen}
        onOpenChange={setManagePermisosOpen}
        rolNombre={rolGuardado?.nombreVisible || 'Nuevo rol de seguridad'}
        catalogoPermisos={catalogoPermisos}
        permisosSeleccionados={permisosSeleccionados}
        onApply={(nuevos) => setPermisosSeleccionados(nuevos)}
      />
    </div>
  );
}
