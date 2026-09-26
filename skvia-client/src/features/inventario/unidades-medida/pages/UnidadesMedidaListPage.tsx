import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  Button,
  Input,
  Spinner,
  Text,
  Link,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  Tooltip,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableCellLayout,
  createTableColumn,
} from '@fluentui/react-components';
import type { TableColumnDefinition, SelectionItemId } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  ArrowUpload16Regular,
  Checkmark16Regular,
  ChevronDown12Regular,
  ChevronDown16Regular,
  DataFunnel20Regular,
  Search16Regular,
  Share16Regular,
  TableEdit16Regular,
  Warning24Regular,
  Ruler24Regular,
} from '@fluentui/react-icons';
import { UnidadMedidaService } from '../services/unidadMedida.service';
import type { UnidadMedidaDto } from '../types/unidadMedida.types';
import { ImportarExcelDialog } from '../../../../components/common/ImportarExcelDialog';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    userSelect: 'none',
  },
  // 1. Dynamics 365 Standard Top Command Bar
  commandBar: {
    height: '44px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    flexShrink: 0,
    zIndex: 10,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  btnPrimary: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  // 2. View Header Row (Selector + Search)
  viewHeader: {
    height: '42px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    flexShrink: 0,
  },
  viewSelectorTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    padding: '4px 8px',
    borderRadius: tokens.borderRadiusMedium,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  viewToolsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  searchBox: {
    width: '240px',
  },
  // 3. Grid Container
  gridWrapper: {
    flexGrow: 1,
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  table: {
    width: '100%',
    minWidth: '700px',
    userSelect: 'text',
  },
  dataRow: {
    userSelect: 'text',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  dataCell: {
    userSelect: 'text',
    cursor: 'text',
  },
  noWrapCell: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    userSelect: 'text',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '12px',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60%',
    gap: '12px',
    color: tokens.colorNeutralForeground3,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
    gap: '12px',
  },
});

export interface UnidadesMedidaListPageProps {
  onNew?: () => void;
  onSelect?: (item: UnidadMedidaDto) => void;
}

