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
      // ── Clientes Operativos ──
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/clientes-list/clientes-list.component').then(
            (m) => m.ClientesListComponent
          ),
        title: 'Directorio de Clientes - Servicio de Campo',
      },
      {
        path: 'clientes/nuevo',
        loadComponent: () =>
          import('./pages/cliente-form/cliente-form.component').then(
            (m) => m.ClienteFormComponent
          ),
        title: 'Nuevo Cliente - Servicio de Campo',
      },
      {
        path: 'clientes/editar/:id',
        loadComponent: () =>
          import('./pages/cliente-form/cliente-form.component').then(
            (m) => m.ClienteFormComponent
          ),
        title: 'Editar Cliente - Servicio de Campo',
      },
      // ── Logística y Materiales de Campo ──
      {
        path: 'materiales',
        loadComponent: () =>
          import('./pages/productos-list/productos-list.component').then(
            (m) => m.ProductosListComponent
          ),
        title: 'Materiales y Equipos - Servicio de Campo',
      },
      {
        path: 'materiales/nuevo',
        loadComponent: () =>
          import('./pages/producto-form/producto-form.component').then(
            (m) => m.ProductoFormComponent
          ),
        title: 'Nuevo Material / Equipo - Servicio de Campo',
      },
      {
        path: 'materiales/editar/:id',
        loadComponent: () =>
          import('./pages/producto-form/producto-form.component').then(
            (m) => m.ProductoFormComponent
          ),
        title: 'Editar Material / Equipo - Servicio de Campo',
      },
      {
        path: 'almacenes',
        loadComponent: () =>
          import('./pages/almacenes-list/almacenes-list.component').then(
            (m) => m.AlmacenesListComponent
          ),
        title: 'Almacenes y Bodegas - Servicio de Campo',
      },
      {
        path: 'stock-tecnicos',
        loadComponent: () =>
          import('./pages/stock-tecnicos-list/stock-tecnicos-list.component').then(
            (m) => m.StockTecnicosListComponent
          ),
        title: 'Saldo de Técnicos (Móviles) - Servicio de Campo',
      },
      {
        path: 'stock',
        loadComponent: () =>
          import('./pages/stock-list/stock-list.component').then(
            (m) => m.StockListComponent
          ),
        title: 'Control de Existencias (Stock) - Servicio de Campo',
      },
      {
        path: 'seriados',
        loadComponent: () =>
          import('./pages/seriados-list/seriados-list.component').then(
            (m) => m.SeriadosListComponent
          ),
        title: 'Trazabilidad de Series - Servicio de Campo',
      },
      {
        path: 'movimientos',
        loadComponent: () =>
          import('./pages/movimientos-list/movimientos-list.component').then(
            (m) => m.MovimientosListComponent
          ),
        title: 'Kardex y Despachos - Servicio de Campo',
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
