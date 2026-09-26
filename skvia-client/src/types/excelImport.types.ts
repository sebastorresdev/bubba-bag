export interface ImportarErrorDto {
  fila: number;
  codigo?: string;
  mensaje: string;
}

export interface ImportarExcelResultadoDto {
  totalFilas: number;
  creados: number;
  actualizados: number;
  errores: ImportarErrorDto[];
  exitoso: boolean;
}
