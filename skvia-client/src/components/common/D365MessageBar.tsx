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
  className?: string;
}

const defaultTitles: Record<NonNullable<MessageBarProps['intent']>, string> = {
  success: 'Éxito',
  error: 'Atención',
  warning: 'Aviso',
  info: 'Información',
};

export const D365MessageBar: React.FC<D365MessageBarProps> = ({
  intent,
  children,
  title,
  onDismiss,
  className,
}) => (
  <MessageBar intent={intent} shape="square" className={className}>
    <MessageBarBody>
      <MessageBarTitle>{title ?? defaultTitles[intent]}</MessageBarTitle>
      {children}
    </MessageBarBody>
    {onDismiss && (
      <MessageBarActions
        containerAction={
          <Button
            appearance="transparent"
            aria-label="Cerrar notificación"
            icon={<DismissRegular />}
            onClick={onDismiss}
          />
        }
      />
    )}
  </MessageBar>
);

export default D365MessageBar;
