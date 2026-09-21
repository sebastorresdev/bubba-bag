import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../core/layout/main-layout/main-layout.component';
import { TiposOrdenListComponent } from './pages/tipos-orden-list/tipos-orden-list.component';
import { MotivosIncidenciaListComponent } from './pages/motivos-incidencia-list/motivos-incidencia-list.component';
import { TarifasServicioListComponent } from './pages/tarifas-servicio-list/tarifas-servicio-list.component';
import { TarifaServicioFormComponent } from './pages/tarifa-servicio-form/tarifa-servicio-form.component';

import { TipoOrdenFormComponent } from './pages/tipo-orden-form/tipo-orden-form.component';
import { MotivoIncidenciaFormComponent } from './pages/motivo-incidencia-form/motivo-incidencia-form.component';
import { ServiciosListComponent } from './pages/servicios-list/servicios-list.component';
import { ServicioFormComponent } from './pages/servicio-form/servicio-form.component';
import { CatalogosServicioListComponent } from './pages/catalogos-servicio-list/catalogos-servicio-list.component';
import { CatalogoServicioFormComponent } from './pages/catalogo-servicio-form/catalogo-servicio-form.component';
import { OrdenesListComponent } from './pages/ordenes-list/ordenes-list.component';
export const SERVICIO_CAMPO_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'ordenes',
        component: OrdenesListComponent,
        title: 'Órdenes de Trabajo - Servicio de Campo',
      },
      {
        path: 'tarifas-servicio',
        component: TarifasServicioListComponent,
        title: 'Tarifario de Servicios - Servicio de Campo',
      },
      {
        path: 'tarifas-servicio/nuevo',
        component: TarifaServicioFormComponent,
        title: 'Nueva Tarifa de Servicio - Servicio de Campo',
      },
      {
        path: 'tarifas-servicio/editar/:id',
        component: TarifaServicioFormComponent,
        title: 'Editar Tarifa de Servicio - Servicio de Campo',
      },
      {
        path: 'catalogos-servicio',
        component: CatalogosServicioListComponent,
        title: 'Catálogos de Servicios - Servicio de Campo',
      },
      {
        path: 'catalogos-servicio/nuevo',
        component: CatalogoServicioFormComponent,
        title: 'Nuevo Catálogo de Servicios - Servicio de Campo',
      },
      {
        path: 'catalogos-servicio/editar/:id',
        component: CatalogoServicioFormComponent,
        title: 'Editar Catálogo de Servicios - Servicio de Campo',
      },
      {
        path: 'servicios',
        component: ServiciosListComponent,
        title: 'Plantillas de Servicios - Servicio de Campo',
      },
      {
        path: 'servicios/nuevo',
        component: ServicioFormComponent,
        title: 'Nueva Plantilla de Servicio - Servicio de Campo',
      },
      {
        path: 'servicios/editar/:id',
        component: ServicioFormComponent,
        title: 'Editar Plantilla de Servicio - Servicio de Campo',
      },
      {
        path: 'tipos-orden',
        component: TiposOrdenListComponent,
        title: 'Tipos de Orden (Modalidad) - Servicio de Campo',
      },
      {
        path: 'tipos-orden/nuevo',
        component: TipoOrdenFormComponent,
        title: 'Nuevo Tipo de Orden - Servicio de Campo',
      },
      {
        path: 'tipos-orden/editar/:id',
        component: TipoOrdenFormComponent,
        title: 'Editar Tipo de Orden - Servicio de Campo',
      },
      {
        path: 'motivos-incidencia',
        component: MotivosIncidenciaListComponent,
        title: 'Motivos de Incidencia - Servicio de Campo',
      },
      {
        path: 'motivos-incidencia/nuevo',
        component: MotivoIncidenciaFormComponent,
        title: 'Nuevo Motivo de Incidencia - Servicio de Campo',
      },
      {
        path: 'motivos-incidencia/editar/:id',
        component: MotivoIncidenciaFormComponent,
        title: 'Editar Motivo de Incidencia - Servicio de Campo',
      },
      {
        path: '',
        redirectTo: 'ordenes',
        pathMatch: 'full',
      },
    ],
  },
];
