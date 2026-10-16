import React from 'react';
import {
  tokens,
  makeStyles,
  mergeClasses,
} from '@fluentui/react-components';
import {
  Calendar16Regular,
  CheckmarkCircle16Filled,
  Warning16Filled,
  DismissCircle16Filled,
  Edit16Regular,
  ChevronDown16Regular,
  Clock16Regular,
  ArrowSyncCircle16Regular,
} from '@fluentui/react-icons';

export interface D365StatusOption {
  value: string;
  label: string;
  color?: 'blue' | 'yellow' | 'green' | 'red' | 'gray' | 'purple';
}

export interface D365StatusFieldProps {
  id?: string;
  value?: string | boolean | null;
  label?: string;
  options?: D365StatusOption[];
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  size?: 'small' | 'medium';
}

interface StatusTheme {
  background: string;
  color: string;
  border: string;
  hoverBackground: string;
  icon: React.ReactNode;
}

const useStyles = makeStyles({
  container: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    width: '100%',
    borderRadius: '4px',
    border: '1px solid transparent',
    boxSizing: 'border-box',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '20px',
    transitionProperty: 'background-color, border-color, box-shadow',
    transitionDuration: tokens.durationNormal,
    userSelect: 'none',
  },
  medium: {
    height: '32px',
    paddingLeft: '10px',
    paddingRight: '10px',
  },
  small: {
    height: '26px',
    paddingLeft: '8px',
    paddingRight: '8px',
    fontSize: tokens.fontSizeBase200,
  },
  contentWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexGrow: 1,
    overflow: 'hidden',
  },
  text: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    letterSpacing: '-0.1px',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: '6px',
    opacity: 0.7,
  },
  nativeSelect: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    appearance: 'none',
  },
  disabled: {
    opacity: 0.65,
    cursor: 'not-allowed',
  },
});

function resolveStatusTheme(status?: string | boolean | null): StatusTheme {
  if (status === null || status === undefined || status === '') {
    return {
      background: '#F3F4F6',
      color: '#374151',
      border: '#D1D5DB',
      hoverBackground: '#E5E7EB',
      icon: <Edit16Regular />,
    };
  }

  if (typeof status === 'boolean') {
    return status
      ? {
          background: '#DCFCE7',
          color: '#15803D',
          border: '#86EFAC',
          hoverBackground: '#BBF7D0',
          icon: <CheckmarkCircle16Filled />,
        }
      : {
          background: '#FEE2E2',
          color: '#B91C1C',
          border: '#FCA5A5',
          hoverBackground: '#FECACA',
          icon: <DismissCircle16Filled />,
        };
  }

  const str = String(status).trim();
  const norm = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s_-]/g, '');

  // 1. Borrador / Draft / Pendiente inicial
  if (norm === 'borrador' || norm === 'draft' || norm === 'nuevo' || norm === 'nueva') {
    return {
      background: '#F3F4F6',
      color: '#374151',
      border: '#D1D5DB',
      hoverBackground: '#E5E7EB',
      icon: <Edit16Regular />,
    };
  }

  // 2. Scheduled / Programada / Solicitada / Asignada
  if (
    norm.includes('scheduled') ||
    norm.includes('programad') ||
    norm.includes('solicitad') ||
    norm.includes('asignad')
  ) {
    return {
      background: '#DBEAFE', // Azul tenue exacto al screenshot de Dynamics
      color: '#1E40AF',
      border: '#93C5FD',
      hoverBackground: '#BFDBFE',
      icon: <Calendar16Regular />,
    };
  }

  // 3. En Progreso / Enviada / En Ruta
  if (
    norm.includes('progreso') ||
    norm.includes('enviad') ||
    norm.includes('enruta') ||
    norm.includes('ensitio') ||
    norm.includes('curso')
  ) {
    return {
      background: '#E0E7FF', // Indigo / Brand sutil
      color: '#4338CA',
      border: '#A5B4FC',
      hoverBackground: '#C7D2FE',
      icon: <ArrowSyncCircle16Regular />,
    };
  }

  // 4. Completada / Recibida / Finalizada / Cerrada / Activo
  if (
    (norm.includes('recibid') && !norm.includes('faltante')) ||
    norm.includes('completad') ||
    norm.includes('finalizad') ||
    norm.includes('cerrad') ||
    norm === 'activo'
  ) {
    return {
      background: '#DCFCE7', // Verde menta tenue
      color: '#15803D',
      border: '#86EFAC',
      hoverBackground: '#BBF7D0',
      icon: <CheckmarkCircle16Filled />,
    };
  }

  // 5. Warning / Recibida con faltantes / Pendiente programar / High priority
  if (
    norm.includes('faltante') ||
    norm.includes('pendienteprogramar') ||
    norm === 'alta' ||
    norm === 'high' ||
    norm === 'urgente'
  ) {
    return {
      background: '#FEF3C7', // Amarillo / Ámbar tenue exacto al screenshot de Dynamics
      color: '#B45309',
      border: '#FCD34D',
      hoverBackground: '#FDE68A',
      icon: <Warning16Filled />,
    };
  }

  // 6. Danger / Cancelado / Inactivo / Rechazado / Critical
  if (
    norm.includes('cancelad') ||
    norm.includes('anulad') ||
    norm.includes('rechazad') ||
    norm === 'inactivo' ||
    norm === 'critica' ||
    norm === 'critical'
  ) {
    return {
      background: '#FEE2E2', // Rojo tenue
      color: '#B91C1C',
      border: '#FCA5A5',
      hoverBackground: '#FECACA',
      icon: <DismissCircle16Filled />,
    };
  }

  // Default subtle fallback
  return {
    background: '#F3F4F6',
    color: '#374151',
    border: '#D1D5DB',
    hoverBackground: '#E5E7EB',
    icon: <Clock16Regular />,
  };
}

export const D365StatusField: React.FC<D365StatusFieldProps> = ({
  id,
  value,
  label,
  options,
  onChange,
  disabled = false,
  readOnly = false,
  className,
  style,
  size = 'medium',
}) => {
  const styles = useStyles();
  const theme = resolveStatusTheme(value);
  const displayLabel = label || (typeof value === 'boolean' ? (value ? 'Activo' : 'Inactivo') : value || '—');
  const isInteractive = Boolean(onChange && options && options.length > 0 && !disabled && !readOnly);

  return (
    <div
      id={id}
      className={mergeClasses(
        styles.container,
        styles[size],
        (disabled || readOnly) && styles.disabled,
        className
      )}
      style={{
        backgroundColor: theme.background,
        color: theme.color,
        borderColor: theme.border,
        cursor: isInteractive ? 'pointer' : 'default',
        ...style,
      }}
      title={String(displayLabel)}
    >
      <div className={styles.contentWrapper}>
        <span className={styles.icon}>{theme.icon}</span>
        <span className={styles.text}>{displayLabel}</span>
      </div>

      <span className={styles.chevron}>
        <ChevronDown16Regular />
      </span>

      {isInteractive && (
        <select
          className={styles.nativeSelect}
          value={String(value ?? '')}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={String(displayLabel)}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default D365StatusField;
