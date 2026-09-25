import React from 'react';
import {
  makeStyles,
  tokens,
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
} from '@fluentui/react-components';
import {
  Navigation24Regular,
  Apps20Regular,
  ChevronDown12Regular,
  Search16Regular,
  WeatherSunny20Regular,
  WeatherMoon20Regular,
  Alert20Regular,
  QuestionCircle20Regular,
  Settings20Regular,
  Checkmark16Regular,
} from '@fluentui/react-icons';
import { useTheme } from '../../context/ThemeContext';
import type { EnterpriseApp } from '../../types/navigation.types';

const useStyles = makeStyles({
  root: {
    height: '48px',
    backgroundColor: tokens.colorBrandBackground, // Dynamics 365 Field Service Brand Blue
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '0px',
    paddingRight: '16px',
    userSelect: 'none',
    boxSizing: 'border-box',
    flexShrink: 0,
    zIndex: 100,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
  },
  hamburgerBtn: {
    width: '48px',
    height: '48px',
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
    ':active': {
      backgroundColor: tokens.colorBrandBackgroundPressed,
    },
  },
  waffleBtn: {
    width: '48px',
    height: '48px',
    backgroundColor: tokens.colorPaletteTealBackground2, // Microsoft Dynamics 365 Teal Waffle
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: 0,
    border: 'none',
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorPaletteTealBorderActive,
    },
  },
  d365BrandBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0 12px',
    height: '48px',
    fontSize: '15px',
    fontWeight: '400',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
  },
  divider: {
    width: '1px',
    height: '18px',
    backgroundColor: tokens.colorNeutralStrokeAlpha2,
    margin: '0 4px',
  },
  appTitle: {
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: '15px',
    fontWeight: '600',
    padding: '0 10px',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  centerSection: {
    flexGrow: 1,
    maxWidth: '500px',
    margin: '0 16px',
  },
  searchInput: {
    width: '100%',
    borderRadius: '4px',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  suiteBarIconBtn: {
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: 'transparent',
    border: 'none',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '6px',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
  },
  userInfoText: {
    display: 'none',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: '1.2',
    '@media (min-width: 900px)': {
      display: 'flex',
    },
  },
  appLauncherHeader: {
    padding: '10px 14px 6px 14px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: '4px',
  },
  appItemText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
});

interface SuiteBarProps {
  apps: EnterpriseApp[];
  activeApp: EnterpriseApp;
  onSelectApp: (app: EnterpriseApp) => void;
  isNavOpen?: boolean;
  onToggleNav?: () => void;
}

export const SuiteBar: React.FC<SuiteBarProps> = ({
  apps,
  activeApp,
  onSelectApp,
  isNavOpen,
  onToggleNav,
}) => {
  const styles = useStyles();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const appMenu = (
    <MenuList style={{ minWidth: '280px' }}>
      <div className={styles.appLauncherHeader}>
        <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground4 }}>
          APLICACIONES DE LA EMPRESA
        </Text>
      </div>

      {apps.map((app) => {
        const isSelected = app.id === activeApp.id;
        return (
          <MenuItem
            key={app.id}
            icon={
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '4px',
                  backgroundColor: app.color,
                  color: tokens.colorNeutralForegroundOnBrand,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                {app.shortCode}
              </div>
            }
            secondaryContent={
              isSelected ? (
                <Checkmark16Regular
                  style={{ color: tokens.colorCompoundBrandForeground1 }}
                />
              ) : undefined
            }
            onClick={() => onSelectApp(app)}
          >
            <div className={styles.appItemText}>
              <Text weight={isSelected ? 'semibold' : 'medium'} size={300}>
                {app.name}
              </Text>
              <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                {app.subtitle}
              </Text>
            </div>
          </MenuItem>
        );
      })}
    </MenuList>
  );

  return (
    <header className={styles.root}>
      {/* Left: Hamburger Toggle + Teal Waffle Button + Dynamics 365 dropdown + App Name */}
      <div className={styles.leftSection}>
        {onToggleNav && (
          <button
            className={styles.hamburgerBtn}
            onClick={onToggleNav}
            title={isNavOpen ? 'Contraer navegación' : 'Expandir navegación'}
            aria-label={isNavOpen ? 'Contraer navegación' : 'Expandir navegación'}
            aria-expanded={isNavOpen}
          >
            <Navigation24Regular />
          </button>
        )}

        {/* Teal Waffle Launcher */}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <button
              className={styles.waffleBtn}
              title="Iniciador de aplicaciones (Apps)"
              aria-label="Iniciador de aplicaciones"
            >
              <Apps20Regular />
            </button>
          </MenuTrigger>
          <MenuPopover>{appMenu}</MenuPopover>
        </Menu>

        {/* SKVIA with Chevron Down */}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <button className={styles.d365BrandBtn} title="Cambiar Aplicación">
              <span style={{ fontWeight: 600 }}>SKVIA</span>
              <ChevronDown12Regular style={{ opacity: 0.8 }} />
            </button>
          </MenuTrigger>
          <MenuPopover>{appMenu}</MenuPopover>
        </Menu>

        {/* Separator Pipe | */}
        <div className={styles.divider} />

        {/* Active Application Name */}
        <span className={styles.appTitle}>{activeApp.name}</span>
      </div>

      {/* Global Search */}
      <div className={styles.centerSection}>
        <Input
          className={styles.searchInput}
          placeholder={`Buscar en ${activeApp.name}...`}
          contentBefore={<Search16Regular />}
          appearance="outline"
          size="medium"
        />
      </div>

      {/* Right Actions */}
      <div className={styles.rightSection}>
        <Tooltip
          content={isDarkMode ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro'}
          relationship="label"
        >
          <button
            className={styles.suiteBarIconBtn}
            onClick={toggleDarkMode}
            aria-label="Cambiar tema"
          >
            {isDarkMode ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />}
          </button>
        </Tooltip>

        <Tooltip content="Notificaciones y alertas" relationship="label">
          <button className={styles.suiteBarIconBtn} aria-label="Notificaciones">
            <div style={{ position: 'relative', display: 'flex' }}>
              <Alert20Regular />
              <Badge
                size="extra-small"
                color="danger"
                style={{ position: 'absolute', top: -2, right: -2 }}
              />
            </div>
          </button>
        </Tooltip>

        <Tooltip content="Ayuda y soporte" relationship="label">
          <button className={styles.suiteBarIconBtn} aria-label="Ayuda">
            <QuestionCircle20Regular />
          </button>
        </Tooltip>

        <Tooltip content="Configuración global" relationship="label">
          <button className={styles.suiteBarIconBtn} aria-label="Configuración">
            <Settings20Regular />
          </button>
        </Tooltip>

        {/* User Persona */}
        <div className={styles.userProfile}>
          <Avatar
            name="Sebastián Torres"
            initials="ST"
            color="colorful"
            size={28}
            badge={{ status: 'available' }}
          />
          <div className={styles.userInfoText}>
            <Text weight="semibold" size={200} style={{ color: tokens.colorNeutralForegroundOnBrand }}>
              Sebastián Torres
            </Text>
            <Text size={100} style={{ color: tokens.colorNeutralForegroundOnBrand, opacity: 0.85 }}>
              Administrador
            </Text>
          </div>
        </div>
      </div>
    </header>
  );
};
