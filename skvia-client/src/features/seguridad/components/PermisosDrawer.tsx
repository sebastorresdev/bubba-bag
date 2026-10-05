import { OverlayDrawer, DrawerHeader, DrawerHeaderTitle, DrawerBody, Button, Text } from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
export const permissionLabels: Record<string, string> = {
  'serviciocampo.acceso': 'Acceder a Servicio de Campo',
  'serviciocampo.ordenes.ver_todas': 'Consultar todas las órdenes de trabajo',
  'serviciocampo.ordenes.ver_asignadas': 'Consultar órdenes asignadas',
  'serviciocampo.ordenes.crear': 'Crear órdenes de trabajo',
  'serviciocampo.ordenes.asignar': 'Asignar trabajo a recursos',
  'serviciocampo.ordenes.operar_campo': 'Registrar trabajo en campo',
  'serviciocampo.ordenes.cerrar': 'Cerrar órdenes de trabajo',
  'serviciocampo.catalogos.gestionar': 'Gestionar catálogos de servicio',
  'crm.acceso': 'Acceder a CRM',
  'crm.clientes.ver': 'Consultar clientes',
  'crm.clientes.crear': 'Crear clientes',
  'crm.clientes.editar': 'Editar clientes',
  'crm.clientes.eliminar': 'Eliminar clientes',
  'crm.segmentacion.avanzada': 'Usar segmentación comercial',
  'rrhh.acceso': 'Acceder a Recursos Humanos',
  'rrhh.colaboradores.ver': 'Consultar colaboradores',
  'rrhh.colaboradores.gestionar': 'Gestionar colaboradores',
  'rrhh.salarios.confidencial': 'Consultar información salarial confidencial',
  'rrhh.catalogos.gestionar': 'Gestionar catálogos de Recursos Humanos',
  'inventario.acceso': 'Consultar inventario y catálogos', 'inventario.catalogos.gestionar': 'Crear y editar productos, almacenes y estructura operativa',
  'inventario.operar': 'Registrar movimientos en almacenes autorizados', 'inventario.accesos.gestionar': 'Asignar autorizaciones por almacén',
  'seguridad.acceso': 'Consultar usuarios y roles', 'seguridad.usuarios.gestionar': 'Crear usuarios, asignar roles y restablecer contraseñas',
  'seguridad.roles.gestionar': 'Administración del catálogo técnico de roles',
};
export function PermisosDrawer({ open, onClose, title, permisos }: { open: boolean; onClose: () => void; title: string; permisos: string[] }) {
  return <OverlayDrawer open={open} position="end" size="medium" onOpenChange={(_, d) => { if (!d.open) onClose(); }}>
    <DrawerHeader><DrawerHeaderTitle action={<Button appearance="subtle" aria-label="Cerrar permisos" icon={<DismissRegular />} onClick={onClose} />}>{title}</DrawerHeaderTitle></DrawerHeader>
    <DrawerBody>
      <ul>{[...new Set(permisos)].sort().map(p => <li key={p}>{permissionLabels[p] ?? p}</li>)}</ul>
      {!permisos.length && <Text>No tiene capacidades asignadas.</Text>}
    </DrawerBody>
  </OverlayDrawer>;
}
