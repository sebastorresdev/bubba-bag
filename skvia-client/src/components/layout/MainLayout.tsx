import React, { useState, useEffect } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { SuiteBar } from './SuiteBar';
import { SideNav } from './SideNav';
import { D365CommandBar } from './D365CommandBar';
import { EntityPlaceholder } from '../placeholder/EntityPlaceholder';
import { ProductosListView } from '../views/ProductosListView';
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
  viewport: {
    flexGrow: 1,
    overflow: 'hidden',
    position: 'relative',
  },
});

export const MainLayout: React.FC = () => {
  const styles = useStyles();
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

  // Active Enterprise Application (Default: Servicio de Campo)
  const [activeApp, setActiveApp] = useState<EnterpriseApp>(ENTERPRISE_APPS[0]);

  // Active Area within the Application (Default: Configuración to see Productos, or Servicio)
  const [activeArea, setActiveArea] = useState<NavArea>(ENTERPRISE_APPS[0].areas[2]); // Configuración

  // Active Item (Default: Productos y Servicios)
  const [activeItem, setActiveItem] = useState<NavItem>(() => {
    const configArea = ENTERPRISE_APPS[0].areas[2];
    const productosItem = configArea?.groups[0]?.items.find((i) => i.id === 'productos');
    return productosItem || ENTERPRISE_APPS[0].areas[0].groups[0].items[0];
  });

  const handleSelectApp = (app: EnterpriseApp) => {
    setActiveApp(app);
    const initialArea = app.areas[0];
    setActiveArea(initialArea);
    if (initialArea?.groups[0]?.items[0]) {
      const preferred = initialArea.groups[1]?.items[0] || initialArea.groups[0].items[0];
      setActiveItem(preferred);
    }
  };

  const handleSelectArea = (area: NavArea) => {
    setActiveArea(area);
    if (area.groups[0]?.items[0]) {
      setActiveItem(area.groups[0].items[0]);
    }
  };

  const handleSelectItem = (item: NavItem) => {
    setActiveItem(item);
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

        {/* Right Content Area */}
        <main className={styles.mainContent}>
          {activeItem.id === 'productos' ? (
            <ProductosListView
              onNewProduct={() => alert('Formulario Nuevo Producto en desarrollo')}
              onSelectProduct={(p) => alert(`Abriendo producto: ${p.codigo} - ${p.nombre}`)}
            />
          ) : (
            <>
              {/* Dynamics 365 Command Bar for placeholder views */}
              <D365CommandBar
                title={activeItem.title}
                onRefresh={() => {}}
                onNew={() => alert(`Acción Nueva entidad para: ${activeItem.title}`)}
              />

              {/* Viewport with placeholder for each entity */}
              <div className={styles.viewport}>
                <EntityPlaceholder
                  key={activeItem.id}
                  item={activeItem}
                  area={activeArea}
                  app={activeApp}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
