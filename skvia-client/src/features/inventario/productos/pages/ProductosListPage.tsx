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
  Board16Regular,
  Box24Regular,
  Checkmark16Regular,
  ChevronDown12Regular,
  ChevronDown16Regular,
  DataFunnel20Regular,
  DataPie16Regular,
  Eye16Regular,
  Grid16Regular,
  Search16Regular,
  Share16Regular,
  Table16Regular,
  TableEdit16Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { ProductoService } from '../services/producto.service';
import type { ProductoDto } from '../types/producto.types';

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
  btnPrimary: {
    fontWeight: '600',
  },
  viewHeader: {
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '16px',
    paddingRight: '16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  viewSelectorTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    padding: '8px 4px',
    borderBottom: `2px solid ${tokens.colorCompoundBrandStroke}`,
    color: tokens.colorNeutralForeground1,
    fontWeight: '700',
    fontSize: tokens.fontSizeBase400,
  },
  viewToolsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  keywordInput: {
    width: '260px',
  },
  gridContainer: {
    flexGrow: 1,
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  codeLink: {
    color: tokens.colorBrandForegroundLink,
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
    maxWidth: '100%',
    ':hover': {
      textDecoration: 'underline',
      color: tokens.colorBrandForegroundLinkHover,
    },
  },
  noWrapCell: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
              onClick={() => {
                if (onSelectProduct) {
                  onSelectProduct(item);
                } else {
                  navigate(`/servicio-campo/productos/${item.id}`);
                }
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
    [styles.codeLink, styles.noWrapCell, onSelectProduct, navigate]
  );

  return (
    <div className={styles.root}>
      {/* 1. TOP COMMAND BAR */}
      <div className={styles.commandBar}>
        <div className={styles.toolbarLeft}>
          <Toolbar size="small" style={{ backgroundColor: 'transparent', padding: 0 }}>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <ToolbarButton icon={<Grid16Regular />}>
                  Mostrar como
                  <ChevronDown12Regular style={{ marginLeft: 4 }} />
                </ToolbarButton>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem icon={<Table16Regular />}>
                    Cuadrícula de solo lectura
                  </MenuItem>
                  <MenuItem icon={<Board16Regular />}>
                    Vista Kanban / Tarjetas
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>

            <ToolbarButton icon={<DataPie16Regular />}>
              Mostrar gráfico
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              className={styles.btnPrimary}
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

            <ToolbarButton icon={<Eye16Regular />}>
              Visualizar esta vista
            </ToolbarButton>

            <ToolbarButton icon={<ArrowDownload16Regular />}>
              Exportar a Excel
              <ChevronDown12Regular style={{ marginLeft: 4 }} />
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
              <span>
                {activeView === 'activos'
                  ? 'Productos Activos'
                  : activeView === 'inactivos'
                    ? 'Productos Inactivos'
                    : 'Todos los Productos'}
              </span>
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

          <Tooltip content="Filtrado avanzado por condiciones" relationship="label">
            <Button
              appearance="subtle"
              size="medium"
              icon={<DataFunnel20Regular style={{ color: tokens.colorCompoundBrandForeground1 }} />}
            >
              Editar filtros
            </Button>
          </Tooltip>

          <Input
            className={styles.keywordInput}
            size="medium"
            placeholder="Filtrar por palabra clave"
            contentBefore={<Search16Regular />}
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
          <div className={styles.emptyState}>
            <Box24Regular style={{ color: tokens.colorNeutralForeground4, fontSize: 36 }} />
            <Text weight="semibold" size={300}>
              No se encontraron productos registrados.
            </Text>
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
            style={{ minWidth: '100%' }}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell, columnId }) => (
                  <DataGridHeaderCell
                    style={{
                      whiteSpace: 'nowrap',
                      minWidth: columnId === 'nombre' ? '320px' : '90px',
                      flex: columnId === 'nombre' ? '3 1 320px' : '1 1 110px',
                    }}
                  >
                    {renderHeaderCell()}
                  </DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<ProductoDto>>
              {({ item, rowId }) => (
                <DataGridRow<ProductoDto> key={rowId}>
                  {({ renderCell, columnId }) => (
                    <DataGridCell
                      style={{
                        whiteSpace: 'nowrap',
                        minWidth: columnId === 'nombre' ? '320px' : '90px',
                        flex: columnId === 'nombre' ? '3 1 320px' : '1 1 110px',
                        overflow: 'hidden',
                      }}
                    >
                      {renderCell(item)}
                    </DataGridCell>
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
    </div>
  );
};
