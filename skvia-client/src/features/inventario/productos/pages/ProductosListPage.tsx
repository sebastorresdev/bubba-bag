import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
import { ImportDataDrawer } from '../../../../components/common/ImportDataDrawer';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';

export interface ProductosListPageProps {
  onNewProduct?: () => void;
  onSelectProduct?: (product: ProductoDto) => void;
}

export const ProductosListPage: React.FC<ProductosListPageProps> = ({
  onNewProduct,
  onSelectProduct,
}) => {
  const styles = useD365ListStyles();
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
              className={styles.primaryLink}
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
          <Toolbar size="medium" className={styles.transparentToolbar}>
            <ToolbarButton
              icon={<Add16Regular className={styles.iconNewGreen} />}
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
              <ChevronDown12Regular className={styles.iconChevronMargin} />
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
            <ChevronDown12Regular className={styles.iconChevronMargin} />
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
            <MenuList className={styles.viewMenuPopover}>
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
              icon={<TableEdit16Regular className={styles.iconBrand} />}
            >
              Editar columnas
            </Button>
          </Tooltip>

          <Tooltip content="Editar filtros de la consulta" relationship="label">
            <Button
              appearance="subtle"
              size="medium"
              icon={<DataFunnel20Regular className={styles.iconBrand} />}
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
            <Spinner label="Cargando..." size="medium" />
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <Warning24Regular className={styles.dangerIcon32} />
            <Text weight="semibold" size={400} className={styles.dangerText}>
              {error}
            </Text>
            <ToolbarButton onClick={loadData}>Reintentar conexión</ToolbarButton>
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
            {filteredProductos.length === 0 ? (
              <TableEmptyState />
            ) : (
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
            )}
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

      {/* 5. IMPORT DATA DRAWER LATERAL DERECHO (DYNAMICS 365) */}
      <ImportDataDrawer
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        targetEntityName="Producto"
        onDownloadTemplate={() => ProductoService.descargarPlantillaExcel()}
        onSuccess={loadData}
      />
    </div>
  );
};
