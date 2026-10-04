import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { Button, Card, Input, Spinner, Text, Title2, makeStyles, tokens } from '@fluentui/react-components';
import { D365FormField } from '../../components/common/D365FormField';
import { D365MessageBar } from '../../components/common/D365MessageBar';
import { useAuthSession, startSession } from '../../services/authSession';
import { canAccessPath, homePath } from './securityAccess';
import { publicSecurityRequest } from './seguridad.service';

const useStyles = makeStyles({
  root: { minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground3 },
  card: { width: '100%', maxWidth: '440px', padding: tokens.spacingHorizontalXXL, gap: tokens.spacingVerticalL },
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  control: { width: '100%' },
});
export function LoginPage() {
  const styles = useStyles(), location = useLocation();
  const session = useAuthSession();
  const [setup, setSetup] = useState<boolean | null>(null), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [email, setEmail] = useState(''), [nombre, setNombre] = useState('');
  const [password, setPassword] = useState(''), [confirmacion, setConfirmacion] = useState('');
  const load = () => {
    setError(''); setSetup(null);
    void publicSecurityRequest<{ requiereConfiguracion: boolean }>('configuracion-inicial')
      .then(data => setSetup(data.requiereConfiguracion)).catch(e => setError(e.message));
  };
  useEffect(load, []);
  const next = new URLSearchParams(location.search).get('continuar');
  if (session.usuario) return <Navigate replace to={next?.startsWith('/') && !next.startsWith('//') && next !== '/login' && canAccessPath(next, session.permisos) ? next : homePath(session.permisos)} />;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (setup && password !== confirmacion) { setError('Las contraseñas no coinciden.'); return; }
    setBusy(true);
    try {
      if (setup) {
        await publicSecurityRequest('configuracion-inicial', { email: email.trim(), password, nombreCompleto: nombre.trim() });
        setSetup(false);
      }
      const result = await publicSecurityRequest<{ token: string }>('login', { email: email.trim(), password });
      await startSession(result.token);
      setPassword(''); setConfirmacion('');
      // LoginPage redirige después de verificar la sesión con el servidor.
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.'); }
    finally { setBusy(false); }
  }
  return <main className={styles.root}><Card className={styles.card}>
    <Text weight="semibold">SKVIA</Text><Title2>{setup ? 'Configurar primer administrador' : 'Iniciar sesión'}</Title2>
    {error && <D365MessageBar intent="error">{error}</D365MessageBar>}
    {setup === null ? error ? <Button onClick={load}>Reintentar conexión</Button> : <Spinner label="Verificando configuración..." /> :
      <form className={styles.form} onSubmit={submit}>
        {setup && <D365FormField label="Nombre completo" required htmlFor="login-nombre"><Input className={styles.control} id="login-nombre" required maxLength={150} autoComplete="name" value={nombre} onChange={(_, d) => setNombre(d.value)} disabled={busy} /></D365FormField>}
        <D365FormField label="Correo electrónico" required htmlFor="login-email"><Input className={styles.control} id="login-email" type="email" required maxLength={256} autoComplete="username" value={email} onChange={(_, d) => setEmail(d.value)} disabled={busy} /></D365FormField>
        <D365FormField label="Contraseña" required htmlFor="login-password"><Input className={styles.control} id="login-password" type="password" required minLength={setup ? 8 : undefined} autoComplete={setup ? 'new-password' : 'current-password'} value={password} onChange={(_, d) => setPassword(d.value)} disabled={busy} /></D365FormField>
        {setup && <><Text size={200}>Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.</Text><D365FormField label="Confirmar contraseña" required htmlFor="login-confirmar"><Input className={styles.control} id="login-confirmar" type="password" required autoComplete="new-password" value={confirmacion} onChange={(_, d) => setConfirmacion(d.value)} disabled={busy} /></D365FormField></>}
        <Button type="submit" appearance="primary" disabled={busy}>{busy ? 'Procesando...' : setup ? 'Crear administrador e ingresar' : 'Ingresar'}</Button>
      </form>}
  </Card></main>;
}
