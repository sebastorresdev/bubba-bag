import { Injectable, inject, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface NavItem {
  title: string;
  icon?: string;
  path?: string;
  matchPrefix?: boolean;
  open?: boolean;
  requiredRoles?: string[];
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
  themeColor: string;
  accentColor: string;
  description: string;
  requiredRoles?: string[];
  items: NavItem[];
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Catálogo de aplicaciones empresariales (Apps estilo Microsoft Dynamics 365)
  readonly modules: ErpModule[] = [
    {
      id: 'serviciocampo',
      title: 'Servicio de Campo',
      shortCode: 'SC',
      icon: 'car',
      basePath: '/servicio-campo',
      searchPlaceholder: 'Buscar órdenes de trabajo, técnicos, clientes, series...',
      themeColor: '#0b4c8c', // Deep Navy / Ocean Blue
      accentColor: '#0078d4',
      description: 'Suite operativa: Órdenes de Trabajo, Cuadrillas, Clientes, Almacenes y Materiales',
      requiredRoles: [
        'SuperAdmin',
        'Gerencia',
        'ServicioCampoAdmin',
        'ServicioCampoBackoffice',
        'ServicioCampoTecnico',
      ],
      items: [
        {
          title: 'Órdenes de Trabajo',
          icon: 'solution',
          path: '/servicio-campo/ordenes',
          matchPrefix: true,
        },
        {
          title: 'Directorio de Clientes',
          icon: 'user',
          path: '/servicio-campo/clientes',
          matchPrefix: true,
        },
        {
          title: 'Logística y Materiales',
          icon: 'appstore',
          open: true,
          children: [
            { title: 'Productos y Servicios', path: '/servicio-campo/productos' },
            { title: 'Almacenes y Bodegas', path: '/servicio-campo/almacenes' },
            { title: 'Saldo de Técnicos (Móviles)', path: '/servicio-campo/stock-tecnicos' },
            { title: 'Control de Existencias (Stock)', path: '/servicio-campo/stock' },
            { title: 'Trazabilidad de Series', path: '/servicio-campo/seriados' },
            { title: 'Kardex y Despachos', path: '/servicio-campo/movimientos' },
          ],
        },
        {
          title: 'Catálogos Operativos',
          icon: 'setting',
          open: false,
          requiredRoles: ['SuperAdmin', 'Gerencia', 'ServicioCampoAdmin', 'ServicioCampoBackoffice'],
          children: [
            { title: 'Tarifario de Liquidación', path: '/servicio-campo/tarifas-servicio' },
            { title: 'Tipos de Orden (Modalidad)', path: '/servicio-campo/tipos-orden' },
            { title: 'Motivos de Incidencia', path: '/servicio-campo/motivos-incidencia' },
          ],
        },
      ],
    },
    {
      id: 'rrhh',
      title: 'Recursos Humanos',
      shortCode: 'RH',
      icon: 'team',
      basePath: '/rrhh',
      searchPlaceholder: 'Buscar colaboradores, contratos, legajos...',
      themeColor: '#4a2373', // Deep Imperial Violet
      accentColor: '#742774',
      description: 'Gestión de personal: Colaboradores, Planillas, Asistencia, Vacaciones y Legajos',
      requiredRoles: ['SuperAdmin', 'Gerencia', 'RrhhAdmin', 'RrhhAsistente'],
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
        {
          title: 'Estructura Organizacional',
          icon: 'apartment',
          open: true,
          children: [
            { title: 'Departamentos', path: '/rrhh/departamentos' },
            { title: 'Cargos y Puestos', path: '/rrhh/cargos' },
          ],
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
          requiredRoles: ['SuperAdmin', 'Gerencia', 'RrhhAdmin'],
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
      id: 'configuracion',
      title: 'Configuración y Seguridad',
      shortCode: 'CF',
      icon: 'setting',
      basePath: '/configuracion',
      searchPlaceholder: 'Buscar usuarios, roles del sistema...',
      themeColor: '#2d3238', // Slate Charcoal
      accentColor: '#484644',
      description: 'Consola de administración: Usuarios, Roles del Sistema, Permisos y Sedes',
      requiredRoles: ['SuperAdmin', 'Gerencia'],
      items: [
        {
          title: 'Gestión de Accesos',
          icon: 'lock',
          open: true,
          children: [
            { title: 'Usuarios del Sistema', path: '/configuracion/usuarios' },
          ],
        },
        {
          title: 'Organización y Sedes',
          icon: 'bank',
          open: true,
          children: [
            { title: 'Sucursales y Sedes', path: '/configuracion/sucursales' },
          ],
        },
      ],
    },
  ];

  // Módulos visibles filtrados según los roles del usuario autenticado
  readonly visibleModules = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    if (this.authService.isSuperAdmin()) {
      return this.modules;
    }
    return this.modules.filter((m) => {
      if (!m.requiredRoles || m.requiredRoles.length === 0) return true;
      return m.requiredRoles.some((r) => user.roles.includes(r));
    });
  });

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
    return found || this.visibleModules()[0] || this.modules[0];
  });

  // Navegar a un módulo
  switchToModule(module: ErpModule) {
    this.router.navigate([module.basePath]);
  }

  // Filtrar ítems de la barra lateral del módulo según los roles del usuario
  getVisibleItems(module: ErpModule): NavItem[] {
    const user = this.authService.currentUser();
    if (!user) return [];
    if (this.authService.isSuperAdmin()) return module.items;

    return module.items
      .filter((item) => {
        if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
        return item.requiredRoles.some((r) => user.roles.includes(r));
      })
      .map((item) => {
        if (!item.children || item.children.length === 0) return item;
        const visibleChildren = item.children.filter((child) => {
          if (!child.requiredRoles || child.requiredRoles.length === 0) return true;
          return child.requiredRoles.some((r) => user.roles.includes(r));
        });
        return { ...item, children: visibleChildren };
      })
      .filter((item) => !item.children || item.children.length > 0);
  }
}
