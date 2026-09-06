export interface CommandBarItem {
  /** Identificador único del comando */
  key: string;
  /** Texto que se muestra en el botón */
  label?: string;
  /** Nombre del icono de NG-ZORRO (ej. 'plus', 'delete', 'reload', etc.) */
  icon?: string;
  /** Si es true, solo muestra el icono sin texto */
  iconOnly?: boolean;
  /** Si es true, se renderiza con el estilo de acción primaria (fondo azul D365) */
  primary?: boolean;
  /** Si es true, se renderiza con estilo destructivo (rojo tenue) */
  danger?: boolean;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Texto de ayuda al pasar el cursor (tooltip) */
  tooltip?: string;
  /** Si actúa como divisor vertical separador */
  isDivider?: boolean;
  /** Sub-opciones para desplegar un menú dropdown */
  children?: CommandBarItem[];
  /** Acción a ejecutar al hacer clic */
  execute?: (item: CommandBarItem) => void;
  /** Si debe ocultarse visualmente */
  hidden?: boolean;
}
