import React, { cloneElement, createContext, useContext, type ReactElement, type ReactNode } from 'react';
import { Button, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, makeStyles, Spinner, Toolbar, ToolbarButton, ToolbarDivider, tokens } from '@fluentui/react-components';
import { MoreHorizontal20Regular } from '@fluentui/react-icons';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { semanticTokens } from '../../styles/semanticTokens';

const BusyContext = createContext(false);

function flattenCommands(children: ReactNode): ReactNode[] {
  return React.Children.toArray(children).flatMap(child => {
    if (React.isValidElement<{ children?: ReactNode }>(child) && (child.type === 'div' || child.type === React.Fragment)) return flattenCommands(child.props.children);
    return [child];
  });
}

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
    '@media (max-width: 767px)': { flexWrap: 'wrap' },
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
    '@media (max-width: 767px)': { flexWrap: 'wrap', gap: '4px', padding: '4px 0' },
  },
  trailing: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexShrink: 0,
    '@media (max-width: 767px)': { width: '100%', minWidth: 0, flexWrap: 'wrap', paddingBottom: '4px' },
  },
  saveIcon: { color: tokens.colorBrandForeground1 },
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
  const isMobile = useIsMobile(768);
  const commands = isMobile ? flattenCommands(children) : [];
  const buttons = commands.filter((child): child is ReactElement<D365CommandButtonProps> => React.isValidElement(child) && child.type === D365CommandButton);
  const primary = buttons.find(child => child.props.tone === 'save' || child.props.tone === 'create' || child.props.appearance === 'primary') ?? buttons.find(child => child.props.children);
  const overflow = buttons.filter(child => child !== primary && !!child.props.children);
  const mobileCommands = commands.filter(child => !overflow.includes(child as ReactElement<D365CommandButtonProps>) && !(React.isValidElement(child) && child.type === D365CommandDivider));

  return (
    <BusyContext.Provider value={busy}>
    <div aria-busy={busy} className={className ? `${styles.root} ${className}` : styles.root}>
      <Toolbar aria-label={ariaLabel} className={styles.toolbar} size="medium">
        {isMobile ? mobileCommands : children}
        {isMobile && overflow.length > 0 && <Menu>
          <MenuTrigger disableButtonEnhancement><Button appearance="subtle" icon={<MoreHorizontal20Regular />} aria-label="Más acciones" disabled={busy}>Más</Button></MenuTrigger>
          <MenuPopover><MenuList>
            {overflow.map((child, index) => <MenuItem key={child.key ?? index} icon={child.props.icon as ReactElement | undefined} disabled={busy || child.props.disabled} onClick={event => child.props.onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>)}>{child.props.children}</MenuItem>)}
          </MenuList></MenuPopover>
        </Menu>}
      </Toolbar>
      {(trailing || busy) && (
        <div className={styles.trailing}>
          {trailing}
          {busy && <Spinner size="tiny" label={busyLabel} />}
        </div>
      )}
    </div>
    </BusyContext.Provider>
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
  const busy = useContext(BusyContext);
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
  return <FlexibleToolbarButton {...buttonProps} disabled={busy || buttonProps.disabled} icon={styledIcon} />;
};

export const D365CommandDivider: React.FC = () => {
  return <ToolbarDivider />;
};

export default D365CommandBar;
