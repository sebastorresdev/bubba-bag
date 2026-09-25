import { tokens } from '@fluentui/react-components';
import type { EnterpriseApp } from '../types/navigation.types';

export const ENTERPRISE_APPS: EnterpriseApp[] = [
  // =========================================================================
  // 1. SERVICIO DE CAMPO (Field Service)
  // =========================================================================
  {
    id: 'field-service',
    name: 'Servicio de Campo',
    subtitle: 'Dynamics 365 Field Service',
    shortCode: 'SC',
    iconName: 'Car',
    color: tokens.colorPaletteBlueBorderActive,
    description: 'Suite de operaciones: Órdenes de Trabajo, Despacho, Clientes, Inventarios y Materiales.',
    areas: [
      {
        id: 'service',
        name: 'Servicio',
        shortCode: 'S',
        iconName: 'Wrench',
        color: tokens.colorPaletteBlueBorderActive,
        defaultPath: '/servicio-campo/ordenes',
        groups: [
          {
            id: 'work',
            title: 'Mi Trabajo',
            items: [
              {
                id: 'dashboard',
                title: 'Panel de Control',
                path: '/dashboard',
                iconName: 'Board',
                description: 'Métricas clave, indicadores de despacho y actividad diaria.',
              },
            ],
          },
          {
            id: 'dispatch',
            title: 'Programación y Despacho',
            items: [
              {
                id: 'ordenes',
                title: 'Órdenes de Trabajo',
                path: '/servicio-campo/ordenes',
                iconName: 'ClipboardTask',
                badge: 'Principal',
                description: 'Gestión completa de órdenes de servicio en campo, asignaciones y estados.',
              },
            ],
          },
          {
            id: 'customers',
            title: 'Clientes',
            items: [
              {
                id: 'clientes',
                title: 'Cuentas (Clientes)',
                path: '/servicio-campo/clientes',
                iconName: 'PersonAccounts',
                description: 'Directorio de empresas, contactos y cuentas comerciales.',
              },
            ],
          },
        ],
      },
      {
        id: 'inventory',
        name: 'Inventario',
        shortCode: 'I',
        iconName: 'Box',
        color: tokens.colorPaletteGreenBorderActive,
        defaultPath: '/servicio-campo/almacenes',
        groups: [
          {
            id: 'materials',
            title: 'Inventario y Materiales',
            items: [
              {
                id: 'almacenes',
                title: 'Almacenes y Bodegas',
                path: '/servicio-campo/almacenes',
                iconName: 'BuildingBank',
                description: 'Centros logísticos, bodegas físicas y zonas de almacenamiento.',
              },
              {
                id: 'stock-tecnicos',
                title: 'Saldo de Técnicos (Móviles)',
                path: '/servicio-campo/stock-tecnicos',
                iconName: 'PersonToolbox',
                description: 'Existencias asignadas a vehículos y mochilas de técnicos en ruta.',
              },
              {
                id: 'stock',
                title: 'Control de Existencias (Stock)',
                path: '/servicio-campo/stock',
                iconName: 'BoxCheckmark',
                description: 'Monitoreo global de stock disponible, reservado y en tránsito.',
              },
              {
                id: 'seriados',
                title: 'Trazabilidad de Series',
                path: '/servicio-campo/seriados',
                iconName: 'Barcode',
                description: 'Historial individual por número de serie, garantías e instalaciones.',
              },
              {
                id: 'movimientos',
                title: 'Kardex y Despachos',
                path: '/servicio-campo/movimientos',
                iconName: 'ArrowRepeatAll',
                description: 'Registro histórico de entradas, salidas y transferencias de mercadería.',
              },
            ],
          },
        ],
      },
      {
        id: 'settings',
        name: 'Configuración',
        shortCode: 'C',
        iconName: 'Settings',
        color: tokens.colorPaletteBerryBorderActive,
        defaultPath: '/servicio-campo/unidades-medida',
        groups: [
          {
            id: 'catalog',
            title: 'Catálogo General',
            items: [
              {
                id: 'unidades-medida',
                title: 'Unidades de Medida',
                path: '/servicio-campo/unidades-medida',
                iconName: 'Ruler',
                description: 'Definición de unidades base, múltiplos y precisión decimal.',
              },
              {
                id: 'categorias-producto',
                title: 'Categorías y Familias',
                path: '/servicio-campo/categorias-producto',
                iconName: 'FolderOpen',
                description: 'Jerarquía taxonómica para clasificar productos y repuestos.',
              },
              {
                id: 'productos',
                title: 'Productos',
                path: '/servicio-campo/productos',
                iconName: 'Box',
                description: 'Maestro de productos y control de inventario.',
              },
            ],
          },
          {
            id: 'operations-cfg',
            title: 'Configuración Operativa',
            items: [
              {
                id: 'tipos-orden',
                title: 'Tipos de Orden (Modalidad)',
                path: '/servicio-campo/tipos-orden',
                iconName: 'TaskList',
                description: 'Modalidades de atención: preventiva, correctiva, instalación, etc.',
              },
              {
                id: 'motivos-incidencia',
                title: 'Motivos de Incidencia',
                path: '/servicio-campo/motivos-incidencia',
                iconName: 'Warning',
                description: 'Catálogo de causas de falla, problemas y motivos de reclamo.',
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
    name: 'Recursos Humanos',
    subtitle: 'Gestión de Talento & Nómina',
    shortCode: 'RH',
    iconName: 'People',
    color: tokens.colorPaletteBerryBorderActive,
    description: 'Gestión integral del talento: Colaboradores, Asistencia, Turnos, Nómina y Planillas.',
    areas: [
      {
        id: 'personal',
        name: 'Personal',
        shortCode: 'P',
        iconName: 'People',
        color: tokens.colorPaletteBerryBorderActive,
        defaultPath: '/rrhh/empleados',
        groups: [
          {
            id: 'team-mgmt',
            title: 'Gestión de Personas',
            items: [
              {
                id: 'empleados',
                title: 'Colaboradores',
                path: '/rrhh/empleados',
                iconName: 'PeopleCommunity',
                description: 'Ficha del personal, contratos, puestos y asignación departamental.',
              },
            ],
          },
        ],
      },
      {
        id: 'attendance',
        name: 'Asistencia',
        shortCode: 'A',
        iconName: 'Clock',
        color: tokens.colorPaletteBlueBorderActive,
        defaultPath: '/rrhh/asistencia',
        groups: [
          {
            id: 'time-tracking',
            title: 'Control de Asistencia',
            items: [
              {
                id: 'asistencia',
                title: 'Marcaciones y Turnos',
                path: '/rrhh/asistencia',
                iconName: 'Clock',
                description: 'Control biométrico, registro de ingresos, tardanzas y horas extras.',
              },
            ],
          },
        ],
      },
      {
        id: 'payroll',
        name: 'Nómina',
        shortCode: 'N',
        iconName: 'Money',
        color: tokens.colorPaletteGreenBorderActive,
        defaultPath: '/rrhh/planilla',
        groups: [
          {
            id: 'comp',
            title: 'Compensaciones',
            items: [
              {
                id: 'planilla',
                title: 'Planilla y Liquidaciones',
                path: '/rrhh/planilla',
                iconName: 'Money',
                description: 'Cálculo de nómina mensual, gratificaciones y beneficios laborales.',
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 3. ADMIN CENTER (Centro de Administración)
  // =========================================================================
  {
    id: 'admin-center',
    name: 'Admin Center',
    subtitle: 'Centro de Administración',
    shortCode: 'AC',
    iconName: 'Shield',
    color: tokens.colorPaletteDarkOrangeBorderActive,
    description: 'Configuración global de la plataforma: Usuarios, Roles, Auditoría y Parámetros del Sistema.',
    areas: [
      {
        id: 'security',
        name: 'Seguridad',
        shortCode: 'SEG',
        iconName: 'Shield',
        color: tokens.colorPaletteDarkOrangeBorderActive,
        defaultPath: '/configuracion/usuarios',
        groups: [
          {
            id: 'access-control',
            title: 'Control de Acceso',
            items: [
              {
                id: 'usuarios',
                title: 'Usuarios del Sistema',
                path: '/configuracion/usuarios',
                iconName: 'PersonAccounts',
                description: 'Administración de cuentas de usuario, credenciales y estados.',
              },
              {
                id: 'roles',
                title: 'Roles y Permisos',
                path: '/configuracion/roles',
                iconName: 'TaskList',
                description: 'Políticas de seguridad, perfiles y asignación de permisos.',
              },
            ],
          },
        ],
      },
      {
        id: 'system',
        name: 'Sistema',
        shortCode: 'SYS',
        iconName: 'Settings',
        color: tokens.colorPaletteNavyBorderActive,
        defaultPath: '/configuracion/auditoria',
        groups: [
          {
            id: 'sys-mgmt',
            title: 'Gestión del Sistema',
            items: [
              {
                id: 'auditoria',
                title: 'Registro de Auditoría',
                path: '/configuracion/auditoria',
                iconName: 'ClipboardTask',
                description: 'Trazabilidad de acciones, inicios de sesión y modificaciones críticas.',
              },
            ],
          },
        ],
      },
    ],
  },
];
