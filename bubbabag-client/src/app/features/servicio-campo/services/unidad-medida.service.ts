import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UnidadMedidaDto,
  CrearUnidadMedidaRequest,
  ActualizarUnidadMedidaRequest,
} from '../models/catalogo-producto.model';

@Injectable({
  providedIn: 'root',
})
export class UnidadMedidaService {
  private http = inject(HttpClient);
  private apiUrl = '/api/inventario/unidades-medida';

  getUnidadesMedida(
    soloActivos?: boolean,
    search?: string
  ): Observable<UnidadMedidaDto[]> {
    let params = new HttpParams();
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    return this.http.get<UnidadMedidaDto[]>(this.apiUrl, { params });
  }

  getUnidadMedidaById(id: string): Observable<UnidadMedidaDto> {
    return this.http.get<UnidadMedidaDto>(`${this.apiUrl}/${id}`);
  }

  crearUnidadMedida(request: CrearUnidadMedidaRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, request);
  }

  actualizarUnidadMedida(id: string, request: ActualizarUnidadMedidaRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  cambiarEstado(id: string, activo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, { activo });
  }
}
