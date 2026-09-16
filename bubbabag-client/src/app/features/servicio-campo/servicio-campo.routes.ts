import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../core/layout/main-layout/main-layout.component';
import { TiposOrdenListComponent } from './pages/tipos-orden-list/tipos-orden-list.component';
import { TiposTareaListComponent } from './pages/tipos-tarea-list/tipos-tarea-list.component';
import { MotivosIncidenciaListComponent } from './pages/motivos-incidencia-list/motivos-incidencia-list.component';

export const SERVICIO_CAMPO_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'tipos-orden',
        component: TiposOrdenListComponent,
        title: 'Tipos de Orden (Modalidad) - Servicio de Campo',
      },
      {
        path: 'tipos-tarea',
        component: TiposTareaListComponent,
        title: 'Tipos de Tarea - Servicio de Campo',
      },
      {
        path: 'motivos-incidencia',
        component: MotivosIncidenciaListComponent,
        title: 'Motivos de Incidencia - Servicio de Campo',
      },
      {
        path: '',
        redirectTo: 'tipos-orden',
        pathMatch: 'full',
      },
    ],
  },
];
