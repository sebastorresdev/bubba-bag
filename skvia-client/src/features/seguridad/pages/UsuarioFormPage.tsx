import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Radio,
  RadioGroup,
  Spinner,
  Tab,
  TabList,
  Text,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  LockClosed16Regular,
  Person20Regular,
  ShieldPerson20Regular,
  ArrowSync16Regular,
  Copy16Regular,
  Eye16Regular,
  EyeOff16Regular,
} from '@fluentui/react-icons';
import {
  D365CommandBar,
  D365CommandButton,
  D365CommandDivider,
} from '../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../components/common/D365FormField';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { clearSession, useAuthSession } from '../../../services/authSession';
import {
  SeguridadService,
  type RolDto,
  type UsuarioDto,
} from '../services/seguridad.service';
import { PermisosDrawer } from '../components/PermisosDrawer';
import { ManageUserRolesDialog } from '../components/ManageUserRolesDialog';

function generarPasswordSegura(longitud = 14): string {
  const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minusculas = 'abcdefghijkmnopqrstuvwxyz';
  const numeros = '23456789';
  const simbolos = '!@#$%&*+=?';
  const todos = mayusculas + minusculas + numeros + simbolos;

  const array = new Uint32Array(longitud);
  crypto.getRandomValues(array);

  const chars = [
    mayusculas[array[0] % mayusculas.length],
    minusculas[array[1] % minusculas.length],
    numeros[array[2] % numeros.length],
    simbolos[array[3] % simbolos.length],
  ];

  for (let i = 4; i < longitud; i++) {
    chars.push(todos[array[i] % todos.length]);
  }

  return chars.sort(() => Math.random() - 0.5).join('');
}

