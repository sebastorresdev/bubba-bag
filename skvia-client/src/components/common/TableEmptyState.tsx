import React from 'react';
import { makeStyles, tokens, Text } from '@fluentui/react-components';
import { Database32Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
    gap: '12px',
    width: '100%',
    userSelect: 'none',
  },
  icon: {
    fontSize: '36px',
    width: '36px',
    height: '36px',
    color: tokens.colorNeutralForeground4,
  },
  text: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
  },
});

export interface TableEmptyStateProps {
  message?: string;
  icon?: React.ReactElement;
  children?: React.ReactNode;
  className?: string;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  message = 'No hay datos disponibles',
  icon = <Database32Regular />,
  children,
  className,
}) => {
  const styles = useStyles();

  return (
    <div className={className ? `${styles.container} ${className}` : styles.container}>
      {React.cloneElement(icon, {
        className: styles.icon,
      })}
      <Text className={styles.text}>{message}</Text>
      {children}
    </div>
  );
};

export default TableEmptyState;
