import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ListaPrecioDto,
  ListaPrecioDetalleDto,
  CrearListaPrecioRequest,
  ActualizarListaPrecioRequest,
  ProductoComercialDto,
} from '../models/listas-precio.model';

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private http = inject(HttpClient);
  private baseUrl = '/api/ventas/listas-precio';

  getListasPrecio(search?: string, soloActivos?: boolean): Observable<ListaPrecioDto[]> {
    let params = new HttpParams();
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }
    return this.http.get<ListaPrecioDto[]>(this.baseUrl, { params });
  }

  getListaPrecioPorId(id: string): Observable<ListaPrecioDetalleDto> {
    return this.http.get<ListaPrecioDetalleDto>(`${this.baseUrl}/${id}`);
  }

  crearListaPrecio(command: CrearListaPrecioRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.baseUrl, command);
  }

  actualizarListaPrecio(id: string, command: ActualizarListaPrecioRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/${id}`, command);
  }

  cambiarEstadoListaPrecio(id: string, activo: boolean): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${id}/estado`, { activo });
  }

  getProductosComerciales(search?: string, tipo?: number, soloActivos: boolean = true): Observable<ProductoComercialDto[]> {
    let params = new HttpParams();
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    if (tipo !== undefined && tipo !== null) {
      params = params.set('tipo', tipo.toString());
    }
    params = params.set('soloActivos', soloActivos.toString());
    return this.http.get<ProductoComercialDto[]>('/api/inventario/productos', { params });
  }
}