export function UsuarioFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const styles = useD365FormStyles();
  const session = useAuthSession();
  const isNew = !id;
  const canEdit = session.permisos.includes('seguridad.usuarios.gestionar');

  const [usuarioGuardado, setUsuarioGuardado] = useState<UsuarioDto | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [catalogo, setCatalogo] = useState<RolDto[]>([]);
  const [activo, setActivo] = useState(true);

  // Configuración de contraseña en línea (Paso inicial estilo Microsoft 365 / Dynamics)
  const [passwordModo, setPasswordModo] = useState<'automatica' | 'manual'>('automatica');
  const [passwordAuto, setPasswordAuto] = useState(() => generarPasswordSegura());
  const [passwordManual, setPasswordManual] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('general');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [manageRolesOpen, setManageRolesOpen] = useState(false);

  // Modal exclusivo para RESTABLECER contraseña en usuarios ya existentes
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetModo, setResetModo] = useState<'automatica' | 'manual'>('automatica');
  const [resetAuto, setResetAuto] = useState('');
  const [resetManual, setResetManual] = useState('');
  const [resetConfirmar, setResetConfirmar] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetCopiado, setResetCopiado] = useState(false);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setUsuarioGuardado(null);
    setError('');
    setSuccess('');
    setTab('general');

    void Promise.all([
      SeguridadService.roles(),
      id ? SeguridadService.usuario(id) : Promise.resolve(null),
    ])
      .then(([c, u]) => {
        if (!current) return;
        setCatalogo(c);
        setUsuarioGuardado(u);
        setNombre(u?.nombreCompleto ?? '');
        setEmail(u?.email ?? '');
        setRoles(u?.roles ?? []);
        setActivo(u?.esActivo ?? true);
      })
      .catch((e) => {
        if (current) setError(e instanceof Error ? e.message : 'Error al cargar usuario.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [id]);

  const effective = catalogo
    .filter((r) => roles.includes(r.codigo))
    .flatMap((r) => r.permisos);

  const regenerarPassword = () => {
    setPasswordAuto(generarPasswordSegura());
    setCopiado(false);
  };

  const copiarTexto = async (texto: string, callback: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(texto);
      callback(true);
      setTimeout(() => callback(false), 2000);
    } catch {
      // Ignorar si clipboard no está disponible
    }
  };

  const abrirResetDialog = () => {
    setResetError('');
    setResetCopiado(false);
    setResetModo('automatica');
    setResetAuto(generarPasswordSegura());
    setResetManual('');
    setResetConfirmar('');
    setResetDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!id) return;
    setResetError('');
    let claveFinal = '';

    if (resetModo === 'automatica') {
      claveFinal = resetAuto;
    } else {
      if (resetManual.length < 8) {
        setResetError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (resetManual !== resetConfirmar) {
        setResetError('Las contraseñas no coinciden.');
        return;
      }
      claveFinal = resetManual;
    }

    setBusy(true);
    try {
      await SeguridadService.password(id, claveFinal);
      setResetDialogOpen(false);
      if (id === session.usuario?.id) {
        clearSession();
      } else {
        setSuccess('Contraseña restablecida correctamente.');
      }
    } catch (e) {
      setResetError(e instanceof Error ? e.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setBusy(false);
    }
  };

  async function save(close: boolean) {
    setError('');
    setSuccess('');
    if (!nombre.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingrese un nombre completo y un correo electrónico válidos.');
      return;
    }

    let passwordFinal = '';
    if (isNew) {
      if (passwordModo === 'automatica') {
        passwordFinal = passwordAuto;
      } else {
        if (passwordManual.length < 8) {
          setError('La contraseña debe tener al menos 8 caracteres.');
          return;
        }
        passwordFinal = passwordManual;
      }
    }

    setBusy(true);
    try {
      if (id) {
        await SeguridadService.editar(id, {
          nombreCompleto: nombre.trim(),
          email: email.trim(),
          roles,
        });
      } else {
        const result = await SeguridadService.crear({
          nombreCompleto: nombre.trim(),
          email: email.trim(),
          password: passwordFinal,
          roles,
        });
        navigate(
          close
            ? '/configuracion/usuarios'
            : `/configuracion/usuarios/${result.usuarioId}`,
          {
            replace: true,
            state: close ? { successMessage: 'Usuario creado exitosamente.' } : undefined,
          }
        );
        return;
      }

      if (id === session.usuario?.id) {
        clearSession();
        return;
      }

      const guardado = await SeguridadService.usuario(id);
      setUsuarioGuardado(guardado);
      setNombre(guardado.nombreCompleto);
      setEmail(guardado.email);
      setRoles(guardado.roles);
      setActivo(guardado.esActivo);
      setSuccess('Usuario guardado exitosamente.');
      if (close) navigate('/configuracion/usuarios');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el usuario.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleState() {
    if (!id) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await SeguridadService.estado(id, !activo);
      setActivo(!activo);
      if (id === session.usuario?.id) clearSession();
      else setSuccess('Estado actualizado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.root}>
      {/* 1. COMMANDBAR ESTÁNDAR DYNAMICS 365 */}
      <D365CommandBar ariaLabel="Acciones de usuario">
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Volver"
            title="Volver al listado"
            disabled={busy}
            onClick={() => navigate('/configuracion/usuarios')}
          />
          <D365CommandDivider />

          {canEdit && (
            <>
              <D365CommandButton
                tone="save"
                icon={<Save16Regular />}
                disabled={busy || loading || (!!error && !catalogo.length)}
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

              {id && (
                <>
                  <D365CommandButton
                    icon={<LockClosed16Regular />}
                    disabled={busy || loading}
                    onClick={abrirResetDialog}
                  >
                    Restablecer contraseña
                  </D365CommandButton>

                  <D365CommandButton
                    disabled={busy || loading}
                    onClick={() => void toggleState()}
                  >
                    {activo ? 'Desactivar' : 'Activar'}
                  </D365CommandButton>
                </>
              )}
            </>
          )}
        </div>
      </D365CommandBar>

      {error && <D365MessageBar intent="error">{error}</D365MessageBar>}
      {success && (
        <D365MessageBar intent="success" onDismiss={() => setSuccess('')}>
          {success}
        </D365MessageBar>
      )}

      {loading ? (
        <Spinner label="Cargando usuario..." />
      ) : (
        <>
          <D365EntityHeader
            title={
              isNew
                ? 'Nuevo usuario'
                : usuarioGuardado?.nombreCompleto || 'Usuario'
            }
            subtitle={usuarioGuardado?.email || 'Cuenta de acceso al sistema'}
            avatarName={usuarioGuardado?.nombreCompleto || 'Usuario'}
            avatarIcon={<Person20Regular />}
            metadata={[
              {
                label: 'Estado',
                value: (
                  <Badge
                    appearance="tint"
                    color={activo ? 'success' : 'subtle'}
                  >
                    {activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                ),
              },
            ]}
            tabs={
              <TabList
                selectedValue={tab}
                onTabSelect={(_, d) => setTab(String(d.value))}
              >
                <Tab value="general">Información general</Tab>
                <Tab value="roles">Roles y permisos</Tab>
              </TabList>
            }
          />

          <div className={styles.contentBody}>
            {tab === 'general' ? (
              /* Tarjeta limpia con ancho controlado a la mitad de la pantalla */
              <div style={{ maxWidth: '640px', width: '100%' }}>
                <div className={styles.card}>
                  <div className={styles.cardSectionTitle}>Información básica</div>

                  <D365FormField
                    label="Nombre completo"
                    required
                    htmlFor="usuario-nombre"
                  >
                    <Input
                      id="usuario-nombre"
                      className={styles.d365ControlFull}
                      maxLength={150}
                      value={nombre}
                      disabled={!canEdit || busy}
                      contentAfter={!canEdit ? <LockClosed16Regular /> : undefined}
                      onChange={(_, d) => setNombre(d.value)}
                    />
                  </D365FormField>

                  <D365FormField
                    label="Correo de acceso"
                    required
                    htmlFor="usuario-email"
                  >
                    <Input
                      id="usuario-email"
                      className={styles.d365ControlFull}
                      type="email"
                      maxLength={256}
                      value={email}
                      disabled={!canEdit || busy}
                      contentAfter={!canEdit ? <LockClosed16Regular /> : undefined}
                      onChange={(_, d) => setEmail(d.value)}
                    />
                  </D365FormField>

                  {/* CONFIGURACIÓN DE CONTRASEÑA EN LÍNEA (Solo al crear usuario) */}
                  {isNew && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className={styles.cardSectionTitle}>Configuración de contraseña</div>

                      <RadioGroup
                        value={passwordModo}
                        onChange={(_, d) => setPasswordModo(d.value as 'automatica' | 'manual')}
                      >
                        <Radio value="automatica" label="Generar contraseña automáticamente (Recomendado)" />
                        <Radio value="manual" label="Crear contraseña manualmente" />
                      </RadioGroup>

                      {passwordModo === 'automatica' ? (
                        <div style={{
                          padding: '12px',
                          border: '1px solid var(--colorNeutralStroke2)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--colorNeutralBackground2)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Input
                              readOnly
                              type={mostrarPassword ? 'text' : 'password'}
                              value={passwordAuto}
                              contentAfter={
                                <Button
                                  size="small"
                                  appearance="transparent"
                                  icon={mostrarPassword ? <EyeOff16Regular /> : <Eye16Regular />}
                                  onClick={() => setMostrarPassword(!mostrarPassword)}
                                />
                              }
                              style={{ flex: 1, fontFamily: 'monospace' }}
                            />
                            <Button
                              size="small"
                              icon={<Copy16Regular />}
                              onClick={() => void copiarTexto(passwordAuto, setCopiado)}
                            >
                              {copiado ? 'Copiado' : 'Copiar'}
                            </Button>
                            <Button
                              size="small"
                              icon={<ArrowSync16Regular />}
                              title="Generar otra"
                              onClick={regenerarPassword}
                            />
                          </div>
                          <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
                            Copie esta contraseña para proporcionársela al usuario al crearlo.
                          </Text>
                        </div>
                      ) : (
                        <D365FormField label="Contraseña inicial" required htmlFor="usuario-password-manual">
                          <Input
                            id="usuario-password-manual"
                            className={styles.d365ControlFull}
                            type={mostrarPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={passwordManual}
                            contentAfter={
                              <Button
                                size="small"
                                appearance="transparent"
                                icon={mostrarPassword ? <EyeOff16Regular /> : <Eye16Regular />}
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                              />
                            }
                            onChange={(_, d) => setPasswordManual(d.value)}
                          />
                        </D365FormField>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Pestaña de Roles y Permisos */
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
                        Roles asignados al usuario
                      </Text>
                      <div
                        style={{
                          color: 'var(--colorNeutralForeground3)',
                          fontSize: '12px',
                        }}
                      >
                        {roles.length === 0
                          ? 'Sin roles asignados'
                          : `${roles.length} rol(es) activo(s)`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {canEdit && (
                        <Button
                          appearance="outline"
                          icon={<ShieldPerson20Regular />}
                          disabled={busy}
                          onClick={() => setManageRolesOpen(true)}
                        >
                          Administrar roles
                        </Button>
                      )}
                      <Button
                        appearance="subtle"
                        onClick={() => setDrawer(true)}
                      >
                        Ver permisos resultantes ({effective.length})
                      </Button>
                    </div>
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
                        gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
                        padding: '10px 16px',
                        backgroundColor: 'var(--colorNeutralBackground3)',
                        fontWeight: 600,
                        fontSize: '12px',
                        color: 'var(--colorNeutralForeground2)',
                        borderBottom: '1px solid var(--colorNeutralStroke2)',
                      }}
                    >
                      <span>Rol de seguridad</span>
                      <span>Módulo</span>
                      <span>Tipo</span>
                      <span style={{ textAlign: 'right' }}>Permisos</span>
                    </div>

                    {roles.length === 0 ? (
                      <div
                        style={{
                          padding: '32px 16px',
                          textAlign: 'center',
                          color: 'var(--colorNeutralForeground3)',
                        }}
                      >
                        Este usuario no tiene ningún rol asignado. Haga clic en{' '}
                        <strong>Administrar roles</strong> para asignarle funciones.
                      </div>
                    ) : (
                      catalogo
                        .filter((r) => roles.includes(r.codigo))
                        .map((rol) => (
                          <div
                            key={rol.codigo}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
                              alignItems: 'center',
                              padding: '10px 16px',
                              borderBottom: '1px solid var(--colorNeutralStroke3)',
                              fontSize: '13px',
                            }}
                          >
                            <div>
                              <strong style={{ color: 'var(--colorNeutralForeground1)' }}>
                                {rol.nombreVisible}
                              </strong>
                              <div style={{ fontSize: '11px', color: 'var(--colorNeutralForeground3)' }}>
                                {rol.descripcion}
                              </div>
                            </div>
                            <span>{rol.modulo}</span>
                            <span>
                              <Badge
                                appearance="tint"
                                color={rol.esSistema ? 'informative' : 'subtle'}
                              >
                                {rol.esSistema ? 'Sistema' : 'Personalizado'}
                              </Badge>
                            </span>
                            <span style={{ textAlign: 'right' }}>
                              <Badge appearance="outline">
                                {rol.permisos.length} permisos
                              </Badge>
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Drawer de Permisos Efectivos */}
      <PermisosDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Permisos resultantes"
        permisos={effective}
      />

      {/* Diálogo Administrar Roles */}
      <ManageUserRolesDialog
        open={manageRolesOpen}
        onOpenChange={setManageRolesOpen}
        usuariosSeleccionados={usuarioGuardado ? [usuarioGuardado] : []}
        initialRoles={roles}
        onApplyLocal={isNew ? (nuevosRoles) => setRoles(nuevosRoles) : undefined}
        onSuccess={() => {
          if (id) {
            void SeguridadService.usuario(id).then((u) => {
              setUsuarioGuardado(u);
              setRoles(u.roles);
              setSuccess('Roles de usuario actualizados.');
            });
          }
        }}
      />

      {/* DIÁLOGO LIMPIO PARA RESTABLECER CONTRASEÑA (Solo usuario existente) */}
      <Dialog
        open={resetDialogOpen}
        onOpenChange={(_, d) => {
          if (!busy && !d.open) setResetDialogOpen(false);
        }}
      >
        <DialogSurface style={{ maxWidth: '480px', width: '100%' }}>
          <DialogBody>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
              <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
                Se cambiará la contraseña y se invalidarán las sesiones activas de {usuarioGuardado?.nombreCompleto}.
              </Text>

              {resetError && <D365MessageBar intent="error">{resetError}</D365MessageBar>}

              <RadioGroup
                value={resetModo}
                onChange={(_, d) => setResetModo(d.value as 'automatica' | 'manual')}
              >
                <Radio value="automatica" label="Generar automáticamente" />
                <Radio value="manual" label="Ingresar manualmente" />
              </RadioGroup>

              {resetModo === 'automatica' ? (
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--colorNeutralBackground2)',
                  borderRadius: '4px',
                  border: '1px solid var(--colorNeutralStroke2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Input
                    readOnly
                    value={resetAuto}
                    style={{ flex: 1, fontFamily: 'monospace' }}
                  />
                  <Button
                    size="small"
                    icon={<Copy16Regular />}
                    onClick={() => void copiarTexto(resetAuto, setResetCopiado)}
                  >
                    {resetCopiado ? 'Copiado' : 'Copiar'}
                  </Button>
                  <Button
                    size="small"
                    icon={<ArrowSync16Regular />}
                    onClick={() => setResetAuto(generarPasswordSegura())}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <D365FormField label="Nueva contraseña" required htmlFor="reset-pass-man">
                    <Input
                      id="reset-pass-man"
                      type="password"
                      autoComplete="new-password"
                      className={styles.d365ControlFull}
                      value={resetManual}
                      onChange={(_, d) => setResetManual(d.value)}
                    />
                  </D365FormField>
                  <D365FormField label="Confirmar contraseña" required htmlFor="reset-pass-conf">
                    <Input
                      id="reset-pass-conf"
                      type="password"
                      autoComplete="new-password"
                      className={styles.d365ControlFull}
                      value={resetConfirmar}
                      onChange={(_, d) => setResetConfirmar(d.value)}
                    />
                  </D365FormField>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button disabled={busy} onClick={() => setResetDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                disabled={busy}
                onClick={() => void handleResetPassword()}
              >
                {busy ? 'Guardando...' : 'Restablecer'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
