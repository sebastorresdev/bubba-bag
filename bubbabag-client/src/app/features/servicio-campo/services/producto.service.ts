import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProductoDto,
  CrearProductoRequest,
  ActualizarProductoRequest,
  TipoProducto,
} from '../models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/inventario/productos';

  getProductos(
    search?: string,
    categoria?: string,
    tipo?: TipoProducto,
    catalogoId?: string,
    soloActivos?: boolean
  ): Observable<ProductoDto[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (categoria) params = params.set('categoria', categoria);
    if (tipo) params = params.set('tipo', tipo);
    if (catalogoId) params = params.set('catalogoId', catalogoId);
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }
    return this.http.get<ProductoDto[]>(this.apiUrl, { params });
  }

  getProductoById(id: string): Observable<ProductoDto> {
    return this.http.get<ProductoDto>(`${this.apiUrl}/${id}`);
  }

  crearProducto(request: CrearProductoRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, request);
  }

  actualizarProducto(id: string, request: ActualizarProductoRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  cambiarEstado(id: string, activo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, { activo });
  }
}