export const UnidadesMedidaListPage: React.FC<UnidadesMedidaListPageProps> = ({
  onNew,
  onSelect,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();

  const [items, setItems] = useState<UnidadMedidaDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeView, setActiveView] = useState<'activos' | 'todos' | 'inactivos'>('activos');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UnidadMedidaService.getUnidadesMedida();
      setItems(data);
    } catch (err: any) {
      console.error('Error loading unidades de medida:', err);
      setError(err?.message || 'Error al conectar con el backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (activeView === 'activos') {
      result = result.filter((i) => i.activo);
    } else if (activeView === 'inactivos') {
      result = result.filter((i) => !i.activo);
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (i) =>
          i.codigo.toLowerCase().includes(q) ||
          i.nombre.toLowerCase().includes(q) ||
          i.abreviatura.toLowerCase().includes(q) ||
          (i.descripcion && i.descripcion.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, activeView, searchKeyword]);

  const columns: TableColumnDefinition<UnidadMedidaDto>[] = useMemo(
    () => [
      createTableColumn<UnidadMedidaDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelect) onSelect(item);
                else navigate(`/servicio-campo/unidades-medida/${item.id}`);
              }}
              title={item.nombre}
              style={{
                fontWeight: 500,
                color: tokens.colorBrandForegroundLink,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                textAlign: 'left',
              }}
            >
              {item.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<UnidadMedidaDto>({
        columnId: 'codigo',
        compare: (a, b) => a.codigo.localeCompare(b.codigo),
        renderHeaderCell: () => 'Código',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.codigo}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<UnidadMedidaDto>({
        columnId: 'abreviatura',
        renderHeaderCell: () => 'Abreviatura',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.abreviatura}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<UnidadMedidaDto>({
        columnId: 'permiteDecimales',
        renderHeaderCell: () => 'Permite Decimales',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.permiteDecimales ? 'Sí (Fracciones)' : 'No (Entero)'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<UnidadMedidaDto>({
        columnId: 'descripcion',
        renderHeaderCell: () => 'Descripción',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.descripcion || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<UnidadMedidaDto>({
        columnId: 'activo',
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.activo ? 'Activo' : 'Inactivo'}
            </Text>
          </TableCellLayout>
        ),
      }),
    ],
    [styles.noWrapCell, onSelect, navigate]
  );

  return (
    <div className={styles.root}>
      {/* 1. TOP COMMAND BAR */}
      <div className={styles.commandBar}>
        <div className={styles.toolbarLeft}>
          <Toolbar size="medium" style={{ backgroundColor: 'transparent', padding: 0 }}>
            <ToolbarButton
              className={styles.btnPrimary}
              icon={<Add16Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />}
              onClick={() => {
                if (onNew) onNew();
                else navigate('/servicio-campo/unidades-medida/nuevo');
              }}
            >
              Nuevo
            </ToolbarButton>

            <ToolbarButton
              icon={<ArrowClockwise16Regular />}
              onClick={loadData}
            >
              Actualizar
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton icon={<ArrowDownload16Regular />}>
              Exportar a Excel
              <ChevronDown12Regular style={{ marginLeft: 4 }} />
            </ToolbarButton>

            <ToolbarButton
              icon={<ArrowUpload16Regular />}
              onClick={() => setImportDialogOpen(true)}
            >
              Importar de Excel
            </ToolbarButton>
          </Toolbar>
        </div>

        <div>
          <ToolbarButton
            appearance="primary"
            icon={<Share16Regular />}
          >
            Compartir
            <ChevronDown12Regular style={{ marginLeft: 4 }} />
          </ToolbarButton>
        </div>
      </div>

      {/* 2. VIEW HEADER ROW */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <span>
                {activeView === 'activos'
                  ? 'Unidades de Medida Activas'
                  : activeView === 'inactivos'
                    ? 'Unidades de Medida Inactivas'
                    : 'Todas las Unidades de Medida'}
              </span>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList style={{ minWidth: '240px' }}>
              <MenuItem
                icon={activeView === 'activos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('activos')}
              >
                Unidades de Medida Activas
              </MenuItem>
              <MenuItem
                icon={activeView === 'todos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('todos')}
              >
                Todas las Unidades de Medida
              </MenuItem>
              <MenuItem
                icon={activeView === 'inactivos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('inactivos')}
              >
                Unidades de Medida Inactivas
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        <div className={styles.viewToolsRight}>
          <Tooltip content="Modificar orden y visibilidad de columnas" relationship="label">
            <Button
              appearance="subtle"
              size="medium"
              icon={<TableEdit16Regular style={{ color: tokens.colorCompoundBrandForeground1 }} />}
            >
              Editar columnas
            </Button>
          </Tooltip>

          <Tooltip content="Editar filtros de la consulta" relationship="label">
            <Button
              appearance="subtle"
              size="medium"
              icon={<DataFunnel20Regular style={{ color: tokens.colorCompoundBrandForeground1 }} />}
            >
              Editar filtros
            </Button>
          </Tooltip>

          <Input
            className={styles.searchBox}
            size="medium"
            contentBefore={<Search16Regular />}
            placeholder="Buscar en esta vista..."
            value={searchKeyword}
            onChange={(_, d) => setSearchKeyword(d.value)}
          />
        </div>
      </div>

      {/* 3. GRID BODY */}
      <div className={styles.gridWrapper}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spinner size="medium" label="Cargando unidades de medida..." />
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <Warning24Regular style={{ color: tokens.colorStatusDangerForeground1 }} />
            <Text weight="semibold" style={{ color: tokens.colorStatusDangerForeground1 }}>
              {error}
            </Text>
            <Button appearance="outline" onClick={loadData}>
              Reintentar
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={styles.emptyContainer}>
            <Ruler24Regular style={{ fontSize: 40 }} />
            <Text size={400} weight="semibold">
              No se encontraron registros
            </Text>
            <Text size={200}>
              {searchKeyword
                ? 'No hay unidades de medida que coincidan con la búsqueda.'
                : 'Crea tu primera unidad de medida pulsando el botón "+ Nuevo".'}
            </Text>
          </div>
        ) : (
          <DataGrid
            items={filteredItems}
            columns={columns}
            getRowId={(item) => item.id}
            selectionMode="multiselect"
            selectedItems={selectedIds}
            onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
            className={styles.table}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>
                    {renderHeaderCell()}
                  </DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<UnidadMedidaDto>>
              {({ item, rowId }) => (
                <DataGridRow<UnidadMedidaDto>
                  key={rowId}
                  className={styles.dataRow}
                  onDoubleClick={() => {
                    if (onSelect) onSelect(item);
                    else navigate(`/servicio-campo/unidades-medida/${item.id}`);
                  }}
                >
                  {({ renderCell }) => (
                    <DataGridCell className={styles.dataCell}>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        )}
      </div>

      {/* 4. IMPORT EXCEL DIALOG */}
      <ImportarExcelDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Importar Unidades de Medida desde Excel"
        entityName="Unidades de Medida"
        onDownloadTemplate={() => UnidadMedidaService.descargarPlantillaExcel()}
        onUploadFile={(file) => UnidadMedidaService.importarExcel(file)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default UnidadesMedidaListPage;
