import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Toast,
  Toaster,
  ToastTitle,
  useId,
  useToastController,
} from '@fluentui/react-components';
import type { TableColumnDefinition, SelectionItemId } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  TableEdit16Regular,
} from '@fluentui/react-icons';
import { AlmacenService } from '../services/almacen.service';
import type { AlmacenDto } from '../types/almacen.types';
import { D365EntityTable, D365TableToolbarTools, type D365EntityTableRef, type D365FilterField } from '../../../../components/common/D365EntityTable';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';

const filterFields: D365FilterField[] = [
  { id: 'nombre', label: 'Nombre', type: 'string' },
  {
    id: 'tipo',
    label: 'Tipo de almacén',
    type: 'string',
    options: [
      { value: '1', label: 'Bodega' },
      { value: '2', label: 'Custodia personal' },
    ],
  },
  { id: 'unidadOrganizativaNombre', label: 'Unidad Organizativa', type: 'string' },
  { id: 'descripcion', label: 'Descripción', type: 'string' },
  { id: 'creadoPorNombre', label: 'Creado por', type: 'string' },
  { id: 'createdAt', label: 'Fecha de creación', type: 'date' },
  {
    id: 'activo',
    label: 'Estado',
    type: 'boolean',
    options: [
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' },
    ],
  },
];

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

  const toasterId = useId('almacenes-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const notifySuccess = useCallback((title: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeView, setActiveView] = useState<
    'activos' | 'bodegas' | 'custodias' | 'todos' | 'inactivos'
  >('activos');

  // Fluent UI v9 DataGrid Selection
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());
  const tableRef = useRef<D365EntityTableRef>(null);

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

    notifySuccess(flashMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.key, location.pathname, location.state, navigate, notifySuccess]);

  const filteredAlmacenes = useMemo(() => {
    let result = [...almacenes];

    // Filtro Estado & Tipo
    if (activeView === 'activos') {
      result = result.filter((a) => a.activo);
    } else if (activeView === 'bodegas') {
      result = result.filter((a) => a.activo && a.tipo === 1);
    } else if (activeView === 'custodias') {
      result = result.filter((a) => a.activo && a.tipo === 2);
    } else if (activeView === 'inactivos') {
      result = result.filter((a) => !a.activo);
    }

    // Búsqueda
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (a) =>
          a.nombre.toLowerCase().includes(q) ||
          (a.codigo && a.codigo.toLowerCase().includes(q)) ||
          (a.descripcion && a.descripcion.toLowerCase().includes(q)) ||
          (a.unidadOrganizativaNombre &&
            a.unidadOrganizativaNombre.toLowerCase().includes(q)) ||
          (a.recursoNombre && a.recursoNombre.toLowerCase().includes(q)) ||
          (a.tipo === 2 ? 'custodia personal' : 'bodega').includes(q)
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
        columnId: 'tipo',
        compare: (a, b) => (a.tipo || 0) - (b.tipo || 0),
        renderHeaderCell: () => 'Tipo de almacén',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <D365StatusBadge
              status={item.tipo === 2 ? 'Custodia personal' : 'Bodega'}
            />
          </TableCellLayout>
        ),
      }),
      createTableColumn<AlmacenDto>({
        columnId: 'unidadOrganizativaNombre',
        compare: (a, b) =>
          (a.unidadOrganizativaNombre || '').localeCompare(b.unidadOrganizativaNombre || ''),
        renderHeaderCell: () => 'Unidad Organizativa',
        renderCell: (item) => (
          <TableCellLayout truncate>
            {item.unidadOrganizativaId ? (
              <Link
                as="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/servicio-campo/unidades-organizativas/${item.unidadOrganizativaId}`);
                }}
              >
                {item.unidadOrganizativaNombre}
              </Link>
            ) : (
              <Text>{item.unidadOrganizativaNombre || '—'}</Text>
            )}
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
            <D365StatusBadge status={item.activo} />
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
      <Toaster toasterId={toasterId} position="top-end" />

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
                  : activeView === 'bodegas'
                  ? 'Bodegas'
                  : activeView === 'custodias'
                  ? 'Custodias Personales'
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
                icon={activeView === 'bodegas' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('bodegas')}
              >
                Bodegas
              </MenuItem>
              <MenuItem
                icon={activeView === 'custodias' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('custodias')}
              >
                Custodias Personales
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
          <D365TableToolbarTools
            tableRef={tableRef}
            searchValue={searchKeyword}
            onSearchChange={setSearchKeyword}
            searchPlaceholder="Buscar por nombre o descripción"
          />
        </div>
      </div>

      {/* 3. D365 ADVANCED ENTITY TABLE */}
      <D365EntityTable
        ref={tableRef}
        entityName="Almacenes"
        tableId="almacenes"
        filterFields={filterFields}
        items={filteredAlmacenes}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={loadData}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
        onRowDoubleClick={(item) => {
          if (onSelectAlmacen) {
            onSelectAlmacen(item);
          } else {
            navigate(`/servicio-campo/almacenes/${item.id}`);
          }
        }}
      />

      {/* 4. BOTTOM STATUS BAR */}
      <footer className={styles.footer}>
        <div>
          {filteredAlmacenes.length} almacenes ({selectedIds.size} seleccionados)
        </div>
      </footer>
    </div>
  );
};
