import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Warning24Regular, Delete24Regular } from '@fluentui/react-icons';
import { dismissError, getFeedback, resolveConfirmation, subscribeFeedback } from '../../services/uiFeedback';
import type { Confirmation } from '../../services/uiFeedback';
import { D365MessageBar } from './D365MessageBar';

const useStyles = makeStyles({
  surface: {
    width: 'min(480px, calc(100vw - 32px))',
    minWidth: 0,
    borderRadius: tokens.borderRadiusMedium,
    padding: '20px 24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
  },
  iconWarning: {
    color: tokens.colorPaletteDarkOrangeForeground1,
    flexShrink: 0,
  },
  iconDanger: {
    color: tokens.colorStatusDangerForeground1,
    flexShrink: 0,
  },
  notification: {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    width: 'min(480px, calc(100vw - 32px))',
    zIndex: 10000,
    boxShadow: tokens.shadow16,
  },
  dangerBtn: {
    backgroundColor: tokens.colorStatusDangerBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    whiteSpace: 'nowrap',
    ':hover': { backgroundColor: tokens.colorStatusDangerBackground3Hover },
  },
  nowrap: {
    whiteSpace: 'nowrap',
  },
});

/** Confirmación accesible común con diseño pulido estilo Dynamics 365. */
export function D365FeedbackHost() {
  const { confirmation, error } = useSyncExternalStore(subscribeFeedback, getFeedback, getFeedback);
  const styles = useStyles();

  // Conserva los datos de la última confirmación activa para que el contenido no parpadee durante la animación de cierre del modal
  const lastConfirmationRef = useRef<Confirmation | null>(null);
  if (confirmation) {
    lastConfirmationRef.current = confirmation;
  }
  const active = confirmation ?? lastConfirmationRef.current;

  useEffect(() => () => resolveConfirmation(false), []);

  const esPeligro = Boolean(active?.danger);

  return (
    <>
      <Dialog open={Boolean(confirmation)} onOpenChange={(_, data) => { if (!data.open) resolveConfirmation(false); }}>
        <DialogSurface className={styles.surface}>
          <DialogBody>
            <div className={styles.header}>
              {esPeligro ? (
                <Delete24Regular className={styles.iconDanger} />
              ) : (
                <Warning24Regular className={styles.iconWarning} />
              )}
              <DialogTitle style={{ margin: 0 }}>
                {active?.title}
              </DialogTitle>
            </div>
            <DialogContent style={{ paddingTop: '6px', paddingBottom: '12px' }}>
              {active?.message}
            </DialogContent>
            <DialogActions>
              <Button
                className={styles.nowrap}
                appearance={esPeligro ? 'secondary' : 'primary'}
                onClick={() => resolveConfirmation(false)}
              >
                Volver
              </Button>
              <Button
                className={esPeligro ? styles.dangerBtn : styles.nowrap}
                appearance={esPeligro ? 'primary' : 'secondary'}
                onClick={() => resolveConfirmation(true)}
              >
                {active?.action}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      {error && (
        <div className={styles.notification}>
          <D365MessageBar intent="error" onDismiss={dismissError}>
            {error}
          </D365MessageBar>
        </div>
      )}
    </>
  );
}
