import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import {
  Button,
  Input,
  Spinner,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Mail16Regular,
  LockClosed16Regular,
  Eye16Regular,
  EyeOff16Regular,
  ArrowRight16Regular,
  Person16Regular,
  ShieldCheckmark16Regular,
  Cube16Regular,
} from '@fluentui/react-icons';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { useAuthSession, startSession } from '../../../services/authSession';
import { canAccessPath, homePath } from '../services/securityAccess';
import { publicSecurityRequest } from '../services/seguridad.service';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground3,
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '430px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '12px',
    padding: '40px 36px',
    boxShadow: tokens.shadow16,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  brandIconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: tokens.colorBrandBackground,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForegroundOnBrand,
    boxShadow: tokens.shadow4,
  },
  brandTexts: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: '18px',
    fontWeight: tokens.fontWeightBold,
    letterSpacing: '0.6px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '22px',
  },
  brandSubtitle: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
  },
  headerGroup: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '22px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    margin: 0,
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    margin: '6px 0 0 0',
    lineHeight: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  requiredStar: {
    color: tokens.colorPaletteRedForeground1,
    marginLeft: '3px',
  },
  inputControl: {
    width: '100%',
  },
  inputIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: '16px',
  },
  helperText: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  submitButton: {
    width: '100%',
    height: '42px',
    marginTop: '6px',
    fontSize: '14px',
    fontWeight: tokens.fontWeightSemibold,
  },
  divider: {
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
    margin: '24px 0 16px 0',
  },
  securityBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
  },
  securityIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '16px',
  },
  footerText: {
    marginTop: '24px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
    textAlign: 'center',
  },
  centerBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 0',
  },
});

export function LoginPage() {
  const styles = useStyles();
  const location = useLocation();
  const session = useAuthSession();

  const [setup, setSetup] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const load = () => {
    setError('');
    setSetup(null);
    void publicSecurityRequest<{ requiereConfiguracion: boolean }>('configuracion-inicial')
      .then((data) => setSetup(data.requiereConfiguracion))
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const next = new URLSearchParams(location.search).get('continuar');

  if (session.usuario) {
    return (
      <Navigate
        replace
        to={
          next?.startsWith('/') && !next.startsWith('//') && next !== '/login' && canAccessPath(next, session.permisos)
            ? next
            : homePath(session.permisos)
        }
      />
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (setup && password !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setBusy(true);
    try {
      if (setup) {
        await publicSecurityRequest('configuracion-inicial', {
          email: email.trim(),
          password,
          nombreCompleto: nombre.trim(),
        });
        setSetup(false);
      }
      const result = await publicSecurityRequest<{ token: string }>('login', {
        email: email.trim(),
        password,
      });
      await startSession(result.token);
      setPassword('');
      setConfirmacion('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <div className={styles.brandIconWrap}>
            <Cube16Regular style={{ fontSize: '22px' }} />
          </div>
          <div className={styles.brandTexts}>
            <span className={styles.brandTitle}>SKVIA</span>
            <span className={styles.brandSubtitle}>Field Operations & Logistics</span>
          </div>
        </div>

        <div className={styles.headerGroup}>
          <h1 className={styles.title}>
            {setup ? 'Configurar administrador' : 'Iniciar sesión'}
          </h1>
          <p className={styles.subtitle}>
            {setup
              ? 'Defina las credenciales del primer usuario administrador para iniciar el sistema.'
              : 'Ingrese sus credenciales corporativas para acceder a la plataforma.'}
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '16px' }}>
            <D365MessageBar intent="error">{error}</D365MessageBar>
          </div>
        )}

        {setup === null ? (
          <div className={styles.centerBox}>
            {error ? (
              <Button appearance="secondary" onClick={load}>
                Reintentar conexión
              </Button>
            ) : (
              <Spinner label="Verificando configuración del sistema..." size="medium" />
            )}
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            {setup && (
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="login-nombre">
                  Nombre completo <span className={styles.requiredStar}>*</span>
                </label>
                <Input
                  className={styles.inputControl}
                  id="login-nombre"
                  size="large"
                  required
                  maxLength={150}
                  autoComplete="name"
                  placeholder="Ej. Juan Pérez"
                  contentBefore={<Person16Regular className={styles.inputIcon} />}
                  value={nombre}
                  onChange={(_, d) => setNombre(d.value)}
                  disabled={busy}
                />
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="login-email">
                Correo electrónico corporativo <span className={styles.requiredStar}>*</span>
              </label>
              <Input
                className={styles.inputControl}
                id="login-email"
                type="email"
                size="large"
                required
                maxLength={256}
                autoComplete="username"
                placeholder="usuario@empresa.com"
                contentBefore={<Mail16Regular className={styles.inputIcon} />}
                value={email}
                onChange={(_, d) => setEmail(d.value)}
                disabled={busy}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="login-password">
                Contraseña <span className={styles.requiredStar}>*</span>
              </label>
              <Input
                className={styles.inputControl}
                id="login-password"
                type={mostrarPassword ? 'text' : 'password'}
                size="large"
                required
                minLength={setup ? 8 : undefined}
                autoComplete={setup ? 'new-password' : 'current-password'}
                placeholder="••••••••••••"
                contentBefore={<LockClosed16Regular className={styles.inputIcon} />}
                contentAfter={
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={mostrarPassword ? <EyeOff16Regular /> : <Eye16Regular />}
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    tabIndex={-1}
                  />
                }
                value={password}
                onChange={(_, d) => setPassword(d.value)}
                disabled={busy}
              />
            </div>

            {setup && (
              <>
                <Text className={styles.helperText}>
                  Mínimo 8 caracteres, incluyendo mayúscula, minúscula, número y símbolo.
                </Text>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="login-confirmar">
                    Confirmar contraseña <span className={styles.requiredStar}>*</span>
                  </label>
                  <Input
                    className={styles.inputControl}
                    id="login-confirmar"
                    type={mostrarConfirmacion ? 'text' : 'password'}
                    size="large"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    contentBefore={<LockClosed16Regular className={styles.inputIcon} />}
                    contentAfter={
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={mostrarConfirmacion ? <EyeOff16Regular /> : <Eye16Regular />}
                        onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)}
                        aria-label={mostrarConfirmacion ? 'Ocultar contraseña' : 'Ver contraseña'}
                        tabIndex={-1}
                      />
                    }
                    value={confirmacion}
                    onChange={(_, d) => setConfirmacion(d.value)}
                    disabled={busy}
                  />
                </div>
              </>
            )}

            <Button
              className={styles.submitButton}
              type="submit"
              appearance="primary"
              size="large"
              disabled={busy}
              icon={busy ? <Spinner size="tiny" /> : <ArrowRight16Regular />}
              iconPosition="after"
            >
              {busy
                ? 'Validando...'
                : setup
                ? 'Crear administrador e ingresar'
                : 'Iniciar sesión'}
            </Button>
          </form>
        )}

        <div className={styles.divider} />

        <div className={styles.securityBadge}>
          <ShieldCheckmark16Regular className={styles.securityIcon} />
          <span>Acceso corporativo cifrado con token de seguridad</span>
        </div>
      </div>

      <div className={styles.footerText}>
        SKVIA Operations System • © 2026 Todos los derechos reservados
      </div>
    </main>
  );
}
