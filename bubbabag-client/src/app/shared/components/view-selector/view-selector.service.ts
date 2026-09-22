import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  VistaItem,
  GuardarVistaDto,
  EstablecerPredeterminadaDto,
} from './view-selector.models';

@Injectable({
  providedIn: 'root',
})
export class ViewSelectorService {
  private http = inject(HttpClient);
  private apiUrl = '/api/seguridad/vistas';

  getVistas(entidad: string): Observable<VistaItem[]> {
    const params = new HttpParams().set('entidad', entidad);
    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map((vistasBackend) => {
        return (vistasBackend || []).map((v) => ({
          id: v.id,
          key: v.esSistema ? v.nombre : v.id,
          nombre: v.nombre,
          descripcion: v.descripcion,
          esSistema: v.esSistema,
          esPredeterminada: v.esPredeterminada,
          configuracion: v.configuracionJson ? JSON.parse(v.configuracionJson) : null,
        }));
      }),
      catchError(() => {
        // Fallback a localStorage si el backend no responde
        const guardadas = this.getVistasLocales(entidad);
        return of(guardadas);
      })
    );
  }

  guardarVista(dto: GuardarVistaDto): Observable<VistaItem> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      map((v) => ({
        id: v.id,
        key: v.id,
        nombre: v.nombre,
        descripcion: v.descripcion,
        esSistema: false,
        esPredeterminada: v.esPredeterminada,
        configuracion: v.configuracionJson ? JSON.parse(v.configuracionJson) : null,
      })),
      catchError(() => {
        // Fallback local
        const idLocal = 'local-' + Date.now();
        const nueva: VistaItem = {
          id: idLocal,
          key: idLocal,
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          esSistema: false,
          esPredeterminada: dto.esPredeterminada,
          configuracion: dto.configuracionJson ? JSON.parse(dto.configuracionJson) : null,
        };
        this.guardarVistaLocal(dto.entidad, nueva);
        return of(nueva);
      })
    );
  }

  establecerPredeterminada(entidad: string, vistaId?: string, vistaKey?: string): Observable<any> {
    const payload: EstablecerPredeterminadaDto = {
      entidad,
      vistaId,
      vistaKey,
    };

    // Actualizar también en localStorage como backup
    this.guardarPredeterminadaLocal(entidad, vistaKey || vistaId || '');

    return this.http.put(`${this.apiUrl}/predeterminada`, payload).pipe(
      catchError(() => of({ success: true }))
    );
  }

  eliminarVista(entidad: string, vistaId: string): Observable<any> {
    this.eliminarVistaLocal(entidad, vistaId);
    return this.http.delete(`${this.apiUrl}/${vistaId}`).pipe(
      catchError(() => of({ success: true }))
    );
  }

  actualizarVista(entidad: string, vistaId: string, configuracionJson: string): Observable<any> {
    this.actualizarVistaLocal(entidad, vistaId, configuracionJson);
    return this.http.put(`${this.apiUrl}/${vistaId}`, { configuracionJson }).pipe(
      catchError(() => of({ success: true }))
    );
  }

  // --- LocalStorage Helpers ---
  private getStorageKey(entidad: string): string {
    return `bubbabag_saved_views_${entidad}`;
  }

  private getDefaultKey(entidad: string): string {
    return `bubbabag_default_view_${entidad}`;
  }

  getPredeterminadaLocal(entidad: string): string | null {
    try {
      return localStorage.getItem(this.getDefaultKey(entidad));
    } catch {
      return null;
    }
  }

  guardarPredeterminadaLocal(entidad: string, key: string): void {
    try {
      localStorage.setItem(this.getDefaultKey(entidad), key);
    } catch {
      // Ignorar restricciones de almacenamiento
    }
  }

  private getVistasLocales(entidad: string): VistaItem[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(entidad));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private guardarVistaLocal(entidad: string, vista: VistaItem): void {
    try {
      const vistas = this.getVistasLocales(entidad);
      if (vista.esPredeterminada) {
        vistas.forEach((v) => (v.esPredeterminada = false));
        this.guardarPredeterminadaLocal(entidad, vista.key);
      }
      vistas.push(vista);
      localStorage.setItem(this.getStorageKey(entidad), JSON.stringify(vistas));
    } catch {
      // Ignorar restricciones de almacenamiento
    }
  }

  private eliminarVistaLocal(entidad: string, vistaId: string): void {
    try {
      let vistas = this.getVistasLocales(entidad);
      vistas = vistas.filter((v) => v.id !== vistaId);
      localStorage.setItem(this.getStorageKey(entidad), JSON.stringify(vistas));
    } catch {
      // Ignorar restricciones de almacenamiento
    }
  }

  private actualizarVistaLocal(entidad: string, vistaId: string, configuracionJson: string): void {
    try {
      const vistas = this.getVistasLocales(entidad);
      const idx = vistas.findIndex((v) => v.id === vistaId);
      if (idx !== -1) {
        vistas[idx].configuracion = JSON.parse(configuracionJson);
        localStorage.setItem(this.getStorageKey(entidad), JSON.stringify(vistas));
      }
    } catch {
      // Ignorar restricciones de almacenamiento
    }
  }
}

