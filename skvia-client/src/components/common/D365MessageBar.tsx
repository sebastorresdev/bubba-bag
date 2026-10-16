import React, { type ReactNode } from 'react';
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  type MessageBarProps,
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';

export interface D365MessageBarProps {
  intent: NonNullable<MessageBarProps['intent']>;
  children: ReactNode;
  title?: ReactNode;
  onDismiss?: () => void;
  actions?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const defaultTitles: Record<NonNullable<MessageBarProps['intent']>, string> = {
  success: 'Operación completada',
  error: 'No se pudo completar la operación',
  warning: 'Aviso',
  info: 'Información',
};

export const D365MessageBar: React.FC<D365MessageBarProps> = ({
  intent,
  children,
  title,
  onDismiss,
  actions,
  className,
  style,
}) => (
  <MessageBar role={intent === 'error' ? 'alert' : 'status'} intent={intent} shape="square" className={className} style={style}>
    <MessageBarBody>
      <MessageBarTitle>{title ?? defaultTitles[intent]}</MessageBarTitle>
      {children}
    </MessageBarBody>
    {(actions || onDismiss) && (
      <MessageBarActions
        containerAction={
          onDismiss ? (
            <Button
              appearance="transparent"
              aria-label="Cerrar notificación"
              icon={<DismissRegular />}
              onClick={onDismiss}
            />
          ) : undefined
        }
      >
        {actions}
      </MessageBarActions>
    )}
  </MessageBar>
);

export default D365MessageBar;
