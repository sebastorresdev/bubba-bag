import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../core/layout/main-layout/main-layout.component';
import { ClientesListComponent } from './pages/clientes-list/clientes-list.component';
import { ClienteFormComponent } from './pages/cliente-form/cliente-form.component';

export const CRM_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'clientes',
        component: ClientesListComponent,
        title: 'Directorio de Clientes - CRM',
      },
      {
        path: 'clientes/nuevo',
        component: ClienteFormComponent,
        title: 'Nuevo Cliente - CRM',
      },
      {
        path: 'clientes/editar/:id',
        component: ClienteFormComponent,
        title: 'Editar Cliente - CRM',
      },
      {
        path: '',
        redirectTo: 'clientes',
        pathMatch: 'full',
      },
    ],
  },
];
