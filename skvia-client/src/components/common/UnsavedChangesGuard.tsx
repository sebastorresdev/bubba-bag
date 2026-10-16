import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { useBlocker } from 'react-router-dom';
import { hasUnsavedDrafts, subscribeDrafts } from '../../services/draftState';
import { confirmAction } from '../../services/uiFeedback';

function ActiveUnsavedChangesGuard() {
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }) => {
        return currentLocation.pathname !== nextLocation.pathname;
      },
      []
    )
  );
  const latestBlocker = useRef(blocker);
  useLayoutEffect(() => {
    latestBlocker.current = blocker;
  }, [blocker]);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    let active = true;
    void confirmAction('Los cambios de esta ficha todavía no se han guardado. Si sale, se perderán.', {
      title: 'Cambios sin guardar',
      action: 'Salir sin guardar',
      danger: false,
    }).then((accepted) => {
      if (!active) return;
      const pending = latestBlocker.current;
      if (pending.state !== 'blocked') return;
      if (accepted) pending.proceed();
      else pending.reset();
    });
    return () => {
      active = false;
    };
  }, [blocker.state]);

  return null;
}

export function UnsavedChangesGuard() {
  const dirty = useSyncExternalStore(subscribeDrafts, hasUnsavedDrafts, hasUnsavedDrafts);

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  if (!dirty) return null;
  return <ActiveUnsavedChangesGuard />;
}
