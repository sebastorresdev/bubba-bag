import React, { type ReactNode } from 'react';
import { Button, makeStyles, Skeleton, SkeletonItem, Text, tokens } from '@fluentui/react-components';
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
  skeletonRoot: {
    width: '100%',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    boxSizing: 'border-box',
  },
  skeletonHeader: {
    display: 'grid',
    gridTemplateColumns: '32px 2fr 2fr 1fr 1fr',
    gap: tokens.spacingHorizontalL,
    padding: `${tokens.spacingVerticalS} 0`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  skeletonRow: {
    display: 'grid',
    gridTemplateColumns: '32px 2fr 2fr 1fr 1fr',
    gap: tokens.spacingHorizontalL,
    alignItems: 'center',
    minHeight: '52px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  skeletonCell: { width: '80%' },
  skeletonCellFull: { width: '100%' },
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
    return (
      <div className={styles.skeletonRoot} role="status" aria-label={loadingLabel}>
        <Skeleton animation="pulse">
          <div className={styles.skeletonHeader}>
            {Array.from({ length: 5 }, (_, index) => (
              <SkeletonItem key={`header-${index}`} size={16} className={styles.skeletonCell} />
            ))}
          </div>
          {Array.from({ length: 6 }, (_, row) => (
            <div className={styles.skeletonRow} key={`row-${row}`}>
              {Array.from({ length: 5 }, (_, column) => (
                <SkeletonItem
                  key={`cell-${row}-${column}`}
                  size={16}
                  className={column === 1 ? styles.skeletonCellFull : styles.skeletonCell}
                />
              ))}
            </div>
          ))}
        </Skeleton>
      </div>
    );
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
