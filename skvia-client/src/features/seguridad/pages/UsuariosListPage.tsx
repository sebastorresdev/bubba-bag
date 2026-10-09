import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
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
  TableCellLayout,
  useId,
  useToastController,
  type SelectionItemId,
} from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowUpload16Regular,
  ChevronDown16Regular,
  Checkmark16Regular,
  ShieldPerson20Regular,
  PersonStar20Regular,
  LockClosed16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
} from '../../../components/common/D365EntityTable';
import { D365StatusBadge } from '../../../components/common/D365StatusBadge';
import { ImportacionDrawer } from '../../../components/common/ImportacionDrawer';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { useAuthSession } from '../../../services/authSession';
import { SeguridadService, type UsuarioDto } from '../services/seguridad.service';
import { ManageUserRolesDialog } from '../components/ManageUserRolesDialog';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';

type VistaUsuarios = 'todos' | 'activos' | 'inactivos';

const nombresVistaUsuarios: Record<VistaUsuarios, string> = {
  activos: 'Usuarios habilitados',
  todos: 'Todos los usuarios',
  inactivos: 'Usuarios inactivos',
};

export function UsuariosListPage() {
  const styles = useD365ListStyles(), navigate = useNavigate(), location = useLocation();
  const tableRef = useRef<D365EntityTableRef>(null);
  const toasterId = useId('usuarios-toaster');
  const { dispatchToast } = useToastController(toasterId);
  const { permisos } = useAuthSession(), canEdit = permisos.includes('seguridad.usuarios.gestionar');
  const [items, setItems] = useState<UsuarioDto[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [vista, setVista] = useState<VistaUsuarios>('activos');
  const [importOpen, setImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());
  const [manageRolesOpen, setManageRolesOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [promoting, setPromoting] = useState(false);

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
      setItems(await SeguridadService.usuarios());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  // Flash message tras redirección de creación/edición
  useEffect(() => {
    const flashMessage = (location.state as { successMessage?: string } | null)?.successMessage;
    if (!flashMessage) return;

    notifySuccess(flashMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.key, location.pathname, location.state, navigate]);

  const filtered = items.filter(x =>
    (vista === 'todos' || x.esActivo === (vista === 'activos')) &&
    `${x.nombreCompleto} ${x.email} ${x.roles.join(' ')}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  );

  const selectedUsers = useMemo(() => {
    return items.filter(u => selectedIds.has(u.id));
  }, [items, selectedIds]);

  const handlePromoteToAdmin = async () => {
    if (selectedUsers.length === 0) return;
    setPromoting(true);
    setError(null);
    try {
      for (const user of selectedUsers) {
        const rolesActuales = new Set(user.roles);
        rolesActuales.add('SuperAdmin');
        await SeguridadService.asignarRoles(user.id, Array.from(rolesActuales));
      }
      setSelectedIds(new Set());
      notifySuccess(`Se promovió a Administrador a ${selectedUsers.length} usuario(s).`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al promover a administrador.');
    } finally {
      setPromoting(false);
    }
  };

  const columns = useMemo(() => [
    createTableColumn<UsuarioDto>({
      columnId: 'nombre',
      compare: (a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto),
      renderHeaderCell: () => 'Nombre',
      renderCell: x => <Link as="button" onClick={() => navigate(`/configuracion/usuarios/${x.id}`)}>{x.nombreCompleto}</Link>
    }),
    createTableColumn<UsuarioDto>({
      columnId: 'email',
      compare: (a, b) => a.email.localeCompare(b.email),
      renderHeaderCell: () => 'Correo electrónico',
      renderCell: x => x.email
    }),
    createTableColumn<UsuarioDto>({
      columnId: 'roles',
      renderHeaderCell: () => 'Roles',
      renderCell: x => x.roles.join(', ') || 'Sin roles'
    }),
    createTableColumn<UsuarioDto>({
      columnId: 'estado',
      renderHeaderCell: () => 'Estado',
      renderCell: x => (
        <TableCellLayout truncate>
          <D365StatusBadge status={x.esActivo} />
        </TableCellLayout>
      ),
    }),
  ], [navigate]);

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} position="top-end" />
      <D365CommandBar ariaLabel="Acciones de seguridad">
        <div className={styles.toolbarLeft}>
          {canEdit && (
            <>
              <D365CommandButton tone="create" icon={<Add16Regular />} onClick={() => navigate('/configuracion/usuarios/nuevo')}>
                Nuevo
              </D365CommandButton>
              <D365CommandButton
                icon={<ShieldPerson20Regular />}
                disabled={selectedIds.size === 0}
                onClick={() => setManageRolesOpen(true)}
              >
                Administrar roles
              </D365CommandButton>
              <D365CommandButton
                icon={<LockClosed16Regular />}
                disabled={selectedIds.size !== 1}
                title={selectedIds.size === 1 ? 'Restablecer contraseña del usuario seleccionado' : 'Seleccione un único usuario'}
                onClick={() => setResetPasswordOpen(true)}
              >
                Restablecer contraseña
              </D365CommandButton>
              <D365CommandButton
                icon={<PersonStar20Regular />}
                disabled={selectedIds.size === 0 || promoting}
                onClick={() => void handlePromoteToAdmin()}
              >
                Promover a Admin
              </D365CommandButton>
              <D365CommandButton icon={<ArrowUpload16Regular />} onClick={() => setImportOpen(true)}>
                Importar usuarios
              </D365CommandButton>
            </>
          )}
          <D365CommandButton icon={<ArrowClockwise16Regular />} disabled={loading} onClick={() => void load()}>
            Actualizar
          </D365CommandButton>
        </div>
      </D365CommandBar>

      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {nombresVistaUsuarios[vista]}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              {(Object.keys(nombresVistaUsuarios) as VistaUsuarios[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={vista === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => {
                    setVista(v);
                    setSelectedIds(new Set());
                  }}
                >
                  {nombresVistaUsuarios[v]}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>
        <div className={styles.viewToolsRight}>
          <D365TableToolbarTools
            tableRef={tableRef}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar"
            searchAriaLabel="Buscar usuarios"
          />
        </div>
      </div>

      <D365EntityTable
        ref={tableRef}
        entityName="Usuarios"
        tableId="usuarios"
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
        <span>{filtered.length} usuarios</span>
        {selectedIds.size > 0 && <span>{selectedIds.size} seleccionado(s)</span>}
      </div>

      <ImportacionDrawer open={importOpen} onOpenChange={setImportOpen} targetEntityName="Usuario" onSuccess={() => { setImportOpen(false); void load(); }} />

      <ManageUserRolesDialog
        open={manageRolesOpen}
        onOpenChange={setManageRolesOpen}
        usuariosSeleccionados={selectedUsers}
        onSuccess={() => {
          setSelectedIds(new Set());
          notifySuccess('Roles actualizados exitosamente.');
          void load();
        }}
      />

      <ResetPasswordDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        usuario={selectedUsers[0] ?? null}
        onSuccess={(msg) => {
          setSelectedIds(new Set());
          notifySuccess(msg);
          void load();
        }}
      />
    </div>
  );
}
