import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  Link,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Text,
  Toast,
  Toaster,
  ToastTitle,
  createTableColumn,
  useId,
  useToastController,
  type SelectionItemId,
} from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ChevronDown16Regular,
  Checkmark16Regular,
  Delete16Regular,
  Eye16Regular,
  Key16Regular,
  Search16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import { D365EntityTable } from '../../../components/common/D365EntityTable';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { useAuthSession } from '../../../services/authSession';
import { SeguridadService, type PermisoDefinicionDto, type RolDto } from '../services/seguridad.service';
import { PermisosDrawer } from '../components/PermisosDrawer';
import { ManageRolePermissionsDialog } from '../components/ManageRolePermissionsDialog';

type VistaRoles = 'todos' | 'sistema' | 'personalizados';

const nombresVistaRoles: Record<VistaRoles, string> = {
  todos: 'Todos los roles',
  sistema: 'Roles del sistema',
  personalizados: 'Roles personalizados',
};

export function RolesListPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const session = useAuthSession();
  const canEdit = session.permisos.includes('seguridad.roles.gestionar');

  const toasterId = useId('roles-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [items, setItems] = useState<RolDto[]>([]);
  const [catalogoPermisos, setCatalogoPermisos] = useState<PermisoDefinicionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [vista, setVista] = useState<VistaRoles>('todos');
  const [selectedDrawer, setSelectedDrawer] = useState<RolDto | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());
  const [managePermisosOpen, setManagePermisosOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const notifySuccess = (title: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesData, permisosData] = await Promise.all([
        SeguridadService.roles(),
        SeguridadService.permisos(),
      ]);
      setItems(rolesData);
      setCatalogoPermisos(permisosData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((x) => {
      const matchVista =
        vista === 'todos' ||
        (vista === 'sistema' && x.esSistema) ||
        (vista === 'personalizados' && !x.esSistema);
      const matchSearch = `${x.nombreVisible} ${x.modulo} ${x.codigo}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchVista && matchSearch;
    });
  }, [items, vista, search]);

  const selectedRoles = useMemo(() => {
    return items.filter((r) => selectedIds.has(r.id));
  }, [items, selectedIds]);

  const singleSelectedRole = selectedRoles.length === 1 ? selectedRoles[0] : null;

  // Reglas de negocio estrictas:
  // 1. Roles de sistema NUNCA se pueden modificar ni eliminar.
  // 2. Roles personalizados solo se pueden eliminar si no tienen usuarios asignados.
  const canManagePermissions = !!singleSelectedRole && !singleSelectedRole.esSistema;
  const canDeleteRole =
    !!singleSelectedRole &&
    !singleSelectedRole.esSistema &&
    (singleSelectedRole.usuariosCount ?? 0) === 0;

  let managePermissionsTitle = 'Administrar permisos del rol seleccionado';
  if (selectedIds.size === 0) {
    managePermissionsTitle = 'Seleccione un rol para administrar sus permisos';
  } else if (selectedIds.size > 1) {
    managePermissionsTitle = 'Seleccione un único rol para administrar sus permisos';
  } else if (singleSelectedRole?.esSistema) {
    managePermissionsTitle = 'Los roles del sistema son predefinidos y no se pueden modificar';
  }

  let deleteRoleTitle = 'Eliminar rol de seguridad';
  if (selectedIds.size === 0) {
    deleteRoleTitle = 'Seleccione un rol para eliminar';
  } else if (selectedIds.size > 1) {
    deleteRoleTitle = 'Seleccione un único rol para eliminar';
  } else if (singleSelectedRole?.esSistema) {
    deleteRoleTitle = 'Los roles del sistema son predefinidos y no se pueden eliminar';
  } else if ((singleSelectedRole?.usuariosCount ?? 0) > 0) {
    deleteRoleTitle = 'No se puede eliminar porque tiene usuarios asignados';
  }

  const handleEliminarRol = async () => {
    if (!singleSelectedRole || singleSelectedRole.esSistema || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await SeguridadService.eliminarRol(singleSelectedRole.id);
      setSelectedIds(new Set());
      setDeleteDialogOpen(false);
      notifySuccess(`Rol "${singleSelectedRole.nombreVisible}" eliminado correctamente.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el rol.');
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleApplyPermissions = async (nuevosPermisos: string[]) => {
    if (!singleSelectedRole || singleSelectedRole.esSistema) return;
    try {
      await SeguridadService.actualizarRol(singleSelectedRole.id, {
        nombreVisible: singleSelectedRole.nombreVisible,
        modulo: singleSelectedRole.modulo,
        descripcion: singleSelectedRole.descripcion,
        permisos: nuevosPermisos,
      });
      setSelectedIds(new Set());
      setManagePermisosOpen(false);
      notifySuccess(
        `Permisos del rol "${singleSelectedRole.nombreVisible}" actualizados exitosamente.`
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron actualizar los permisos.');
    }
  };

  const columns = useMemo(
    () => [
      createTableColumn<RolDto>({
        columnId: 'nombre',
        renderHeaderCell: () => 'Rol de seguridad',
        renderCell: (x) => (
          <Link as="button" onClick={() => navigate(`/configuracion/roles/${x.id}`)}>
            {x.nombreVisible}
          </Link>
        ),
      }),
      createTableColumn<RolDto>({
        columnId: 'tipo',
        renderHeaderCell: () => 'Tipo',
        renderCell: (x) => (
          <Badge appearance="tint" color={x.esSistema ? 'informative' : 'subtle'}>
            {x.esSistema ? 'Sistema' : 'Personalizado'}
          </Badge>
        ),
      }),
      createTableColumn<RolDto>({
        columnId: 'modulo',
        compare: (a, b) => a.modulo.localeCompare(b.modulo),
        renderHeaderCell: () => 'Módulo',
        renderCell: (x) => x.modulo,
      }),
      createTableColumn<RolDto>({
        columnId: 'permisos',
        renderHeaderCell: () => 'Permisos',
        renderCell: (x) => (
          <Button
            size="small"
            appearance="subtle"
            icon={<Eye16Regular />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDrawer(x);
            }}
          >
            {x.permisos.length} asignados
          </Button>
        ),
      }),
      createTableColumn<RolDto>({
        columnId: 'usuarios',
        renderHeaderCell: () => 'Usuarios',
        renderCell: (x) => x.usuariosCount ?? 0,
      }),
      createTableColumn<RolDto>({
        columnId: 'descripcion',
        renderHeaderCell: () => 'Alcance / Propósito',
        renderCell: (x) => x.descripcion,
      }),
    ],
    [navigate]
  );

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} position="top-end" />

      <D365CommandBar ariaLabel="Acciones de roles y seguridad">
        <div className={styles.toolbarLeft}>
          {canEdit && (
            <>
              <D365CommandButton
                tone="create"
                icon={<Add16Regular />}
                disabled={loading}
                onClick={() => navigate('/configuracion/roles/nuevo')}
              >
                Nuevo
              </D365CommandButton>
              <D365CommandButton
                icon={<Key16Regular />}
                disabled={!canManagePermissions}
                title={managePermissionsTitle}
                onClick={() => setManagePermisosOpen(true)}
              >
                Administrar permisos
              </D365CommandButton>
              <D365CommandButton
                tone="danger"
                icon={<Delete16Regular />}
                disabled={!canDeleteRole}
                title={deleteRoleTitle}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Eliminar
              </D365CommandButton>
            </>
          )}
          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            disabled={loading}
            onClick={() => void load()}
          >
            Actualizar
          </D365CommandButton>
        </div>
      </D365CommandBar>

      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {nombresVistaRoles[vista]}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              {(Object.keys(nombresVistaRoles) as VistaRoles[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={vista === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => {
                    setVista(v);
                    setSelectedIds(new Set());
                  }}
                >
                  {nombresVistaRoles[v]}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>
        <div className={styles.viewToolsRight}>
          <Input
            className={styles.searchBox}
            size="medium"
            contentBefore={<Search16Regular />}
            placeholder="Buscar"
            aria-label="Buscar roles"
            value={search}
            onChange={(_, d) => setSearch(d.value)}
          />
        </div>
      </div>

      <D365EntityTable
        items={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
      />

      <div className={styles.footer}>
        <span>{filtered.length} roles</span>
        {selectedIds.size > 0 && <span>{selectedIds.size} seleccionado(s)</span>}
      </div>

      <PermisosDrawer
        open={!!selectedDrawer}
        onClose={() => setSelectedDrawer(null)}
        title={
          selectedDrawer
            ? `${selectedDrawer.modulo} · ${selectedDrawer.nombreVisible}`
            : 'Permisos'
        }
        permisos={selectedDrawer?.permisos ?? []}
      />

      {/* Diálogo modal para administrar permisos directamente desde la lista */}
      <ManageRolePermissionsDialog
        open={managePermisosOpen}
        onOpenChange={setManagePermisosOpen}
        rolNombre={singleSelectedRole?.nombreVisible}
        catalogoPermisos={catalogoPermisos}
        permisosSeleccionados={singleSelectedRole?.permisos ?? []}
        onApply={(nuevos) => void handleApplyPermissions(nuevos)}
      />

      {/* Diálogo de confirmación para eliminar rol */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(_, d) => !deleting && setDeleteDialogOpen(d.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Eliminar rol de seguridad</DialogTitle>
            <DialogContent>
              ¿Está seguro de que desea eliminar el rol{' '}
              <strong>{singleSelectedRole?.nombreVisible}</strong>? Esta acción es
              irreversible.
            </DialogContent>
            <DialogActions>
              <Button disabled={deleting} onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                disabled={deleting}
                onClick={() => void handleEliminarRol()}
              >
                {deleting ? 'Eliminando...' : 'Eliminar definitivamente'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
