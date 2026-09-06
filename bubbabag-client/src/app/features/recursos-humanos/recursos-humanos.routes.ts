import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../core/layout/main-layout/main-layout.component';
import { EmpleadosListComponent } from './pages/empleados-list/empleados-list.component';
import { EmpleadoFormComponent } from './pages/empleado-form/empleado-form.component';

export const RECURSOS_HUMANOS_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'empleados',
        component: EmpleadosListComponent,
        title: 'Gestión de Colaboradores - RRHH'
      },
      {
        path: 'empleados/nuevo',
        component: EmpleadoFormComponent,
        title: 'Nuevo Empleado - RRHH'
      },
      {
        path: 'empleados/editar/:id',
        component: EmpleadoFormComponent,
        title: 'Editar Empleado - RRHH'
      },
      {
        path: '',
        redirectTo: 'empleados',
        pathMatch: 'full'
      }
    ]
  }
];
