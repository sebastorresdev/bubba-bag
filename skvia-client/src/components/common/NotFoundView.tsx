import React from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Text,
  Button,
} from '@fluentui/react-components';
import {
  DocumentSearch24Regular,
  Home16Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    padding: '32px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  card: {
    maxWidth: '520px',
    width: '100%',
    padding: '40px 32px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow8,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  iconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorCompoundBrandForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    marginBottom: '20px',
  },
  errorCode: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    lineHeight: 1,
    marginBottom: '8px',
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  message: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    lineHeight: '1.5',
    marginBottom: '28px',
    maxWidth: '380px',
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
});

interface NotFoundViewProps {
  title?: string;
  message?: string;
  onGoHome?: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  title = 'Página no encontrada',
  message = 'El recurso, vista o registro al que intentas acceder no existe, fue movido o no tienes permisos para visualizarlo.',
  onGoHome,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.iconWrapper}>
          <DocumentSearch24Regular style={{ fontSize: 32 }} />
        </div>

        <span className={styles.errorCode}>404</span>

        <Text className={styles.title}>{title}</Text>
        <Text className={styles.message}>{message}</Text>

        <div className={styles.actionRow}>
          {onGoHome && (
            <Button
              appearance="primary"
              icon={<Home16Regular />}
              onClick={onGoHome}
            >
              Ir a la vista principal
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
