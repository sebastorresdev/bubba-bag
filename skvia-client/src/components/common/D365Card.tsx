import React from 'react';
import { Card, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  card: {
    padding: '20px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
  },
  cardSectionTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    paddingBottom: '8px',
    marginBottom: '4px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    marginBottom: '4px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerTitleOnly: {
    borderBottom: 'none',
    paddingBottom: 0,
    marginBottom: 0,
  },
});

export interface D365CardProps {
  title?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Tarjeta estándar de formulario basada en el componente <Card> de FluentUI v9.
 * Provee título de sección en mayúsculas estilo Dynamics 365, acción de cabecera y bordes estándar.
 */
export const D365Card: React.FC<D365CardProps> = ({
  title,
  headerAction,
  children,
  className,
  style,
}) => {
  const styles = useStyles();

  return (
    <Card appearance="outline" className={`${styles.card} ${className ?? ''}`} style={style}>
      {title && (
        <div className={headerAction ? styles.headerWrapper : undefined}>
          <div className={`${styles.cardSectionTitle} ${headerAction ? styles.headerTitleOnly : ''}`}>
            {title}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </Card>
  );
};

export default D365Card;
