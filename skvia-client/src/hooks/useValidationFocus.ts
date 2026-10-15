import { useCallback, useEffect, useRef } from 'react';

const controls = 'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex="0"]';

export function useValidationFocus() {
  const frame = useRef<number | null>(null);
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  return useCallback((field?: string) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    let attempts = 0;
    const focus = () => {
      const scope = document.querySelector('main') ?? document;
      const named = field ? document.getElementById(field) ?? Array.from(scope.querySelectorAll<HTMLElement>('[data-field-label]')).find(element => element.dataset.fieldLabel === field) : undefined;
      const invalid = named ?? Array.from(scope.querySelectorAll<HTMLElement>('[aria-invalid="true"]')).find(element => element.getClientRects().length > 0);
      const target = invalid?.matches(controls) ? invalid : invalid?.querySelector<HTMLElement>(controls);
      if (target && target.getClientRects().length > 0) {
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
        frame.current = null;
        return;
      }
      if (++attempts < 4) frame.current = requestAnimationFrame(focus);
      else {
        const alert = Array.from(scope.querySelectorAll<HTMLElement>('[role="alert"]')).find(element => element.getClientRects().length > 0);
        if (alert) { alert.tabIndex = -1; alert.focus({ preventScroll: true }); alert.scrollIntoView({ block: 'nearest' }); }
        frame.current = null;
      }
    };
    frame.current = requestAnimationFrame(focus);
  }, []);
}
