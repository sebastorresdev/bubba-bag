import type { ReactNode, CSSProperties } from 'react';

/** Evita modificar el borrador mientras se confirma su guardado y garantiza scroll vertical nativo en Chromium/Firefox. */
export function D365FormContent({
  children,
  busy,
  className,
  style,
  'aria-busy': ariaBusy,
}: {
  children: ReactNode;
  busy?: boolean;
  className?: string;
  style?: CSSProperties;
  'aria-busy'?: boolean;
}) {
  return (
    <div
      className={className}
      style={{ minHeight: 0, ...style }}
      aria-busy={ariaBusy}
    >
      <fieldset
        disabled={busy}
        aria-label="Datos del formulario"
        style={{
          border: 0,
          margin: 0,
          padding: 0,
          minWidth: 0,
          width: '100%',
          display: 'contents',
        }}
      >
        {children}
      </fieldset>
    </div>
  );
}
