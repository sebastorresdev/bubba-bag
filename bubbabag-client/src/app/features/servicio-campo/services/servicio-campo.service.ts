import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MotivoIncidenciaDto,
  CrearMotivoIncidenciaCommand,
  ActualizarMotivoIncidenciaRequest,
  AmbitoMotivo,
  TipoOrdenTrabajoDto,
  CrearTipoOrdenTrabajoCommand,
  ActualizarTipoOrdenTrabajoRequest,
  TipoTareaServicioDto,
  CrearTipoTareaServicioCommand,
  ActualizarTipoTareaServicioRequest,
  CambiarEstadoCatalogoRequest,
} from '../models/servicio-campo-catalogos.model';

@Injectable({
  providedIn: 'root',
})
export class ServicioCampoService {
  private http = inject(HttpClient);
  private baseUrl = '/api/serviciocampo/catalogos';

  // =========================================================================
  // 1. MOTIVOS DE INCIDENCIA
  // =========================================================================
  getMotivosIncidencia(
    ambito?: AmbitoMotivo,
    soloActivos?: boolean,
    search?: string
  ): Observable<MotivoIncidenciaDto[]> {
    let params = new HttpParams();
    if (ambito !== undefined && ambito !== null) {
      params = params.set('ambito', ambito.toString());
    }
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    return this.http.get<MotivoIncidenciaDto[]>(`${this.baseUrl}/motivos-incidencia`, { params });
  }

  getMotivoIncidenciaPorId(id: string): Observable<MotivoIncidenciaDto> {
    return this.http.get<MotivoIncidenciaDto>(`${this.baseUrl}/motivos-incidencia/${id}`);
  }

  crearMotivoIncidencia(command: CrearMotivoIncidenciaCommand): Observable<{ id: string; message: string }> {
    return this.http.post<{ id: string; message: string }>(`${this.baseUrl}/motivos-incidencia`, command);
  }

  actualizarMotivoIncidencia(id: string, request: ActualizarMotivoIncidenciaRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/motivos-incidencia/${id}`, request);
  }

  cambiarEstadoMotivoIncidencia(id: string, activo: boolean): Observable<{ message: string }> {
    const request: CambiarEstadoCatalogoRequest = { activo };
    return this.http.patch<{ message: string }>(`${this.baseUrl}/motivos-incidencia/${id}/estado`, request);
  }

  // =========================================================================
  // 2. TIPOS DE ORDEN DE TRABAJO (Modalidad Operativa)
  // =========================================================================
  getTiposOrden(
    soloActivos?: boolean,
    search?: string
  ): Observable<TipoOrdenTrabajoDto[]> {
    let params = new HttpParams();
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    return this.http.get<TipoOrdenTrabajoDto[]>(`${this.baseUrl}/tipos-orden`, { params });
  }

  getTipoOrdenPorId(id: string): Observable<TipoOrdenTrabajoDto> {
    return this.http.get<TipoOrdenTrabajoDto>(`${this.baseUrl}/tipos-orden/${id}`);
  }

  crearTipoOrden(command: CrearTipoOrdenTrabajoCommand): Observable<{ id: string; message: string }> {
    return this.http.post<{ id: string; message: string }>(`${this.baseUrl}/tipos-orden`, command);
  }

  actualizarTipoOrden(id: string, request: ActualizarTipoOrdenTrabajoRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/tipos-orden/${id}`, request);
  }

  cambiarEstadoTipoOrden(id: string, activo: boolean): Observable<{ message: string }> {
    const request: CambiarEstadoCatalogoRequest = { activo };
    return this.http.patch<{ message: string }>(`${this.baseUrl}/tipos-orden/${id}/estado`, request);
  }

  // =========================================================================
  // 3. TIPOS DE TAREA DE SERVICIO (Catálogo de Prestaciones por Cliente)
  // =========================================================================
  getTiposTarea(
    clienteFacturacionId?: string,
    soloActivos?: boolean,
    search?: string
  ): Observable<TipoTareaServicioDto[]> {
    let params = new HttpParams();
    if (clienteFacturacionId && clienteFacturacionId.trim() !== '') {
      params = params.set('clienteFacturacionId', clienteFacturacionId.trim());
    }
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    return this.http.get<TipoTareaServicioDto[]>(`${this.baseUrl}/tipos-tarea`, { params });
  }

  getTipoTareaPorId(id: string): Observable<TipoTareaServicioDto> {
    return this.http.get<TipoTareaServicioDto>(`${this.baseUrl}/tipos-tarea/${id}`);
  }

  crearTipoTarea(command: CrearTipoTareaServicioCommand): Observable<{ id: string; message: string }> {
    return this.http.post<{ id: string; message: string }>(`${this.baseUrl}/tipos-tarea`, command);
  }

  actualizarTipoTarea(id: string, request: ActualizarTipoTareaServicioRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/tipos-tarea/${id}`, request);
  }

  cambiarEstadoTipoTarea(id: string, activo: boolean): Observable<{ message: string }> {
    const request: CambiarEstadoCatalogoRequest = { activo };
    return this.http.patch<{ message: string }>(`${this.baseUrl}/tipos-tarea/${id}/estado`, request);
  }
}
