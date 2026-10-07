import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  Input,
  Select,
  Badge,
  Tooltip,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Key20Regular,
  Search16Regular,
  Info16Regular,
} from '@fluentui/react-icons';
import type { PermisoDefinicionDto } from '../types/seguridad.types';

const useStyles = makeStyles({
  surface: {
    maxWidth: '680px',
    width: '100%',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  filtersRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  searchInput: {
    flex: 1,
  },
  moduleSelect: {
    minWidth: '180px',
  },
  tableContainer: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    maxHeight: '360px',
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  tableHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: '40px 1.8fr 1.2fr 1.4fr',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '40px 1.8fr 1.2fr 1.4fr',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    cursor: 'pointer',
  },
  permTitle: {
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  permDesc: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    lineHeight: '1.2',
  },
  permCode: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  emptyNotice: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  footerInfo: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

interface ManageRolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rolNombre?: string;
  catalogoPermisos: PermisoDefinicionDto[];
  permisosSeleccionados: string[];
  onApply: (nuevosPermisos: string[]) => void;
}

export function ManageRolePermissionsDialog({
  open,
  onOpenChange,
  rolNombre,
  catalogoPermisos,
  permisosSeleccionados,
  onApply,
}: ManageRolePermissionsDialogProps) {
  const styles = useStyles();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('todos');

  // Inicializar permisos seleccionados al abrir
  useEffect(() => {
    if (open) {
      setSelected(new Set(permisosSeleccionados));
      setSearch('');
      setSelectedModule('todos');
    }
  }, [open, permisosSeleccionados]);

  // Módulos únicos disponibles en el catálogo
  const modulesList = useMemo(() => {
    const set = new Set<string>();
    for (const p of catalogoPermisos) {
      if (p.modulo) set.add(p.modulo);
    }
    return Array.from(set).sort();
  }, [catalogoPermisos]);

  // Lista filtrada
  const filteredPermissions = useMemo(() => {
    const s = search.trim().toLowerCase();
    return catalogoPermisos.filter((p) => {
      const matchMod = selectedModule === 'todos' || p.modulo === selectedModule;
      if (!matchMod) return false;
      if (!s) return true;
      return (
        p.titulo.toLowerCase().includes(s) ||
        p.codigo.toLowerCase().includes(s) ||
        p.modulo.toLowerCase().includes(s) ||
        p.descripcion.toLowerCase().includes(s)
      );
    });
  }, [catalogoPermisos, search, selectedModule]);

  const toggleOne = (codigo: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) {
        next.delete(codigo);
      } else {
        next.add(codigo);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of filteredPermissions) {
        next.add(p.codigo);
      }
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of filteredPermissions) {
        next.delete(p.codigo);
      }
      return next;
    });
  };

  const handleSave = () => {
    onApply(Array.from(selected));
    onOpenChange(false);
  };

  const allFilteredSelected =
    filteredPermissions.length > 0 &&
    filteredPermissions.every((p) => selected.has(p.codigo));

  const someFilteredSelected =
    !allFilteredSelected && filteredPermissions.some((p) => selected.has(p.codigo));

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle
            action={
              <Tooltip
                content="Marque o desmarque los permisos del sistema que heredan los usuarios con este rol."
                relationship="description"
              >
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Info16Regular />}
                  aria-label="Más información sobre permisos"
                />
              </Tooltip>
            }
          >
            <div className={styles.dialogHeader}>
              <Key20Regular />
              <span>Administrar permisos{rolNombre ? ` · ${rolNombre}` : ''}</span>
            </div>
          </DialogTitle>

          <DialogContent>
            {/* Filtros rápidos: búsqueda y módulo */}
            <div className={styles.filtersRow}>
              <Input
                className={styles.searchInput}
                size="medium"
                contentBefore={<Search16Regular />}
                placeholder="Buscar permiso por nombre o código..."
                value={search}
                onChange={(_, d) => setSearch(d.value)}
              />
              <Select
                className={styles.moduleSelect}
                value={selectedModule}
                onChange={(_, d) => setSelectedModule(d.value)}
              >
                <option value="todos">Todos los módulos</option>
                {modulesList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>

            {/* Tabla limpia de permisos */}
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <Checkbox
                  checked={
                    allFilteredSelected ? true : someFilteredSelected ? 'mixed' : false
                  }
                  onChange={() => {
                    if (allFilteredSelected) {
                      handleDeselectAllFiltered();
                    } else {
                      handleSelectAllFiltered();
                    }
                  }}
                />
                <span>Capacidad / Permiso</span>
                <span>Módulo</span>
                <span>Código técnico</span>
              </div>

              {filteredPermissions.length === 0 ? (
                <div className={styles.emptyNotice}>
                  No se encontraron permisos con los criterios indicados.
                </div>
              ) : (
                filteredPermissions.map((p) => {
                  const isChecked = selected.has(p.codigo);
                  return (
                    <div
                      key={p.codigo}
                      className={styles.tableRow}
                      onClick={() => toggleOne(p.codigo)}
                    >
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleOne(p.codigo)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <div className={styles.permTitle}>{p.titulo}</div>
                        {p.descripcion && (
                          <div className={styles.permDesc}>{p.descripcion}</div>
                        )}
                      </div>
                      <div>
                        <Badge appearance="tint" shape="rounded" color="subtle">
                          {p.modulo}
                        </Badge>
                      </div>
                      <div className={styles.permCode}>{p.codigo}</div>
                    </div>
                  );
                })
              )}
            </div>
          </DialogContent>

          <DialogActions style={{ justifyContent: 'space-between', marginTop: tokens.spacingVerticalM }}>
            <span className={styles.footerInfo}>
              <strong>{selected.size}</strong> de {catalogoPermisos.length} seleccionados
            </span>
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
              <Button appearance="secondary" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleSave}>
                Aceptar
              </Button>
            </div>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
