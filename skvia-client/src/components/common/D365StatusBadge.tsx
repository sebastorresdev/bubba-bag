import React from 'react';
import { Badge, makeStyles, tokens, type BadgeProps } from '@fluentui/react-components';
import { Checkmark12Regular } from '@fluentui/react-icons';

export type D365StatusColor =
  | 'brand'
  | 'danger'
  | 'important'
  | 'informative'
  | 'severe'
  | 'subtle'
  | 'success'
  | 'warning';

export interface StatusResolution {
  color: D365StatusColor;
  label: string;
  hasCheckmark?: boolean;
  isPulsing?: boolean;
  hasBorder?: boolean;
}

export interface D365StatusBadgeProps {
  status?: string | boolean | number | null;
  text?: string;
  color?: D365StatusColor;
  appearance?: BadgeProps['appearance'];
  shape?: BadgeProps['shape'];
  size?: BadgeProps['size'];
  className?: string;
  style?: React.CSSProperties;
}

const useStyles = makeStyles({
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    display: 'inline-block',
    marginRight: '6px',
    flexShrink: 0,
    animationName: {
      '0%': { transform: 'scale(0.85)', opacity: 0.6 },
      '50%': { transform: 'scale(1.35)', opacity: 1 },
      '100%': { transform: 'scale(0.85)', opacity: 0.6 },
    },
    animationDuration: '1.8s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
  checkmarkIcon: {
    marginRight: '4px',
    flexShrink: 0,
    verticalAlign: 'middle',
  },
  badgeSubtleBorder: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  badgeBase: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    display: 'inline-flex',
    alignItems: 'center',
  },
});

/**
 * Matriz Semántica de Estados Estandarizada:
 * - Borrador / Pendiente: Neutral / Gris con borde suave (subtle).
 * - Pendiente Programar: Ámbar / Amarillo tenue (warning).
 * - Programada / En Ruta: Azul corporativo (brand).
 * - En Progreso: Azul intenso / Púrpura con punto pulsante de actividad (informative + pulse).
 * - Completada / Liquidada / Finalizada: Verde esmeralda con icono Checkmark (success + checkmark).
 * - Cancelada / Rechazada / Defectuoso: Rojo suave (danger).
 */
