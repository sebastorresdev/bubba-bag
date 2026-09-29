import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Input,
  Text,
  Link,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
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
  Checkmark16Regular,
  ChevronDown16Regular,
  Search16Regular,
  TableEdit16Regular,
} from '@fluentui/react-icons';
import { AlmacenService } from '../services/almacen.service';
import type { AlmacenDto } from '../types/almacen.types';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { D365ListState } from '../../../../components/common/D365ListState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';

export interface AlmacenesListPageProps {
  onNewAlmacen?: () => void;
  onSelectAlmacen?: (almacen: AlmacenDto) => void;
}

export const AlmacenesListPage: React.FC<AlmacenesListPageProps> = ({
  onNewAlmacen,
  onSelectAlmacen,
}) => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeView, setActiveView] = useState<'activos' | 'todos' | 'inactivos'>('activos');

  // Fluent UI v9 DataGrid Selection
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AlmacenService.getAlmacenes();
      setAlmacenes(data);
    } catch (err: any) {
      console.error('Error loading almacenes:', err);
      setError(err?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const flashMessage = (location.state as { successMessage?: string } | null)?.successMessage;
    if (!flashMessage) return;

    setSuccessMessage(flashMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.key, location.pathname, location.state, navigate]);

  const filteredAlmacenes = useMemo(() => {
    let result = [...almacenes];

    // Filtro Estado
    if (activeView === 'activos') {
      result = result.filter((a) => a.activo);
    } else if (activeView === 'inactivos') {
      result = result.filter((a) => !a.activo);
    }

    // Búsqueda
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (a) =>
          a.nombre.toLowerCase().includes(q) ||
          (a.descripcion && a.descripcion.toLowerCase().includes(q))
      );
    }

    return result;
  }, [almacenes, activeView, searchKeyword]);

  const columns: TableColumnDefinition<AlmacenDto>[] = useMemo(
    () => [
      createTableColumn<AlmacenDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectAlmacen) {
                  onSelectAlmacen(item);
                } else {
                  navigate(`/servicio-campo/almacenes/${item.id}`);
                }
              }}
              title={item.nombre}
            >
              {item.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'descripcion',
        compare: (a, b) => (a.descripcion || '').localeCompare(b.descripcion || ''),
        renderHeaderCell: () => 'Descripción',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {item.descripcion || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'createdAt',
        compare: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        renderHeaderCell: () => 'Fecha de creación',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {new Date(item.createdAt).toLocaleDateString('es-PE')}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'creadoPorNombre',
        compare: (a, b) => (a.creadoPorNombre || '').localeCompare(b.creadoPorNombre || ''),
        renderHeaderCell: () => 'Creado por',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text title={item.creadoPorNombre || undefined}>
              {item.creadoPorNombre || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'activo',
        compare: (a, b) => Number(b.activo) - Number(a.activo),
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
    [navigate, onSelectAlmacen]
  );

  const handleEditSelected = () => {
    if (selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0];
      navigate(`/servicio-campo/almacenes/${selectedId}`);
    }
  };

  return (
    <div className={styles.root}>
      {successMessage && (
        <D365MessageBar intent="success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </D365MessageBar>
      )}

      {/* 1. TOP COMMAND BAR */}
      <D365CommandBar ariaLabel="Comandos de almacenes">
        <div className={styles.toolbarLeft}>
            <D365CommandButton
              icon={<Add16Regular />}
              tone="create"
              onClick={() => {
                if (onNewAlmacen) {
                  onNewAlmacen();
                } else {
                  navigate('/servicio-campo/almacenes/nuevo');
                }
              }}
            >
              Nuevo
            </D365CommandButton>

            {selectedIds.size === 1 && (
              <D365CommandButton
                icon={<TableEdit16Regular />}
                onClick={handleEditSelected}
              >
                Editar
              </D365CommandButton>
            )}

            <D365CommandDivider />

            <D365CommandButton
              icon={<ArrowClockwise16Regular />}
              onClick={loadData}
              title="Actualizar datos"
            >
              Actualizar
            </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. VIEW HEADER ROW (Selector de Vista + Filtros + Búsqueda) */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {activeView === 'activos'
                  ? 'Almacenes Activos'
                  : activeView === 'inactivos'
                  ? 'Almacenes Inactivos'
                  : 'Todos los Almacenes'}
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
                Almacenes Activos
              </MenuItem>
              <MenuItem
                icon={activeView === 'todos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('todos')}
              >
                Todos los Almacenes
              </MenuItem>
              <MenuItem
                icon={activeView === 'inactivos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('inactivos')}
              >
                Almacenes Inactivos
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        <div className={styles.viewToolsRight}>
          <Input
            className={styles.searchBox}
            size="medium"
            contentBefore={<Search16Regular />}
            placeholder="Buscar por nombre o descripción..."
            value={searchKeyword}
            onChange={(_, data) => setSearchKeyword(data.value)}
          />
        </div>
      </div>

      {/* 3. FLUENT UI V9 NATIVE DATAGRID */}
      <div className={styles.gridContainer}>
        <D365ListState loading={loading} error={error} onRetry={loadData} loadingLabel="Cargando almacenes...">
          <DataGrid
            items={filteredAlmacenes}
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

            {filteredAlmacenes.length === 0 ? (
              <TableEmptyState />
            ) : (
              <DataGridBody<AlmacenDto>>
                {({ item, rowId }) => (
                  <DataGridRow<AlmacenDto>
                    key={rowId}
                    className={styles.dataRow}
                    onDoubleClick={() => {
                      if (onSelectAlmacen) {
                        onSelectAlmacen(item);
                      } else {
                        navigate(`/servicio-campo/almacenes/${item.id}`);
                      }
                    }}
                  >
                    {({ renderCell }) => (
                      <DataGridCell className={styles.dataCell}>
                        {renderCell(item)}
                      </DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            )}
          </DataGrid>
        </D365ListState>
      </div>

      {/* 4. BOTTOM STATUS BAR */}
      <footer className={styles.footer}>
        <div>
          {filteredAlmacenes.length} almacenes ({selectedIds.size} seleccionados)
        </div>
      </footer>
    </div>
  );
};
