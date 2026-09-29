import React, { cloneElement, type ReactElement, type ReactNode } from 'react';
import { makeStyles, Spinner, Toolbar, ToolbarButton, ToolbarDivider, tokens } from '@fluentui/react-components';
import { semanticTokens } from '../../styles/semanticTokens';

const useStyles = makeStyles({
  root: {
    minHeight: '44px',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    padding: '0 8px',
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  toolbar: {
    minHeight: '44px',
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
  },
  trailing: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexShrink: 0,
  },
  saveIcon: { color: tokens.colorPaletteLilacBorderActive },
  createIcon: { color: semanticTokens.status.success },
  dangerIcon: { color: tokens.colorStatusDangerForeground1 },
  brandIcon: { color: tokens.colorBrandForeground1 },
});

export interface D365CommandBarProps {
  ariaLabel: string;
  children: ReactNode;
  trailing?: ReactNode;
  busy?: boolean;
  busyLabel?: string;
  className?: string;
}

export const D365CommandBar: React.FC<D365CommandBarProps> = ({
  ariaLabel,
  children,
  trailing,
  busy = false,
  busyLabel = 'Procesando...',
  className,
}) => {
  const styles = useStyles();

  return (
    <div className={className ? `${styles.root} ${className}` : styles.root}>
      <Toolbar aria-label={ariaLabel} className={styles.toolbar} size="medium">
        {children}
      </Toolbar>
      {(trailing || busy) && (
        <div className={styles.trailing}>
          {trailing}
          {busy && <Spinner size="tiny" label={busyLabel} />}
        </div>
      )}
    </div>
  );
};

export type D365CommandTone = 'default' | 'save' | 'create' | 'danger' | 'brand';

export interface D365CommandButtonProps {
  children?: ReactNode;
  icon?: ReactNode;
  tone?: D365CommandTone;
  appearance?: 'primary' | 'outline' | 'subtle' | 'transparent';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
  className?: string;
  'aria-label'?: string;
}

export const D365CommandButton: React.FC<D365CommandButtonProps> = ({
  icon,
  tone = 'default',
  ...buttonProps
}) => {
  const styles = useStyles();
  const toneClass = {
    default: undefined,
    save: styles.saveIcon,
    create: styles.createIcon,
    danger: styles.dangerIcon,
    brand: styles.brandIcon,
  }[tone];

  const iconElement = React.isValidElement(icon) ? icon as ReactElement<{ className?: string }> : undefined;
  const styledIcon = iconElement && toneClass
    ? cloneElement(iconElement, {
        className: [iconElement.props.className, toneClass].filter(Boolean).join(' '),
      })
    : icon;

  const FlexibleToolbarButton = ToolbarButton as React.ComponentType<any>;
  return <FlexibleToolbarButton {...buttonProps} icon={styledIcon} />;
};

export const D365CommandDivider: React.FC = () => {
  return <ToolbarDivider />;
};

export default D365CommandBar;
