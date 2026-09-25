import React from 'react';
import {
  makeStyles,
  tokens,
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
    backgroundColor: '#0e213f', // Dynamics 365 Deep Navy Blue
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '0px',
    paddingRight: '16px',
    userSelect: 'none',
    boxSizing: 'border-box',
    flexShrink: 0,
    zIndex: 100,
    color: '#ffffff',
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
    color: '#ffffff',
    border: 'none',
    borderRadius: 0,
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      color: '#ffffff',
    },
    ':active': {
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      color: '#ffffff',
    },
  },
  brandBtn: {
    minWidth: 'auto',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#ffffff',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 0,
    padding: '0 12px',
    fontSize: '15px',
    fontWeight: '400',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      color: '#ffffff',
    },
    ':active': {
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      color: '#ffffff',
    },
  },
  divider: {
    height: '18px',
    marginLeft: '4px',
    marginRight: '4px',
    flexShrink: 0,
    opacity: 0.35,
  },
  appTitle: {
    color: '#ffffff',
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
  actionBtn: {
    minWidth: '36px',
    width: '36px',
    height: '36px',
    padding: 0,
    color: '#ffffff',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff',
    },
    ':active': {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      color: '#ffffff',
    },
  },
  userProfile: {
    minWidth: 'auto',
    height: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '6px',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffffff',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff',
    },
    ':active': {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      color: '#ffffff',
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

        {/* Waffle Launcher */}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="transparent"
              className={styles.navBtn}
              title="Iniciador de aplicaciones (Apps)"
              aria-label="Iniciador de aplicaciones"
              icon={<Apps20Regular />}
            />
          </MenuTrigger>
          <MenuPopover>{appMenu}</MenuPopover>
        </Menu>

        {/* SKVIA with Chevron Down */}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="transparent"
              className={styles.brandBtn}
              title="Cambiar Aplicación"
              icon={<ChevronDown12Regular style={{ opacity: 0.8 }} />}
              iconPosition="after"
            >
              <span style={{ fontWeight: 600 }}>SKVIA</span>
            </Button>
          </MenuTrigger>
          <MenuPopover>{appMenu}</MenuPopover>
        </Menu>

        {/* Separator Pipe | */}
        <Divider vertical className={styles.divider} />

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
          <Button
            appearance="transparent"
            className={styles.actionBtn}
            onClick={toggleDarkMode}
            aria-label="Cambiar tema"
            icon={isDarkMode ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />}
          />
        </Tooltip>

        <Tooltip content="Notificaciones y alertas" relationship="label">
          <Button
            appearance="transparent"
            className={styles.actionBtn}
            aria-label="Notificaciones"
            icon={
              <div style={{ position: 'relative', display: 'flex' }}>
                <Alert20Regular />
                <Badge
                  size="extra-small"
                  color="danger"
                  style={{ position: 'absolute', top: -2, right: -2 }}
                />
              </div>
            }
          />
        </Tooltip>

        <Tooltip content="Ayuda y soporte" relationship="label">
          <Button
            appearance="transparent"
            className={styles.actionBtn}
            aria-label="Ayuda"
            icon={<QuestionCircle20Regular />}
          />
        </Tooltip>

        <Tooltip content="Configuración global" relationship="label">
          <Button
            appearance="transparent"
            className={styles.actionBtn}
            aria-label="Configuración"
            icon={<Settings20Regular />}
          />
        </Tooltip>

        {/* User Persona */}
        <Button appearance="transparent" className={styles.userProfile}>
          <Avatar
            name="Sebastián Torres"
            initials="ST"
            color="colorful"
            size={28}
            badge={{ status: 'available' }}
          />
          <div className={styles.userInfoText}>
            <Text weight="semibold" size={200} style={{ color: '#ffffff' }}>
              Sebastián Torres
            </Text>
            <Text size={100} style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              Administrador
            </Text>
          </div>
        </Button>
      </div>
    </header>
  );
};
