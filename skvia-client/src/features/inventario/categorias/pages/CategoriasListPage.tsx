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
import { CategoriaService } from '../services/categoria.service';
import type { CategoriaProductoDto } from '../types/categoria.types';
import { ImportacionDrawer } from '../../../../components/common/ImportacionDrawer';
import { D365EntityTable, D365TableToolbarTools, type D365EntityTableRef } from '../../../../components/common/D365EntityTable';
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
  const [importDrawerOpen, setImportDrawerOpen] = useState<boolean>(false);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeView, setActiveView] = useState<'activos' | 'todos' | 'inactivos'>('activos');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());
  const tableRef = useRef<D365EntityTableRef>(null);

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
              icon={<ArrowDownload16Regular />}
              onClick={() => void CategoriaService.descargarPlantillaExcel()}
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
        entityName="Categorías de Producto"
        tableId="categorias_producto"
        items={filteredItems}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={loadData}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
        onRowDoubleClick={(item) => {
          if (onSelect) onSelect(item);
          else navigate(`/servicio-campo/categorias-producto/${item.id}`);
        }}
      />

      {/* 4. IMPORT DATA DRAWER LATERAL DERECHO (DYNAMICS 365) */}
      <ImportacionDrawer
        open={importDrawerOpen}
        onOpenChange={setImportDrawerOpen}
        targetEntityName="Categoria"
        onSuccess={loadData}
      />
    </div>
  );
};

export default CategoriasListPage;
