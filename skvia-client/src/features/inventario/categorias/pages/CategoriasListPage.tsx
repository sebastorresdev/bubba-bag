import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
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
} from '@fluentui/react-icons';
import { CategoriaService } from '../services/categoria.service';
import type { CategoriaProductoDto } from '../types/categoria.types';
import { ImportacionDrawer } from '../../../../components/common/ImportacionDrawer';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { D365ListState } from '../../../../components/common/D365ListState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';

export interface CategoriasListPageProps {
  onNew?: () => void;
  onSelect?: (item: CategoriaProductoDto) => void;
}

export const CategoriasListPage: React.FC<CategoriasListPageProps> = ({
  onNew,
  onSelect,
}) => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();

  const [items, setItems] = useState<CategoriaProductoDto[]>([]);
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
      const data = await CategoriaService.getCategorias();
      setItems(data);
    } catch (err: any) {
      console.error('Error loading categorias:', err);
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
          i.nombre.toLowerCase().includes(q) ||
          (i.categoriaPadreNombre && i.categoriaPadreNombre.toLowerCase().includes(q)) ||
          (i.descripcion && i.descripcion.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, activeView, searchKeyword]);

  const columns: TableColumnDefinition<CategoriaProductoDto>[] = useMemo(
    () => [
      createTableColumn<CategoriaProductoDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre de la Categoría',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelect) onSelect(item);
                else navigate(`/servicio-campo/categorias-producto/${item.id}`);
              }}
              title={item.nombre}
            >
              {item.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<CategoriaProductoDto>({
        columnId: 'categoriaPadreNombre',
        compare: (a, b) => (a.categoriaPadreNombre || '').localeCompare(b.categoriaPadreNombre || ''),
        renderHeaderCell: () => 'Categoría Padre',
        renderCell: (item) => {
          const padreId = item.categoriaPadreId || items.find((c) => c.nombre === item.categoriaPadreNombre)?.id;
          return (
            <TableCellLayout truncate>
              {item.categoriaPadreNombre ? (
                padreId ? (
                  <Link
                    as="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/servicio-campo/categorias-producto/${padreId}`);
                    }}
                    title={`Ir a categoría padre: ${item.categoriaPadreNombre}`}
                  >
                    {item.categoriaPadreNombre}
                  </Link>
                ) : (
                  <Text>
                    {item.categoriaPadreNombre}
                  </Text>
                )
              ) : (
                <Text>
                  ---
                </Text>
              )}
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<CategoriaProductoDto>({
        columnId: 'descripcion',
        renderHeaderCell: () => 'Descripción',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {item.descripcion || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<CategoriaProductoDto>({
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
    [items, onSelect, navigate]
  );

  return (
    <div className={styles.root}>
      {/* 1. TOP COMMAND BAR */}
      <D365CommandBar
        ariaLabel="Comandos de categorías"
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
                if (onNew) onNew();
                else navigate('/servicio-campo/categorias-producto/nuevo');
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
              icon={<ArrowUpload16Regular />}
              onClick={() => setImportDialogOpen(true)}
            >
              Importar de Excel
            </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. VIEW HEADER ROW */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {activeView === 'activos'
                  ? 'Categorías Activas'
                  : activeView === 'inactivos'
                    ? 'Categorías Inactivas'
                    : 'Todas las Categorías'}
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
                Categorías Activas
              </MenuItem>
              <MenuItem
                icon={activeView === 'todos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('todos')}
              >
                Todas las Categorías
              </MenuItem>
              <MenuItem
                icon={activeView === 'inactivos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('inactivos')}
              >
                Categorías Inactivas
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
            onChange={(_, d) => setSearchKeyword(d.value)}
          />
        </div>
      </div>

      {/* 3. GRID BODY */}
      <div className={styles.gridWrapper}>
        <D365ListState loading={loading} error={error} onRetry={loadData} loadingLabel="Cargando categorías...">
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
            {filteredItems.length === 0 ? (
              <TableEmptyState />
            ) : (
              <DataGridBody<CategoriaProductoDto>>
                {({ item, rowId }) => (
                  <DataGridRow<CategoriaProductoDto>
                    key={rowId}
                    className={styles.dataRow}
                    onDoubleClick={() => {
                      if (onSelect) onSelect(item);
                      else navigate(`/servicio-campo/categorias-producto/${item.id}`);
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
        </D365ListState>
      </div>

      {/* 4. IMPORT DATA DRAWER LATERAL DERECHO (DYNAMICS 365) */}
      <ImportacionDrawer
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        targetEntityName="Categoria"
        onDownloadTemplate={() => CategoriaService.descargarPlantillaExcel()}
        onSuccess={loadData}
      />
    </div>
  );
};

export default CategoriasListPage;
