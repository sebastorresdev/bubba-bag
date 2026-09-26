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
} from '@fluentui/react-icons';
import { ProductoService } from '../services/producto.service';
import type { ProductoDto } from '../types/producto.types';
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
  commandBar: {
    height: '44px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '8px',
    paddingRight: '16px',
    flexShrink: 0,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
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
  gridContainer: {
    flexGrow: 1,
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  table: {
    width: '100%',
    minWidth: '900px',
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
  footer: {
    height: '32px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
    gap: '12px',
  },
});

export interface ProductosListPageProps {
  onNewProduct?: () => void;
  onSelectProduct?: (product: ProductoDto) => void;
}

export const ProductosListPage: React.FC<ProductosListPageProps> = ({
  onNewProduct,
  onSelectProduct,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();

  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeView, setActiveView] = useState<'activos' | 'todos' | 'inactivos'>('activos');

  // Fluent UI v9 DataGrid Selection
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProductoService.getProductos();
      setProductos(data);
    } catch (err: any) {
      console.error('Error loading productos:', err);
      setError(err?.message || 'Error al conectar con el backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProductos = useMemo(() => {
    let result = [...productos];

    if (activeView === 'activos') {
      result = result.filter((p) => p.activo);
    } else if (activeView === 'inactivos') {
      result = result.filter((p) => !p.activo);
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.codigo.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q) ||
          p.categoria?.toLowerCase().includes(q) ||
          p.unidadMedida?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [productos, activeView, searchKeyword]);

  const columns: TableColumnDefinition<ProductoDto>[] = useMemo(
    () => [
      createTableColumn<ProductoDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectProduct) {
                  onSelectProduct(item);
                } else {
                  navigate(`/servicio-campo/productos/${item.id}`);
                }
              }}
              title={item.nombre}
              className={styles.noWrapCell}
            >
              {item.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
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
      createTableColumn<ProductoDto>({
        columnId: 'categoria',
        compare: (a, b) => (a.categoria || '').localeCompare(b.categoria || ''),
        renderHeaderCell: () => 'Categoría',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>{item.categoria || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'tipo',
        renderHeaderCell: () => 'Tipo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.tipo === 1 || item.tipo === 'Inventario'
                ? 'Inventario'
                : item.tipo === 2 || item.tipo === 'Servicio'
                  ? 'Servicio'
                  : 'No Inventariable'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'unidadMedida',
        renderHeaderCell: () => 'Unidad de Medida',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>{item.unidadMedida || 'UND'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'precioBase',
        compare: (a, b) => (a.precioBase || 0) - (b.precioBase || 0),
        renderHeaderCell: () => 'Precio Base',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: 'PEN',
              }).format(item.precioBase || 0)}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'esSerializado',
        renderHeaderCell: () => 'Serializado',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.esSerializado ? 'Sí' : '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
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
    [styles.noWrapCell, onSelectProduct, navigate]
  );

  return (
    <div className={styles.root}>
      {/* 1. TOP COMMAND BAR */}
      <div className={styles.commandBar}>
        <div className={styles.toolbarLeft}>
          <Toolbar size="medium" style={{ backgroundColor: 'transparent', padding: 0 }}>
            <ToolbarButton
              icon={<Add16Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />}
              onClick={() => {
                if (onNewProduct) {
                  onNewProduct();
                } else {
                  navigate('/servicio-campo/productos/nuevo');
                }
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

        {/* Right side: Share */}
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

      {/* 2. VIEW HEADER ROW (View Selector + Column/Filter/Search) */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {activeView === 'activos'
                  ? 'Productos Activos'
                  : activeView === 'inactivos'
                    ? 'Productos Inactivos'
                    : 'Todos los Productos'}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList style={{ minWidth: '220px' }}>
              <MenuItem
                icon={activeView === 'activos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('activos')}
              >
                Productos Activos
              </MenuItem>
              <MenuItem
                icon={activeView === 'todos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('todos')}
              >
                Todos los Productos
              </MenuItem>
              <MenuItem
                icon={activeView === 'inactivos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('inactivos')}
              >
                Productos Inactivos
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
            onChange={(_, data) => setSearchKeyword(data.value)}
          />
        </div>
      </div>

      {/* 3. FLUENT UI V9 NATIVE DATAGRID */}
      <div className={styles.gridContainer}>
        {loading ? (
          <div className={styles.emptyState}>
            <Spinner label="Cargando productos desde el backend..." size="medium" />
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <Warning24Regular style={{ color: tokens.colorStatusDangerForeground1, fontSize: 32 }} />
            <Text weight="semibold" size={400} style={{ color: tokens.colorStatusDangerForeground1 }}>
              {error}
            </Text>
            <ToolbarButton onClick={loadData}>Reintentar conexión</ToolbarButton>
          </div>
        ) : filteredProductos.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 16px', color: tokens.colorNeutralForeground3 }}>
            <Text size={300}>No hay datos</Text>
          </div>
        ) : (
          <DataGrid
            items={filteredProductos}
            columns={columns}
            sortable
            selectionMode="multiselect"
            selectedItems={selectedIds}
            onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
            getRowId={(item) => item.id}
            focusMode="composite"
            size="medium"
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
            <DataGridBody<ProductoDto>>
              {({ item, rowId }) => (
                <DataGridRow<ProductoDto>
                  key={rowId}
                  className={styles.dataRow}
                  onDoubleClick={() => {
                    if (onSelectProduct) {
                      onSelectProduct(item);
                    } else {
                      navigate(`/servicio-campo/productos/${item.id}`);
                    }
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

      {/* 4. BOTTOM STATUS BAR */}
      <footer className={styles.footer}>
        <div>
          1-{filteredProductos.length} de {filteredProductos.length} ({selectedIds.size} seleccionados)
        </div>
        <div>Página 1</div>
      </footer>

      {/* 5. IMPORT EXCEL DIALOG */}
      <ImportarExcelDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Importar Catálogo de Productos desde Excel"
        entityName="Productos"
        onDownloadTemplate={() => ProductoService.descargarPlantillaExcel()}
        onUploadFile={(file) => ProductoService.importarExcel(file)}
        onSuccess={loadData}
      />
    </div>
  );
};
