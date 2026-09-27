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
  Badge,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
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
  Warning24Regular,
  CalendarLtr16Regular,
  TableEdit16Regular,
  DataFunnel20Regular,
} from '@fluentui/react-icons';
import { ListaPreciosService } from '../services/listaPrecios.service';
import type { ListaPreciosDto } from '../types/listaPrecios.types';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';

const useLocalStyles = makeStyles({
  currencyBadgePEN: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
    fontWeight: tokens.fontWeightSemibold,
    padding: '2px 8px',
    borderRadius: tokens.borderRadiusSmall,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: tokens.fontSizeBase200,
  },
  currencyBadgeUSD: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorPaletteBlueForeground2,
    fontWeight: tokens.fontWeightSemibold,
    padding: '2px 8px',
    borderRadius: tokens.borderRadiusSmall,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: tokens.fontSizeBase200,
  },
  statusActive: {
    color: tokens.colorPaletteGreenForeground1,
    fontWeight: tokens.fontWeightSemibold,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusInactive: {
    color: tokens.colorNeutralForeground4,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  emptyIcon: {
    color: tokens.colorBrandForeground1,
    opacity: 0.8,
    fontSize: '48px',
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
          i.codigo.toLowerCase().includes(q) ||
          i.moneda.toLowerCase().includes(q) ||
          (i.descripcion && i.descripcion.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, activeView, searchKeyword]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '---';
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
              className={styles.primaryLink}
            >
              {item.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ListaPreciosDto>({
        columnId: 'codigo',
        compare: (a, b) => a.codigo.localeCompare(b.codigo),
        renderHeaderCell: () => 'Código',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text className={styles.codeCell}>{item.codigo}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ListaPreciosDto>({
        columnId: 'moneda',
        compare: (a, b) => a.moneda.localeCompare(b.moneda),
        renderHeaderCell: () => 'Moneda',
        renderCell: (item) => {
          const isPEN = item.moneda?.toUpperCase() === 'PEN';
          return (
            <TableCellLayout truncate>
              <Text className={isPEN ? localStyles.currencyBadgePEN : localStyles.currencyBadgeUSD}>
                {isPEN ? 'PEN (S/)' : 'USD ($)'}
              </Text>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<ListaPreciosDto>({
        columnId: 'vigencia',
        renderHeaderCell: () => 'Período de Vigencia',
        renderCell: (item) => {
          const inicio = formatDate(item.fechaInicio);
          const fin = formatDate(item.fechaFin);
          const tieneFechas = item.fechaInicio || item.fechaFin;

          return (
            <TableCellLayout truncate>
              <div className={styles.flexRowGap6}>
                <CalendarLtr16Regular className={styles.mutedIcon} />
                <Text size={200} wrap={false} className={styles.noWrapCell}>
                  {tieneFechas ? `${inicio} → ${fin}` : 'Permanente / Sin límite'}
                </Text>
              </div>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<ListaPreciosDto>({
        columnId: 'cantidadElementos',
        compare: (a, b) => (a.cantidadElementos ?? 0) - (b.cantidadElementos ?? 0),
        renderHeaderCell: () => 'Productos Asignados',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Badge appearance="tint" color="informative" shape="rounded">
              {item.cantidadElementos ?? 0} {item.cantidadElementos === 1 ? 'producto' : 'productos'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ListaPreciosDto>({
        columnId: 'descripcion',
        renderHeaderCell: () => 'Descripción',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200} wrap={false} className={styles.noWrapCell} title={item.descripcion || ''}>
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
            {item.activo ? (
              <Text className={styles.statusActive}>
                <span className={styles.statusDotActive} />
                Activo
              </Text>
            ) : (
              <Text className={styles.statusInactive}>
                <span className={styles.statusDotInactive} />
                Inactivo
              </Text>
            )}
          </TableCellLayout>
        ),
      }),
    ],
    [styles, localStyles, navigate, onSelect]
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
          <MessageBar intent={feedbackMessage.intent}>
            <MessageBarBody>
              <MessageBarTitle>{feedbackMessage.intent === 'success' ? 'Éxito' : 'Atención'}</MessageBarTitle>
              {feedbackMessage.text}
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      {/* 1. Dynamics 365 Command Bar */}
      <Toolbar className={styles.commandBar} size="small">
        <div className={styles.toolbarLeft}>
          <ToolbarButton
            icon={<Add16Regular className={styles.iconNewGreen} />}
            onClick={() => {
              if (onNew) onNew();
              else navigate('/servicio-campo/listas-precios/nuevo');
            }}
          >
            Nuevo
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            icon={<ArrowClockwise16Regular />}
            onClick={loadData}
            title="Actualizar datos"
          >
            Actualizar
          </ToolbarButton>

          {selectedIds.size > 0 && (
            <>
              <ToolbarDivider />
              <ToolbarButton
                icon={<Checkmark16Regular className={styles.iconNewGreen} />}
                onClick={() => handleCambiarEstadoSeleccionados(true)}
              >
                Activar ({selectedIds.size})
              </ToolbarButton>
              <ToolbarButton
                icon={<DismissRegular className={styles.iconDanger} />}
                onClick={() => handleCambiarEstadoSeleccionados(false)}
              >
                Desactivar ({selectedIds.size})
              </ToolbarButton>
            </>
          )}
        </div>
      </Toolbar>

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
            placeholder="Buscar en esta vista..."
            contentBefore={<Search16Regular />}
            value={searchKeyword}
            onChange={(_, d) => setSearchKeyword(d.value)}
          />
        </div>
      </div>

      {/* 3. Grid Container */}
      <div className={styles.gridWrapper}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spinner label="Cargando..." size="large" />
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <Warning24Regular className={styles.iconDanger} />
            <Text weight="semibold">{error}</Text>
            <Button size="small" onClick={loadData}>
              Reintentar
            </Button>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
export default ListasPreciosListPage;
