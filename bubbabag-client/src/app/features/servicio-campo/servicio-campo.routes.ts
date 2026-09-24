import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../core/layout/main-layout/main-layout.component';
import { TiposOrdenListComponent } from './pages/tipos-orden-list/tipos-orden-list.component';
import { MotivosIncidenciaListComponent } from './pages/motivos-incidencia-list/motivos-incidencia-list.component';
import { TipoOrdenFormComponent } from './pages/tipo-orden-form/tipo-orden-form.component';
import { MotivoIncidenciaFormComponent } from './pages/motivo-incidencia-form/motivo-incidencia-form.component';
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
      // ── Catálogo Maestro de Productos y Servicios (Unificado) ──
      {
        path: 'productos',
        loadComponent: () =>
          import('./pages/productos-list/productos-list.component').then(
            (m) => m.ProductosListComponent
          ),
        title: 'Productos y Servicios - Servicio de Campo',
      },
      {
        path: 'productos/nuevo',
        loadComponent: () =>
          import('./pages/producto-form/producto-form.component').then(
            (m) => m.ProductoFormComponent
          ),
        title: 'Nuevo Producto / Servicio - Servicio de Campo',
      },
      {
        path: 'productos/editar/:id',
        loadComponent: () =>
          import('./pages/producto-form/producto-form.component').then(
            (m) => m.ProductoFormComponent
          ),
        title: 'Editar Producto / Servicio - Servicio de Campo',
      },
      // ── Catálogo Maestro: Unidades de Medida ──
      {
        path: 'unidades-medida',
        loadComponent: () =>
          import('./pages/unidades-medida-list/unidades-medida-list.component').then(
            (m) => m.UnidadesMedidaListComponent
          ),
        title: 'Unidades de Medida - Servicio de Campo',
      },
      {
        path: 'unidades-medida/nuevo',
        loadComponent: () =>
          import('./pages/unidad-medida-form/unidad-medida-form.component').then(
            (m) => m.UnidadMedidaFormComponent
          ),
        title: 'Nueva Unidad de Medida - Servicio de Campo',
      },
      {
        path: 'unidades-medida/editar/:id',
        loadComponent: () =>
          import('./pages/unidad-medida-form/unidad-medida-form.component').then(
            (m) => m.UnidadMedidaFormComponent
          ),
        title: 'Editar Unidad de Medida - Servicio de Campo',
      },
      // ── Catálogo Maestro: Categorías de Producto ──
      {
        path: 'categorias-producto',
        loadComponent: () =>
          import('./pages/categorias-producto-list/categorias-producto-list.component').then(
            (m) => m.CategoriasProductoListComponent
          ),
        title: 'Categorías y Familias de Producto - Servicio de Campo',
      },
      {
        path: 'categorias-producto/nuevo',
        loadComponent: () =>
          import('./pages/categoria-producto-form/categoria-producto-form.component').then(
            (m) => m.CategoriaProductoFormComponent
          ),
        title: 'Nueva Categoría - Servicio de Campo',
      },
      {
        path: 'categorias-producto/editar/:id',
        loadComponent: () =>
          import('./pages/categoria-producto-form/categoria-producto-form.component').then(
            (m) => m.CategoriaProductoFormComponent
          ),
        title: 'Editar Categoría - Servicio de Campo',
      },
      // ── Redirecciones canónicas de rutas duplicadas/heredadas ──
      {
        path: 'materiales',
        redirectTo: 'productos',
        pathMatch: 'full',
      },
      {
        path: 'materiales/nuevo',
        redirectTo: 'productos/nuevo',
        pathMatch: 'full',
      },
      {
        path: 'materiales/editar/:id',
        redirectTo: 'productos/editar/:id',
      },
      {
        path: 'servicios',
        redirectTo: 'productos',
        pathMatch: 'full',
      },
      {
        path: 'servicios/nuevo',
        redirectTo: 'productos/nuevo',
        pathMatch: 'full',
      },
      {
        path: 'servicios/editar/:id',
        redirectTo: 'productos/editar/:id',
      },
      // ── Logística e Inventario ──
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
      // ── Parámetros Operativos ──
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
      // ── Entidades Complementarias Dynamics 365 Field Service ──
      {
        path: 'schedule-board',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'schedule-board' },
        title: 'Schedule Board - Field Service',
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'bookings' },
        title: 'Bookings - Field Service',
      },
      {
        path: 'resource-requirements',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'resource-requirements' },
        title: 'Resource Requirements - Field Service',
      },
      {
        path: 'time-off-requests',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'time-off-requests' },
        title: 'Time Off Requests - Field Service',
      },
      {
        path: 'contactos',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'contacts' },
        title: 'Contacts - Field Service',
      },
      {
        path: 'cases',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'cases' },
        title: 'Cases - Field Service',
      },
      {
        path: 'agreements',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'agreements' },
        title: 'Agreements - Field Service',
      },
      {
        path: 'assets',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'assets' },
        title: 'Customer Assets - Field Service',
      },
      {
        path: 'iot-alerts',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'iot-alerts' },
        title: 'IoT Alerts - Field Service',
      },
      {
        path: 'devices',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'devices' },
        title: 'Devices - Field Service',
      },
      // Área: Resources
      {
        path: 'resources',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'resources' },
        title: 'Bookable Resources - Field Service',
      },
      {
        path: 'characteristics',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'characteristics' },
        title: 'Characteristics - Field Service',
      },
      {
        path: 'resource-categories',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'resource-categories' },
        title: 'Resource Categories - Field Service',
      },
      {
        path: 'pay-types',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'pay-types' },
        title: 'Pay Types - Field Service',
      },
      {
        path: 'proficiency-models',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'proficiency-models' },
        title: 'Proficiency Models - Field Service',
      },
      {
        path: 'workhour-templates',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'workhour-templates' },
        title: 'Workhour Templates - Field Service',
      },
      {
        path: 'requirement-groups',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'requirement-groups' },
        title: 'Requirement Groups - Field Service',
      },
      {
        path: 'requirement-statuses',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'requirement-statuses' },
        title: 'Requirement Statuses - Field Service',
      },
      {
        path: 'booking-statuses',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'booking-statuses' },
        title: 'Booking Statuses - Field Service',
      },
      {
        path: 'booking-rules',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'booking-rules' },
        title: 'Booking Rules - Field Service',
      },
      {
        path: 'fulfillment-preferences',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'fulfillment-preferences' },
        title: 'Fulfillment Preferences - Field Service',
      },
      {
        path: 'booking-setup-metadata',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'booking-setup-metadata' },
        title: 'Booking Setup Metadata - Field Service',
      },
      {
        path: 'scheduling-parameters',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'scheduling-parameters' },
        title: 'Scheduling Parameters - Field Service',
      },
      {
        path: 'prioridades',
        loadComponent: () =>
          import('./pages/d365-entity-view/d365-entity-view.component').then(
            (m) => m.D365EntityViewComponent
          ),
        data: { entityKey: 'priorities' },
        title: 'Priorities - Field Service',
      },
      {
        path: '',
        redirectTo: 'ordenes',
        pathMatch: 'full',
      },
    ],
  },
];
