import { useState, useEffect } from 'react';
import {
  Button,
  Checkbox,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Input,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MenuDivider,
  OverlayDrawer,
  Select,
  makeStyles,
  tokens,
  typographyStyles,
  Toast,
  Toaster,
  ToastTitle,
  useId,
  useToastController,
} from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  ChevronDown16Regular,
  Delete16Regular,
  DismissRegular,
  Filter16Regular,
  Folder16Regular,
} from '@fluentui/react-icons';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'not_empty';

export interface D365FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
}

export interface D365FilterField {
  id: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
  options?: Array<{ value: string; label: string }>;
}

export const OPERADORES_FILTRO: Array<{ id: FilterOperator; label: string; soloTexto?: boolean; soloNumero?: boolean }> = [
  { id: 'equals', label: 'Es igual a' },
  { id: 'not_equals', label: 'No es igual a' },
  { id: 'contains', label: 'Contiene' },
  { id: 'not_contains', label: 'No contiene' },
  { id: 'starts_with', label: 'Comienza con' },
  { id: 'ends_with', label: 'Termina con' },
  { id: 'greater_than', label: 'Mayor que' },
  { id: 'less_than', label: 'Menor que' },
  { id: 'greater_or_equal', label: 'Mayor o igual a' },
  { id: 'less_or_equal', label: 'Menor o igual a' },
  { id: 'not_empty', label: 'Tiene datos' },
  { id: 'is_empty', label: 'No tiene datos' },
];

const useStyles = makeStyles({
  drawer: {
    width: '650px',
    maxWidth: '92vw',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow64,
  },
  drawerHeader: {
    padding: '16px 20px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    width: '100%',
    alignSelf: 'stretch',
    boxSizing: 'border-box',
  },
  headerTitle: {
    ...typographyStyles.subtitle2,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  subActionsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '10px 20px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    width: '100%',
    alignSelf: 'stretch',
    boxSizing: 'border-box',
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
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    alignSelf: 'stretch',
    boxSizing: 'border-box',
  },
  treeRootHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2px',
    marginLeft: '6px',
  },
  logicalOperatorBtn: {
    minWidth: '46px',
    height: '28px',
    padding: '0 8px',
    fontWeight: tokens.fontWeightBold,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  treeContainer: {
    position: 'relative',
    paddingLeft: '24px',
    borderLeft: `2px solid ${tokens.colorNeutralStroke1}`,
    marginLeft: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingTop: '6px',
    paddingBottom: '6px',
  },
  treeBranch: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '2px 0',
    '::before': {
      content: '""',
      position: 'absolute',
      left: '-24px',
      top: '50%',
      width: '20px',
      height: '2px',
      backgroundColor: tokens.colorNeutralStroke1,
    },
  },
  treeAddBranch: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '4px 0',
    '::before': {
      content: '""',
      position: 'absolute',
      left: '-24px',
      top: '50%',
      width: '20px',
      height: '2px',
      backgroundColor: tokens.colorNeutralStroke1,
    },
  },
  conditionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  fieldSelect: {
    width: '160px',
    flexShrink: 0,
  },
  operatorSelect: {
    width: '145px',
    flexShrink: 0,
  },
  valueInput: {
    flexGrow: 1,
    minWidth: '120px',
  },
  deleteButton: {
    minWidth: '32px',
    padding: '4px',
    color: tokens.colorNeutralForeground3,
    ':hover': {
      color: tokens.colorStatusDangerForeground1,
    },
  },
  footer: {
    padding: '16px 20px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    width: '100%',
    alignSelf: 'stretch',
    boxSizing: 'border-box',
  },
  emptyNotice: {
    padding: '24px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
});

export function generarFetchXml(
  entityName: string,
  conditions: D365FilterCondition[],
  fields: D365FilterField[],
  logicalOperator: 'and' | 'or' = 'and'
) {
  const entityLogicalName = entityName.toLowerCase().replace(/\s+/g, '_');
  const attrXml = fields.map((f) => `    <attribute name="${f.id}" />`).join('\n');
  const conditionsXml =
    conditions.length > 0
      ? `    <filter type="${logicalOperator}">\n` +
        conditions
          .map((c) => {
            let op = 'eq';
            if (c.operator === 'not_equals') op = 'ne';
            else if (c.operator === 'contains') op = 'like';
            else if (c.operator === 'not_contains') op = 'not-like';
            else if (c.operator === 'starts_with') op = 'begins-with';
            else if (c.operator === 'ends_with') op = 'ends-with';
            else if (c.operator === 'greater_than') op = 'gt';
            else if (c.operator === 'less_than') op = 'lt';
            else if (c.operator === 'greater_or_equal') op = 'ge';
            else if (c.operator === 'less_or_equal') op = 'le';
            else if (c.operator === 'is_empty') op = 'null';
            else if (c.operator === 'not_empty') op = 'not-null';
            const valAttr = op !== 'null' && op !== 'not-null' ? ` value="${c.value}"` : '';
            return `      <condition attribute="${c.field}" operator="${op}"${valAttr} />`;
          })
          .join('\n') +
        `\n    </filter>`
      : '';

  return `<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false">
  <entity name="${entityLogicalName}">
${attrXml}
${conditionsXml}
  </entity>
</fetch>`;
}

