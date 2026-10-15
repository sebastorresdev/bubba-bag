import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, makeStyles, tokens } from '@fluentui/react-components';
import { dismissError, getFeedback, resolveConfirmation, subscribeFeedback } from '../../services/uiFeedback';
import { D365MessageBar } from './D365MessageBar';

const useStyles = makeStyles({
  surface: { width: 'min(480px, calc(100vw - 32px))', minWidth: 0 },
  notification: { position: 'fixed', bottom: '16px', right: '16px', width: 'min(480px, calc(100vw - 32px))', zIndex: 10000, boxShadow: tokens.shadow16 },
  danger: { backgroundColor: tokens.colorStatusDangerBackground3, color: tokens.colorNeutralForegroundOnBrand, ':hover': { backgroundColor: tokens.colorStatusDangerBackground3Hover } },
});

/** Confirmación accesible común; los errores de operación no interrumpen con otro modal. */
export function D365FeedbackHost() {
  const { confirmation, error } = useSyncExternalStore(subscribeFeedback, getFeedback, getFeedback);
  const styles = useStyles();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (confirmation) cancelRef.current?.focus(); }, [confirmation]);
  useEffect(() => () => resolveConfirmation(false), []);
  return <>
    <Dialog open={!!confirmation} onOpenChange={(_, data) => { if (!data.open) resolveConfirmation(false); }}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>{confirmation?.title}</DialogTitle>
          <DialogContent>{confirmation?.message}</DialogContent>
          <DialogActions>
            <Button ref={cancelRef} onClick={() => resolveConfirmation(false)}>Volver</Button>
            <Button appearance="primary" className={confirmation?.danger ? styles.danger : undefined} onClick={() => resolveConfirmation(true)}>{confirmation?.action}</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
    {error && <div className={styles.notification}><D365MessageBar intent="error" onDismiss={dismissError}>{error}</D365MessageBar></div>}
  </>;
}
