import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../core/layout/main-layout/main-layout.component';
import { UsuariosListComponent } from './pages/usuarios-list/usuarios-list.component';
import { UsuarioFormComponent } from './pages/usuario-form/usuario-form.component';
import { SucursalesListComponent } from './pages/sucursales-list/sucursales-list.component';
import { SucursalFormComponent } from './pages/sucursal-form/sucursal-form.component';

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
        path: 'sucursales',
        component: SucursalesListComponent,
        title: 'Sucursales y Sedes - Configuración',
      },
      {
        path: 'sucursales/nuevo',
        component: SucursalFormComponent,
        title: 'Nueva Sucursal - Configuración',
      },
      {
        path: 'sucursales/editar/:id',
        component: SucursalFormComponent,
        title: 'Editar Sucursal - Configuración',
      },
      {
        path: '',
        redirectTo: 'usuarios',
        pathMatch: 'full',
      },
    ],
  },
];
