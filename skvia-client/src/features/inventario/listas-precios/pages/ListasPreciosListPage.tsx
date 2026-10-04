import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
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
  Checkmark16Regular,
  ChevronDown16Regular,
  DismissRegular,
  Search16Regular,
  TableEdit16Regular,
  DataFunnel20Regular,
} from '@fluentui/react-icons';
import { ListaPreciosService } from '../services/listaPrecios.service';
import type { ListaPreciosDto } from '../types/listaPrecios.types';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { D365ListState } from '../../../../components/common/D365ListState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';

const useLocalStyles = makeStyles({
  emptyIcon: {
    color: tokens.colorBrandForeground1,
    opacity: 0.8,
    fontSize: tokens.fontSizeHero800,
    width: '48px',
    height: '48px',
  },
  toastContainer: {
    position: 'absolute',
    top: '48px',
    right: '24px',
    zIndex: 1000,
  },
});

export interface ListasPreciosListPageProps {
  onNew?: () => void;
  onSelect?: (item: ListaPreciosDto) => void;
}

export const ListasPreciosListPage: React.FC<ListasPreciosListPageProps> = ({
  onNew,
  onSelect,
}) => {
  const styles = useD365ListStyles();
  const localStyles = useLocalStyles();
  const navigate = useNavigate();

  const [items, setItems] = useState<ListaPreciosDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; intent: 'success' | 'error' } | null>(null);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeView, setActiveView] = useState<'activos' | 'todos' | 'inactivos'>('activos');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ListaPreciosService.getListasPrecios();
      setItems(data);
    } catch (err: any) {
      console.error('Error loading listas de precios:', err);
      setError(err?.message || 'Error al conectar con el backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCambiarEstadoSeleccionados = async (nuevoEstado: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      const ids = Array.from(selectedIds) as string[];
      for (const id of ids) {
        await ListaPreciosService.cambiarEstado(id, nuevoEstado);
      }
      setSelectedIds(new Set());
      setFeedbackMessage({
        text: `Se ${nuevoEstado ? 'activaron' : 'desactivaron'} ${ids.length} lista(s) de precios correctamente.`,
        intent: 'success',
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadData();
    } catch (err: any) {
      setFeedbackMessage({
        text: err?.message || 'Ocurrió un error al cambiar el estado de las listas seleccionadas.',
        intent: 'error',
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

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
          i.moneda.toLowerCase().includes(q) ||
          (i.descripcion && i.descripcion.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, activeView, searchKeyword]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const columns: TableColumnDefinition<ListaPreciosDto>[] = useMemo(
    () => [
      createTableColumn<ListaPreciosDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre de la Lista',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelect) onSelect(item);
                else navigate(`/servicio-campo/listas-precios/${item.id}`);
              }}
              title={item.nombre}
            >
              {item.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ListaPreciosDto>({
        columnId: 'moneda',
        compare: (a, b) => a.moneda.localeCompare(b.moneda),
        renderHeaderCell: () => 'Moneda',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {item.moneda?.toUpperCase() === 'PEN' ? 'PEN (S/)' : item.moneda?.toUpperCase() === 'USD' ? 'USD ($)' : item.moneda}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ListaPreciosDto>({
        columnId: 'fechaInicio',
        compare: (a, b) => (a.fechaInicio || '').localeCompare(b.fechaInicio || ''),
        renderHeaderCell: () => 'Desde',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{formatDate(item.fechaInicio)}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ListaPreciosDto>({
        columnId: 'fechaFin',
        compare: (a, b) => (a.fechaFin || '').localeCompare(b.fechaFin || ''),
        renderHeaderCell: () => 'Hasta',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{formatDate(item.fechaFin)}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ListaPreciosDto>({
        columnId: 'cantidadElementos',
        compare: (a, b) => (a.cantidadElementos ?? 0) - (b.cantidadElementos ?? 0),
        renderHeaderCell: () => 'Productos Asignados',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {item.cantidadElementos ?? 0} {item.cantidadElementos === 1 ? 'producto' : 'productos'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ListaPreciosDto>({
        columnId: 'descripcion',
        renderHeaderCell: () => 'Descripción',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text title={item.descripcion || undefined}>
              {item.descripcion || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ListaPreciosDto>({
        columnId: 'activo',
        compare: (a, b) => Number(a.activo) - Number(b.activo),
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.activo ? 'Activo' : 'Inactivo'}</Text>
          </TableCellLayout>
        ),
      }),
    ],
    [navigate, onSelect]
  );

  const viewLabels: Record<string, string> = {
    activos: 'Listas de precios activas',
    todos: 'Todas las listas de precios',
    inactivos: 'Listas de precios inactivas',
  };

  return (
    <div className={styles.root}>
      {feedbackMessage && (
        <div className={localStyles.toastContainer}>
          <D365MessageBar intent={feedbackMessage.intent}>{feedbackMessage.text}</D365MessageBar>
        </div>
      )}

      {/* 1. Dynamics 365 Command Bar */}
      <D365CommandBar ariaLabel="Comandos de listas de precios">
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => {
              if (onNew) onNew();
              else navigate('/servicio-campo/listas-precios/nuevo');
            }}
          >
            Nuevo
          </D365CommandButton>

          <D365CommandDivider />

          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            onClick={loadData}
            title="Actualizar datos"
          >
            Actualizar
          </D365CommandButton>

          {selectedIds.size > 0 && (
            <>
              <D365CommandDivider />
              <D365CommandButton
                icon={<Checkmark16Regular />}
                tone="create"
                onClick={() => handleCambiarEstadoSeleccionados(true)}
              >
                Activar ({selectedIds.size})
              </D365CommandButton>
              <D365CommandButton
                icon={<DismissRegular />}
                tone="danger"
                onClick={() => handleCambiarEstadoSeleccionados(false)}
              >
                Desactivar ({selectedIds.size})
              </D365CommandButton>
            </>
          )}
        </div>
      </D365CommandBar>

      {/* 2. View Header Row (Selector + Tools + Search) */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {viewLabels[activeView]}
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
                Listas de precios activas
              </MenuItem>
              <MenuItem
                icon={activeView === 'todos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('todos')}
              >
                Todas las listas de precios
              </MenuItem>
              <MenuItem
                icon={activeView === 'inactivos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('inactivos')}
              >
                Listas de precios inactivas
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
            placeholder="Buscar" aria-label="Buscar en esta vista"
            contentBefore={<Search16Regular />}
            value={searchKeyword}
            onChange={(_, d) => setSearchKeyword(d.value)}
          />
        </div>
      </div>

      {/* 3. Grid Container */}
      <div className={styles.gridWrapper}>
        <D365ListState loading={loading} error={error} onRetry={loadData} loadingLabel="Cargando listas de precios...">
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
              <DataGridRow selectionCell={{ 'aria-label': 'Seleccionar todas las filas' }}>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            {filteredItems.length === 0 ? (
              <TableEmptyState />
            ) : (
              <DataGridBody<ListaPreciosDto>>
                {({ item, rowId }) => (
                  <DataGridRow<ListaPreciosDto>
                    key={rowId}
                    selectionCell={{ 'aria-label': 'Seleccionar fila' }}
                    className={styles.dataRow}
                    onDoubleClick={() => {
                      if (onSelect) onSelect(item);
                      else navigate(`/servicio-campo/listas-precios/${item.id}`);
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
    </div>
  );
};
export default ListasPreciosListPage;
