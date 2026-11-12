import { UnsavedChangesGuard } from '../common/UnsavedChangesGuard';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { makeStyles, tokens, Spinner, Button } from '@fluentui/react-components';
import { Warning16Filled } from '@fluentui/react-icons';
import { SuiteBar } from './SuiteBar';
import { SideNav } from './SideNav';
import { availableApps } from '../../features/seguridad/services/securityAccess';
import { useAuthSession } from '../../services/authSession';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { CambiarMiPasswordDialog } from '../../features/seguridad/components/CambiarMiPasswordDialog';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { dismissError, resolveConfirmation } from '../../services/uiFeedback';
import type { NavArea, NavItem, EnterpriseApp } from '../../types/navigation.types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  body: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 0,
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    overflow: 'hidden',
    minWidth: 0,
    minHeight: 0,
    backgroundColor: tokens.colorNeutralBackground3,
  },
});

export const MainLayout: React.FC = () => {
  const styles = useStyles();
  const { permisos } = useAuthSession();
  const currentUser = useCurrentUser();
  const [cambiarPasswordOpen, setCambiarPasswordOpen] = useState(false);
  const apps = useMemo(() => availableApps(permisos), [permisos]);
  const location = useLocation();
  useEffect(() => {
    resolveConfirmation(false);
    dismissError();
  }, [location.key]);
  const navigate = useNavigate();
  const isMobile = useIsMobile(1024);
  const [navOpen, setNavOpen] = useState<boolean>(() => !isMobile);

  // Sync default state when breakpoint changes
  useEffect(() => {
    if (isMobile) {
      setNavOpen(false);
    } else {
      setNavOpen(true);
    }
  }, [isMobile]);

  // Find matching navigation hierarchy (app, area, item) based on current route path
  const currentNav = useMemo(() => {
    const currentPath = location.pathname;
    for (const app of apps) {
      for (const area of app.areas) {
        for (const group of area.groups) {
          for (const item of group.items) {
            if (currentPath === item.path || currentPath.startsWith(item.path + '/')) {
              return { app, area, item };
            }
            if (item.subItems) {
              for (const subItem of item.subItems) {
                if (currentPath === subItem.path || currentPath.startsWith(subItem.path + '/')) {
                  return { app, area, item: subItem };
                }
              }
            }
          }
        }
      }
    }
    return null;
  }, [location.pathname, apps]);

  // Active state with fallbacks
  const [selectedApp, setSelectedApp] = useState<EnterpriseApp>(() => currentNav?.app || apps[0]);
  const [selectedArea, setSelectedArea] = useState<NavArea>(() => currentNav?.area || apps[0].areas[0]);

  // Keep selected app and area in sync when route changes
  useEffect(() => {
    if (currentNav) {
      setSelectedApp(currentNav.app);
      setSelectedArea(currentNav.area);
    }
  }, [currentNav]);

  const activeApp = currentNav?.app || selectedApp;
  const activeArea = currentNav?.area || selectedArea;
  const activeItem = currentNav?.item;

  const handleSelectApp = (app: EnterpriseApp) => {
    setSelectedApp(app);
    const targetArea = app.areas[0];
    setSelectedArea(targetArea);
    if (targetArea?.defaultPath) {
      navigate(targetArea.defaultPath);
    }
  };

  const handleSelectArea = (area: NavArea) => {
    setSelectedArea(area);
    if (area.defaultPath) {
      navigate(area.defaultPath);
    }
  };

  const handleSelectItem = (item: NavItem) => {
    navigate(item.path);
    if (isMobile) setNavOpen(false);
  };

  const handleToggleNav = () => {
    setNavOpen((prev) => !prev);
  };

  return (
    <div className={styles.root}>
      <UnsavedChangesGuard />
      {/* Top SuiteBar: App Launcher (Waffle) + Hamburger Toggle + Enterprise apps */}
      <SuiteBar
        apps={apps}
        activeApp={activeApp}
        onSelectApp={handleSelectApp}
        isNavOpen={navOpen}
        onToggleNav={handleToggleNav}
        isMobile={isMobile}
        onAbrirCambiarPassword={() => setCambiarPasswordOpen(true)}
      />

      {/* Alerta de Seguridad si el usuario usa la contraseña genérica */}
      {currentUser.esClaveGenerica && (
        <div
          style={{
            backgroundColor: '#fff4ce',
            borderBottom: '1px solid #fed86f',
            padding: '7px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '13px',
            color: '#323130',
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warning16Filled style={{ color: '#795b00', fontSize: '16px', flexShrink: 0 }} />
            <span>
              <strong>Aviso de Seguridad:</strong> Su cuenta está utilizando la contraseña inicial genérica (<code>Admin123*!</code>). 
              Le recomendamos cambiarla ahora para proteger el acceso a su sistema.
            </span>
          </div>
          <Button
            size="small"
            appearance="primary"
            onClick={() => setCambiarPasswordOpen(true)}
            style={{ flexShrink: 0 }}
          >
            Cambiar Contraseña
          </Button>
        </div>
      )}

      {/* Main Body */}
      <div className={styles.body}>
        {/* Left SideNav: Responsive Fluent UI v9 NavDrawer */}
        <SideNav
          open={navOpen}
          type={isMobile ? 'overlay' : 'inline'}
          onOpenChange={setNavOpen}
          areas={activeApp.areas}
          activeArea={activeArea}
          activeItem={activeItem}
          onSelectArea={handleSelectArea}
          onSelectItem={handleSelectItem}
          onToggleNav={handleToggleNav}
        />

        {/* Right Content Area: Rendered via React Router Outlet */}
        <main className={styles.mainContent}>
          <Suspense
            fallback={
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexGrow: 1,
                  height: '100%',
                  minHeight: '320px',
                  gap: '12px',
                  backgroundColor: tokens.colorNeutralBackground3,
                }}
              >
                <Spinner size="large" label="Cargando módulo..." />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <CambiarMiPasswordDialog
        open={cambiarPasswordOpen}
        onOpenChange={setCambiarPasswordOpen}
        esAlertaInicial={currentUser.esClaveGenerica}
      />
    </div>
  );
};
