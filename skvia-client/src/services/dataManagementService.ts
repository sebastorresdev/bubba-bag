import { apiClient, getValidAuthToken } from './apiClient';

export interface EntityFieldDescriptor {
  systemName: string;
  displayName: string;
  isRequired: boolean;
  isPrimary: boolean;
  type: string;
  options?: string[];
  lookupTarget?: string;
  synonyms: string[];
}

export interface EntityImportDescriptor {
  entityName: string;
  displayName: string;
  description: string;
  iconName: string;
  primaryKeyField: string;
  fields: EntityFieldDescriptor[];
}

export interface FilePreviewResult {
  fileName: string;
  fileSizeBytes: number;
  detectedDelimiter: string;
  detectedQuoteChar: string;
  hasHeader: boolean;
  headers: string[];
  sampleRows: string[][];
  totalEstimatedRows: number;
}

export interface DataImportJobError {
  id: string;
  fila: number;
  claveIdentificador?: string;
  columna?: string;
  mensaje: string;
  valorOriginal?: string;
}

export interface DataImportJob {
  id: string;
  nombreArchivo: string;
  tipoRegistro: string;
  tamanoBytes: number;
  estado: string; // "Completado", "ConErrores", "Fallido", "Procesando"
  modoDuplicados: string; // "Upsert", "Skip", "Error"
  permitirDuplicados: boolean;
  creadoPor: string;
  fechaCreacion: string;
  fechaFinalizacion?: string;
  totalProcesados: number;
  totalExitosos: number;
  totalFallidos: number;
  totalParciales: number;
  mapeoCampos?: Record<string, string>;
  errores: DataImportJobError[];
}

export const dataManagementService = {
  // 1. Obtener catálogo de entidades importables
  async getImportableEntities(): Promise<EntityImportDescriptor[]> {
    return apiClient<EntityImportDescriptor[]>('/api/servicio-campo/data-management/entities');
  },

  // 2. Previsualizar archivo y detectar delimitadores
  async previewImportFile(
    file: File,
    options?: { delimiter?: string; quoteChar?: string; hasHeader?: boolean }
  ): Promise<FilePreviewResult> {
    const token = await getValidAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const queryParams = new URLSearchParams();
    if (options?.delimiter) queryParams.append('delimiter', options.delimiter);
    if (options?.quoteChar) queryParams.append('quoteChar', options.quoteChar);
    if (options?.hasHeader !== undefined) queryParams.append('hasHeader', String(options.hasHeader));

    const url = `/api/servicio-campo/data-management/preview?${queryParams.toString()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.mensaje || err.detail || 'Error al previsualizar el archivo.');
    }

    return res.json();
  },

  // 3. Ejecutar importación con mapeo dinámico
  async executeImport(
    file: File,
    params: {
      entityName: string;
      duplicateMode: string;
      delimiter?: string;
      quoteChar?: string;
      columnMapping: Record<string, string>;
    }
  ): Promise<DataImportJob> {
    const token = await getValidAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityName', params.entityName);
    formData.append('duplicateMode', params.duplicateMode);
    if (params.delimiter) formData.append('delimiter', params.delimiter);
    if (params.quoteChar) formData.append('quoteChar', params.quoteChar);
    formData.append('creadoPor', 'Sebastián Torres');
    formData.append('columnMappingJson', JSON.stringify(params.columnMapping));

    const queryParams = new URLSearchParams({ entityName: params.entityName });
    const url = `/api/servicio-campo/data-management/execute?${queryParams.toString()}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.mensaje || err.detail || 'Error al ejecutar la importación.');
    }

    return res.json();
  },

  // 4. Historial de importaciones
  async getImportJobs(limit: number = 50): Promise<DataImportJob[]> {
    return apiClient<DataImportJob[]>(`/api/servicio-campo/data-management/imports?limit=${limit}`, { method: 'GET' });
  },

  // 5. Detalle de una importación
  async getImportJobById(id: string): Promise<DataImportJob> {
    return apiClient<DataImportJob>(`/api/servicio-campo/data-management/imports/${id}`, { method: 'GET' });
  },

  // 6. Eliminar registro de importación
  async deleteImportJob(id: string): Promise<void> {
    return apiClient<void>(`/api/servicio-campo/data-management/imports/${id}`, { method: 'DELETE' });
  },
};
