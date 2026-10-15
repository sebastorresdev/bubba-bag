import React from 'react';
import { Field, InfoLabel, makeStyles, tokens, useId } from '@fluentui/react-components';

const useStyles = makeStyles({
  fieldHorizontal: {
    flexShrink: 0,
    display: 'grid',
    gridTemplateColumns: '150px minmax(0, 1fr)',
    gridTemplateRows: 'auto auto auto',
    alignItems: 'center',
    columnGap: '12px',
    rowGap: '4px',
    minHeight: '34px',
    padding: '2px 0',
    width: '100%',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: '135px minmax(0, 1fr)',
      columnGap: '10px',
    },
    '@media (max-width: 900px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      rowGap: '4px',
    },
    '& .fui-Field__label': {
      gridRowStart: 1,
      gridRowEnd: 2,
      gridColumn: '1 / 2',
      alignSelf: 'center',
      width: '150px',
      minWidth: '150px',
      maxWidth: '150px',
      fontSize: tokens.fontSizeBase200,
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground2,
      margin: 0,
      padding: 0,
      lineHeight: '1.25',
      '@media (max-width: 1200px)': {
        width: '135px',
        minWidth: '135px',
        maxWidth: '135px',
      },
      '@media (max-width: 900px)': {
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        paddingBottom: '2px',
      },
    },
    '& > :not(.fui-Field__label):not(.fui-Field__validationMessage):not(.fui-Field__hint)': {
      gridRowStart: 1,
      gridRowEnd: 2,
      gridColumn: '2 / 3',
      alignSelf: 'center',
      width: '100%',
      minWidth: 0,
      '@media (max-width: 900px)': {
        gridRowStart: 2,
        gridRowEnd: 3,
        gridColumn: '1 / 2',
      },
    },
    '& .fui-Field__validationMessage': {
      gridRow: '2 / 3',
      gridColumn: '2 / 3',
      fontSize: tokens.fontSizeBase200,
      marginTop: '2px',
      '@media (max-width: 900px)': {
        gridRow: '3 / 4',
        gridColumn: '1 / 2',
      },
    },
    '& .fui-Field__hint': {
      gridRow: '3 / 4',
      gridColumn: '2 / 3',
      fontSize: tokens.fontSizeBase200,
      marginTop: '2px',
      '@media (max-width: 900px)': {
        gridRow: '4 / 5',
        gridColumn: '1 / 2',
      },
    },
  },
  fieldHorizontalTop: {
    flexShrink: 0,
    display: 'grid',
    gridTemplateColumns: '150px minmax(0, 1fr)',
    gridTemplateRows: 'auto auto auto',
    alignItems: 'start',
    columnGap: '12px',
    rowGap: '4px',
    padding: '4px 0',
    width: '100%',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: '135px minmax(0, 1fr)',
      columnGap: '10px',
    },
    '@media (max-width: 900px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      rowGap: '4px',
    },
    '& .fui-Field__label': {
      gridRowStart: 1,
      gridRowEnd: 2,
      gridColumn: '1 / 2',
      alignSelf: 'start',
      width: '150px',
      minWidth: '150px',
      maxWidth: '150px',
      fontSize: tokens.fontSizeBase200,
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground2,
      paddingTop: '6px',
      margin: 0,
      lineHeight: '1.25',
      '@media (max-width: 1200px)': {
        width: '135px',
        minWidth: '135px',
        maxWidth: '135px',
      },
      '@media (max-width: 900px)': {
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        paddingTop: 0,
        paddingBottom: '2px',
      },
    },
    '& > :not(.fui-Field__label):not(.fui-Field__validationMessage):not(.fui-Field__hint)': {
      gridRowStart: 1,
      gridRowEnd: 2,
      gridColumn: '2 / 3',
      alignSelf: 'start',
      width: '100%',
      minWidth: 0,
      '@media (max-width: 900px)': {
        gridRowStart: 2,
        gridRowEnd: 3,
        gridColumn: '1 / 2',
      },
    },
    '& .fui-Field__validationMessage': {
      gridRow: '2 / 3',
      gridColumn: '2 / 3',
      fontSize: tokens.fontSizeBase200,
      marginTop: '2px',
      '@media (max-width: 900px)': {
        gridRow: '3 / 4',
        gridColumn: '1 / 2',
      },
    },
    '& .fui-Field__hint': {
      gridRow: '3 / 4',
      gridColumn: '2 / 3',
      fontSize: tokens.fontSizeBase200,
      marginTop: '2px',
      '@media (max-width: 900px)': {
        gridRow: '4 / 5',
        gridColumn: '1 / 2',
      },
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
  const generatedId = useId('field');
  const child = React.isValidElement<{ id?: string }>(children) ? children : null;
  const controlId = htmlFor ?? child?.props.id ?? generatedId;
  const isTopAligned = align === 'top';

  const labelSlot = info ? (
    <InfoLabel
      required={required}
      htmlFor={controlId}
      size={size}
      info={
        <span style={{ whiteSpace: 'normal', maxWidth: '300px', display: 'inline-block', lineHeight: '1.4' }}>
          {info}
        </span>
      }
    >
      <span style={{ whiteSpace: 'normal' }}>{label}</span>
    </InfoLabel>
  ) : htmlFor ? (
    ({ children: label, htmlFor } as any)
  ) : (
    (label as any)
  );

  return (
    <Field
      data-field-label={typeof label === 'string' ? label : undefined}
      orientation="horizontal"
      label={labelSlot}
      required={!info && required}
      size={size}
      validationMessage={error as any}
      validationState={error ? 'error' : undefined}
      hint={hint as any}
      className={`d365-form-field ${isTopAligned ? styles.fieldHorizontalTop : styles.fieldHorizontal}`}
    >
      {info && child ? React.cloneElement(child, { id: controlId }) : children}
    </Field>
  );
};

export default D365FormField;
