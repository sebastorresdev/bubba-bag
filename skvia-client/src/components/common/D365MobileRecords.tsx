import React, { useId, useState, type ReactNode } from 'react';
import {
  Button,
  Checkbox,
  Input,
  Select,
  Combobox,
  Dropdown,
  SpinButton,
  Badge,
  makeStyles,
  tokens,
  type TableColumnDefinition,
  type SelectionItemId,
} from '@fluentui/react-components';

function labelControls(node: ReactNode, labelId: string): ReactNode {
  if (Array.isArray(node)) return node.map((child) => labelControls(child, labelId));
  if (!React.isValidElement<{ children?: ReactNode; 'aria-label'?: string; 'aria-labelledby'?: string }>(node)) return node;
  const isControl = [Input, Select, Combobox, Dropdown, SpinButton].some((control) => node.type === control);
  const props = isControl && !node.props['aria-label'] && !node.props['aria-labelledby'] ? { 'aria-labelledby': labelId } : {};
  return React.cloneElement(node, { ...props, ...(node.props.children !== undefined ? { children: labelControls(node.props.children, labelId) } : {}) });
}

const useStyles = makeStyles({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
  },
  card: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground1,
    minWidth: 0,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxSizing: 'border-box',
    width: '100%',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '10px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    gap: '8px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
    flex: 1,
  },
  indexBadge: {
    fontFamily: 'monospace',
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px 14px',
    margin: 0,
  },
  field: {
    margin: 0,
    minWidth: 0,
    '& > dt': {
      fontSize: tokens.fontSizeBase200,
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground3,
      marginBottom: '2px',
    },
    '& > dd': {
      margin: 0,
      fontSize: tokens.fontSizeBase300,
      color: tokens.colorNeutralForeground1,
      overflowWrap: 'anywhere',
      '& > *': { maxWidth: '100%', whiteSpace: 'normal' },
    },
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '8px',
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
    '& > button, & .fui-Button': {
      minHeight: '44px !important',
      padding: '8px 16px',
      fontSize: '14px',
      touchAction: 'manipulation',
      flex: '1 1 auto',
      justifyContent: 'center',
    },
  },
});

interface Props<T> {
  items: T[];
  columns: TableColumnDefinition<T>[];
  getRowId: (item: T, index: number) => SelectionItemId;
  selectionMode?: 'single' | 'multiselect';
  selectedItems?: Set<SelectionItemId>;
  onSelectionChange?: (event: unknown, data: { selectedItems: Set<SelectionItemId> }) => void;
  onOpen?: (item: T) => void;
  label?: string;
}

/**
 * Componente móvil táctil para técnicos y operadores de campo:
 * Transforma subcuadrículas y tablas complejas en tarjetas táctiles (Card List Items)
 * con botones grandes que cumplen con el estándar de accesibilidad táctil WCAG (>= 44px).
 */
export function D365MobileRecords<T>({
  items,
  columns,
  getRowId,
  selectionMode,
  selectedItems,
  onSelectionChange,
  onOpen,
  label = 'Registros',
}: Props<T>) {
  const styles = useStyles();
  const prefix = useId();
  const [internalSelection, setInternalSelection] = useState<Set<SelectionItemId>>(new Set());
  const selection = selectedItems ?? internalSelection;

  // Separar columnas para una tarjeta organizada
  const statusColumn = columns.find(
    (c) =>
      c.columnId === 'estado' ||
      c.columnId === 'estadoSistema' ||
      c.columnId === 'status'
  );
  const actionsColumn = columns.find(
    (c) => c.columnId === 'acciones' || c.columnId === 'actions'
  );
  const indexColumn = columns.find(
    (c) => c.columnId === 'index' || c.columnId === '#'
  );

  // Columnas de detalle (excluyendo status, acciones e index que van al encabezado/pie)
  const detailColumns = columns.filter(
    (c) => c !== statusColumn && c !== actionsColumn && c !== indexColumn
  );

  return (
    <div className={styles.list} role="list" aria-label={label}>
      {items.map((item, index) => {
        const id = getRowId(item, index);
        const firstCol = detailColumns[0];
        const remainingDetailCols = detailColumns.slice(1);

        return (
          <article role="listitem" key={id} className={styles.card}>
            {/* ENCABEZADO DE LA TARJETA */}
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <Badge
                  appearance="tint"
                  color="subtle"
                  size="small"
                  className={styles.indexBadge}
                >
                  #{index + 1}
                </Badge>
                {firstCol && (
                  <div className={styles.headerTitle}>
                    {firstCol.renderCell(item) as ReactNode}
                  </div>
                )}
              </div>
              {statusColumn && (
                <div>
                  {statusColumn.renderCell(item) as ReactNode}
                </div>
              )}
            </div>

            {/* CAMPOS DE DETALLE EN GRID FLUIDO */}
            {remainingDetailCols.length > 0 && (
              <dl className={styles.fieldsGrid}>
                {remainingDetailCols.map((column, columnIndex) => (
                  <div key={column.columnId} className={styles.field}>
                    <dt id={`${prefix}-${index}-${columnIndex}`}>
                      {column.renderHeaderCell()}
                    </dt>
                    <dd>
                      {labelControls(
                        column.renderCell(item),
                        `${prefix}-${index}-${columnIndex}`
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {/* ACCIONES Y BOTONES TÁCTILES (>= 44PX WCAG) */}
            <div className={styles.actions}>
              {selectionMode && (
                <Checkbox
                  label={`Seleccionar registro ${index + 1}`}
                  checked={selection.has(id)}
                  onChange={(_, data) => {
                    const next =
                      selectionMode === 'single'
                        ? new Set<SelectionItemId>()
                        : new Set(selection);
                    if (data.checked) next.add(id);
                    else next.delete(id);
                    setInternalSelection(next);
                    onSelectionChange?.(undefined, { selectedItems: next });
                  }}
                />
              )}

              {actionsColumn && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                  {actionsColumn.renderCell(item) as ReactNode}
                </div>
              )}

              {onOpen && (
                <Button appearance="outline" onClick={() => onOpen(item)}>
                  Abrir registro
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default D365MobileRecords;
