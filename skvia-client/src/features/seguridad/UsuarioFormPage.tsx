import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Checkbox, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Input, Spinner, Tab, TabList, Text } from '@fluentui/react-components';
import { ArrowLeft16Regular, Save16Regular, SaveMultiple16Regular, LockClosed16Regular, Person20Regular } from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../components/common/D365EntityHeader';
import { D365FormField } from '../../components/common/D365FormField';
import { D365MessageBar } from '../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../styles/d365FormStyles';
import { clearSession, useAuthSession } from '../../services/authSession';
import { SeguridadService, type RolDto, type UsuarioDto } from './seguridad.service';
import { PermisosDrawer } from './PermisosDrawer';
import { UsuarioAlmacenesPanel } from './UsuarioAlmacenesPanel';

export function UsuarioFormPage() {
  const { id } = useParams(), navigate = useNavigate(), styles = useD365FormStyles(), session = useAuthSession();
  const isNew = !id, canEdit = session.permisos.includes('seguridad.usuarios.gestionar');
  const [usuarioGuardado, setUsuarioGuardado] = useState<UsuarioDto | null>(null);
  const [nombre, setNombre] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirmar, setConfirmar] = useState('');
  const [roles, setRoles] = useState<string[]>([]), [catalogo, setCatalogo] = useState<RolDto[]>([]), [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [tab, setTab] = useState('general');
  const [error, setError] = useState(''), [success, setSuccess] = useState(''), [drawer, setDrawer] = useState(false), [passwordDialog, setPasswordDialog] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState(''), [confirmarNueva, setConfirmarNueva] = useState(''), [passwordError, setPasswordError] = useState('');
  useEffect(() => {
    let current = true;
    setLoading(true); setUsuarioGuardado(null); setError(''); setSuccess(''); setPassword(''); setConfirmar(''); setTab('general');
    void Promise.all([SeguridadService.roles(), id ? SeguridadService.usuario(id) : Promise.resolve(null)]).then(([c, u]) => {
      if (!current) return;
      setCatalogo(c); setUsuarioGuardado(u); setNombre(u?.nombreCompleto ?? ''); setEmail(u?.email ?? ''); setRoles(u?.roles ?? []); setActivo(u?.esActivo ?? true);
    }).catch(e => { if (current) setError(e.message); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id]);
  const effective = catalogo.filter(r => roles.includes(r.codigo)).flatMap(r => r.permisos);
  async function save(close: boolean) {
    setError(''); setSuccess('');
    if (!nombre.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Ingrese un nombre y correo válidos.'); return; }
    if (isNew && (password.length < 8 || password !== confirmar)) { setError('Ingrese una contraseña de al menos 8 caracteres y confirme que coincida.'); return; }
    setBusy(true);
    try {
      if (id) await SeguridadService.editar(id, { nombreCompleto: nombre.trim(), email: email.trim(), roles });
      else {
        const result = await SeguridadService.crear({ nombreCompleto: nombre.trim(), email: email.trim(), password, roles });
        setPassword(''); setConfirmar('');
        navigate(close ? '/configuracion/usuarios' : `/configuracion/usuarios/${result.usuarioId}`, { replace: true }); return;
      }
      if (id === session.usuario?.id) { clearSession(); return; }
      const guardado = await SeguridadService.usuario(id);
      setUsuarioGuardado(guardado); setNombre(guardado.nombreCompleto); setEmail(guardado.email); setRoles(guardado.roles); setActivo(guardado.esActivo);
      setSuccess('Usuario y roles guardados.'); if (close) navigate('/configuracion/usuarios');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar.'); }
    finally { setBusy(false); }
  }
  async function toggleState() {
    if (!id) return;
    setBusy(true); setError(''); setSuccess('');
    try { await SeguridadService.estado(id, !activo); setActivo(!activo); if (id === session.usuario?.id) clearSession(); else setSuccess('Estado actualizado.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar.'); } finally { setBusy(false); }
  }
  async function resetPassword() {
    if (!id) return;
    if (nuevaPassword.length < 8 || nuevaPassword !== confirmarNueva) { setPasswordError('Revise la contraseña y su confirmación.'); return; }
    setBusy(true); setPasswordError('');
    try {
      await SeguridadService.password(id, nuevaPassword); setPasswordDialog(false); setNuevaPassword(''); setConfirmarNueva('');
      if (id === session.usuario?.id) clearSession(); else setSuccess('Contraseña restablecida. Las sesiones anteriores quedaron invalidadas.');
    } catch (e) { setPasswordError(e instanceof Error ? e.message : 'No se pudo restablecer.'); } finally { setBusy(false); }
  }
  return <div className={styles.root}>
    <D365CommandBar ariaLabel="Acciones de seguridad"><div className={styles.toolbarLeft}>
      <D365CommandButton icon={<ArrowLeft16Regular />} aria-label="Volver" title="Volver al listado" disabled={busy} onClick={() => navigate('/configuracion/usuarios')} />
      {canEdit && <><D365CommandButton tone="save" icon={<Save16Regular />} disabled={busy || loading || !!error && !catalogo.length} onClick={() => void save(false)}>Guardar</D365CommandButton>
        <D365CommandButton tone="save" icon={<SaveMultiple16Regular />} disabled={busy || loading} onClick={() => void save(true)}>Guardar y cerrar</D365CommandButton>
        {id && <><D365CommandButton disabled={busy || loading} onClick={() => void toggleState()}>{activo ? 'Desactivar' : 'Activar'}</D365CommandButton>
          <D365CommandButton icon={<LockClosed16Regular />} disabled={busy || loading} onClick={() => { setPasswordDialog(true); setPasswordError(''); }}>Restablecer contraseña</D365CommandButton></>}
      </>}
    </div></D365CommandBar>
    {error && <D365MessageBar intent="error">{error}</D365MessageBar>}{success && <D365MessageBar intent="success" onDismiss={() => setSuccess('')}>{success}</D365MessageBar>}
    {loading ? <Spinner label="Cargando usuario..." /> : <>
      <D365EntityHeader title={isNew ? 'Nuevo usuario' : usuarioGuardado?.nombreCompleto || 'Usuario'} subtitle={usuarioGuardado?.email || 'Cuenta de acceso al sistema'} avatarName={usuarioGuardado?.nombreCompleto || 'Usuario'} avatarIcon={<Person20Regular />} metadata={[{ label: 'Estado', value: <Badge appearance="tint" color={activo ? 'success' : 'subtle'}>{activo ? 'Activo' : 'Inactivo'}</Badge> }]} tabs={
        <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(String(d.value))}><Tab value="general">General</Tab><Tab value="roles">Roles y permisos</Tab>
          {canEdit && <Tab value="almacenes" disabled={isNew}>Autorizaciones por almacén</Tab>}
        </TabList>} />
      <div className={styles.contentBody}><div className={styles.card}>
        {tab === 'general' ? <div className={styles.grid2Cols}>
          <D365FormField label="Nombre completo" required htmlFor="usuario-nombre"><Input id="usuario-nombre" className={styles.d365ControlFull} maxLength={150} value={nombre} disabled={!canEdit || busy} onChange={(_, d) => setNombre(d.value)} /></D365FormField>
          <D365FormField label="Correo de acceso" required htmlFor="usuario-email"><Input id="usuario-email" className={styles.d365ControlFull} type="email" maxLength={256} value={email} disabled={!canEdit || busy} onChange={(_, d) => setEmail(d.value)} /></D365FormField>
          {isNew && <><D365FormField label="Contraseña inicial" required htmlFor="usuario-password"><Input id="usuario-password" className={styles.d365ControlFull} type="password" autoComplete="new-password" value={password} disabled={busy} onChange={(_, d) => setPassword(d.value)} /></D365FormField>
            <D365FormField label="Confirmar contraseña" required htmlFor="usuario-confirmar"><Input id="usuario-confirmar" className={styles.d365ControlFull} type="password" autoComplete="new-password" value={confirmar} disabled={busy} onChange={(_, d) => setConfirmar(d.value)} /></D365FormField>
            <Text>Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.</Text></>}
        </div> : tab === 'roles' ? <>
          {[...new Set(catalogo.map(r => r.modulo))].map(modulo => <section key={modulo}><h3>{modulo}</h3>
            {catalogo.filter(r => r.modulo === modulo).map(rol => <div key={rol.codigo}><Checkbox label={rol.nombreVisible} checked={roles.includes(rol.codigo)} disabled={!canEdit || busy} onChange={(_, d) => setRoles(previous => d.checked ? [...previous, rol.codigo] : previous.filter(r => r !== rol.codigo))} /></div>)}
          </section>)}
          <Button appearance="subtle" onClick={() => setDrawer(true)}>Ver permisos resultantes</Button>
        </> : id ? <UsuarioAlmacenesPanel usuarioId={id} /> : null}
      </div></div>
    </>}
    <PermisosDrawer open={drawer} onClose={() => setDrawer(false)} title="Permisos resultantes" permisos={effective} />
    <Dialog open={passwordDialog} onOpenChange={(_, d) => { if (!busy && !d.open) { setPasswordDialog(false); setNuevaPassword(''); setConfirmarNueva(''); } }}>
      <DialogSurface><DialogBody><DialogTitle>Restablecer contraseña</DialogTitle><DialogContent>
        <Text>Se cerrarán las sesiones de {usuarioGuardado?.nombreCompleto}.</Text>
        {passwordError && <D365MessageBar intent="error">{passwordError}</D365MessageBar>}
        <D365FormField label="Nueva contraseña" htmlFor="reset-password"><Input id="reset-password" type="password" autoComplete="new-password" className={styles.d365ControlFull} value={nuevaPassword} disabled={busy} onChange={(_, d) => setNuevaPassword(d.value)} /></D365FormField>
        <D365FormField label="Confirmar nueva contraseña" htmlFor="reset-confirmar"><Input id="reset-confirmar" type="password" autoComplete="new-password" className={styles.d365ControlFull} value={confirmarNueva} disabled={busy} onChange={(_, d) => setConfirmarNueva(d.value)} /></D365FormField>
      </DialogContent><DialogActions><Button disabled={busy} onClick={() => { setPasswordDialog(false); setNuevaPassword(''); setConfirmarNueva(''); }}>Cancelar</Button><Button appearance="primary" disabled={busy} onClick={() => void resetPassword()}>Restablecer</Button></DialogActions></DialogBody></DialogSurface>
    </Dialog>
  </div>;
}
