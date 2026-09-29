import React, { type ReactNode } from 'react';
import { Button, makeStyles, Spinner, Text, tokens } from '@fluentui/react-components';
import { ArrowClockwise16Regular, ErrorCircle24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    minHeight: '240px',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
  },
  errorIcon: { color: tokens.colorStatusDangerForeground1 },
  errorText: { color: tokens.colorNeutralForeground1, maxWidth: '640px' },
});

export interface D365ListStateProps {
  loading?: boolean;
  error?: string | null;
  loadingLabel?: string;
  onRetry?: () => void;
  children: ReactNode;
}

/** Estados compartidos del área de contenido de las listas. */
export const D365ListState: React.FC<D365ListStateProps> = ({
  loading = false,
  error,
  loadingLabel = 'Cargando...',
  onRetry,
  children,
}) => {
  const styles = useStyles();

  if (loading) {
    return <div className={styles.root}><Spinner size="medium" label={loadingLabel} /></div>;
  }

  if (error) {
    return (
      <div className={styles.root} role="alert">
        <ErrorCircle24Regular className={styles.errorIcon} />
        <Text className={styles.errorText} weight="semibold">{error}</Text>
        {onRetry && (
          <Button appearance="outline" icon={<ArrowClockwise16Regular />} onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default D365ListState;
