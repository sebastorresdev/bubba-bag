import React from 'react';
import { Badge, type BadgeProps } from '@fluentui/react-components';

export type D365StatusColor =
  | 'brand'
  | 'danger'
  | 'important'
  | 'informative'
  | 'severe'
  | 'subtle'
  | 'success'
  | 'warning';

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

/**
 * Resolves standard business/ERP status terms to appropriate Fluent UI Badge colors
 * matching Dynamics 365 / Power Apps tint badges.
 */
export function resolveStatusColor(status?: string | boolean | number | null): {
  color: D365StatusColor;
  label: string;
} {
  if (status === null || status === undefined) {
    return { color: 'subtle', label: '—' };
  }

  if (typeof status === 'boolean') {
    return status
      ? { color: 'success', label: 'Activo' }
      : { color: 'danger', label: 'Inactivo' };
  }

  const str = String(status).trim();
  const normalized = str.toLowerCase();

  // 1. Success (Green)
  if (
    normalized === 'completed' ||
    normalized === 'completado' ||
    normalized === 'completada' ||
    normalized === 'aplicado' ||
    normalized === 'aprobado' ||
    normalized === 'aprobada' ||
    normalized === 'recibida' ||
    normalized === 'recibido' ||
    normalized === 'cerrada' ||
    normalized === 'cerrado' ||
    normalized === 'activo' ||
    normalized === 'activa' ||
    normalized === 'conforme' ||
    normalized === 'finalizado' ||
    normalized === 'utilizable'
  ) {
    return { color: 'success', label: str };
  }

  // 2. Scheduled / In Progress / Brand (Blue)
  if (
    normalized === 'scheduled' ||
    normalized === 'programado' ||
    normalized === 'programada' ||
    normalized === 'entransito' ||
    normalized === 'en transito' ||
    normalized === 'en tránsito' ||
    normalized === 'enviado' ||
    normalized === 'enviada' ||
    normalized === 'despachado' ||
    normalized === 'despachada'
  ) {
    return {
      color: 'brand',
      label: normalized === 'entransito' ? 'En Tránsito' : str,
    };
  }

  // 3. Informative / Cyan / In Progress
  if (
    normalized === 'in progress' ||
    normalized === 'inprogress' ||
    normalized === 'en proceso' ||
    normalized === 'en curso' ||
    normalized === 'bodega' ||
    normalized === 'custodia personal' ||
    normalized === 'custodia'
  ) {
    return {
      color: 'informative',
      label: str,
    };
  }

  // 4. Warning / Amber / Orange
  if (
    normalized === 'unscheduled' ||
    normalized === 'no programado' ||
    normalized === 'pendiente' ||
    normalized === 'enrevision' ||
    normalized === 'en revision' ||
    normalized === 'en revisión' ||
    normalized === 'poraprobar' ||
    normalized === 'por aprobar' ||
    normalized === 'parcialmenterecibida' ||
    normalized === 'parcialmente recibida' ||
    normalized === 'parcial' ||
    normalized === 'observado'
  ) {
    return {
      color: 'warning',
      label:
        normalized === 'enrevision'
          ? 'En revisión'
          : normalized === 'parcialmenterecibida'
          ? 'Parcialmente Recibida'
          : str,
    };
  }

  // 5. Danger / Red
  if (
    normalized === 'cancelado' ||
    normalized === 'cancelada' ||
    normalized === 'anulado' ||
    normalized === 'anulada' ||
    normalized === 'rechazado' ||
    normalized === 'rechazada' ||
    normalized === 'inactivo' ||
    normalized === 'inactiva' ||
    normalized === 'defectuoso' ||
    normalized === 'baja' ||
    normalized === 'eliminado'
  ) {
    return { color: 'danger', label: str };
  }

  // 6. Subtle / Gray (Draft, New, etc.)
  if (
    normalized === 'borrador' ||
    normalized === 'draft' ||
    normalized === 'nuevo' ||
    normalized === 'nueva'
  ) {
    return { color: 'subtle', label: str };
  }

  return { color: 'subtle', label: str };
}

/**
 * Dynamics 365 / Fluent UI status badge with tint appearance and rounded shape.
 */
export const D365StatusBadge: React.FC<D365StatusBadgeProps> = ({
  status,
  text,
  color,
  appearance = 'tint',
  shape = 'rounded',
  size = 'small',
  className,
  style,
}) => {
  const resolved = resolveStatusColor(status);
  const badgeColor = color ?? resolved.color;
  const badgeLabel = text ?? resolved.label;

  return (
    <Badge
      appearance={appearance}
      shape={shape}
      color={badgeColor}
      size={size}
      className={className}
      style={{
        fontWeight: 500,
        textTransform: 'none',
        ...style,
      }}
    >
      {badgeLabel}
    </Badge>
  );
};

export default D365StatusBadge;
