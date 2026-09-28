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
  Badge,
} from '@fluentui/react-components';
import type { TableColumnDefinition, SelectionItemId } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  Checkmark16Regular,
  ChevronDown12Regular,
  ChevronDown16Regular,
  DataFunnel20Regular,
  Search16Regular,
  TableEdit16Regular,
  VehicleTruckProfile16Regular,
  Building16Regular,
  DismissCircle16Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { AlmacenService } from '../services/almacen.service';
import type { AlmacenDto } from '../types/almacen.types';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';

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

  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeView, setActiveView] = useState<'activos' | 'todos' | 'inactivos'>('activos');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'Fisico' | 'Movil'>('todos');

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

    // Filtro Tipo
    if (tipoFiltro === 'Fisico') {
      result = result.filter((a) => a.tipo === 'Fisico' || a.tipo === 1);
    } else if (tipoFiltro === 'Movil') {
      result = result.filter((a) => a.tipo === 'Movil' || a.tipo === 2);
    }

    // Búsqueda
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (a) =>
          a.codigo.toLowerCase().includes(q) ||
          a.nombre.toLowerCase().includes(q) ||
          a.direccion?.toLowerCase().includes(q) ||
          a.nombreSucursal?.toLowerCase().includes(q) ||
          a.nombreRecurso?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [almacenes, activeView, tipoFiltro, searchKeyword]);

  const columns: TableColumnDefinition<AlmacenDto>[] = useMemo(
    () => [
      createTableColumn<AlmacenDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre del Almacén',
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
        columnId: 'codigo',
        compare: (a, b) => a.codigo.localeCompare(b.codigo),
        renderHeaderCell: () => 'Código',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text font="monospace" size={200} weight="semibold">
              {item.codigo}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'tipo',
        compare: (a, b) => {
          const tA = a.tipo === 'Movil' || a.tipo === 2 ? 'Móvil' : 'Físico';
          const tB = b.tipo === 'Movil' || b.tipo === 2 ? 'Móvil' : 'Físico';
          return tA.localeCompare(tB);
        },
        renderHeaderCell: () => 'Tipo',
        renderCell: (item) => {
          const esMovil = item.tipo === 'Movil' || item.tipo === 2;
          return (
            <TableCellLayout>
              <Badge
                appearance="tint"
                color={esMovil ? 'informative' : 'subtle'}
                icon={esMovil ? <VehicleTruckProfile16Regular /> : <Building16Regular />}
              >
                {esMovil ? 'Móvil (Vehículo)' : 'Físico (Sede)'}
              </Badge>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'sucursal',
        compare: (a, b) => (a.nombreSucursal || '').localeCompare(b.nombreSucursal || ''),
        renderHeaderCell: () => 'Sucursal / Sede',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200} style={{ color: item.nombreSucursal ? 'inherit' : '#8a8886' }}>
              {item.nombreSucursal || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'responsable',
        compare: (a, b) => (a.nombreRecurso || '').localeCompare(b.nombreRecurso || ''),
        renderHeaderCell: () => 'Técnico / Responsable',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200} weight={item.nombreRecurso ? 'medium' : 'regular'}>
              {item.nombreRecurso || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'direccion',
        renderHeaderCell: () => 'Dirección / Ubicación',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200} title={item.direccion || ''}>
              {item.direccion || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'telefono',
        renderHeaderCell: () => 'Teléfono',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200}>{item.telefono || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'activo',
        compare: (a, b) => Number(b.activo) - Number(a.activo),
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <TableCellLayout>
            <Badge
              appearance="filled"
              color={item.activo ? 'success' : 'informative'}
              icon={item.activo ? <Checkmark16Regular /> : <DismissCircle16Regular />}
            >
              {item.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </TableCellLayout>
        ),
      }),
    ],
    [navigate, onSelectAlmacen, styles.primaryLink]
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

            <ToolbarDivider />

            {/* Selector de Tipo */}
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <ToolbarButton icon={<DataFunnel20Regular />}>
                  Tipo: {tipoFiltro === 'todos' ? 'Todos' : tipoFiltro === 'Fisico' ? 'Físicos' : 'Móviles'}
                  <ChevronDown12Regular className={styles.iconChevronMargin} />
                </ToolbarButton>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => setTipoFiltro('todos')}>Todos los Tipos</MenuItem>
                  <MenuItem onClick={() => setTipoFiltro('Fisico')}>Solo Almacenes Físicos</MenuItem>
                  <MenuItem onClick={() => setTipoFiltro('Movil')}>Solo Almacenes Móviles</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
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
            placeholder="Buscar por código, nombre, sede o técnico..."
            value={searchKeyword}
            onChange={(_, data) => setSearchKeyword(data.value)}
          />
        </div>
      </div>

      {/* 3. FLUENT UI V9 NATIVE DATAGRID */}
      <div className={styles.gridContainer}>
        {loading ? (
          <div className={styles.emptyState}>
            <Spinner label="Cargando almacenes y bodegas..." size="medium" />
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
