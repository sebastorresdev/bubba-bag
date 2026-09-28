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
  Checkmark16Regular,
  ChevronDown16Regular,
  DataFunnel20Regular,
  Search16Regular,
  TableEdit16Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { AlmacenService } from '../services/almacen.service';
import type { AlmacenDto } from '../types/almacen.types';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { getCurrentUserSession } from '../../../../services/sessionService';

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
  const currentUser = useMemo(() => getCurrentUserSession(), []);

  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
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
              className={styles.primaryLink}
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
            <Text size={200} style={{ color: item.descripcion ? 'inherit' : '#8a8886' }}>
              {item.descripcion || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'propietario',
        compare: (a, b) => {
          const pA = a.propietario || currentUser.nombre;
          const pB = b.propietario || currentUser.nombre;
          return pA.localeCompare(pB);
        },
        renderHeaderCell: () => 'Propietario',
        renderCell: (item) => {
          const ownerName = item.propietario || currentUser.nombre;
          return (
            <TableCellLayout truncate>
              <Link
                as="button"
                className={styles.primaryLink}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                title={`Propietario: ${ownerName} (${currentUser.username})`}
              >
                {ownerName}
              </Link>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'activo',
        compare: (a, b) => Number(b.activo) - Number(a.activo),
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
    [navigate, onSelectAlmacen, styles.primaryLink, styles.noWrapCell]
  );

  const handleEditSelected = () => {
    if (selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0];
      navigate(`/servicio-campo/almacenes/${selectedId}`);
    }
  };

  return (
    <div className={styles.root}>
      {/* 1. TOP COMMAND BAR */}
      <div className={styles.commandBar}>
        <div className={styles.toolbarLeft}>
          <Toolbar size="medium" className={styles.transparentToolbar}>
            <ToolbarButton
              icon={<Add16Regular className={styles.iconNewGreen} />}
              onClick={() => {
                if (onNewAlmacen) {
                  onNewAlmacen();
                } else {
                  navigate('/servicio-campo/almacenes/nuevo');
                }
              }}
            >
              Nuevo
            </ToolbarButton>

            {selectedIds.size === 1 && (
              <ToolbarButton
                icon={<TableEdit16Regular />}
                onClick={handleEditSelected}
              >
                Editar
              </ToolbarButton>
            )}

            <ToolbarDivider />

            <ToolbarButton
              icon={<ArrowClockwise16Regular />}
              onClick={loadData}
              title="Actualizar datos"
            >
              Actualizar
            </ToolbarButton>
          </Toolbar>
        </div>
      </div>

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
          <Tooltip content="Editar filtros de la consulta" relationship="label">
            <Button
              appearance="subtle"
              size="medium"
              icon={<DataFunnel20Regular className={styles.iconBrand} />}
            >
              Filtros
            </Button>
          </Tooltip>

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
        {loading ? (
          <div className={styles.emptyState}>
            <Spinner label="Cargando almacenes..." size="medium" />
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
        )}
      </div>

      {/* 4. BOTTOM STATUS BAR */}
      <footer className={styles.footer}>
        <div>
          1-{filteredAlmacenes.length} de {filteredAlmacenes.length} ({selectedIds.size} seleccionados)
        </div>
        <div>Página 1</div>
      </footer>
    </div>
  );
};
