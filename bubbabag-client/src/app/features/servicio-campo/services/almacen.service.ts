import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AlmacenDto,
  CrearAlmacenRequest,
  ActualizarAlmacenRequest,
  TipoAlmacen,
} from '../models/almacen.model';

@Injectable({
  providedIn: 'root',
})
export class AlmacenService {
  private http = inject(HttpClient);
  private apiUrl = '/api/inventario/almacenes';

  getAlmacenes(
    tipo?: TipoAlmacen,
    sucursalId?: string,
    soloActivos?: boolean
  ): Observable<AlmacenDto[]> {
    let params = new HttpParams();
    if (tipo) params = params.set('tipo', tipo);
    if (sucursalId) params = params.set('sucursalId', sucursalId);
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }
    return this.http.get<AlmacenDto[]>(this.apiUrl, { params });
  }

  getAlmacenById(id: string): Observable<AlmacenDto> {
    return this.http.get<AlmacenDto>(`${this.apiUrl}/${id}`);
  }

  crearAlmacen(request: CrearAlmacenRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, request);
  }

  actualizarAlmacen(id: string, request: ActualizarAlmacenRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  cambiarEstado(id: string, activo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, { activo });
  }

  getStockTecnicos(soloActivos: boolean = true): Observable<import('../models/almacen.model').ResumenAlmacenMovilDto[]> {
    let params = new HttpParams().set('soloActivos', soloActivos.toString());
    return this.http.get<import('../models/almacen.model').ResumenAlmacenMovilDto[]>('/api/inventario/stock/tecnicos', { params });
  }
}

