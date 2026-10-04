import { ENTERPRISE_APPS } from '../../data/navigation.data';
import type { EnterpriseApp } from '../../types/navigation.types';

export function canAccessPath(path: string, permisos: readonly string[]): boolean {
  const has = (permission: string) => permisos.includes(permission);
  if (path.startsWith('/configuracion/usuarios') || path.startsWith('/configuracion/roles')) {
    return has('seguridad.acceso') && (!path.includes('/nuevo') || has('seguridad.usuarios.gestionar'));
  }
  if (path.startsWith('/gestion-datos/') || path.includes('/gestion-datos/') || path.includes('/data-management/'))
    return has('inventario.catalogos.gestionar') || has('crm.clientes.eliminar');
  if (path.startsWith('/recursos-humanos') || path.startsWith('/rrhh')) return has('rrhh.acceso');
  if (path.startsWith('/crm')) return has('crm.acceso');
  if (path.startsWith('/servicio-campo/clientes')) return has('crm.acceso');
  if (path.startsWith('/servicio-campo/ordenes') || path === '/dashboard') return has('serviciocampo.acceso');
  if (path.startsWith('/servicio-campo/') || path.startsWith('/grupos-unidades')) {
    if (!has('inventario.acceso')) return false;
    if (path.endsWith('/nuevo') && !/transferencias|recepciones-compra/.test(path)) return has('inventario.catalogos.gestionar');
    return true;
  }
  return has('seguridad.acceso');
}
export function availableApps(permisos: readonly string[]): EnterpriseApp[] {
  return ENTERPRISE_APPS.map(app => ({ ...app, areas: app.areas.map(area => {
    const groups = area.groups.map(group => ({ ...group, items: group.items
      .filter(item => canAccessPath(item.path, permisos))
      .map(item => ({ ...item, subItems: item.subItems?.filter(child => canAccessPath(child.path, permisos)) }))
    })).filter(group => group.items.length > 0);
    const paths = groups.flatMap(group => group.items.map(item => item.path));
    return { ...area, groups, defaultPath: paths.includes(area.defaultPath ?? '') ? area.defaultPath : paths[0] };
  }).filter(area => area.groups.length > 0) })).filter(app => app.areas.length > 0);
}
export function homePath(permisos: readonly string[]): string {
  if (permisos.includes('seguridad.usuarios.gestionar')) return '/configuracion/usuarios';
  if (permisos.includes('inventario.acceso')) return '/servicio-campo/inventario-productos';
  return availableApps(permisos)[0]?.areas[0]?.defaultPath ?? '/sin-acceso';
}
