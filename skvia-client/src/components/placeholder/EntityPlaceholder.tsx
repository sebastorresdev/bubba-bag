import React from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Text,
  Badge,
  Button,
  ProgressBar,
} from '@fluentui/react-components';
import type { NavItem, NavArea, EnterpriseApp } from '../../types/navigation.types';
import { FluentIcon } from '../common/FluentIcon';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    height: '100%',
    boxSizing: 'border-box',
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  card: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '28px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow8,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  iconBox: {
    width: '56px',
    height: '56px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    flexShrink: 0,
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  description: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginTop: '6px',
    lineHeight: '1.5',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginTop: '24px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Consolas, monospace',
  },
  previewSection: {
    marginTop: '28px',
    padding: '20px',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px dashed ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  mockTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
  },
  mockTh: {
    textAlign: 'left',
    padding: '8px 12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  mockTd: {
    padding: '10px 12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
  },
  mockSkeletonBar: {
    height: '10px',
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: '4px',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
});

interface EntityPlaceholderProps {
  item: NavItem;
  area: NavArea;
  app?: EnterpriseApp;
  onRefresh?: () => void;
}

export const EntityPlaceholder: React.FC<EntityPlaceholderProps> = ({ item, area, app, onRefresh }) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.headerRow}>
          <div className={styles.iconBox}>
            <FluentIcon name={item.iconName} fontSize={32} />
          </div>

          <div style={{ flexGrow: 1 }}>
            <div className={styles.badgeRow}>
              <Badge appearance="filled" color="warning" size="medium">
                Por implementar
              </Badge>
              {app && (
                <Badge
                  appearance="filled"
                  size="medium"
                  style={{ backgroundColor: app.color, color: '#ffffff' }}
                >
                  {app.name}
                </Badge>
              )}
              <Badge appearance="outline" color="brand" size="medium">
                {area.name}
              </Badge>
              {item.badge && (
                <Badge appearance="tint" color="important" size="medium">
                  {item.badge}
                </Badge>
              )}
            </div>

            <Text className={styles.title}>{item.title}</Text>
            <div className={styles.description}>
              {item.description || 'Vista Dynamics 365 configurada y lista para su implementación paso a paso.'}
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div style={{ marginTop: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>
              Estado del Módulo
            </Text>
            <Text size={200} weight="semibold" style={{ color: tokens.colorBrandForeground1 }}>
              Estructura lista (Fase 1: Layout & Navegación)
            </Text>
          </div>
          <ProgressBar value={0.35} color="brand" />
        </div>

        {/* Metadata info */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Ruta de Enlace</span>
            <span className={styles.infoValue}>{item.path}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Identificador Único</span>
            <span className={styles.infoValue}>{item.id}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Tecnología UI</span>
            <span className={styles.infoValue}>Fluent UI v9 + React 19</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Área Empresarial</span>
            <span className={styles.infoValue}>{area.name} ({area.shortCode})</span>
          </div>
        </div>

        {/* Preview of future UI */}
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <Text weight="semibold" size={300}>
              Previsualización de estructura: {item.title}
            </Text>
            <Badge appearance="tint" color="informative" size="small">
              Maqueta de Rejilla de Datos
            </Badge>
          </div>

          <table className={styles.mockTable}>
            <thead>
              <tr>
                <th className={styles.mockTh} style={{ width: '40px' }}>
                  <input type="checkbox" disabled />
                </th>
                <th className={styles.mockTh}>Código / Nombre</th>
                <th className={styles.mockTh}>Estado</th>
                <th className={styles.mockTh}>Fecha Modificación</th>
                <th className={styles.mockTh}>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((row) => (
                <tr key={row}>
                  <td className={styles.mockTd}>
                    <input type="checkbox" disabled />
                  </td>
                  <td className={styles.mockTd}>
                    <div className={styles.mockSkeletonBar} style={{ width: `${80 + row * 15}%` }} />
                  </td>
                  <td className={styles.mockTd}>
                    <div className={styles.mockSkeletonBar} style={{ width: '60px' }} />
                  </td>
                  <td className={styles.mockTd}>
                    <div className={styles.mockSkeletonBar} style={{ width: '90px' }} />
                  </td>
                  <td className={styles.mockTd}>
                    <div className={styles.mockSkeletonBar} style={{ width: '120px' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action row */}
        <div className={styles.actionRow}>
          <Button appearance="secondary" icon={<FluentIcon name="ArrowClockwise" fontSize={16} />} onClick={onRefresh}>
            Recargar
          </Button>
          <Button
            appearance="primary"
            icon={<FluentIcon name="Add" fontSize={16} />}
            onClick={() => alert(`Listo para codificar la vista completa de ${item.title} (${item.path})`)}
          >
            Comenzar implementación de esta vista
          </Button>
        </div>
      </Card>
    </div>
  );
};
