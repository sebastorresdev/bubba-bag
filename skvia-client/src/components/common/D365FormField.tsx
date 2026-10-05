import React from 'react';
import { InfoLabel, Label, Text } from '@fluentui/react-components';
import { useD365FormStyles } from '../../styles/d365FormStyles';

export interface D365FormFieldProps {
  label: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
  error?: React.ReactNode;
  htmlFor?: string;
  size?: 'small' | 'medium' | 'large';
  align?: 'center' | 'top';
  info?: React.ReactNode;
}

/** Shared Dynamics-style label, control, and validation layout for entity forms. */
export const D365FormField: React.FC<D365FormFieldProps> = ({
  label,
  children,
  required = false,
  error,
  htmlFor,
  size,
  align = 'center',
  info,
}) => {
  const styles = useD365FormStyles();
  const isTopAligned = align === 'top';

  return (
    <div className={isTopAligned ? styles.d365FieldRowTop : styles.d365FieldRow}>
      <div className={isTopAligned ? styles.d365LabelColTop : styles.d365LabelCol}>
        {info ? (
          <InfoLabel required={required} htmlFor={htmlFor} size={size} info={info}>
            {label}
          </InfoLabel>
        ) : (
          <Label required={required} htmlFor={htmlFor} size={size}>
            {label}
          </Label>
        )}
      </div>
      <div className={styles.d365ControlCol}>
        {children}
        {error && <Text className={styles.fieldErrorText}>{error}</Text>}
      </div>
    </div>
  );
};

export default D365FormField;
