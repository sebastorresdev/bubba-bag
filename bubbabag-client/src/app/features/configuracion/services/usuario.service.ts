import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UsuarioDto,
  RolDto,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest,
  CambiarPasswordRequest,
  CambiarEstadoUsuarioRequest,
} from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = '/api/seguridad';

  getUsuarios(busqueda?: string, soloActivos?: boolean): Observable<UsuarioDto[]> {
    let params = new HttpParams();
    if (busqueda) {
      params = params.set('busqueda', busqueda);
    }
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }
    return this.http.get<UsuarioDto[]>(`${this.apiUrl}/usuarios`, { params });
  }

  getUsuarioById(id: string): Observable<UsuarioDto> {
    return this.http.get<UsuarioDto>(`${this.apiUrl}/usuarios/${id}`);
  }

  getRoles(): Observable<RolDto[]> {
    return this.http.get<RolDto[]>(`${this.apiUrl}/roles`);
  }

  crearUsuario(req: CrearUsuarioRequest): Observable<{ usuarioId: string }> {
    return this.http.post<{ usuarioId: string }>(`${this.apiUrl}/usuarios`, req);
  }

  actualizarUsuario(id: string, req: ActualizarUsuarioRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/usuarios/${id}`, req);
  }

  cambiarEstado(id: string, esActivo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/usuarios/${id}/estado`, { esActivo });
  }

  cambiarPassword(id: string, nuevaPassword: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/usuarios/${id}/password`, { nuevaPassword });
  }

  asignarRoles(id: string, roles: string[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/usuarios/${id}/roles`, { roles });
  }
}
