import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button, Spinner, Text } from '@fluentui/react-components';
import { clearSession, initializeSession, useAuthSession } from '../../../services/authSession';
import { canAccessPath, homePath } from '../services/securityAccess';
import { D365MessageBar } from '../../../components/common/D365MessageBar';

export function RequireSession() {
  const { usuario, cargando, permisos } = useAuthSession();
  const location = useLocation();
  useEffect(() => { void initializeSession(); }, []);
  if (cargando) return <Spinner label="Verificando sesión..." />;
  if (!usuario) return <Navigate replace to={`/login?continuar=${encodeURIComponent(location.pathname + location.search)}`} />;
  if (location.pathname === '/') return <Navigate replace to={homePath(permisos)} />;
  if (!canAccessPath(location.pathname, permisos)) return <div>
    <D365MessageBar intent="warning">Tu cuenta no tiene permiso para acceder a esta sección.</D365MessageBar>
    <Text>{usuario.nombreCompleto}</Text><Button onClick={clearSession}>Cerrar sesión</Button>
    {homePath(permisos) !== '/sin-acceso' && <Button as="a" href={homePath(permisos)}>Ir a mi área</Button>}
  </div>;
  return <Outlet />;
}
