export type CommandIconColor =
  | 'default'
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'purple'
  | 'neutral'
  | string;

export interface CommandBarItem {
  /** Identificador único del comando */
  key: string;
  /** Texto que se muestra en el botón */
  label?: string;
  /** Nombre del icono de NG-ZORRO (ej. 'plus', 'delete', 'reload', etc.) */
  icon?: string;
  /** Color semántico ('primary', 'success', 'danger', 'warning', 'purple', 'neutral', 'default') o código CSS */
  iconColor?: CommandIconColor;
  /** Si es true, solo muestra el icono sin texto */
  iconOnly?: boolean;
  /** Apariencia visual del botón: 'subtle' (por defecto, plano) o 'primary' (relleno sólido como Share en D365) */
  appearance?: 'subtle' | 'primary';
  /** Si es true, se renderiza con el estilo de acción primaria */
  primary?: boolean;
  /** Si es true, marca una acción destructiva */
  danger?: boolean;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Texto de ayuda al pasar el cursor (tooltip) */
  tooltip?: string;
  /** Si actúa como divisor vertical separador */
  isDivider?: boolean;
  /** Sub-opciones para desplegar un menú dropdown */
  children?: CommandBarItem[];
  /** Si es true y tiene children, se convierte en un Split Button (botón principal + flecha desplegable) */
  split?: boolean;
  /** Configuración opcional para confirmación emergente (popconfirm) */
  popconfirm?: {
    title: string;
    okText?: string;
    cancelText?: string;
    okDanger?: boolean;
    onConfirm: () => void;
  };
  /** Callback opcional de acción (se recomienda preferir el output (itemClick) del CommandBar) */
  execute?: (item: CommandBarItem) => void;
  /** Alias opcional de execute */
  action?: (item: CommandBarItem) => void;
  /** Si debe ocultarse visualmente */
  hidden?: boolean;
}
