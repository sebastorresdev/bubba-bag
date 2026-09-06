import { Injectable, inject, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

export interface NavItem {
  title: string;
  icon?: string;
  path?: string;
  matchPrefix?: boolean;
  open?: boolean;
  children?: NavItem[];
}

export type ModuleMenuItem = NavItem;

export interface ErpModule {
  id: string;
  title: string;
  shortCode: string;
  icon: string;
  basePath: string;
  searchPlaceholder: string;
  items: NavItem[];
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);

  // Catálogo de módulos empresariales:
  // - Ítem solo (nivel 1): Tiene icono propio.
  // - Submenú con hijos: El padre tiene icono, y sus hijos dentro NO tienen icono.
  readonly modules: ErpModule[] = [
    {
      id: 'rrhh',
      title: 'Recursos Humanos',
      shortCode: 'RH',
      icon: 'team',
      basePath: '/rrhh',
      searchPlaceholder: 'Buscar colaboradores, contratos, legajos...',
      items: [
        // 1. Ítems solos (con icono)
        {
          title: 'Gestión de Colaboradores',
          icon: 'team',
          path: '/rrhh/empleados',
          matchPrefix: true,
        },
        {
          title: 'Reclutamiento (ATS)',
          icon: 'solution',
          path: '/rrhh/reclutamiento',
        },

        // 2. Submenús (el padre tiene icono, los hijos no)
        {
          title: 'Asistencia y Tiempo',
          icon: 'calendar',
          open: true,
          children: [
            { title: 'Marcaciones y Turnos', path: '/rrhh/asistencia' },
            { title: 'Licencias y Vacaciones', path: '/rrhh/licencias' },
            { title: 'Horas Extras y Permisos', path: '/rrhh/horas-extras' },
          ],
        },
        {
          title: 'Nómina y Pagos',
          icon: 'dollar',
          open: false,
          children: [
            { title: 'Planilla Mensual', path: '/rrhh/planilla' },
            { title: 'Boletas de Pago', path: '/rrhh/boletas' },
            { title: 'Gratificaciones y CTS', path: '/rrhh/beneficios' },
            { title: 'Liquidaciones de Ley', path: '/rrhh/liquidaciones' },
          ],
        },
        {
          title: 'Rendimiento y Reportes',
          icon: 'bar-chart',
          open: false,
          children: [
            { title: 'Evaluación de Desempeño', path: '/rrhh/evaluaciones' },
            { title: 'Reportes e Indicadores', path: '/rrhh/reportes' },
          ],
        },
      ],
    },
    {
      id: 'ventas',
      title: 'Centro de Ventas',
      shortCode: 'VT',
      icon: 'shopping-cart',
      basePath: '/ventas',
      searchPlaceholder: 'Buscar productos, clientes, pedidos...',
      items: [
        { title: 'Punto de Venta (POS)', icon: 'shop', path: '/ventas/pos' },
        { title: 'Pedidos y Cotizaciones', icon: 'file-text', path: '/ventas/pedidos' },
        {
          title: 'Clientes y Fidelidad',
          icon: 'user',
          open: true,
          children: [
            { title: 'Directorio de Clientes', path: '/ventas/clientes' },
            { title: 'Segmentación y Puntos', path: '/ventas/fidelidad' },
          ],
        },
        {
          title: 'Facturación',
          icon: 'audit',
          open: false,
          children: [
            { title: 'Comprobantes Emitidos', path: '/ventas/facturacion' },
            { title: 'Reporte de Ventas', path: '/ventas/reportes' },
          ],
        },
      ],
    },
    {
      id: 'inventario',
      title: 'Inventario y Almacén',
      shortCode: 'IN',
      icon: 'database',
      basePath: '/inventario',
      searchPlaceholder: 'Buscar en Inventario...',
      items: [
        { title: 'Control de Stock', icon: 'database', path: '/inventario/stock' },
        {
          title: 'Catálogo de Productos',
          icon: 'tags',
          open: true,
          children: [
            { title: 'Artículos y Variantes', path: '/inventario/productos' },
            { title: 'Categorías y Familias', path: '/inventario/categorias' },
          ],
        },
        {
          title: 'Operaciones de Almacén',
          icon: 'swap',
          open: false,
          children: [
            { title: 'Transferencias', path: '/inventario/movimientos' },
            { title: 'Ajustes y Mermas', path: '/inventario/ajustes' },
            { title: 'Proveedores', path: '/inventario/proveedores' },
          ],
        },
      ],
    },
    {
      id: 'finanzas',
      title: 'Finanzas y Tesorería',
      shortCode: 'FN',
      icon: 'dollar',
      basePath: '/finanzas',
      searchPlaceholder: 'Buscar cuentas, movimientos...',
      items: [
        { title: 'Flujo de Caja', icon: 'fund', path: '/finanzas/flujo' },
        {
          title: 'Cuentas Corrientes',
          icon: 'account-book',
          open: true,
          children: [
            { title: 'Cuentas por Cobrar', path: '/finanzas/cobrar' },
            { title: 'Cuentas por Pagar', path: '/finanzas/pagar' },
          ],
        },
      ],
    },
  ];

  // Señal reactiva sincronizada con los cambios de URL
  private currentUrlSignal = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  // Módulo activo determinado automáticamente por la ruta actual
  readonly currentModule = computed(() => {
    const url = this.currentUrlSignal() || '';
    const found = this.modules.find((m) => url.startsWith(m.basePath));
    return found || this.modules[0];
  });

  // Navegar a un módulo
  switchToModule(module: ErpModule) {
    this.router.navigate([module.basePath]);
  }
}
