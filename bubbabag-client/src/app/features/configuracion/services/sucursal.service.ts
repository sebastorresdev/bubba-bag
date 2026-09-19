import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SucursalDto,
  CrearSucursalRequest,
  ActualizarSucursalRequest,
} from '../models/sucursal.model';

@Injectable({
  providedIn: 'root',
})
export class SucursalService {
  private http = inject(HttpClient);
  private apiUrl = '/api/configuracion/sucursales';

  getSucursales(search?: string, soloActivos?: boolean): Observable<SucursalDto[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }
    return this.http.get<SucursalDto[]>(this.apiUrl, { params });
  }

  getSucursalById(id: string): Observable<SucursalDto> {
    return this.http.get<SucursalDto>(`${this.apiUrl}/${id}`);
  }

  crearSucursal(req: CrearSucursalRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, req);
  }

  actualizarSucursal(id: string, req: ActualizarSucursalRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, req);
  }

  cambiarEstado(id: string, activo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, { activo });
  }
}
