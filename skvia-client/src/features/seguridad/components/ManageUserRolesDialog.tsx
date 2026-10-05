import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  Spinner,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ShieldPerson20Regular } from '@fluentui/react-icons';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { SeguridadService, type RolDto, type UsuarioDto } from '../services/seguridad.service';

const useStyles = makeStyles({
  surface: {
    maxWidth: '560px',
    width: '100%',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXS,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    marginBottom: tokens.spacingVerticalM,
    display: 'block',
  },
  rolesTable: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    maxHeight: '340px',
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '40px 1.5fr 1fr',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '40px 1.5fr 1fr',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    cursor: 'pointer',
  },
  roleName: {
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
  },
  roleModule: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  emptyNotice: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

interface ManageUserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuariosSeleccionados: UsuarioDto[];
  initialRoles?: string[];
  onApplyLocal?: (roles: string[]) => void;
  onSuccess: () => void;
}

export function ManageUserRolesDialog({
  open,
  onOpenChange,
  usuariosSeleccionados,
  initialRoles,
  onApplyLocal,
  onSuccess,
}: ManageUserRolesDialogProps) {
  const styles = useStyles();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rolesCatalog, setRolesCatalog] = useState<RolDto[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(true);

    void SeguridadService.roles()
      .then((catalogo) => {
        setRolesCatalog(catalogo);
        if (initialRoles) {
          setSelectedRoles([...initialRoles]);
        } else if (usuariosSeleccionados.length === 1) {
          setSelectedRoles([...usuariosSeleccionados[0].roles]);
        } else if (usuariosSeleccionados.length > 1) {
          // Si son múltiples, intersección de roles comunes
          const intersection = catalogo
            .filter((rol) =>
              usuariosSeleccionados.every((u) => u.roles.includes(rol.codigo))
            )
            .map((r) => r.codigo);
          setSelectedRoles(intersection);
        } else {
          setSelectedRoles([]);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar roles'))
      .finally(() => setLoading(false));
  }, [open, usuariosSeleccionados, initialRoles]);

  const toggleRole = (codigo: string) => {
    setSelectedRoles((prev) =>
      prev.includes(codigo) ? prev.filter((r) => r !== codigo) : [...prev, codigo]
    );
  };

  const handleSave = async () => {
    if (onApplyLocal) {
      onApplyLocal(selectedRoles);
      onSuccess();
      onOpenChange(false);
      return;
    }

    if (!usuariosSeleccionados.length) return;
    setSaving(true);
    setError(null);

    try {
      // Asignar los roles seleccionados a cada usuario
      for (const usuario of usuariosSeleccionados) {
        await SeguridadService.asignarRoles(usuario.id, selectedRoles);
      }
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar los roles.');
    } finally {
      setSaving(false);
    }
  };

  const count = usuariosSeleccionados.length;
  const subtitleText =
    count === 1
      ? `¿Qué roles desea aplicar a ${usuariosSeleccionados[0].nombreCompleto}?`
      : `¿Qué roles desea aplicar a los ${count} usuarios seleccionados?`;

  return (
    <Dialog open={open} onOpenChange={(_, d) => !saving && onOpenChange(d.open)}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>
            <div className={styles.dialogHeader}>
              <ShieldPerson20Regular />
              <span>Administrar roles de usuario</span>
            </div>
          </DialogTitle>
          <Text className={styles.subtitle}>{subtitleText}</Text>

          <DialogContent>
            {error && <D365MessageBar intent="error">{error}</D365MessageBar>}

            {loading ? (
              <Spinner label="Cargando roles disponibles..." />
            ) : (
              <div className={styles.rolesTable}>
                <div className={styles.tableHeader}>
                  <span />
                  <span>Nombre del rol</span>
                  <span>Módulo / Categoría</span>
                </div>
                {rolesCatalog.length === 0 ? (
                  <div className={styles.emptyNotice}>No hay roles configurados.</div>
                ) : (
                  rolesCatalog.map((rol) => {
                    const isChecked = selectedRoles.includes(rol.codigo);
                    return (
                      <div
                        key={rol.codigo}
                        className={styles.tableRow}
                        onClick={() => toggleRole(rol.codigo)}
                      >
                        <Checkbox
                          checked={isChecked}
                          onChange={() => toggleRole(rol.codigo)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <div className={styles.roleName}>{rol.nombreVisible}</div>
                        </div>
                        <div className={styles.roleModule}>{rol.modulo}</div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              disabled={loading || saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'Guardando...' : 'Aceptar'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
