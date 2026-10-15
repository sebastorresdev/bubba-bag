import type { ReactNode, CSSProperties } from 'react';

/** Evita modificar el borrador mientras se confirma su guardado. */
export function D365FormContent({ children, busy, className, style }: { children: ReactNode; busy?: boolean; className?: string; style?: CSSProperties }) {
  return <fieldset disabled={busy} aria-label="Datos del formulario" className={className} style={{ border: 0, margin: 0, minWidth: 0, ...style }}>{children}</fieldset>;
}
