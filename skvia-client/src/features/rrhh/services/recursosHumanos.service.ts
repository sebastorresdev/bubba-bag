import { apiClient } from '../../../services/apiClient';
import type {
  EmpleadoDto,
  CrearEmpleadoDto,
  ActualizarEmpleadoDto,
  DarDeBajaEmpleadoDto,
  CatalogosRrhhDto,
  DepartamentoDto,
  CargoDto,
  TurnoDto,
  CrearTurnoDto,
  ActualizarTurnoDto,
  MiEstadoAsistenciaHoyDto,
  RegistrarMarcacionDto,
  AsistenciaDiariaDto,
} from '../types/recursosHumanos.types';

const base = '/api/rrhh';

export const RecursosHumanosService = {
  // Catálogos
  obtenerCatalogos(): Promise<CatalogosRrhhDto> {
    return apiClient<CatalogosRrhhDto>(`${base}/catalogos`);
  },

  // Empleados
  obtenerEmpleados(params?: {
    searchTerm?: string;
    estado?: string;
    departamentoId?: string;
    cargoId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<EmpleadoDto[]> {
    const query = new URLSearchParams();
    if (params?.searchTerm) query.set('searchTerm', params.searchTerm);
    if (params?.estado) query.set('estado', params.estado);
    if (params?.departamentoId) query.set('departamentoId', params.departamentoId);
    if (params?.cargoId) query.set('cargoId', params.cargoId);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return apiClient<EmpleadoDto[]>(`${base}/empleados?${query.toString()}`);
  },

  obtenerEmpleadoPorId(id: string): Promise<EmpleadoDto> {
    return apiClient<EmpleadoDto>(`${base}/empleados/${id}`);
  },

  crearEmpleado(dto: CrearEmpleadoDto): Promise<string> {
    return apiClient<string>(`${base}/empleados`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  actualizarEmpleado(id: string, dto: ActualizarEmpleadoDto): Promise<void> {
    return apiClient<void>(`${base}/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  darDeBaja(id: string, dto: DarDeBajaEmpleadoDto): Promise<{ id: string; mensaje: string }> {
    return apiClient<{ id: string; mensaje: string }>(`${base}/empleados/${id}/baja`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  reactivar(id: string): Promise<{ id: string; mensaje: string }> {
    return apiClient<{ id: string; mensaje: string }>(`${base}/empleados/${id}/reactivar`, {
      method: 'POST',
    });
  },

  eliminarEmpleado(id: string): Promise<void> {
    return apiClient<void>(`${base}/empleados/${id}`, {
      method: 'DELETE',
    });
  },

  // Departamentos
  obtenerDepartamentos(params?: { searchTerm?: string; activo?: boolean }): Promise<DepartamentoDto[]> {
    const query = new URLSearchParams();
    if (params?.searchTerm) query.set('searchTerm', params.searchTerm);
    if (params?.activo !== undefined) query.set('activo', String(params.activo));
    return apiClient<DepartamentoDto[]>(`${base}/departamentos?${query.toString()}`);
  },

  crearDepartamento(nombre: string, descripcion?: string): Promise<string> {
    return apiClient<string>(`${base}/departamentos`, {
      method: 'POST',
      body: JSON.stringify({ nombre, descripcion }),
    });
  },

  actualizarDepartamento(id: string, nombre: string, descripcion?: string, activo: boolean = true): Promise<void> {
    return apiClient<void>(`${base}/departamentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nombre, descripcion, activo }),
    });
  },

  cambiarEstadoDepartamento(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`${base}/departamentos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  eliminarDepartamento(id: string): Promise<void> {
    return apiClient<void>(`${base}/departamentos/${id}`, {
      method: 'DELETE',
    });
  },

  // Cargos
  obtenerCargos(params?: { departamentoId?: string; searchTerm?: string; activo?: boolean }): Promise<CargoDto[]> {
    const query = new URLSearchParams();
    if (params?.departamentoId) query.set('departamentoId', params.departamentoId);
    if (params?.searchTerm) query.set('searchTerm', params.searchTerm);
    if (params?.activo !== undefined) query.set('activo', String(params.activo));
    return apiClient<CargoDto[]>(`${base}/cargos?${query.toString()}`);
  },

  crearCargo(nombre: string, departamentoId: string, salarioReferencial?: number | null): Promise<string> {
    return apiClient<string>(`${base}/cargos`, {
      method: 'POST',
      body: JSON.stringify({ nombre, departamentoId, salarioReferencial }),
    });
  },

  actualizarCargo(id: string, nombre: string, departamentoId: string, salarioReferencial?: number | null, activo: boolean = true): Promise<void> {
    return apiClient<void>(`${base}/cargos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nombre, departamentoId, salarioReferencial, activo }),
    });
  },

  cambiarEstadoCargo(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`${base}/cargos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  eliminarCargo(id: string): Promise<void> {
    return apiClient<void>(`${base}/cargos/${id}`, {
      method: 'DELETE',
    });
  },

  // Turnos y Horarios
  obtenerTurnos(params?: { searchTerm?: string; activo?: boolean }): Promise<TurnoDto[]> {
    const query = new URLSearchParams();
    if (params?.searchTerm) query.set('searchTerm', params.searchTerm);
    if (params?.activo !== undefined) query.set('activo', String(params.activo));
    return apiClient<TurnoDto[]>(`${base}/turnos?${query.toString()}`);
  },

  obtenerTurnoPorId(id: string): Promise<TurnoDto> {
    return apiClient<TurnoDto>(`${base}/turnos/${id}`);
  },

  crearTurno(dto: CrearTurnoDto): Promise<string> {
    return apiClient<string>(`${base}/turnos`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  actualizarTurno(id: string, dto: ActualizarTurnoDto): Promise<void> {
    return apiClient<void>(`${base}/turnos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  cambiarEstadoTurno(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`${base}/turnos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  eliminarTurno(id: string): Promise<void> {
    return apiClient<void>(`${base}/turnos/${id}`, {
      method: 'DELETE',
    });
  },

  // Asistencia y Marcación
  obtenerMiAsistenciaHoy(empleadoId?: string): Promise<MiEstadoAsistenciaHoyDto> {
    const query = new URLSearchParams();
    if (empleadoId) query.set('empleadoId', empleadoId);
    return apiClient<MiEstadoAsistenciaHoyDto>(`${base}/asistencia/mi-dia?${query.toString()}`);
  },

  marcarAsistencia(dto: RegistrarMarcacionDto): Promise<{ marcacionId: string; mensaje: string }> {
    return apiClient<{ marcacionId: string; mensaje: string }>(`${base}/asistencia/marcar`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  obtenerConsolidadoAsistencias(params?: {
    fechaInicio?: string;
    fechaFin?: string;
    empleadoId?: string;
    departamentoId?: string;
    estado?: number;
  }): Promise<AsistenciaDiariaDto[]> {
    const query = new URLSearchParams();
    if (params?.fechaInicio) query.set('fechaInicio', params.fechaInicio);
    if (params?.fechaFin) query.set('fechaFin', params.fechaFin);
    if (params?.empleadoId) query.set('empleadoId', params.empleadoId);
    if (params?.departamentoId) query.set('departamentoId', params.departamentoId);
    if (params?.estado !== undefined) query.set('estado', String(params.estado));
    return apiClient<AsistenciaDiariaDto[]>(`${base}/asistencia/consolidado?${query.toString()}`);
  },
};
