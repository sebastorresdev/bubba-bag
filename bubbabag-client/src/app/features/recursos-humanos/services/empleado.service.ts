import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmpleadoDto, CrearEmpleadoCommand, ActualizarEmpleadoCommand } from '../models/empleado.model';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/rrhh/empleados';

  getEmpleados(searchTerm?: string, page: number = 1, pageSize: number = 20): Observable<EmpleadoDto[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
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

  eliminarEmpleado(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

