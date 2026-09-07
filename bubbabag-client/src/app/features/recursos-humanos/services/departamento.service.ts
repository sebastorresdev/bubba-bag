import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DepartamentoDto,
  CrearDepartamentoRequest,
  ActualizarDepartamentoRequest,
  CambiarEstadoRequest,
} from '../models/departamento.model';

@Injectable({
  providedIn: 'root',
})
export class DepartamentoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/rrhh/departamentos';

  getDepartamentos(searchTerm?: string, activo?: boolean): Observable<DepartamentoDto[]> {
    let params = new HttpParams();

    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('searchTerm', searchTerm.trim());
    }

    if (activo !== undefined && activo !== null) {
      params = params.set('activo', activo.toString());
    }

    return this.http.get<DepartamentoDto[]>(this.apiUrl, { params });
  }

  getDepartamento(id: string): Observable<DepartamentoDto> {
    return this.http.get<DepartamentoDto>(`${this.apiUrl}/${id}`);
  }

  crearDepartamento(request: CrearDepartamentoRequest): Observable<string> {
    return this.http.post<string>(this.apiUrl, request);
  }

  actualizarDepartamento(id: string, request: ActualizarDepartamentoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  eliminarDepartamento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cambiarEstado(id: string, activo: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/estado`, { activo });
  }
}
