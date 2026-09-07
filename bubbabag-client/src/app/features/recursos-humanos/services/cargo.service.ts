import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CargoDto,
  CrearCargoRequest,
  ActualizarCargoRequest,
} from '../models/cargo.model';

@Injectable({
  providedIn: 'root',
})
export class CargoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/rrhh/cargos';

  getCargos(departamentoId?: string, searchTerm?: string, activo?: boolean): Observable<CargoDto[]> {
    let params = new HttpParams();

    if (departamentoId) {
      params = params.set('departamentoId', departamentoId);
    }

    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('searchTerm', searchTerm.trim());
    }

    if (activo !== undefined && activo !== null) {
      params = params.set('activo', activo.toString());
    }

    return this.http.get<CargoDto[]>(this.apiUrl, { params });
  }

  getCargo(id: string): Observable<CargoDto> {
    return this.http.get<CargoDto>(`${this.apiUrl}/${id}`);
  }

  crearCargo(request: CrearCargoRequest): Observable<string> {
    return this.http.post<string>(this.apiUrl, request);
  }

  actualizarCargo(id: string, request: ActualizarCargoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  eliminarCargo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cambiarEstado(id: string, activo: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/estado`, { activo });
  }
}
