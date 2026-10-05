import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  mergeClasses,
  Button,
  Divider,
  Input,
  Avatar,
  Tooltip,
  Badge,
  Text,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
} from '@fluentui/react-components';
import {
  Navigation24Regular,
  Apps20Regular,
  Search16Regular,
  WeatherSunny20Regular,
  WeatherMoon20Regular,
  Alert20Regular,
  QuestionCircle20Regular,
  Settings20Regular,
  Checkmark16Regular,
  ArrowClockwise16Regular,
  SignOutRegular,
  Dismiss20Regular,
} from '@fluentui/react-icons';
import { useTheme } from '../../context/ThemeContext';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import type { EnterpriseApp } from '../../types/navigation.types';
import { semanticTokens } from '../../styles/semanticTokens';

const useStyles = makeStyles({
  root: {
    height: '48px',
    backgroundColor: semanticTokens.navigation.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '0px',
    paddingRight: '16px',
    userSelect: 'none',
    boxSizing: 'border-box',
    flexShrink: 0,
    zIndex: 100,
    color: semanticTokens.navigation.foreground,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
  },
  navBtn: {
    minWidth: '48px',
    width: '48px',
    height: '48px',
    padding: 0,
    backgroundColor: 'transparent',
    color: semanticTokens.navigation.foreground,
    border: 'none',
    borderRadius: 0,
    ':hover': {
      backgroundColor: semanticTokens.navigation.hoverBackground,
      color: semanticTokens.navigation.foreground,
    },
    ':active': {
      backgroundColor: semanticTokens.navigation.pressedBackground,
      color: semanticTokens.navigation.foreground,
    },
  },
  waffleBtn: {
    minWidth: '48px',
    width: '48px',
    height: '48px',
    padding: 0,
    backgroundColor: '#008272',
    color: '#ffffff',
    border: 'none',
    borderRadius: 0,
    ':hover': {
      backgroundColor: '#006e60',
      color: '#ffffff',
    },
    ':active': {
      backgroundColor: '#005b4f',
      color: '#ffffff',
    },
  },
  brandText: {
    padding: '0 12px',
    fontSize: semanticTokens.typography.body,
    fontWeight: semanticTokens.typography.semibold,
    color: semanticTokens.navigation.foreground,
    letterSpacing: '0.8px',
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none',
    lineHeight: '48px',
  },
  divider: {
    height: '18px',
    marginLeft: '4px',
    marginRight: '4px',
    flexShrink: 0,
    opacity: 0.35,
  },
  appTitle: {
    fontSize: semanticTokens.typography.body,
    fontWeight: semanticTokens.typography.semibold,
    color: semanticTokens.navigation.foreground,
    letterSpacing: '-0.2px',
    paddingLeft: '8px',
    paddingRight: '16px',
  },
  appsDrawer: {
    width: '320px',
    maxWidth: '85vw',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  drawerHeader: {
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  drawerHeaderTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  waffleHeaderIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    backgroundColor: '#008272',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBody: {
    padding: '12px 8px',
  },
  appsSectionHeader: {
    padding: '6px 8px 10px 8px',
  },
  appsSectionLabel: {
    letterSpacing: '0.5px',
    color: tokens.colorNeutralForeground3,
  },
  appsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  appCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
    boxSizing: 'border-box',
    transition: 'background-color 0.12s ease',
    ':hover': {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
    ':active': {
      backgroundColor: tokens.colorSubtleBackgroundPressed,
    },
  },
  appCardSelected: {
    backgroundColor: tokens.colorSubtleBackgroundSelected,
    ':hover': {
      backgroundColor: tokens.colorSubtleBackgroundSelected,
    },
  },
  appBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: tokens.colorBrandBackground,
    fontWeight: semanticTokens.typography.bold,
    fontSize: semanticTokens.typography.caption,
    flexShrink: 0,
  },
  appItemText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    flexGrow: 1,
    overflow: 'hidden',
  },
  appItemTitle: {
    color: tokens.colorNeutralForeground1,
  },
  appSubtitle: {
    color: tokens.colorNeutralForeground3,
  },
  selectedCheck: {
    color: tokens.colorBrandForeground1,
  },
  centerSection: {
    flexGrow: 1,
    maxWidth: '480px',
    margin: '0 16px',
  },
  searchInput: {
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '4px',
    ':focus-within': {
      backgroundColor: tokens.colorNeutralBackground1,
    },
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  actionBtn: {
    minWidth: '36px',
    width: '36px',
    height: '36px',
    padding: 0,
    backgroundColor: 'transparent',
    color: semanticTokens.navigation.foreground,
    border: 'none',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: semanticTokens.navigation.hoverBackground,
      color: semanticTokens.navigation.foreground,
    },
    ':active': {
      backgroundColor: semanticTokens.navigation.pressedBackground,
      color: semanticTokens.navigation.foreground,
    },
  },
  notificationIcon: {
    position: 'relative',
    display: 'inline-flex',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    height: '36px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: semanticTokens.navigation.hoverBackground,
    },
  },
  userInfoText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    lineHeight: '1.2',
  },
  userName: {
    color: semanticTokens.navigation.foreground,
  },
  userRole: {
    color: semanticTokens.navigation.foreground,
    opacity: 0.85,
  },
});

