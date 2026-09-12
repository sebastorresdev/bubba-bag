import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ClienteListadoItemDto,
  ClienteDetalleDto,
  CrearClienteCommand,
  ActualizarClienteRequest,
} from '../models/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private http = inject(HttpClient);
  private apiUrl = '/api/crm/clientes';

  getClientes(
    search?: string,
    soloFacturacion?: boolean,
    soloServicio?: boolean,
    soloActivos?: boolean
  ): Observable<ClienteListadoItemDto[]> {
    let params = new HttpParams();

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    if (soloFacturacion !== undefined && soloFacturacion !== null) {
      params = params.set('soloFacturacion', soloFacturacion.toString());
    }
    if (soloServicio !== undefined && soloServicio !== null) {
      params = params.set('soloServicio', soloServicio.toString());
    }
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }

    return this.http.get<ClienteListadoItemDto[]>(this.apiUrl, { params });
  }

  getClientePorId(id: string): Observable<ClienteDetalleDto> {
    return this.http.get<ClienteDetalleDto>(`${this.apiUrl}/${id}`);
  }

  crearCliente(command: CrearClienteCommand): Observable<{ id: string; message: string }> {
    return this.http.post<{ id: string; message: string }>(this.apiUrl, command);
  }

  actualizarCliente(id: string, request: ActualizarClienteRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, request);
  }

  cambiarEstado(id: string, activo: boolean): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/estado`, { activo });
  }
}
