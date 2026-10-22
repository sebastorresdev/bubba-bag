import React from 'react';
import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  makeStyles,
} from '@fluentui/react-components';
import {
  Share16Regular,
  ChevronDown12Regular,
  Mail16Regular,
} from '@fluentui/react-icons';
import { WhatsAppIcon } from './WhatsAppIcon';

const useStyles = makeStyles({
  button: {
    fontWeight: 600,
  },
  chevron: {
    marginLeft: '6px',
    verticalAlign: 'middle',
  },
});

export interface D365CompartirButtonProps {
  onCompartirWhatsApp?: () => void;
  onCompartirCorreo?: () => void;
  disabled?: boolean;
  correoData?: {
    destinatario?: string;
    email?: string;
    subject: string;
    body: string;
  };
  ariaLabel?: string;
  className?: string;
}

export const D365CompartirButton: React.FC<D365CompartirButtonProps> = ({
  onCompartirWhatsApp,
  onCompartirCorreo,
  disabled = false,
  correoData,
  ariaLabel = 'Opciones para compartir documento',
  className,
}) => {
  const styles = useStyles();

  const handleCorreo = () => {
    if (onCompartirCorreo) {
      onCompartirCorreo();
      return;
    }
    if (correoData) {
      const mailto = `mailto:${correoData.email || ''}?subject=${encodeURIComponent(correoData.subject)}&body=${encodeURIComponent(correoData.body)}`;
      window.location.href = mailto;
    }
  };

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Button
          appearance="primary"
          icon={<Share16Regular />}
          iconPosition="before"
          disabled={disabled}
          aria-label={ariaLabel}
          className={`${styles.button} ${className || ''}`.trim()}
        >
          Compartir
          <ChevronDown12Regular className={styles.chevron} />
        </Button>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem
            icon={<Mail16Regular />}
            onClick={handleCorreo}
          >
            Por correo
          </MenuItem>
          <MenuItem
            icon={<WhatsAppIcon size={16} />}
            onClick={onCompartirWhatsApp}
          >
            WhatsApp
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

export default D365CompartirButton;
