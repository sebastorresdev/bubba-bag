import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../core/layout/main-layout/main-layout.component';
import { ListasPrecioListComponent } from './pages/listas-precio-list/listas-precio-list.component';
import { ListaPrecioFormComponent } from './pages/lista-precio-form/lista-precio-form.component';
import { CatalogosComercialesListComponent } from './pages/catalogos-comerciales-list/catalogos-comerciales-list.component';
import { CatalogoComercialFormComponent } from './pages/catalogo-comercial-form/catalogo-comercial-form.component';

export const VENTAS_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'catalogos',
        component: CatalogosComercialesListComponent,
        title: 'Catálogos Comerciales - Ventas',
      },
      {
        path: 'catalogos/nuevo',
        component: CatalogoComercialFormComponent,
        title: 'Nuevo Catálogo Comercial - Ventas',
      },
      {
        path: 'catalogos/editar/:id',
        component: CatalogoComercialFormComponent,
        title: 'Editar Catálogo Comercial - Ventas',
      },
      {
        path: 'listas-precio',
        component: ListasPrecioListComponent,
        title: 'Listas de Precios - Ventas',
      },
      {
        path: 'listas-precio/nuevo',
        component: ListaPrecioFormComponent,
        title: 'Nueva Lista de Precios - Ventas',
      },
      {
        path: 'listas-precio/editar/:id',
        component: ListaPrecioFormComponent,
        title: 'Editar Lista de Precios - Ventas',
      },
      {
        path: '',
        redirectTo: 'catalogos',
        pathMatch: 'full',
      },
    ],
  },
];
