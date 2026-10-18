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
  Badge,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
} from '@fluentui/react-components';
import type { TableColumnDefinition, SelectionItemId } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  Delete16Regular,
  Edit16Regular,
  DismissCircle16Regular,
  CheckmarkCircle16Regular,
} from '@fluentui/react-icons';
import { MotivoRetiroEquipoService } from '../services/motivoRetiroEquipo.service';
import type {
  MotivoRetiroEquipoDto,
} from '../types/motivoRetiroEquipo.types';
import { TIPOS_RETIRO_EQUIPO_INFO } from '../types/motivoRetiroEquipo.types';
import { D365EntityTable, D365TableToolbarTools, type D365EntityTableRef } from '../../../../components/common/D365EntityTable';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';

export interface MotivosRetiroEquipoListPageProps {
  onNewMotivo?: () => void;
  onSelectMotivo?: (motivo: MotivoRetiroEquipoDto) => void;
}

export const MotivosRetiroEquipoListPage: React.FC<MotivosRetiroEquipoListPageProps> = ({
  onNewMotivo,
  onSelectMotivo,
}) => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();

  const [motivos, setMotivos] = useState<MotivoRetiroEquipoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeView, setActiveView] = useState<'activos' | 'todos' | 'inactivos'>('activos');

  // Fluent UI v9 DataGrid Selection
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());
  const tableRef = useRef<D365EntityTableRef>(null);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MotivoRetiroEquipoService.getMotivos();
      setMotivos(data);
    } catch (err: any) {
      console.error('Error loading motivos de retiro:', err);
      setError(err?.message || 'Error al conectar con el backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMotivos = useMemo(() => {
    let result = [...motivos];

    if (activeView === 'activos') {
      result = result.filter((m) => m.activo);
    } else if (activeView === 'inactivos') {
      result = result.filter((m) => !m.activo);
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (m) =>
          m.nombre.toLowerCase().includes(q) ||
          (m.descripcion && m.descripcion.toLowerCase().includes(q)) ||
          TIPOS_RETIRO_EQUIPO_INFO[m.tipoRetiro]?.label.toLowerCase().includes(q)
      );
    }

    return result;
  }, [motivos, activeView, searchKeyword]);

  const selectedItem = useMemo(() => {
    if (selectedIds.size !== 1) return null;
    const [firstId] = Array.from(selectedIds);
    return motivos.find((m) => m.id === firstId) || null;
  }, [selectedIds, motivos]);

  const handleEditSelected = () => {
    if (selectedItem) {
      if (onSelectMotivo) {
        onSelectMotivo(selectedItem);
      } else {
        navigate(`/servicio-campo/motivos-retiro/${selectedItem.id}`);
      }
    }
  };

  const handleToggleEstado = async () => {
    if (!selectedItem) return;
    try {
      setActionLoading(true);
      await MotivoRetiroEquipoService.cambiarEstado(selectedItem.id, !selectedItem.activo);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al cambiar estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    try {
      setActionLoading(true);
      await MotivoRetiroEquipoService.eliminarMotivo(selectedItem.id);
      setDeleteDialogOpen(false);
      setSelectedIds(new Set());
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar motivo');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: TableColumnDefinition<MotivoRetiroEquipoDto>[] = useMemo(
    () => [
      createTableColumn<MotivoRetiroEquipoDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre del Motivo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectMotivo) {
                  onSelectMotivo(item);
                } else {
                  navigate(`/servicio-campo/motivos-retiro/${item.id}`);
                }
              }}
              title={item.nombre}
              style={{ fontWeight: 600 }}
            >
              {item.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<MotivoRetiroEquipoDto>({
        columnId: 'tipoRetiro',
        compare: (a, b) => a.tipoRetiro.localeCompare(b.tipoRetiro),
        renderHeaderCell: () => 'Naturaleza / Categoría',
        renderCell: (item) => {
          const info = TIPOS_RETIRO_EQUIPO_INFO[item.tipoRetiro];
          return (
            <TableCellLayout truncate>
              <Badge
                appearance={info?.badgeAppearance || 'tint'}
                color={info?.badgeColor || 'informative'}
                size="medium"
              >
                {info?.badgeLabel || item.tipoRetiro}
              </Badge>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<MotivoRetiroEquipoDto>({
        columnId: 'condicionOperativa',
        renderHeaderCell: () => 'Condición Equipo',
        renderCell: (item) => {
          const info = TIPOS_RETIRO_EQUIPO_INFO[item.tipoRetiro];
          return (
            <TableCellLayout truncate>
              <Text size={200} style={{ color: info?.esOperativo ? '#107c41' : '#a80000', fontWeight: 500 }}>
                {info?.esOperativo ? '● Equipo Operativo' : '● Equipo Dañado / Falla'}
              </Text>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<MotivoRetiroEquipoDto>({
        columnId: 'descripcion',
        renderHeaderCell: () => 'Descripción / Guía',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200} title={item.descripcion || ''} style={{ color: '#605e5c' }}>
              {item.descripcion || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<MotivoRetiroEquipoDto>({
        columnId: 'activo',
        compare: (a, b) => Number(a.activo) - Number(b.activo),
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <TableCellLayout>
            <D365StatusBadge status={item.activo} />
          </TableCellLayout>
        ),
      }),
    ],
    [navigate, onSelectMotivo]
  );

  return (
    <div className={styles.root}>
      {/* 1. Dynamics 365 Standard Command Bar */}
      <D365CommandBar
        ariaLabel="Comandos de motivos de retiro"
        busy={loading || actionLoading}
        busyLabel="Cargando..."
      >
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => {
              if (onNewMotivo) onNewMotivo();
              else navigate('/servicio-campo/motivos-retiro/nuevo');
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

          {selectedIds.size === 1 && (
            <>
              <D365CommandDivider />

              <D365CommandButton
                icon={<Edit16Regular />}
                onClick={handleEditSelected}
              >
                Editar
              </D365CommandButton>

              <D365CommandButton
                icon={selectedItem?.activo ? <DismissCircle16Regular /> : <CheckmarkCircle16Regular />}
                onClick={handleToggleEstado}
              >
                {selectedItem?.activo ? 'Desactivar' : 'Activar'}
              </D365CommandButton>

              <D365CommandButton
                icon={<Delete16Regular />}
                tone="danger"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Eliminar
              </D365CommandButton>
            </>
          )}
        </div>
      </D365CommandBar>

      {/* 2. Header: View Selector & Title */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {activeView === 'activos'
                  ? 'Motivos de Retiro Activos'
                  : activeView === 'inactivos'
                    ? 'Motivos de Retiro Inactivos'
                    : 'Todos los Motivos de Retiro'}
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
                Motivos de Retiro Activos
              </MenuItem>
              <MenuItem
                icon={activeView === 'todos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('todos')}
              >
                Todos los Motivos de Retiro
              </MenuItem>
              <MenuItem
                icon={activeView === 'inactivos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('inactivos')}
              >
                Motivos de Retiro Inactivos
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

      {/* 3. D365 Advanced Entity Table */}
      <D365EntityTable
        ref={tableRef}
        entityName="MotivosRetiro"
        tableId="motivos-retiro"
        items={filteredMotivos}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={loadData}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
        onRowDoubleClick={(item) => {
          if (onSelectMotivo) {
            onSelectMotivo(item);
          } else {
            navigate(`/servicio-campo/motivos-retiro/${item.id}`);
          }
        }}
      />

      {/* 4. Bottom Status Bar */}
      <footer className={styles.footer}>
        <div>
          1-{filteredMotivos.length} de {filteredMotivos.length} ({selectedIds.size} seleccionados)
        </div>
        <div>Página 1</div>
      </footer>

      {/* Confirmation Dialog for Delete */}
      <Dialog open={deleteDialogOpen} onOpenChange={(_, data) => setDeleteDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Eliminar Motivo de Retiro</DialogTitle>
            <DialogContent>
              ¿Está seguro de que desea eliminar el motivo "{selectedItem?.nombre}"? Esta acción no se puede deshacer si no está enlazado a devoluciones previas.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: '#c4314b', color: '#fff' }}
                onClick={handleConfirmDelete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
