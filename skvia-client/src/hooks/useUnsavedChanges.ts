import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { removeDraft, serializeDraft, updateDraft } from '../services/draftState';
import { confirmAction } from '../services/uiFeedback';
import { useLocation } from 'react-router-dom';

/** Sólo registra datos editables; búsqueda, pestañas y selección visual no son cambios. */
export function useUnsavedChanges(value: unknown, enabled = true) {
  const id = useId();
  const { pathname } = useLocation();
  const scope = useRef(pathname);
  const snapshot = serializeDraft(value);
  const current = useRef(snapshot);
  const normalizeAfterSave = useRef(false);
  const [baseline, setBaseline] = useState<string | null>(() => enabled ? snapshot : null);
  const dirty = enabled && baseline !== null && baseline !== snapshot;
  useLayoutEffect(() => {
    current.current = snapshot;
    if (scope.current !== pathname) {
      scope.current = pathname;
      normalizeAfterSave.current = false;
      setBaseline(enabled ? snapshot : null);
      updateDraft(id, false);
      return;
    }
    if (!enabled) {
      normalizeAfterSave.current = false;
      if (baseline !== null) setBaseline(null);
      updateDraft(id, false);
      return;
    }
    if (baseline === null) {
      setBaseline(snapshot);
      updateDraft(id, false);
      return;
    }
    if (normalizeAfterSave.current) {
      normalizeAfterSave.current = false;
      setBaseline(snapshot);
      updateDraft(id, false);
    } else updateDraft(id, dirty);
  }, [id, snapshot, dirty, baseline, enabled, pathname]);
  useEffect(() => () => removeDraft(id), [id]);
  const capture = useCallback(() => current.current, []);
  const markSaved = useCallback((savedSnapshot: string = current.current) => {
    normalizeAfterSave.current = true;
    setBaseline(savedSnapshot);
    updateDraft(id, false);
  }, [id]);
  const discardAndRun = useCallback(async (action: () => void | Promise<void>) => {
    if (dirty && !await confirmAction('Los cambios de esta ficha todavía no se han guardado. Si continúa, se descartarán.', { title: 'Cambios sin guardar', action: 'Descartar cambios', danger: false })) return;
    markSaved();
    await action();
  }, [dirty, markSaved]);
  return { dirty, capture, markSaved, discardAndRun };
}
