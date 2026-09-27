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
import { UnidadMedidaService } from '../services/unidadMedida.service';
import type { UnidadMedidaDto } from '../types/unidadMedida.types';
import { ImportDataDrawer } from '../../../../components/common/ImportDataDrawer';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';

export interface UnidadesMedidaListPageProps {
  onNew?: () => void;
  onSelect?: (item: UnidadMedidaDto) => void;
}

export const UnidadesMedidaListPage: React.FC<UnidadesMedidaListPageProps> = ({
  onNew,
  onSelect,
}) => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();

  const [items, setItems] = useState<UnidadMedidaDto[]>([]);
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
      const data = await UnidadMedidaService.getUnidadesMedida();
      setItems(data);
    } catch (err: any) {
      console.error('Error loading unidades de medida:', err);
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
          i.codigo.toLowerCase().includes(q) ||
          i.nombre.toLowerCase().includes(q) ||
          i.abreviatura.toLowerCase().includes(q) ||
          (i.descripcion && i.descripcion.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, activeView, searchKeyword]);

  const columns: TableColumnDefinition<UnidadMedidaDto>[] = useMemo(
    () => [
      createTableColumn<UnidadMedidaDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelect) onSelect(item);
                else navigate(`/servicio-campo/unidades-medida/${item.id}`);
              }}
              title={item.nombre}
              className={styles.primaryLink}
            >
              {item.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<UnidadMedidaDto>({
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
      createTableColumn<UnidadMedidaDto>({
        columnId: 'abreviatura',
        renderHeaderCell: () => 'Abreviatura',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.abreviatura}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<UnidadMedidaDto>({
        columnId: 'permiteDecimales',
        renderHeaderCell: () => 'Permite Decimales',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.permiteDecimales ? 'Sí (Fracciones)' : 'No (Entero)'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<UnidadMedidaDto>({
        columnId: 'descripcion',
        renderHeaderCell: () => 'Descripción',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.descripcion || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<UnidadMedidaDto>({
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
    [styles.noWrapCell, onSelect, navigate]
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
                if (onNew) onNew();
                else navigate('/servicio-campo/unidades-medida/nuevo');
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

      {/* 2. VIEW HEADER ROW */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {activeView === 'activos'
                  ? 'Unidades de Medida Activas'
                  : activeView === 'inactivos'
                    ? 'Unidades de Medida Inactivas'
                    : 'Todas las Unidades de Medida'}
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
                Unidades de Medida Activas
              </MenuItem>
              <MenuItem
                icon={activeView === 'todos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('todos')}
              >
                Todas las Unidades de Medida
              </MenuItem>
              <MenuItem
                icon={activeView === 'inactivos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('inactivos')}
              >
                Unidades de Medida Inactivas
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
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spinner size="medium" label="Cargando..." />
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <Warning24Regular className={styles.iconDanger} />
            <Text weight="semibold" className={styles.dangerText}>
              {error}
            </Text>
            <Button appearance="outline" onClick={loadData}>
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
              <DataGridBody<UnidadMedidaDto>>
                {({ item, rowId }) => (
                  <DataGridRow<UnidadMedidaDto>
                    key={rowId}
                    className={styles.dataRow}
                    onDoubleClick={() => {
                      if (onSelect) onSelect(item);
                      else navigate(`/servicio-campo/unidades-medida/${item.id}`);
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

      {/* 4. IMPORT DATA DRAWER LATERAL DERECHO (DYNAMICS 365) */}
      <ImportDataDrawer
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        targetEntityName="UnidadMedida"
        onDownloadTemplate={() => UnidadMedidaService.descargarPlantillaExcel()}
        onSuccess={loadData}
      />
    </div>
  );
};

export default UnidadesMedidaListPage;
