import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Link,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
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
  Share16Regular,
} from '@fluentui/react-icons';
import { ProductoService } from '../services/producto.service';
import type { ProductoDto } from '../types/producto.types';
import { ImportacionDrawer } from '../../../../components/common/ImportacionDrawer';
import { D365EntityTable, D365TableToolbarTools, type D365EntityTableRef } from '../../../../components/common/D365EntityTable';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';

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
  const [importDrawerOpen, setImportDrawerOpen] = useState<boolean>(false);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeView, setActiveView] = useState<'activos' | 'todos' | 'inactivos'>('activos');

  // Fluent UI v9 DataGrid Selection
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());
  const tableRef = useRef<D365EntityTableRef>(null);

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
          p.nombreUnidadMedidaDefecto?.toLowerCase().includes(q)
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
            <Text>
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
            <Text>{item.categoria || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'tipo',
        renderHeaderCell: () => 'Tipo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {item.tipo === 1 || item.tipo === 'Inventario'
                ? 'Inventario'
                : item.tipo === 2 || item.tipo === 'NoInventario'
                  ? 'No inventario'
                  : 'Servicio'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'unidadMedida',
        renderHeaderCell: () => 'Unidad de Medida',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.nombreUnidadMedidaDefecto || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'decimalesCantidad',
        renderHeaderCell: () => 'Decimales',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.decimalesCantidad ?? 0}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'precioBase',
        compare: (a, b) => (a.precioBase || 0) - (b.precioBase || 0),
        renderHeaderCell: () => 'Precio Base',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
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
            <Text>
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
            <Text>
              {item.activo ? 'Activo' : 'Inactivo'}
            </Text>
          </TableCellLayout>
        ),
      }),
    ],
    [onSelectProduct, navigate]
  );

  return (
    <div className={styles.root}>
      {/* 1. TOP COMMAND BAR */}
      <D365CommandBar
        ariaLabel="Comandos de productos"
        trailing={
          <D365CommandButton appearance="primary" icon={<Share16Regular />}>
            Compartir
            <ChevronDown12Regular className={styles.iconChevronMargin} />
          </D365CommandButton>
        }
      >
        <div className={styles.toolbarLeft}>
            <D365CommandButton
              icon={<Add16Regular />}
              tone="create"
              onClick={() => {
                if (onNewProduct) {
                  onNewProduct();
                } else {
                  navigate('/servicio-campo/productos/nuevo');
                }
              }}
            >
              Nuevo
            </D365CommandButton>

            <D365CommandButton
              icon={<ArrowClockwise16Regular />}
              onClick={loadData}
            >
              Actualizar
            </D365CommandButton>

            <D365CommandDivider />

            <D365CommandButton icon={<ArrowDownload16Regular />}>
              Exportar a Excel
              <ChevronDown12Regular className={styles.iconChevronMargin} />
            </D365CommandButton>

            <D365CommandButton
              icon={<ArrowDownload16Regular />}
              onClick={() => void ProductoService.descargarPlantillaExcel()}
            >
              Descargar plantilla
            </D365CommandButton>

            <D365CommandButton
              icon={<ArrowUpload16Regular />}
              onClick={() => setImportDrawerOpen(true)}
            >
              Importar de Excel
            </D365CommandButton>
        </div>

      </D365CommandBar>

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
          <D365TableToolbarTools
            tableRef={tableRef}
            searchValue={searchKeyword}
            onSearchChange={setSearchKeyword}
            searchPlaceholder="Buscar en esta vista"
          />
        </div>
      </div>

      {/* 3. D365 ADVANCED ENTITY TABLE */}
      <D365EntityTable
        ref={tableRef}
        entityName="Productos"
        tableId="productos"
        items={filteredProductos}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={loadData}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
        onRowDoubleClick={(item) => {
          if (onSelectProduct) {
            onSelectProduct(item);
          } else {
            navigate(`/servicio-campo/productos/${item.id}`);
          }
        }}
      />

      {/* 4. BOTTOM STATUS BAR */}
      <footer className={styles.footer}>
        <div>
          1-{filteredProductos.length} de {filteredProductos.length} ({selectedIds.size} seleccionados)
        </div>
        <div>Página 1</div>
      </footer>

      {/* 5. IMPORT DATA DRAWER LATERAL DERECHO (DYNAMICS 365) */}
      <ImportacionDrawer
        open={importDrawerOpen}
        onOpenChange={setImportDrawerOpen}
        targetEntityName="Producto"
        onSuccess={loadData}
      />
    </div>
  );
};
