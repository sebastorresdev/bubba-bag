import { Injectable, inject, computed, signal } from '@angular/core';
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

export interface NavigationArea {
  id: string; // 'service', 'resources', 'inventory', 'settings'
  name: string; // 'Servicio', 'Recursos', 'Inventario', 'Configuración'
  shortCode: string; // 'S', 'R', 'I', 'C'
  icon: string;
  badgeColor?: string;
  defaultPath: string;
  items: NavItem[];
}

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
  areas: NavigationArea[];
  items?: NavItem[];
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Área seleccionada manualmente (si el usuario la cambió explícitamente en el Area Switcher)
  private explicitAreaIdSignal = signal<{ [moduleId: string]: string }>({});

  // Catálogo de Aplicaciones Empresariales (Apps estilo Microsoft Dynamics 365)
  readonly modules: ErpModule[] = [
    // =========================================================================
    // 1. SERVICIO DE CAMPO (Field Service)
    // =========================================================================
    {
      id: 'serviciocampo',
      title: 'Servicio de Campo',
      shortCode: 'SC',
      icon: 'car',
      basePath: '/servicio-campo',
      searchPlaceholder: 'Buscar órdenes, técnicos, clientes, recursos, series...',
      themeColor: '#005a9e', // Microsoft Dynamics Field Service Blue
      accentColor: '#0078d4',
      description: 'Suite operativa: Órdenes de Trabajo, Despacho, Clientes, Recursos y Materiales',
      requiredRoles: [
        'SuperAdmin',
        'Gerencia',
        'ServicioCampoAdmin',
        'ServicioCampoBackoffice',
        'ServicioCampoTecnico',
      ],
      areas: [
        // ---------------------------------------------------------------------
        // Área 1: Servicio (Service)
        // ---------------------------------------------------------------------
        {
          id: 'service',
          name: 'Servicio',
          shortCode: 'S',
          icon: 'customer-service',
          badgeColor: '#0078d4',
          defaultPath: '/servicio-campo/ordenes',
          items: [
            {
              title: 'Mi Trabajo',
              icon: 'dashboard',
              open: true,
              children: [
                {
                  title: 'Panel de Control',
                  path: '/dashboard',
                },
              ],
            },
            {
              title: 'Programación y Despacho',
              icon: 'calendar',
              open: true,
              children: [
                {
                  title: 'Órdenes de Trabajo',
                  path: '/servicio-campo/ordenes',
                  matchPrefix: true,
                },
                {
                  title: 'Tablero de Programación',
                  path: '/servicio-campo/schedule-board',
                },
                {
                  title: 'Reservas (Bookings)',
                  path: '/servicio-campo/bookings',
                },
                {
                  title: 'Requisitos de Recursos',
                  path: '/servicio-campo/resource-requirements',
                },
                {
                  title: 'Solicitudes de Ausencia',
                  path: '/servicio-campo/time-off-requests',
                },
              ],
            },
            {
              title: 'Clientes',
              icon: 'team',
              open: false,
              children: [
                {
                  title: 'Cuentas (Clientes)',
                  path: '/servicio-campo/clientes',
                  matchPrefix: true,
                },
                {
                  title: 'Contactos',
                  path: '/servicio-campo/contactos',
                },
              ],
            },
            {
              title: 'Prestación de Servicios',
              icon: 'snippets',
              open: false,
              children: [
                {
                  title: 'Casos e Incidencias',
                  path: '/servicio-campo/cases',
                },
                {
                  title: 'Acuerdos de Servicio (SLA)',
                  path: '/servicio-campo/agreements',
                },
              ],
            },
            {
              title: 'Activos y Dispositivos',
              icon: 'database',
              open: false,
              children: [
                {
                  title: 'Activos del Cliente',
                  path: '/servicio-campo/assets',
                },
                {
                  title: 'Alertas IoT',
                  path: '/servicio-campo/iot-alerts',
                },
                {
                  title: 'Dispositivos',
                  path: '/servicio-campo/devices',
                },
              ],
            },
          ],
        },

        // ---------------------------------------------------------------------
        // Área 2: Recursos (Resources)
        // ---------------------------------------------------------------------
        {
          id: 'resources',
          name: 'Recursos',
          shortCode: 'R',
          icon: 'team',
          badgeColor: '#004e8c',
          defaultPath: '/servicio-campo/resources',
          items: [
            {
              title: 'Recursos',
              icon: 'idcard',
              open: true,
              children: [
                {
                  title: 'Recursos Reservables',
                  path: '/servicio-campo/resources',
                  matchPrefix: true,
                },
                {
                  title: 'Habilidades (Characteristics)',
                  path: '/servicio-campo/characteristics',
                },
                {
                  title: 'Categorías de Recursos',
                  path: '/servicio-campo/resource-categories',
                },
                {
                  title: 'Tipos de Pago',
                  path: '/servicio-campo/pay-types',
                },
                {
                  title: 'Modelos de Competencia',
                  path: '/servicio-campo/proficiency-models',
                },
                {
                  title: 'Plantillas de Horas',
                  path: '/servicio-campo/workhour-templates',
                },
              ],
            },
            {
              title: 'Configuración de Reservas',
              icon: 'calendar',
              open: false,
              children: [
                {
                  title: 'Estados de Reserva',
                  path: '/servicio-campo/booking-statuses',
                },
                {
                  title: 'Reglas de Reserva',
                  path: '/servicio-campo/booking-rules',
                },
                {
                  title: 'Preferencias de Cumplimiento',
                  path: '/servicio-campo/fulfillment-preferences',
                },
              ],
            },
            {
              title: 'Administración de Programación',
              icon: 'setting',
              open: false,
              children: [
                {
                  title: 'Metadatos de Configuración',
                  path: '/servicio-campo/booking-setup-metadata',
                },
                {
                  title: 'Parámetros de Programación',
                  path: '/servicio-campo/scheduling-parameters',
                },
              ],
            },
          ],
        },

        // ---------------------------------------------------------------------
        // Área 3: Inventario (Inventory)
        // ---------------------------------------------------------------------
        {
          id: 'inventory',
          name: 'Inventario',
          shortCode: 'I',
          icon: 'appstore',
          badgeColor: '#107c41',
          defaultPath: '/servicio-campo/almacenes',
          items: [
            {
              title: 'Inventario y Materiales',
              icon: 'appstore',
              open: true,
              children: [
                {
                  title: 'Almacenes y Bodegas',
                  path: '/servicio-campo/almacenes',
                  matchPrefix: true,
                },
                {
                  title: 'Saldo de Técnicos (Móviles)',
                  path: '/servicio-campo/stock-tecnicos',
                  matchPrefix: true,
                },
                {
                  title: 'Control de Existencias (Stock)',
                  path: '/servicio-campo/stock',
                },
                {
                  title: 'Trazabilidad de Series',
                  path: '/servicio-campo/seriados',
                },
                {
                  title: 'Kardex y Despachos',
                  path: '/servicio-campo/movimientos',
                },
              ],
            },
          ],
        },

        // ---------------------------------------------------------------------
        // Área 4: Configuración (Settings)
        // ---------------------------------------------------------------------
        {
          id: 'settings',
          name: 'Configuración',
          shortCode: 'C',
          icon: 'setting',
          badgeColor: '#5c2d91',
          defaultPath: '/servicio-campo/unidades-medida',
          items: [
            {
              title: 'General',
              icon: 'appstore',
              open: true,
              children: [
                {
                  title: 'Unidad de medida',
                  path: '/servicio-campo/unidades-medida',
                  matchPrefix: true,
                },
                {
                  title: 'Categorías y Familias',
                  path: '/servicio-campo/categorias-producto',
                  matchPrefix: true,
                },
                {
                  title: 'Productos y Servicios',
                  path: '/servicio-campo/productos',
                  matchPrefix: true,
                },
              ],
            },
            {
              title: 'Configuración de Órdenes',
              icon: 'setting',
              open: true,
              children: [
                {
                  title: 'Tipos de Orden (Modalidad)',
                  path: '/servicio-campo/tipos-orden',
                  matchPrefix: true,
                },
                {
                  title: 'Motivos de Incidencia',
                  path: '/servicio-campo/motivos-incidencia',
                  matchPrefix: true,
                },
                {
                  title: 'Prioridades',
                  path: '/servicio-campo/prioridades',
                },
              ],
            },
          ],
        },
      ],
    },

    // =========================================================================
    // 2. RECURSOS HUMANOS (RRHH)
    // =========================================================================
    {
      id: 'rrhh',
      title: 'Recursos Humanos',
      shortCode: 'RH',
      icon: 'team',
      basePath: '/rrhh',
      searchPlaceholder: 'Buscar colaboradores, contratos, legajos, planillas...',
      themeColor: '#5c2d91', // Deep Purple / HR
      accentColor: '#8764b8',
      description: 'Gestión de personal: Colaboradores, Planillas, Asistencia y Estructura',
      requiredRoles: ['SuperAdmin', 'Gerencia', 'RrhhAdmin', 'RrhhAsistente'],
      areas: [
        {
          id: 'personal',
          name: 'Personal',
          shortCode: 'P',
          icon: 'team',
          badgeColor: '#5c2d91',
          defaultPath: '/rrhh/empleados',
          items: [
            {
              title: 'Gestión de Personas',
              icon: 'team',
              open: true,
              children: [
                {
                  title: 'Colaboradores',
                  path: '/rrhh/empleados',
                  matchPrefix: true,
                },
                {
                  title: 'Reclutamiento (ATS)',
                  path: '/rrhh/reclutamiento',
                },
              ],
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
          ],
        },
        {
          id: 'asistencia',
          name: 'Asistencia',
          shortCode: 'A',
          icon: 'calendar',
          badgeColor: '#0078d4',
          defaultPath: '/rrhh/asistencia',
          items: [
            {
              title: 'Control de Horarios',
              icon: 'calendar',
              open: true,
              children: [
                {
                  title: 'Marcaciones y Turnos',
                  path: '/rrhh/asistencia',
                },
                {
                  title: 'Licencias y Vacaciones',
                  path: '/rrhh/licencias',
                },
                {
                  title: 'Horas Extras y Permisos',
                  path: '/rrhh/horas-extras',
                },
              ],
            },
          ],
        },
        {
          id: 'nomina',
          name: 'Nómina',
          shortCode: 'N',
          icon: 'dollar',
          badgeColor: '#107c41',
          defaultPath: '/rrhh/planilla',
          items: [
            {
              title: 'Compensaciones y Pagos',
              icon: 'dollar',
              open: true,
              children: [
                {
                  title: 'Planilla Mensual',
                  path: '/rrhh/planilla',
                },
                {
                  title: 'Boletas de Pago',
                  path: '/rrhh/boletas',
                },
                {
                  title: 'Gratificaciones y CTS',
                  path: '/rrhh/beneficios',
                },
                {
                  title: 'Liquidaciones de Ley',
                  path: '/rrhh/liquidaciones',
                },
              ],
            },
          ],
        },
        {
          id: 'rendimiento',
          name: 'Rendimiento',
          shortCode: 'RD',
          icon: 'bar-chart',
          badgeColor: '#d83b01',
          defaultPath: '/rrhh/evaluaciones',
          items: [
            {
              title: 'Evaluación y Reportes',
              icon: 'bar-chart',
              open: true,
              children: [
                {
                  title: 'Evaluación de Desempeño',
                  path: '/rrhh/evaluaciones',
                },
                {
                  title: 'Reportes e Indicadores',
                  path: '/rrhh/reportes',
                },
              ],
            },
          ],
        },
      ],
    },

    // =========================================================================
    // 3. CONFIGURACIÓN Y SEGURIDAD
    // =========================================================================
    {
      id: 'configuracion',
      title: 'Configuración',
      shortCode: 'CF',
      icon: 'setting',
      basePath: '/configuracion',
      searchPlaceholder: 'Buscar usuarios, roles del sistema, sucursales...',
      themeColor: '#2b2b2b',
      accentColor: '#484644',
      description: 'Consola de administración: Usuarios, Roles del Sistema y Sedes',
      requiredRoles: ['SuperAdmin', 'Gerencia'],
      areas: [
        {
          id: 'administracion',
          name: 'Administración',
          shortCode: 'AD',
          icon: 'setting',
          badgeColor: '#323130',
          defaultPath: '/configuracion/usuarios',
          items: [
            {
              title: 'Gestión de Accesos',
              icon: 'lock',
              open: true,
              children: [
                { title: 'Usuarios del Sistema', path: '/configuracion/usuarios', matchPrefix: true },
              ],
            },
            {
              title: 'Organización y Sedes',
              icon: 'bank',
              open: true,
              children: [
                { title: 'Sucursales y Sedes', path: '/configuracion/sucursales', matchPrefix: true },
              ],
            },
          ],
        },
      ],
    },
  ];

  constructor() {
    for (const mod of this.modules) {
      const allItems: NavItem[] = [];
      for (const area of mod.areas) {
        for (const item of area.items) {
          if (item.children) {
            allItems.push(...item.children);
          } else {
            allItems.push(item);
          }
        }
      }
      mod.items = allItems;
    }
  }

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

  // Área activa determinada por URL o por selección explícita
  readonly currentArea = computed<NavigationArea>(() => {
    const mod = this.currentModule();
    if (!mod || !mod.areas || mod.areas.length === 0) {
      return {
        id: 'default',
        name: 'Principal',
        shortCode: 'P',
        icon: 'appstore',
        defaultPath: mod?.basePath || '/',
        items: [],
      };
    }

    const url = this.currentUrlSignal() || '';

    // 1. Verificar si alguna ruta de las áreas coincide con la URL actual
    for (const area of mod.areas) {
      for (const it of area.items) {
        if (it.path && (url === it.path || (it.matchPrefix && url.startsWith(it.path)))) {
          return area;
        }
        if (it.children) {
          for (const sub of it.children) {
            if (sub.path && (url === sub.path || (sub.matchPrefix && url.startsWith(sub.path)))) {
              return area;
            }
          }
        }
      }
    }

    // 2. Verificar si el usuario seleccionó un área manualmente para este módulo
    const explicitMap = this.explicitAreaIdSignal();
    const explicitId = explicitMap[mod.id];
    if (explicitId) {
      const explicitArea = mod.areas.find((a) => a.id === explicitId);
      if (explicitArea) return explicitArea;
    }

    // 3. Área por defecto: la primera del módulo
    return mod.areas[0];
  });

  // Título del elemento actualmente activo para el breadcrumb (ej. "Órdenes de Trabajo", "Recursos")
  readonly activeItemTitle = computed<string>(() => {
    const area = this.currentArea();
    const url = this.currentUrlSignal() || '';
    for (const it of area.items || []) {
      if (it.path && (url === it.path || (it.matchPrefix && url.startsWith(it.path)))) {
        return it.title;
      }
      if (it.children) {
        for (const sub of it.children) {
          if (sub.path && (url === sub.path || (sub.matchPrefix && url.startsWith(sub.path)))) {
            return sub.title;
          }
        }
      }
    }
    return area.name;
  });

  // Cambiar de área dentro de la aplicación actual (Area Switcher)
  switchToArea(area: NavigationArea) {
    const mod = this.currentModule();
    this.explicitAreaIdSignal.update((prev) => ({
      ...prev,
      [mod.id]: area.id,
    }));
    this.router.navigate([area.defaultPath]);
  }

  // Navegar a un módulo / aplicación
  switchToModule(module: ErpModule) {
    const targetArea = module.areas?.[0];
    const targetPath = targetArea ? targetArea.defaultPath : module.basePath;
    this.router.navigate([targetPath]);
  }

  // Filtrar ítems según los roles del usuario autenticado
  getVisibleItems(source: ErpModule | NavigationArea): NavItem[] {
    const user = this.authService.currentUser();
    if (!user || !source) return [];
    const items = source.items || [];
    if (this.authService.isSuperAdmin()) return items;

    return items
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
