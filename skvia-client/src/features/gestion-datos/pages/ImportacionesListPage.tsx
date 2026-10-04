import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowUpload16Regular,
  ArrowClockwise16Regular,
  Delete16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  Search16Regular,
} from '@fluentui/react-icons';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { TableEmptyState } from '../../../components/common/TableEmptyState';
import { D365ListState } from '../../../components/common/D365ListState';
import { ImportacionDrawer } from '../../../components/common/ImportacionDrawer';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import {
  ImportacionService,
  type TrabajoImportacionDto,
} from '../../../services/importacion.service';

type ImportacionViewType = 'todos' | 'completados' | 'fallidos' | 'procesando';

export const ImportacionesListPage: React.FC = () => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<TrabajoImportacionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeView, setActiveView] = useState<ImportacionViewType>('todos');

  // Fluent UI v9 Native DataGrid Selection
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ImportacionService.getImportJobs(100);
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
        await ImportacionService.deleteImportJob(String(id));
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
    } else if (activeView === 'procesando') {
      result = result.filter((j) => j.estado.toLowerCase() === 'procesando');
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
      case 'completados':
        return 'Completadas';
      case 'fallidos':
        return 'Con errores';
      case 'procesando':
        return 'En proceso';
      default:
        return 'Todas las importaciones';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completado':
        return 'Completado';
      case 'conerrores':
        return 'Con errores';
      case 'fallido':
        return 'Fallido';
      case 'procesando':
        return 'En proceso';
      default:
        return estado;
    }
  };

  const columns: TableColumnDefinition<TrabajoImportacionDto>[] = useMemo(
    () => [
      createTableColumn<TrabajoImportacionDto>({
        columnId: 'nombreArchivo',
        compare: (a, b) => a.nombreArchivo.localeCompare(b.nombreArchivo),
        renderHeaderCell: () => 'Archivo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/gestion-datos/importaciones/${item.id}`);
              }}
              title={item.nombreArchivo}
            >
              {item.nombreArchivo}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TrabajoImportacionDto>({
        columnId: 'estado',
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <TableCellLayout truncate><Text>{getStatusText(item.estado)}</Text></TableCellLayout>
        ),
      }),
      createTableColumn<TrabajoImportacionDto>({
        columnId: 'tipoRegistro',
        compare: (a, b) => a.tipoRegistro.localeCompare(b.tipoRegistro),
        renderHeaderCell: () => 'Entidad',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {item.tipoRegistro}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TrabajoImportacionDto>({
        columnId: 'totalExitosos',
        compare: (a, b) => a.totalExitosos - b.totalExitosos,
        renderHeaderCell: () => 'Importados',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {item.totalExitosos}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TrabajoImportacionDto>({
        columnId: 'totalFallidos',
        compare: (a, b) => a.totalFallidos - b.totalFallidos,
        renderHeaderCell: () => 'Con errores',
        renderCell: (item) => (
          <TableCellLayout truncate>
            {item.totalFallidos > 0 ? (
              <Link
                as="button"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/gestion-datos/importaciones/${item.id}?tab=errores`);
                }}
                aria-label={`Revisar ${item.totalFallidos} errores de ${item.nombreArchivo}`}
              >
                {item.totalFallidos}
              </Link>
            ) : (
              <Text>0</Text>
            )}
          </TableCellLayout>
        ),
      }),
      createTableColumn<TrabajoImportacionDto>({
        columnId: 'totalParciales',
        compare: (a, b) => a.totalParciales - b.totalParciales,
        renderHeaderCell: () => 'Parciales',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {item.totalParciales}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TrabajoImportacionDto>({
        columnId: 'totalProcesados',
        compare: (a, b) => a.totalProcesados - b.totalProcesados,
        renderHeaderCell: () => 'Total de filas',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {item.totalProcesados}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TrabajoImportacionDto>({
        columnId: 'fechaCreacion',
        compare: (a, b) =>
          new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime(),
        renderHeaderCell: () => 'Fecha de creación',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {new Date(item.fechaCreacion).toLocaleString('es-PE', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TrabajoImportacionDto>({
        columnId: 'creadoPor',
        compare: (a, b) => a.creadoPor.localeCompare(b.creadoPor),
        renderHeaderCell: () => 'Solicitado por',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.creadoPor || '—'}</Text>
          </TableCellLayout>
        ),
      }),
    ],
    [navigate]
  );

  return (
    <div className={styles.root}>
      {/* 1. TOP COMMAND BAR DYNAMICS 365 */}
      <D365CommandBar ariaLabel="Acciones de gestión de datos">
        <div className={styles.toolbarLeft}>
            <D365CommandButton
              icon={<ArrowUpload16Regular />}
              tone="create"
              onClick={() => setDrawerOpen(true)}
            >
              Nueva importación
            </D365CommandButton>

            <D365CommandButton
              icon={<ArrowClockwise16Regular />}
              onClick={fetchJobs}
            >
              Actualizar
            </D365CommandButton>

            {selectedIds.size > 0 && (
              <D365CommandButton
                icon={<Delete16Regular />}
                tone="danger"
                onClick={handleDeleteSelected}
              >
                Eliminar ({selectedIds.size})
              </D365CommandButton>
            )}

        </div>
      </D365CommandBar>

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
                Todas las importaciones
              </MenuItem>
              <MenuItem
                icon={activeView === 'procesando' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('procesando')}
              >
                En proceso
              </MenuItem>
              <MenuItem
                icon={activeView === 'completados' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('completados')}
              >
                Completadas
              </MenuItem>
              <MenuItem
                icon={activeView === 'fallidos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('fallidos')}
              >
                Con errores
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        <div className={styles.viewToolsRight}>
          <Input
            className={styles.searchBox}
            size="medium"
            contentBefore={<Search16Regular />}
            placeholder="Buscar" aria-label="Buscar importaciones"
            value={searchKeyword}
            onChange={(_, data) => setSearchKeyword(data.value)}
          />
        </div>
      </div>

      {/* 3. FLUENT UI V9 NATIVE DATAGRID */}
      <div className={styles.gridContainer}>
        <D365ListState loading={loading} error={error} onRetry={fetchJobs} loadingLabel="Cargando historial de importaciones...">
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
              <TableEmptyState message={jobs.length === 0 ? 'Aún no hay importaciones registradas' : 'No hay importaciones que coincidan con la búsqueda'} />
            ) : (
              <DataGridBody<TrabajoImportacionDto>>
                {({ item, rowId }) => (
                  <DataGridRow<TrabajoImportacionDto>
                    key={rowId}
                    className={styles.dataRow}
                    onDoubleClick={() => {
                      navigate(`/gestion-datos/importaciones/${item.id}`);
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

      {/* Asistente de importación compartido con las listas de entidad */}
      <ImportacionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={fetchJobs}
      />
    </div>
  );
};

