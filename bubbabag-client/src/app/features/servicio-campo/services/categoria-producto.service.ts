import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CategoriaProductoDto,
  CrearCategoriaProductoRequest,
  ActualizarCategoriaProductoRequest,
} from '../models/catalogo-producto.model';

@Injectable({
  providedIn: 'root',
})
export class CategoriaProductoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/inventario/categorias-producto';

  getCategorias(
    soloActivos?: boolean,
    search?: string
  ): Observable<CategoriaProductoDto[]> {
    let params = new HttpParams();
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    return this.http.get<CategoriaProductoDto[]>(this.apiUrl, { params });
  }

  getCategoriaById(id: string): Observable<CategoriaProductoDto> {
    return this.http.get<CategoriaProductoDto>(`${this.apiUrl}/${id}`);
  }

  crearCategoria(request: CrearCategoriaProductoRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, request);
  }

  actualizarCategoria(id: string, request: ActualizarCategoriaProductoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  cambiarEstado(id: string, activo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, { activo });
  }
}