interface SuiteBarProps {
  apps: EnterpriseApp[];
  activeApp: EnterpriseApp;
  onSelectApp: (app: EnterpriseApp) => void;
  isNavOpen?: boolean;
  onToggleNav?: () => void;
  isMobile?: boolean;
}

export const SuiteBar: React.FC<SuiteBarProps> = ({
  apps,
  activeApp,
  onSelectApp,
  isNavOpen,
  onToggleNav,
  isMobile = false,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (q.includes('prod') || q.includes('art') || q.includes('sku') || q.includes('mat')) {
        navigate(`/servicio-campo/productos?buscar=${encodeURIComponent(searchQuery.trim())}`);
      } else if (q.includes('alm') || q.includes('bod')) {
        navigate('/servicio-campo/almacenes');
      } else if (q.includes('comp') || q.includes('recep')) {
        navigate('/servicio-campo/recepciones-compra');
      } else if (q.includes('transf')) {
        navigate('/servicio-campo/transferencias');
      } else if (q.includes('prec') || q.includes('list')) {
        navigate('/servicio-campo/listas-precios');
      } else if (q.includes('unid')) {
        navigate('/servicio-campo/unidades-medida');
      } else if (q.includes('categ') || q.includes('fam')) {
        navigate('/servicio-campo/categorias-producto');
      } else if (q.includes('imp') || q.includes('carg')) {
        navigate('/gestion-datos/importaciones');
      } else {
        navigate(`/servicio-campo/productos?buscar=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const [appsDrawerOpen, setAppsDrawerOpen] = useState(false);

  return (
    <header className={styles.root}>
      {/* Left: Mobile Hamburger Toggle + Teal Waffle Button + SKVIA text + App Name */}
      <div className={styles.leftSection}>
        {onToggleNav && isMobile && (
          <Button
            appearance="transparent"
            className={styles.navBtn}
            onClick={onToggleNav}
            title={isNavOpen ? 'Contraer navegación' : 'Expandir navegación'}
            aria-label={isNavOpen ? 'Contraer navegación' : 'Expandir navegación'}
            aria-expanded={isNavOpen}
            icon={<Navigation24Regular />}
          />
        )}

        {/* Waffle Launcher Button */}
        <Button
          appearance="transparent"
          className={styles.waffleBtn}
          onClick={() => setAppsDrawerOpen(true)}
          title="Iniciador de aplicaciones (Apps)"
          aria-label="Iniciador de aplicaciones"
          icon={<Apps20Regular />}
        />

        {/* SKVIA Brand Text only */}
        <span className={styles.brandText}>SKVIA</span>

        {/* Separator Pipe | */}
        <Divider vertical className={styles.divider} />

        {/* Active Application Name */}
        <span className={styles.appTitle}>{activeApp.name}</span>
      </div>

      {/* Global Search with direct routing */}
      <div className={styles.centerSection}>
        <Input
          className={styles.searchInput}
          placeholder={`Buscar en ${activeApp.name}`}
          contentBefore={<Search16Regular />}
          appearance="outline"
          size="medium"
          value={searchQuery}
          onChange={(_e, data) => setSearchQuery(data.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      {/* Right Actions */}
      <div className={styles.rightSection}>
        <Tooltip
          content={isDarkMode ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro'}
          relationship="label"
        >
          <Button
            appearance="transparent"
            className={styles.actionBtn}
            onClick={toggleDarkMode}
            aria-label="Cambiar tema"
            icon={isDarkMode ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />}
          />
        </Tooltip>

        {/* Notificaciones del Sistema */}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Tooltip content="Notificaciones y alertas del sistema" relationship="label">
              <Button
                appearance="transparent"
                className={styles.actionBtn}
                aria-label="Notificaciones"
                icon={
                  <div className={styles.notificationIcon}>
                    <Alert20Regular />
                    <Badge
                      size="extra-small"
                      color="success"
                      className={styles.notificationBadge}
                    />
                  </div>
                }
              />
            </Tooltip>
          </MenuTrigger>
          <MenuPopover>
            <MenuList style={{ minWidth: '260px', padding: '8px' }}>
              <div style={{ padding: '6px 12px' }}>
                <Text weight="semibold" size={300} block>
                  Centro de Notificaciones
                </Text>
                <Text size={100} style={{ opacity: 0.7 }} block>
                  Estado operativo en tiempo real
                </Text>
              </div>
              <Divider style={{ margin: '6px 0' }} />
              <MenuItem disabled>🟢 Servidor API: Operativo y en línea</MenuItem>
              <MenuItem disabled>🟢 PostgreSQL: Base de datos sincronizada</MenuItem>
              <MenuItem disabled>🟢 Telemetría Aspire: Activa</MenuItem>
              <MenuItem disabled>ℹ️ No hay alertas críticas pendientes</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        {/* Ayuda y Soporte */}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Tooltip content="Ayuda y documentación técnica" relationship="label">
              <Button
                appearance="transparent"
                className={styles.actionBtn}
                aria-label="Ayuda"
                icon={<QuestionCircle20Regular />}
              />
            </Tooltip>
          </MenuTrigger>
          <MenuPopover>
            <MenuList style={{ minWidth: '260px', padding: '8px' }}>
              <div style={{ padding: '6px 12px' }}>
                <Text weight="semibold" size={300} block>
                  Centro de Ayuda
                </Text>
                <Text size={100} style={{ opacity: 0.7 }} block>
                  BubbaBag / SKVIA ERP v1.0.0
                </Text>
              </div>
              <Divider style={{ margin: '6px 0' }} />
              <MenuItem onClick={() => navigate('/gestion-datos/importaciones')}>
                📂 Guía de Importación Masiva Excel
              </MenuItem>
              <MenuItem onClick={() => navigate('/servicio-campo/productos')}>
                📦 Catálogo de Productos y Precios
              </MenuItem>
              <MenuItem disabled>
                ⌨️ Tip: Busca productos o almacenes desde la barra superior
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        {/* Configuración Rápida */}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Tooltip content="Configuración global del entorno" relationship="label">
              <Button
                appearance="transparent"
                className={styles.actionBtn}
                aria-label="Configuración"
                icon={<Settings20Regular />}
              />
            </Tooltip>
          </MenuTrigger>
          <MenuPopover>
            <MenuList style={{ minWidth: '240px', padding: '8px' }}>
              <div style={{ padding: '6px 12px' }}>
                <Text weight="semibold" size={300} block>
                  Configuración del Entorno
                </Text>
              </div>
              <Divider style={{ margin: '6px 0' }} />
              <MenuItem onClick={toggleDarkMode}>
                {isDarkMode ? '☀️ Cambiar a tema Claro' : '🌙 Cambiar a tema Oscuro'}
              </MenuItem>
              <MenuItem disabled>📐 Densidad: Estándar (D365)</MenuItem>
              <MenuItem disabled>🇵🇪 Moneda: Soles (PEN - S/.)</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        {/* User Persona dinámico */}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button appearance="transparent" className={styles.userProfile} title="Perfil del usuario activo">
              <Avatar
                name={currentUser.nombre}
                initials={currentUser.initials}
                color="colorful"
                size={28}
                badge={{ status: 'available' }}
              />
              <div className={styles.userInfoText}>
                <Text weight="semibold" size={200} className={styles.userName}>
                  {currentUser.nombre}
                </Text>
                <Text size={100} className={styles.userRole}>
                  {currentUser.rol}
                </Text>
              </div>
            </Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList style={{ minWidth: '240px', padding: '8px' }}>
              <div style={{ padding: '8px 12px' }}>
                <Text weight="semibold" block>{currentUser.nombre}</Text>
                <Text size={200} style={{ opacity: 0.7 }} block>{currentUser.email}</Text>
                <Badge size="small" appearance="tint" color="informative" style={{ marginTop: '6px' }}>
                  {currentUser.rol}
                </Badge>
              </div>
              <Divider style={{ margin: '6px 0' }} />
              <MenuItem icon={<ArrowClockwise16Regular />} onClick={currentUser.refreshUser}>
                Actualizar sesión
              </MenuItem>
              <MenuItem icon={<SignOutRegular />} onClick={currentUser.logout}>
                Cerrar sesión
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>

      {/* Left Apps Drawer (Overlay Drawer) */}
      <OverlayDrawer
        position="start"
        open={appsDrawerOpen}
        onOpenChange={(_, { open }) => setAppsDrawerOpen(open)}
        className={styles.appsDrawer}
      >
        <DrawerHeader className={styles.drawerHeader}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar menú de aplicaciones"
                icon={<Dismiss20Regular />}
                onClick={() => setAppsDrawerOpen(false)}
              />
            }
          >
            <div className={styles.drawerHeaderTitleRow}>
              <div className={styles.waffleHeaderIcon}>
                <Apps20Regular />
              </div>
              <Text weight="semibold" size={400}>
                Aplicaciones
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody className={styles.drawerBody}>
          <div className={styles.appsSectionHeader}>
            <Text size={200} weight="semibold" className={styles.appsSectionLabel}>
              APLICACIONES DE LA EMPRESA
            </Text>
          </div>

          <div className={styles.appsList}>
            {apps.map((app) => {
              const isSelected = app.id === activeApp.id;
              return (
                <button
                  key={app.id}
                  type="button"
                  className={mergeClasses(
                    styles.appCard,
                    isSelected && styles.appCardSelected
                  )}
                  onClick={() => {
                    onSelectApp(app);
                    setAppsDrawerOpen(false);
                  }}
                >
                  <div className={styles.appBadge}>
                    {app.shortCode}
                  </div>
                  <div className={styles.appItemText}>
                    <Text weight={isSelected ? 'semibold' : 'medium'} size={300} className={styles.appItemTitle}>
                      {app.name}
                    </Text>
                    <Text size={100} className={styles.appSubtitle}>
                      {app.subtitle}
                    </Text>
                  </div>
                  {isSelected && (
                    <Checkmark16Regular className={styles.selectedCheck} />
                  )}
                </button>
              );
            })}
          </div>
        </DrawerBody>
      </OverlayDrawer>
    </header>
  );
};
