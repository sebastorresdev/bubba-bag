import React from 'react';
import { Field, InfoLabel, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  fieldHorizontal: {
    display: 'grid',
    gridTemplateColumns: '180px minmax(0, 1fr)',
    gridTemplateRows: 'auto auto auto',
    alignItems: 'center',
    columnGap: '16px',
    rowGap: '4px',
    minHeight: '34px',
    padding: '2px 0',
    width: '100%',
    '& .fui-Field__label': {
      gridRowStart: 1,
      gridRowEnd: 2,
      gridColumn: '1 / 2',
      alignSelf: 'center',
      width: '180px',
      minWidth: '180px',
      maxWidth: '180px',
      margin: 0,
      padding: 0,
      lineHeight: '1.25',
    },
    '& > :not(.fui-Field__label):not(.fui-Field__validationMessage):not(.fui-Field__hint)': {
      gridRowStart: 1,
      gridRowEnd: 2,
      gridColumn: '2 / 3',
      alignSelf: 'center',
      width: '100%',
      minWidth: 0,
    },
    '& .fui-Field__validationMessage': {
      gridRow: '2 / 3',
      gridColumn: '2 / 3',
      fontSize: tokens.fontSizeBase100,
      marginTop: '2px',
    },
    '& .fui-Field__hint': {
      gridRow: '3 / 4',
      gridColumn: '2 / 3',
      fontSize: tokens.fontSizeBase100,
      marginTop: '2px',
    },
  },
  fieldHorizontalTop: {
    display: 'grid',
    gridTemplateColumns: '180px minmax(0, 1fr)',
    gridTemplateRows: 'auto auto auto',
    alignItems: 'start',
    columnGap: '16px',
    rowGap: '4px',
    padding: '4px 0',
    width: '100%',
    '& .fui-Field__label': {
      gridRowStart: 1,
      gridRowEnd: 2,
      gridColumn: '1 / 2',
      alignSelf: 'start',
      width: '180px',
      minWidth: '180px',
      maxWidth: '180px',
      paddingTop: '6px',
      margin: 0,
      lineHeight: '1.25',
    },
    '& > :not(.fui-Field__label):not(.fui-Field__validationMessage):not(.fui-Field__hint)': {
      gridRowStart: 1,
      gridRowEnd: 2,
      gridColumn: '2 / 3',
      alignSelf: 'start',
      width: '100%',
      minWidth: 0,
    },
    '& .fui-Field__validationMessage': {
      gridRow: '2 / 3',
      gridColumn: '2 / 3',
      fontSize: tokens.fontSizeBase100,
      marginTop: '2px',
    },
    '& .fui-Field__hint': {
      gridRow: '3 / 4',
      gridColumn: '2 / 3',
      fontSize: tokens.fontSizeBase100,
      marginTop: '2px',
    },
  },
});

export interface D365FormFieldProps {
  label: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  size?: 'small' | 'medium' | 'large';
  align?: 'center' | 'top';
  info?: React.ReactNode;
}

/**
 * Campo de formulario estándar estilo Dynamics 365.
 * Extiende el componente oficial <Field orientation="horizontal"> de FluentUI v9
 * asegurando alineación horizontal de 200px fija para el label y soporte nativo
 * para validationMessage, hint y required.
 */
export const D365FormField: React.FC<D365FormFieldProps> = ({
  label,
  children,
  required = false,
  error,
  hint,
  htmlFor,
  size,
  align = 'center',
  info,
}) => {
  const styles = useStyles();
  const isTopAligned = align === 'top';

  const labelSlot = info ? (
    <InfoLabel
      required={required}
      htmlFor={htmlFor}
      size={size}
      info={
        <span style={{ whiteSpace: 'normal', maxWidth: '300px', display: 'inline-block', lineHeight: '1.4' }}>
          {info}
        </span>
      }
    >
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
    </InfoLabel>
  ) : htmlFor ? (
    ({ children: label, htmlFor } as any)
  ) : (
    (label as any)
  );

  return (
    <Field
      orientation="horizontal"
      label={labelSlot}
      required={!info && required}
      size={size}
      validationMessage={error as any}
      validationState={error ? 'error' : undefined}
      hint={hint as any}
      className={isTopAligned ? styles.fieldHorizontalTop : styles.fieldHorizontal}
    >
      {children}
    </Field>
  );
};

export default D365FormField;
