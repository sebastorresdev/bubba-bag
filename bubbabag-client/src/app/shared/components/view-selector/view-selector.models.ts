export interface VistaItem {
  id?: string;
  key: string;               // Identificador único o clave del sistema (ej: 'Activos', 'Todos')
  nombre: string;            // Nombre para mostrar
  descripcion?: string;      // Descripción opcional
  esSistema: boolean;        // true si es provista por el módulo, false si la creó el usuario
  esPredeterminada?: boolean; // true si es la vista que debe abrirse por defecto
  configuracion?: any;       // Filtros, búsqueda u ordenamiento guardado
}

export interface GuardarVistaDto {
  entidad: string;
  nombre: string;
  descripcion?: string;
  configuracionJson: string;
  esPredeterminada: boolean;
}

export interface EstablecerPredeterminadaDto {
  entidad: string;
  vistaId?: string;
  vistaKey?: string;
}
