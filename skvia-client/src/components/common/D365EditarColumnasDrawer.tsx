import { useState, useEffect } from 'react';
import {
  Button,
  Checkbox,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Input,
  OverlayDrawer,
  Text,
  makeStyles,
  tokens,
  typographyStyles,
} from '@fluentui/react-components';
import {
  ArrowClockwise16Regular,
  ArrowDown16Regular,
  ArrowUp16Regular,
  DismissRegular,
  Search16Regular,
} from '@fluentui/react-icons';

export interface D365ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  fixed?: boolean;
}

const useStyles = makeStyles({
  drawer: {
    width: '420px',
    maxWidth: '90vw',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow64,
  },
  drawerHeader: {
    padding: '16px 20px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerTitle: {
    ...typographyStyles.subtitle2,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  subActionsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  actionLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorBrandForegroundLink,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '4px 6px',
    borderRadius: tokens.borderRadiusSmall,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
      textDecorationLine: 'underline',
    },
  },
  bodyContent: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  searchBox: {
    width: '100%',
  },
  columnList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '6px',
    maxHeight: '450px',
    overflowY: 'auto',
  },
  columnItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 10px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    overflow: 'hidden',
  },
  itemLabel: {
    fontSize: tokens.fontSizeBase300,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  iconBtn: {
    minWidth: '28px',
    padding: '4px',
  },
  footer: {
    padding: '16px 20px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
});

interface D365EditarColumnasDrawerProps {
  open: boolean;
  onClose: () => void;
  entityName: string;
  columns: D365ColumnConfig[];
  defaultColumns: D365ColumnConfig[];
  onApply: (updated: D365ColumnConfig[]) => void;
}

export function D365EditarColumnasDrawer({
  open,
  onClose,
  entityName,
  columns,
  defaultColumns,
  onApply,
}: D365EditarColumnasDrawerProps) {
  const styles = useStyles();
  const [localColumns, setLocalColumns] = useState<D365ColumnConfig[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      setLocalColumns([...columns]);
      setSearch('');
    }
  }, [open, columns]);

  const handleToggle = (id: string) => {
    setLocalColumns((prev) => {
      const target = prev.find((c) => c.id === id);
      if (!target) return prev;
      // Impedir desmarcar si es la última columna visible
      const visiblesCount = prev.filter((c) => c.visible).length;
      if (target.visible && visiblesCount <= 1) return prev;

      return prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c));
    });
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setLocalColumns((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= localColumns.length - 1) return;
    setLocalColumns((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleReset = () => {
    setLocalColumns([...defaultColumns]);
  };

  const handleApply = () => {
    onApply(localColumns);
    onClose();
  };

  const filteredColumns = localColumns.filter((col) =>
    col.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <OverlayDrawer
      open={open}
      position="end"
      className={styles.drawer}
      onOpenChange={(_, state) => {
        if (!state.open) onClose();
      }}
    >
      <DrawerHeader className={styles.drawerHeader}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Cerrar"
              icon={<DismissRegular />}
              onClick={onClose}
            />
          }
        >
          <span className={styles.headerTitle}>Editar columnas: {entityName}</span>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <div className={styles.subActionsBar}>
        <button
          type="button"
          className={styles.actionLink}
          onClick={handleReset}
          title="Restablecer columnas originales"
        >
          <ArrowClockwise16Regular />
          Restablecer valores predeterminados
        </button>
        <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
          {localColumns.filter((c) => c.visible).length} de {localColumns.length} visibles
        </Text>
      </div>

      <DrawerBody className={styles.bodyContent}>
        <Input
          className={styles.searchBox}
          size="medium"
          contentBefore={<Search16Regular />}
          placeholder="Buscar columna..."
          value={search}
          onChange={(_, d) => setSearch(d.value)}
        />

        <div className={styles.columnList}>
          {filteredColumns.map((col) => {
            const originalIndex = localColumns.findIndex((c) => c.id === col.id);
            return (
              <div key={col.id} className={styles.columnItem}>
                <div className={styles.itemLeft}>
                  <Checkbox
                    checked={col.visible}
                    disabled={col.fixed}
                    onChange={() => handleToggle(col.id)}
                    aria-label={`Mostrar u ocultar ${col.label}`}
                  />
                  <span className={styles.itemLabel}>{col.label}</span>
                </div>

                <div className={styles.itemActions}>
                  <Button
                    className={styles.iconBtn}
                    size="small"
                    appearance="subtle"
                    icon={<ArrowUp16Regular />}
                    disabled={originalIndex === 0}
                    title="Mover arriba"
                    onClick={() => handleMoveUp(originalIndex)}
                  />
                  <Button
                    className={styles.iconBtn}
                    size="small"
                    appearance="subtle"
                    icon={<ArrowDown16Regular />}
                    disabled={originalIndex === localColumns.length - 1}
                    title="Mover abajo"
                    onClick={() => handleMoveDown(originalIndex)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </DrawerBody>

      <DrawerFooter className={styles.footer}>
        <Button appearance="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button appearance="primary" onClick={handleApply}>
          Aplicar
        </Button>
      </DrawerFooter>
    </OverlayDrawer>
  );
}
