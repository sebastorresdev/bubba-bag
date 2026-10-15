export interface Confirmation {
  message: string;
  title: string;
  action: string;
  danger: boolean;
}

interface FeedbackState {
  confirmation: Confirmation | null;
  error: string | null;
}

let state: FeedbackState = { confirmation: null, error: null };
let resolvePending: ((confirmed: boolean) => void) | null = null;
let returnFocus: HTMLElement | null = null;
const listeners = new Set<() => void>();
const publish = (next: FeedbackState) => {
  state = next;
  listeners.forEach(listener => listener());
};

export const getFeedback = () => state;
export const subscribeFeedback = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

/** Una segunda solicitud no puede confirmar ni reemplazar una operación pendiente. */
export function confirmAction(message: string, options?: Partial<Omit<Confirmation, 'message'>>): Promise<boolean> {
  if (resolvePending) return Promise.resolve(false);
  if (typeof document !== 'undefined') {
    const active = document.activeElement as HTMLElement | null;
    returnFocus = active?.closest('[role="menuitem"]')
      ? document.querySelector<HTMLElement>('button[aria-haspopup="menu"][aria-expanded="true"]') ?? document.querySelector<HTMLElement>('button[aria-label="Más acciones"]')
      : active;
  }
  const danger = /eliminar|cancelar|anular|desactivar/i.test(message);
  const action = /eliminar/i.test(message) ? 'Eliminar'
    : /desactivar/i.test(message) ? 'Desactivar'
    : /activar/i.test(message) ? 'Activar'
    : /cancelar/i.test(message) ? 'Cancelar operación'
    : /recepci|recibir/i.test(message) ? 'Registrar recepción' : 'Continuar';
  return new Promise<boolean>(resolve => {
    resolvePending = resolve;
    publish({ ...state, confirmation: { message, title: `${action}: confirmar`, action, danger, ...options } });
  });
}

export function resolveConfirmation(confirmed: boolean) {
  const resolve = resolvePending;
  const focusTarget = returnFocus;
  returnFocus = null;
  resolvePending = null;
  publish({ ...state, confirmation: null });
  resolve?.(confirmed);
  if (focusTarget && typeof window !== 'undefined') {
    window.requestAnimationFrame(() => { if (focusTarget.isConnected) focusTarget.focus(); });
  }
}

export const showError = (message: string) => publish({ ...state, error: message });
export const dismissError = () => publish({ ...state, error: null });