export interface D365FiltrosAvanzadosDrawerProps {
  open: boolean;
  onClose: () => void;
  entityName: string;
  fields: D365FilterField[];
  conditions: D365FilterCondition[];
  logicalOperator?: 'and' | 'or';
  onApply: (conditions: D365FilterCondition[], logicalOperator: 'and' | 'or') => void;
  onReset?: () => void;
}

export function D365FiltrosAvanzadosDrawer({
  open,
  onClose,
  entityName,
  fields,
  conditions,
  logicalOperator: propLogicalOperator = 'and',
  onApply,
  onReset,
}: D365FiltrosAvanzadosDrawerProps) {
  const styles = useStyles();
  const toasterId = useId('filtros-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [localConditions, setLocalConditions] = useState<D365FilterCondition[]>([]);
  const [logicalOperator, setLogicalOperator] = useState<'and' | 'or'>(propLogicalOperator);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      if (conditions.length === 0 && fields.length > 0) {
        setLocalConditions([
          {
            id: crypto.randomUUID(),
            field: fields[0].id,
            operator: 'contains',
            value: '',
          },
        ]);
      } else {
        setLocalConditions(JSON.parse(JSON.stringify(conditions)));
      }
      setLogicalOperator(propLogicalOperator);
      setSelectedRowIds(new Set());
    }
  }, [open, conditions, fields, propLogicalOperator]);

  const handleAddRow = () => {
    if (fields.length === 0) return;
    const newCond: D365FilterCondition = {
      id: crypto.randomUUID(),
      field: fields[0].id,
      operator: 'contains',
      value: '',
    };
    setLocalConditions((prev) => [...prev, newCond]);
  };

  const handleDeleteRow = (id: string) => {
    setLocalConditions((prev) => prev.filter((c) => c.id !== id));
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedRowIds.size === 0) return;
    setLocalConditions((prev) => prev.filter((c) => !selectedRowIds.has(c.id)));
    setSelectedRowIds(new Set());
  };

  const handleUpdateCondition = (id: string, updates: Partial<D365FilterCondition>) => {
    setLocalConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResetDefaults = () => {
    setLocalConditions([]);
    setLogicalOperator('and');
    setSelectedRowIds(new Set());
    if (onReset) onReset();
    dispatchToast(
      <Toast>
        <ToastTitle>Filtros restablecidos a valores predeterminados.</ToastTitle>
      </Toast>,
      { intent: 'info', position: 'top-end' }
    );
  };

  const handleDescargarFetchXml = () => {
    const xml = generarFetchXml(entityName, localConditions, fields, logicalOperator);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FetchXML-${entityName.replace(/\s+/g, '_')}.xml`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    void navigator.clipboard.writeText(xml).catch(() => {});
    dispatchToast(
      <Toast>
        <ToastTitle>FetchXML descargado y copiado al portapapeles.</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  };

  const handleApply = () => {
    const validConditions = localConditions.filter((c) => {
      if (c.operator === 'is_empty' || c.operator === 'not_empty') return true;
      return c.value.trim().length > 0;
    });
    onApply(validConditions, logicalOperator);
    onClose();
  };

  return (
    <>
      <Toaster toasterId={toasterId} position="top-end" />
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
            <span className={styles.headerTitle}>Editar filtros: {entityName}</span>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <div className={styles.subActionsBar}>
          <button
            type="button"
            className={styles.actionLink}
            onClick={handleResetDefaults}
            title="Restablecer filtros"
          >
            <ArrowClockwise16Regular />
            Restablecer valores predeterminados
          </button>
          <button
            type="button"
            className={styles.actionLink}
            onClick={handleDescargarFetchXml}
            title="Descargar consulta FetchXML"
          >
            <ArrowDownload16Regular />
            Descargar FetchXML
          </button>
        </div>

        <DrawerBody className={styles.bodyContent}>
          {localConditions.length === 0 ? (
            <div className={styles.emptyNotice}>
              No hay filtros activos configurados.
              <br />
              Haga clic en <strong>+ Agregar</strong> para añadir una condición de filtro.
            </div>
          ) : (
            <>
              {/* Botón de Operador Raíz Y / O como en Dynamics 365 CRM */}
              <div className={styles.treeRootHeader}>
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button
                      size="small"
                      appearance="secondary"
                      className={styles.logicalOperatorBtn}
                      iconPosition="after"
                      icon={<ChevronDown16Regular />}
                      title="Operador de grupo de filtros"
                      aria-label="Operador de grupo de filtros"
                    >
                      {logicalOperator === 'and' ? 'Y' : 'O'}
                    </Button>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem
                        onClick={() => setLogicalOperator('and')}
                        style={{ fontWeight: logicalOperator === 'and' ? 'bold' : 'normal' }}
                      >
                        Y (Todas las condiciones deben cumplirse)
                      </MenuItem>
                      <MenuItem
                        onClick={() => setLogicalOperator('or')}
                        style={{ fontWeight: logicalOperator === 'or' ? 'bold' : 'normal' }}
                      >
                        O (Al menos una condición debe cumplirse)
                      </MenuItem>
                      <MenuDivider />
                      <MenuItem
                        disabled={selectedRowIds.size === 0}
                        onClick={() => {
                          setLogicalOperator('and');
                          setSelectedRowIds(new Set());
                        }}
                      >
                        Agrupar Y ({selectedRowIds.size} seleccionadas)
                      </MenuItem>
                      <MenuItem
                        disabled={selectedRowIds.size === 0}
                        onClick={() => {
                          setLogicalOperator('or');
                          setSelectedRowIds(new Set());
                        }}
                      >
                        Agrupar O ({selectedRowIds.size} seleccionadas)
                      </MenuItem>
                      <MenuItem
                        disabled={selectedRowIds.size === 0}
                        onClick={() => {
                          setSelectedRowIds(new Set());
                        }}
                      >
                        Desagrupar
                      </MenuItem>
                      {selectedRowIds.size > 0 && (
                        <>
                          <MenuDivider />
                          <MenuItem icon={<Delete16Regular />} onClick={handleDeleteSelected}>
                            Eliminar filas seleccionadas ({selectedRowIds.size})
                          </MenuItem>
                        </>
                      )}
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </div>

              {/* Árbol de Condiciones desprendido de la llave de operador raíz */}
              <div className={styles.treeContainer}>
                {localConditions.map((cond) => {
                  const fieldDef = fields.find((f) => f.id === cond.field);
                  const requiresValue = cond.operator !== 'is_empty' && cond.operator !== 'not_empty';
                  return (
                    <div key={cond.id} className={styles.treeBranch}>
                      <div className={styles.conditionRow}>
                        <Checkbox
                          checked={selectedRowIds.has(cond.id)}
                          onChange={() => handleToggleSelectRow(cond.id)}
                          aria-label="Seleccionar fila"
                        />

                        {/* Dropdown de Campo */}
                        <Select
                          className={styles.fieldSelect}
                          value={cond.field}
                          onChange={(_, d) => handleUpdateCondition(cond.id, { field: d.value })}
                          aria-label="Seleccionar campo"
                        >
                          {fields.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                        </Select>

                        {/* Dropdown de Operador */}
                        <Select
                          className={styles.operatorSelect}
                          value={cond.operator}
                          onChange={(_, d) =>
                            handleUpdateCondition(cond.id, { operator: d.value as FilterOperator })
                          }
                          aria-label="Seleccionar operador"
                        >
                          {OPERADORES_FILTRO.map((op) => (
                            <option key={op.id} value={op.id}>
                              {op.label}
                            </option>
                          ))}
                        </Select>

                        {/* Input de Valor */}
                        {requiresValue ? (
                          fieldDef?.options && fieldDef.options.length > 0 ? (
                            <Select
                              className={styles.valueInput}
                              value={cond.value}
                              onChange={(_, d) => handleUpdateCondition(cond.id, { value: d.value })}
                              aria-label="Seleccionar valor"
                            >
                              <option value="">(Seleccione valor)</option>
                              {fieldDef.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <Input
                              className={styles.valueInput}
                              placeholder="Valor"
                              value={cond.value}
                              type={fieldDef?.type === 'number' ? 'number' : fieldDef?.type === 'date' ? 'date' : 'text'}
                              onChange={(_, d) => handleUpdateCondition(cond.id, { value: d.value })}
                              aria-label="Valor de filtro"
                            />
                          )
                        ) : (
                          <div style={{ flexGrow: 1 }} />
                        )}

                        {/* Botón Eliminar fila */}
                        <Button
                          className={styles.deleteButton}
                          appearance="subtle"
                          icon={<Delete16Regular />}
                          title="Eliminar condición"
                          aria-label="Eliminar condición"
                          onClick={() => handleDeleteRow(cond.id)}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Botón + Agregar anclado al árbol */}
                <div className={styles.treeAddBranch}>
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <Button icon={<Add16Regular />} appearance="secondary" size="small">
                        Agregar
                        <ChevronDown16Regular />
                      </Button>
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        <MenuItem icon={<Filter16Regular />} onClick={handleAddRow}>
                          Agregar fila
                        </MenuItem>
                        <MenuItem
                          icon={<Folder16Regular />}
                          onClick={() => {
                            setLogicalOperator('and');
                            handleAddRow();
                          }}
                        >
                          Agregar grupo Y
                        </MenuItem>
                        <MenuItem
                          icon={<Folder16Regular />}
                          onClick={() => {
                            setLogicalOperator('or');
                            handleAddRow();
                          }}
                        >
                          Agregar grupo O
                        </MenuItem>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                </div>
              </div>
            </>
          )}

          {localConditions.length === 0 && (
            <div style={{ paddingLeft: '8px', paddingTop: '8px' }}>
              <Button icon={<Add16Regular />} appearance="secondary" onClick={handleAddRow}>
                Agregar fila
              </Button>
            </div>
          )}
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
    </>
  );
}
