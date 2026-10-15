import { OverlayDrawer, DrawerHeader, DrawerHeaderTitle, DrawerBody, Button, Text } from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import type { PermisoDefinicionDto } from '../types/seguridad.types';

interface PermisosDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  permisos: string[];
  catalogoPermisos: PermisoDefinicionDto[];
}

export function PermisosDrawer({ open, onClose, title, permisos, catalogoPermisos }: PermisosDrawerProps) {
  const catalogo = new Map(catalogoPermisos.map(permiso => [permiso.codigo, permiso]));
  const grupos = new Map<string, Array<{ codigo: string; titulo: string; descripcion: string }>>();
  for (const codigo of new Set(permisos)) {
    const permiso = catalogo.get(codigo);
    const modulo = permiso?.modulo ?? 'Otros permisos';
    const grupo = grupos.get(modulo) ?? [];
    grupo.push({ codigo, titulo: permiso?.titulo ?? codigo,
      descripcion: permiso?.descripcion ?? 'Este permiso no figura en el catálogo actual. Consulte al administrador antes de utilizarlo.' });
    grupos.set(modulo, grupo);
  }

  return <OverlayDrawer open={open} position="end" size="medium" onOpenChange={(_, d) => { if (!d.open) onClose(); }}>
    <DrawerHeader><DrawerHeaderTitle action={<Button appearance="subtle" aria-label="Cerrar permisos" icon={<DismissRegular />} onClick={onClose} />}>{title}</DrawerHeaderTitle></DrawerHeader>
    <DrawerBody>
      {[...grupos].sort(([a], [b]) => a.localeCompare(b)).map(([modulo, grupo]) => (
        <section key={modulo} aria-label={modulo}>
          <h3>{modulo}</h3>
          <ul style={{ paddingLeft: '20px' }}>
            {grupo.sort((a, b) => a.titulo.localeCompare(b.titulo)).map(permiso => (
              <li key={permiso.codigo} style={{ marginBottom: '16px' }}>
                <Text weight="semibold">{permiso.titulo}</Text>
                <Text block style={{ marginTop: '4px', lineHeight: '1.5' }}>{permiso.descripcion}</Text>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!permisos.length && <Text>No tiene permisos asignados.</Text>}
    </DrawerBody>
  </OverlayDrawer>;
}