export function resolveStatusColor(status?: string | boolean | number | null): StatusResolution {
  if (status === null || status === undefined) {
    return { color: 'subtle', label: '—', hasBorder: true };
  }

  if (typeof status === 'boolean') {
    return status
      ? { color: 'success', label: 'Activo', hasCheckmark: true }
      : { color: 'danger', label: 'Inactivo' };
  }

  const str = String(status).trim();
  const normalized = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s_-]/g, '');

  // 1. Borrador / Pendiente (Neutral con borde suave)
  if (normalized === 'borrador' || normalized === 'draft' || normalized === 'nuevo' || normalized === 'nueva') {
    return { color: 'subtle', label: 'Borrador', hasBorder: true };
  }
  if (normalized === 'pendiente' || normalized === 'pending') {
    return { color: 'subtle', label: 'Pendiente', hasBorder: true };
  }

  // 2. Pendiente Programar / Por Aprobar / En Revisión (Ámbar / Amarillo tenue)
  if (
    normalized === 'pendienteprogramar' ||
    normalized === 'unscheduled' ||
    normalized === 'sinprogramar' ||
    normalized === 'poraprobar' ||
    normalized === 'enrevision' ||
    normalized === 'observado' ||
    normalized === 'parcialmenterecibida'
  ) {
    const labelMap: Record<string, string> = {
      pendienteprogramar: 'Pendiente Programar',
      unscheduled: 'Sin programar',
      sinprogramar: 'Sin programar',
      poraprobar: 'Por aprobar',
      enrevision: 'En revisión',
      parcialmenterecibida: 'Parcialmente Recibida',
    };
    return { color: 'warning', label: labelMap[normalized] || str };
  }

  // 3. Programada / En Ruta / En Tránsito (Azul corporativo)
  if (
    normalized === 'programado' ||
    normalized === 'programada' ||
    normalized === 'scheduled' ||
    normalized === 'enruta' ||
    normalized === 'entransito' ||
    normalized === 'despachado' ||
    normalized === 'despachada' ||
    normalized === 'enviado' ||
    normalized === 'enviada'
  ) {
    const labelMap: Record<string, string> = {
      programado: 'Programado',
      programada: 'Programada',
      enruta: 'En Ruta',
      entransito: 'En Tránsito',
    };
    return { color: 'brand', label: labelMap[normalized] || str };
  }

  // 4. En Progreso (Azul intenso / Púrpura con punto pulsante de actividad)
  if (
    normalized === 'enprogreso' ||
    normalized === 'inprogress' ||
    normalized === 'enproceso' ||
    normalized === 'encurso' ||
    normalized === 'operando'
  ) {
    return { color: 'informative', label: 'En Progreso', isPulsing: true };
  }

  // 5. Completada / Liquidada / Finalizada (Verde esmeralda con icono Checkmark)
  if (
    normalized === 'completado' ||
    normalized === 'completada' ||
    normalized === 'completed' ||
    normalized === 'completa' ||
    normalized === 'liquidada' ||
    normalized === 'liquidado' ||
    normalized === 'finalizada' ||
    normalized === 'finalizado' ||
    normalized === 'cerrada' ||
    normalized === 'cerrado' ||
    normalized === 'aprobado' ||
    normalized === 'aprobada' ||
    normalized === 'recibido' ||
    normalized === 'recibida' ||
    normalized === 'activo' ||
    normalized === 'activa' ||
    normalized === 'conforme'
  ) {
    const labelMap: Record<string, string> = {
      completado: 'Completado',
      completada: 'Completada',
      completa: 'Completa',
      liquidada: 'Liquidada',
      liquidado: 'Liquidado',
      finalizada: 'Finalizada',
      finalizado: 'Finalizado',
    };
    return { color: 'success', label: labelMap[normalized] || str, hasCheckmark: true };
  }

  // 6. Cancelada / Rechazada / Defectuoso (Rojo suave)
  if (
    normalized === 'cancelado' ||
    normalized === 'cancelada' ||
    normalized === 'canceled' ||
    normalized === 'cancelled' ||
    normalized === 'rechazado' ||
    normalized === 'rechazada' ||
    normalized === 'anulado' ||
    normalized === 'anulada' ||
    normalized === 'defectuoso' ||
    normalized === 'baja' ||
    normalized === 'eliminado' ||
    normalized === 'inactivo' ||
    normalized === 'inactiva'
  ) {
    const labelMap: Record<string, string> = {
      cancelado: 'Cancelado',
      cancelada: 'Cancelada',
      rechazado: 'Rechazado',
      rechazada: 'Rechazada',
      defectuoso: 'Defectuoso',
    };
    return { color: 'danger', label: labelMap[normalized] || str };
  }

  return { color: 'subtle', label: str, hasBorder: true };
}

/**
 * Dynamics 365 status badge using native Fluent UI Badge with tint appearance and standardized semantics.
 */
export const D365StatusBadge: React.FC<D365StatusBadgeProps> = ({
  status,
  text,
  color,
  appearance = 'tint',
  shape = 'rounded',
  size = 'medium',
  className,
  style,
}) => {
  const styles = useStyles();
  const resolved = resolveStatusColor(status);
  const badgeColor = color ?? resolved.color;
  const badgeLabel = text ?? resolved.label;

  return (
    <Badge
      appearance={appearance}
      shape={shape}
      color={badgeColor}
      size={size}
      className={`${styles.badgeBase} ${resolved.hasBorder ? styles.badgeSubtleBorder : ''} ${className ?? ''}`}
      style={style}
    >
      {resolved.isPulsing && <span className={styles.pulseDot} aria-hidden="true" />}
      {resolved.hasCheckmark && <Checkmark12Regular className={styles.checkmarkIcon} aria-hidden="true" />}
      {badgeLabel}
    </Badge>
  );
};

export default D365StatusBadge;
