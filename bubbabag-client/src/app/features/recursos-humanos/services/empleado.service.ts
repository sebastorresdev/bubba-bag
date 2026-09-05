import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { 
  EmpleadoDto, 
  CrearEmpleadoCommand, 
  ActualizarEmpleadoCommand, 
  CatalogosRrhhDto, 
  DarDeBajaRequest 
} from '../models/empleado.model';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/rrhh/empleados';
  private catalogosUrl = '/api/rrhh/catalogos';
  private catalogos$?: Observable<CatalogosRrhhDto>;

  getCatalogos(): Observable<CatalogosRrhhDto> {
    if (!this.catalogos$) {
      this.catalogos$ = this.http.get<CatalogosRrhhDto>(this.catalogosUrl).pipe(
        shareReplay(1)
      );
    }
    return this.catalogos$;
  }

  getEmpleados(
    searchTerm?: string, 
    estado?: string, 
    departamentoId?: string, 
    cargoId?: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Observable<EmpleadoDto[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('searchTerm', searchTerm.trim());
    }

    if (estado && estado !== 'Todos') {
      params = params.set('estado', estado);
    }

    if (departamentoId) {
      params = params.set('departamentoId', departamentoId);
    }

    if (cargoId) {
      params = params.set('cargoId', cargoId);
    }

    return this.http.get<EmpleadoDto[]>(this.apiUrl, { params });
  }

  getEmpleado(id: string): Observable<EmpleadoDto> {
    return this.http.get<EmpleadoDto>(`${this.apiUrl}/${id}`);
  }

  crearEmpleado(command: CrearEmpleadoCommand): Observable<string> {
    return this.http.post<string>(this.apiUrl, command);
  }

  actualizarEmpleado(id: string, command: ActualizarEmpleadoCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, command);
  }

  darDeBaja(id: string, request: DarDeBajaRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/baja`, request);
  }

  reactivar(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reactivar`, {});
  }

  eliminarEmpleado(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
