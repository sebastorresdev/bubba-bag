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
                id: 'cuentas',
                title: 'Cuentas',
                path: '/servicio-campo/cuentas',
                iconName: 'BuildingBank',
                description: 'Directorio de empresas, proveedores (DIRECTV) y clientes corporativos.',
              },
              {
                id: 'contactos',
                title: 'Contactos',
                path: '/servicio-campo/contactos',
                iconName: 'PersonAccounts',
                description: 'Personas naturales, abonados residenciales y personas de contacto.',
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
        defaultPath: '/servicio-campo/inventario-productos',
        groups: [
          {
            id: 'inventory-operations',
            title: 'Operaciones de Almacén',
            items: [
              {
                id: 'recepciones-compra',
                title: 'Recepciones de Material',
                path: '/servicio-campo/recepciones-compra',
                iconName: 'BoxCheckmark',
                badge: 'Ingresos',
                description: 'Recepción y validación de guías de remisión (DIRECTV) y compras de insumos.',
              },
              {
                id: 'despacho-tecnicos',
                title: 'Despacho a Técnicos',
                path: '/servicio-campo/despacho-tecnicos',
                iconName: 'VehicleTruckProfile',
                description: 'Dotación de repuestos y materiales a personal técnico con cargo oficial.',
              },
              {
                id: 'devolucion-tecnicos',
                title: 'Desabastecimiento de Técnicos',
                path: '/servicio-campo/devolucion-tecnicos',
                iconName: 'ArrowRepeatAll',
                description: 'Recepción y descargo de materiales y equipos de técnicos hacia el almacén.',
              },
              {
                id: 'declaracion-doa',
                title: 'Declaración DOA / Reclasificación',
                path: '/servicio-campo/declaracion-doa',
                iconName: 'Warning',
                description: 'Pase de equipos disponibles a cuarentena/devolución por avería con motivo de retiro.',
              },
              {
                id: 'transferencias',
                title: 'Traslado entre Almacenes',
                path: '/servicio-campo/transferencias',
                iconName: 'ArrowSync',
                description: 'Movimiento de materiales entre sedes y bodegas con guías de remisión.',
              },
              {
                id: 'retiro-defectuoso-proveedor',
                title: 'Retiro Material Defectuoso a OL',
                path: '/servicio-campo/retiro-defectuoso-proveedor',
                iconName: 'ArrowExit',
                badge: 'Garantías',
                description: 'Pedido de retiro de equipos defectuosos, DOA y garantías hacia el operador logístico (OL).',
              },
              {
                id: 'retiro-ok-proveedor',
                title: 'Retiro Material OK hacia OL',
                path: '/servicio-campo/retiro-ok-proveedor',
                iconName: 'ArrowReply',
                badge: 'Disponible',
                description: 'Devolución de material disponible por baja rotación (>60 días sin activación) hacia el OL.',
              },
              {
                id: 'ajustes',
                title: 'Ajustes de Inventario',
                path: '/servicio-campo/ajustes-inventario',
                iconName: 'ClipboardTask',
                description: 'Regularizaciones justificadas de entradas, salidas y mermas de inventario.',
              },
            ],
          },
          {
            id: 'inventory-control',
            title: 'Control y Existencias',
            items: [
              {
                id: 'inventario-productos',
                title: 'Existencias de Productos',
                path: '/servicio-campo/inventario-productos',
                iconName: 'Box',
                description: 'Stock físico de productos por almacén y ubicación.',
              },
              {
                id: 'trazabilidad-series',
                title: 'Trazabilidad de Series',
                path: '/servicio-campo/series',
                iconName: 'Tag',
                description: 'Control 360° de decos, routers y equipos por serie, técnico y cliente.',
              },
              {
                id: 'almacenes',
                title: 'Almacenes y Ubicaciones',
                path: '/servicio-campo/almacenes',
                iconName: 'BuildingBank',
                description: 'Centros principales, almacenes zonales y bodegas móviles.',
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
              {
                id: 'listas-precios',
                title: 'Listas de Precios',
                path: '/servicio-campo/listas-precios',
                iconName: 'Money',
                description: 'Gestión de listas y niveles de precios para productos y servicios.',
              },
            ],
          },
          {
            id: 'organization-cfg',
            title: 'Estructura Organizacional',
            items: [
              {
                id: 'unidades-organizativas',
                title: 'Unidades Organizativas',
                path: '/servicio-campo/unidades-organizativas',
                iconName: 'BuildingBank',
                description: 'Sedes territoriales y bases operativas de la organización.',
              },
              {
                id: 'territorios',
                title: 'Territorios',
                path: '/servicio-campo/territorios',
                iconName: 'Globe',
                description: 'Zonas y áreas de cobertura geográfica para asignación.',
              },
              {
                id: 'recursos',
                title: 'Recursos Reservables',
                path: '/servicio-campo/recursos',
                iconName: 'People',
                description: 'Técnicos de campo, despachadores y personal operativo.',
              },
            ],
          },
          {
            id: 'operations-cfg',
            title: 'Configuración Operativa',
            items: [
              {
                id: 'tipos-orden',
                title: 'Tipos de Orden',
                path: '/servicio-campo/tipos-orden',
                iconName: 'TaskList',
                description: 'Modalidades de atención: preventiva, correctiva, instalación, etc.',
              },
              {
                id: 'configuraciones-servicio',
                title: 'Configuraciones de servicio',
                path: '/servicio-campo/configuraciones-servicio',
                iconName: 'DocumentBulletList',
                description: 'Recetas técnicas: tareas requeridas, productos y servicios asociados.',
              },
              {
                id: 'tareas-catalogo',
                title: 'Catálogo de Tareas',
                path: '/servicio-campo/tareas',
                iconName: 'ClipboardTask',
                description: 'Tareas técnicas atómicas y checklist para el trabajo en campo.',
              },
              {
                id: 'motivos-retiro',
                title: 'Motivos de Retiro de Equipos',
                path: '/servicio-campo/motivos-retiro',
                iconName: 'ArrowRepeatAll',
                description: 'Catálogo de causas de retiro: averías técnicas, upgrades, bajas comerciales y DOA.',
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
    name: 'Centro de administración',
    subtitle: 'Centro de Administración',
    shortCode: 'AC',
    iconName: 'Shield',
    color: tokens.colorPaletteDarkOrangeBorderActive,
    description: 'Administración global de usuarios, seguridad, auditoría y gestión de datos.',
    areas: [
      {
        id: 'security',
        name: 'Seguridad',
        shortCode: 'S',
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
        shortCode: 'S',
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
              {
                id: 'empresa',
                title: 'Datos de la Empresa',
                path: '/configuracion/empresa',
                iconName: 'BuildingBank',
                description: 'Razón social, RUC, logo institucional y pie de página de documentos.',
              },
            ],
          },
        ],
      },
      {
        id: 'data-management',
        name: 'Gestión de datos',
        shortCode: 'G',
        iconName: 'ArrowUpload',
        color: tokens.colorPaletteNavyBorderActive,
        defaultPath: '/gestion-datos/importaciones',
        groups: [
          {
            id: 'data-imports',
            title: 'Importación de datos',
            items: [
              {
                id: 'importaciones',
                title: 'Historial de importaciones',
                path: '/gestion-datos/importaciones',
                iconName: 'ArrowUpload',
                description: 'Cargas de datos de todos los módulos, estado de procesamiento y errores por corregir.',
              },
            ],
          },
        ],
      },
    ],
  },
];
