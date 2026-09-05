import { Routes } from '@angular/router';
import { RrhhLayoutComponent } from './layout/rrhh-layout/rrhh-layout.component';
import { EmpleadosListComponent } from './pages/empleados-list/empleados-list.component';
import { EmpleadoFormComponent } from './pages/empleado-form/empleado-form.component';

export const RECURSOS_HUMANOS_ROUTES: Routes = [
  {
    path: '',
    component: RrhhLayoutComponent,
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
