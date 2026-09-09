import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../core/layout/main-layout/main-layout.component';
import { UsuariosListComponent } from './pages/usuarios-list/usuarios-list.component';
import { UsuarioFormComponent } from './pages/usuario-form/usuario-form.component';

export const CONFIGURACION_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'usuarios',
        component: UsuariosListComponent,
        title: 'Gestión de Accesos - Usuarios del Sistema',
      },
      {
        path: 'usuarios/nuevo',
        component: UsuarioFormComponent,
        title: 'Nuevo Usuario - Configuración',
      },
      {
        path: 'usuarios/editar/:id',
        component: UsuarioFormComponent,
        title: 'Editar Usuario - Configuración',
      },
      {
        path: '',
        redirectTo: 'usuarios',
        pathMatch: 'full',
      },
    ],
  },
];
