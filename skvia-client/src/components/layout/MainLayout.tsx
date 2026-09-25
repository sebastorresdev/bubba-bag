import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { makeStyles, tokens } from '@fluentui/react-components';
import { SuiteBar } from './SuiteBar';
import { SideNav } from './SideNav';
import { ENTERPRISE_APPS } from '../../data/navigation.data';
import { useIsMobile } from '../../hooks/useMediaQuery';
import type { NavArea, NavItem, EnterpriseApp } from '../../types/navigation.types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  body: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground3,
  },
});

export const MainLayout: React.FC = () => {
  const styles = useStyles();
  const location = useLocation();
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
    for (const app of ENTERPRISE_APPS) {
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
  }, [location.pathname]);

  // Active state with fallbacks
  const [selectedApp, setSelectedApp] = useState<EnterpriseApp>(() => currentNav?.app || ENTERPRISE_APPS[0]);
  const [selectedArea, setSelectedArea] = useState<NavArea>(() => currentNav?.area || ENTERPRISE_APPS[0].areas[2]);

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
  };

  const handleToggleNav = () => {
    setNavOpen((prev) => !prev);
  };

  return (
    <div className={styles.root}>
      {/* Top SuiteBar: App Launcher (Waffle) + Hamburger Toggle + Enterprise apps */}
      <SuiteBar
        apps={ENTERPRISE_APPS}
        activeApp={activeApp}
        onSelectApp={handleSelectApp}
        isNavOpen={navOpen}
        onToggleNav={handleToggleNav}
      />

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
          <Outlet />
        </main>
      </div>
    </div>
  );
};
