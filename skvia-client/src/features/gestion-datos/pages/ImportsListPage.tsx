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
  Badge,
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
  Avatar,
  createTableColumn,
} from '@fluentui/react-components';
import type { TableColumnDefinition, SelectionItemId } from '@fluentui/react-components';
import {
  ArrowUpload16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  Delete16Regular,
  Checkmark16Regular,
  ChevronDown12Regular,
  ChevronDown16Regular,
  DataFunnel20Regular,
  Search16Regular,
  Share16Regular,
  TableEdit16Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { TableEmptyState } from '../../../components/common/TableEmptyState';
import { ImportDataDrawer } from '../../../components/common/ImportDataDrawer';
import {
  dataManagementService,
  type DataImportJob,
} from '../../../services/dataManagementService';

type ImportViewType = 'todos' | 'mis' | 'completados' | 'fallidos';

export const ImportsListPage: React.FC = () => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<DataImportJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeView, setActiveView] = useState<ImportViewType>('todos');

  // Fluent UI v9 Native DataGrid Selection
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataManagementService.getImportJobs(100);
      setJobs(data);
    } catch (err: any) {
      console.error('Error fetching import jobs:', err);
      setError(err?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `¿Está seguro de eliminar los ${selectedIds.size} registros de importación seleccionados?`
      )
    ) {
      return;
    }

    try {
      for (const id of selectedIds) {
        await dataManagementService.deleteImportJob(String(id));
      }
      setSelectedIds(new Set());
      await fetchJobs();
    } catch (err: any) {
      console.error('Error deleting import jobs:', err);
      alert(err?.message || 'Error al eliminar las importaciones seleccionadas.');
    }
  };

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (activeView === 'completados') {
      result = result.filter(
        (j) => j.estado.toLowerCase() === 'completado' && j.totalFallidos === 0
      );
    } else if (activeView === 'fallidos') {
      result = result.filter(
        (j) =>
          j.estado.toLowerCase() === 'fallido' ||
          j.estado.toLowerCase() === 'conerrores' ||
          j.totalFallidos > 0
      );
    } else if (activeView === 'mis') {
      result = result.filter(
        (j) =>
          j.creadoPor.toLowerCase().includes('admin') ||
          j.creadoPor.toLowerCase().includes('usuario') ||
          j.creadoPor.toLowerCase().includes('sistema')
      );
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (j) =>
          j.nombreArchivo.toLowerCase().includes(q) ||
          j.tipoRegistro.toLowerCase().includes(q) ||
          j.creadoPor.toLowerCase().includes(q) ||
          j.estado.toLowerCase().includes(q)
      );
    }

    return result;
  }, [jobs, activeView, searchKeyword]);

  const getViewTitle = () => {
    switch (activeView) {
      case 'mis':
        return 'Mis Importaciones';
      case 'completados':
        return 'Importaciones Completadas';
      case 'fallidos':
        return 'Importaciones con Fallos';
      default:
        return 'Todas las Importaciones';
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completado':
        return (
          <Badge appearance="filled" color="success">
            Completado
          </Badge>
        );
      case 'conerrores':
        return (
          <Badge appearance="filled" color="warning">
            Con Errores
          </Badge>
        );
      case 'fallido':
        return (
          <Badge appearance="filled" color="danger">
            Fallido
          </Badge>
        );
      case 'procesando':
        return (
          <Badge appearance="filled" color="brand">
            En Proceso
          </Badge>
        );
      default:
        return <Badge appearance="tint">{estado}</Badge>;
    }
  };

  const columns: TableColumnDefinition<DataImportJob>[] = useMemo(
    () => [
      createTableColumn<DataImportJob>({
        columnId: 'nombreArchivo',
        compare: (a, b) => a.nombreArchivo.localeCompare(b.nombreArchivo),
        renderHeaderCell: () => 'Archivo de Origen',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/configuracion/data-management/imports/${item.id}`);
              }}
              title={item.nombreArchivo}
              className={styles.primaryLink}
            >
              {item.nombreArchivo}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJob>({
        columnId: 'estado',
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <TableCellLayout truncate>{getStatusBadge(item.estado)}</TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJob>({
        columnId: 'tipoRegistro',
        compare: (a, b) => a.tipoRegistro.localeCompare(b.tipoRegistro),
        renderHeaderCell: () => 'Tipo de Registro',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.tipoRegistro}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJob>({
        columnId: 'totalExitosos',
        compare: (a, b) => a.totalExitosos - b.totalExitosos,
        renderHeaderCell: () => 'Correctos',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.totalExitosos}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJob>({
        columnId: 'totalFallidos',
        compare: (a, b) => a.totalFallidos - b.totalFallidos,
        renderHeaderCell: () => 'Errores',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.totalFallidos}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJob>({
        columnId: 'totalParciales',
        compare: (a, b) => a.totalParciales - b.totalParciales,
        renderHeaderCell: () => 'Parciales',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.totalParciales}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJob>({
        columnId: 'totalProcesados',
        compare: (a, b) => a.totalProcesados - b.totalProcesados,
        renderHeaderCell: () => 'Total Filas',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {item.totalProcesados}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJob>({
        columnId: 'fechaCreacion',
        compare: (a, b) =>
          new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime(),
        renderHeaderCell: () => 'Fecha de Creación',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false} className={styles.noWrapCell}>
              {new Date(item.fechaCreacion).toLocaleString('es-PE', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJob>({
        columnId: 'creadoPor',
        compare: (a, b) => a.creadoPor.localeCompare(b.creadoPor),
        renderHeaderCell: () => 'Creado Por',
        renderCell: (item) => (
          <TableCellLayout
            truncate
            media={
              <Avatar
                name={item.creadoPor}
                size={20}
                color="colorful"
              />
            }
          >
            <Link
              as="button"
              className={styles.primaryLink}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {item.creadoPor}
            </Link>
          </TableCellLayout>
        ),
      }),
    ],
    [styles.noWrapCell, styles.primaryLink, navigate]
  );

  return (
    <div className={styles.root}>
      {/* 1. TOP COMMAND BAR DYNAMICS 365 */}
      <div className={styles.commandBar}>
        <div className={styles.toolbarLeft}>
          <Toolbar size="medium" className={styles.transparentToolbar}>
            <ToolbarButton
              icon={<ArrowUpload16Regular className={styles.iconNewGreen} />}
              onClick={() => setDrawerOpen(true)}
            >
              Importar Datos
            </ToolbarButton>

            <ToolbarButton
              icon={<ArrowClockwise16Regular />}
              onClick={fetchJobs}
            >
              Actualizar
            </ToolbarButton>

            {selectedIds.size > 0 && (
              <ToolbarButton
                icon={<Delete16Regular className={styles.iconDanger} />}
                onClick={handleDeleteSelected}
              >
                Eliminar ({selectedIds.size})
              </ToolbarButton>
            )}

            <ToolbarDivider />

            <ToolbarButton icon={<ArrowDownload16Regular />}>
              Exportar
              <ChevronDown12Regular className={styles.iconChevronMargin} />
            </ToolbarButton>
          </Toolbar>
        </div>

        {/* Right side: Compartir */}
        <div>
          <ToolbarButton appearance="primary" icon={<Share16Regular />}>
            Compartir
            <ChevronDown12Regular className={styles.iconChevronMargin} />
          </ToolbarButton>
        </div>
      </div>

      {/* 2. VIEW HEADER ROW (Selector de Vista + Herramientas + Búsqueda) */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista de importaciones">
              <Text weight="semibold" size={400}>
                {getViewTitle()}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              <MenuItem
                icon={activeView === 'todos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('todos')}
              >
                Todas las Importaciones
              </MenuItem>
              <MenuItem
                icon={activeView === 'mis' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('mis')}
              >
                Mis Importaciones
              </MenuItem>
              <MenuItem
                icon={activeView === 'completados' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('completados')}
              >
                Importaciones Completadas
              </MenuItem>
              <MenuItem
                icon={activeView === 'fallidos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('fallidos')}
              >
                Importaciones con Fallos
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
            onChange={(_, data) => setSearchKeyword(data.value)}
          />
        </div>
      </div>

      {/* 3. FLUENT UI V9 NATIVE DATAGRID */}
      <div className={styles.gridContainer}>
        {loading ? (
          <div className={styles.emptyState}>
            <Spinner label="Cargando historial de importaciones..." size="medium" />
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <Warning24Regular className={styles.dangerIcon32} />
            <Text weight="semibold" size={400} className={styles.dangerText}>
              {error}
            </Text>
            <ToolbarButton onClick={fetchJobs}>Reintentar conexión</ToolbarButton>
          </div>
        ) : (
          <DataGrid
            items={filteredJobs}
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
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            {filteredJobs.length === 0 ? (
              <TableEmptyState />
            ) : (
              <DataGridBody<DataImportJob>>
                {({ item, rowId }) => (
                  <DataGridRow<DataImportJob>
                    key={rowId}
                    className={styles.dataRow}
                    onDoubleClick={() => {
                      navigate(`/configuracion/data-management/imports/${item.id}`);
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

      {/* 4. BOTTOM STATUS BAR FOOTER */}
      <footer className={styles.footer}>
        <div>
          1-{filteredJobs.length} de {filteredJobs.length} ({selectedIds.size} seleccionados)
        </div>
        <div>Página 1</div>
      </footer>

      {/* 5. DRAWER LATERAL DE IMPORTACIÓN INTELIGENTE (D365) */}
      <ImportDataDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={fetchJobs}
      />
    </div>
  );
};
