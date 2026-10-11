import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link,
  TableCellLayout,
  Text,
  Badge,
  Toaster,
  Toast,
  ToastTitle,
  useId,
  useToastController,
  tokens,
  createTableColumn,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  DismissCircle16Regular,
  Edit16Regular,
  Delete16Regular,
  Timer16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
} from '../../../../components/common/D365EntityTable';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { PlantillaTrabajoService } from '../services/plantillaTrabajo.service';
import type { PlantillaTrabajoListadoDto } from '../types/plantillaTrabajo.types';

type VistaPlantillas = 'activas' | 'todas' | 'inactivas';

const nombresVistaPlantillas: Record<VistaPlantillas, string> = {
  activas: 'Plantillas de trabajo activas',
  todas: 'Todas las plantillas',
  inactivas: 'Plantillas desactivadas',
};

export function PlantillasTrabajoListPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const tableRef = useRef<D365EntityTableRef>(null);
  const toasterId = useId('plantillas-trabajo-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const notifySuccess = useCallback((msg: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{msg}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  const [datos, setDatos] = useState<PlantillaTrabajoListadoDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [vista, setVista] = useState<VistaPlantillas>('activas');
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PlantillaTrabajoService.getPlantillas();
      setDatos(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las plantillas de trabajo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return datos.filter((item) => {
      if (vista === 'activas' && !item.activo) return false;
      if (vista === 'inactivas' && item.activo) return false;
      if (!q) return true;
      return (
        item.codigo.toLowerCase().includes(q) ||
        item.nombre.toLowerCase().includes(q) ||
        item.productoNombre.toLowerCase().includes(q) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(q))
      );
    });
  }, [buscar, datos, vista]);

  const itemSeleccionado = useMemo(() => {
    if (seleccionados.size !== 1) return null;
    const idSel = Array.from(seleccionados)[0] as string;
    return datos.find((x) => x.id === idSel) || null;
  }, [seleccionados, datos]);

  const cambiarEstado = async () => {
    if (seleccionados.size === 0) return;
    const itemsACambiar = datos.filter((x) => seleccionados.has(x.id));
    try {
      setLoading(true);
      for (const item of itemsACambiar) {
        await PlantillaTrabajoService.cambiarEstado(item.id, !item.activo);
      }
      notifySuccess(
        itemsACambiar.length === 1
          ? `Plantilla ${itemsACambiar[0].activo ? 'desactivada' : 'activada'} correctamente.`
          : `${itemsACambiar.length} plantillas actualizadas correctamente.`
      );
      setSeleccionados(new Set());
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar estado.');
      setLoading(false);
    }
  };

  const eliminarSeleccionado = async () => {
    if (seleccionados.size === 0) return;
    const itemsAEliminar = datos.filter((x) => seleccionados.has(x.id));
    const confirmMsg =
      itemsAEliminar.length === 1
        ? `¿Está seguro de eliminar la plantilla "${itemsAEliminar[0].nombre}"?`
        : `¿Está seguro de eliminar las ${itemsAEliminar.length} plantillas seleccionadas?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      for (const item of itemsAEliminar) {
        await PlantillaTrabajoService.eliminarPlantilla(item.id);
      }
      notifySuccess(
        itemsAEliminar.length === 1
          ? 'Plantilla de trabajo eliminada correctamente.'
          : `${itemsAEliminar.length} plantillas de trabajo eliminadas correctamente.`
      );
      setSeleccionados(new Set());
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar plantilla.');
      setLoading(false);
    }
  };

  const columns: TableColumnDefinition<PlantillaTrabajoListadoDto>[] = useMemo(
    () => [
      createTableColumn<PlantillaTrabajoListadoDto>({
        columnId: 'codigo',
        compare: (a, b) => a.codigo.localeCompare(b.codigo),
        renderHeaderCell: () => 'Código',
        renderCell: (item) => (
          <TableCellLayout>
            <Link
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/servicio-campo/plantillas-trabajo/${item.id}`);
              }}
            >
              {item.codigo}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<PlantillaTrabajoListadoDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre de Plantilla',
        renderCell: (item) => (
          <TableCellLayout>
            <Text weight="semibold">{item.nombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<PlantillaTrabajoListadoDto>({
        columnId: 'servicio',
        compare: (a, b) => a.productoNombre.localeCompare(b.productoNombre),
        renderHeaderCell: () => 'Servicio / Producto',
        renderCell: (item) => (
          <TableCellLayout>
            <Badge appearance="tint" shape="rounded" color="informative">
              {item.productoNombre || 'Sin servicio'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<PlantillaTrabajoListadoDto>({
        columnId: 'duracion',
        compare: (a, b) => a.duracionEstimadaMinutos - b.duracionEstimadaMinutos,
        renderHeaderCell: () => 'Duración Est.',
        renderCell: (item) => (
          <TableCellLayout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Timer16Regular style={{ color: tokens.colorNeutralForeground3 }} />
              <Text size={200}>{item.duracionEstimadaMinutos} min</Text>
            </div>
          </TableCellLayout>
        ),
      }),
      createTableColumn<PlantillaTrabajoListadoDto>({
        columnId: 'contenido',
        renderHeaderCell: () => 'Receta / Tareas',
        renderCell: (item) => (
          <TableCellLayout>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge appearance="tint" shape="rounded" color="brand">
                {item.cantidadTareas} tareas
              </Badge>
              <Badge appearance="tint" shape="rounded" color="subtle">
                {item.cantidadMateriales} materiales
              </Badge>
            </div>
          </TableCellLayout>
        ),
      }),
      createTableColumn<PlantillaTrabajoListadoDto>({
        columnId: 'predeterminada',
        renderHeaderCell: () => 'Predeterminada',
        renderCell: (item) => (
          <TableCellLayout>
            {item.esPredeterminada ? (
              <Badge appearance="tint" shape="rounded" color="success">
                Predeterminada
              </Badge>
            ) : (
              <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
                —
              </Text>
            )}
          </TableCellLayout>
        ),
      }),
      createTableColumn<PlantillaTrabajoListadoDto>({
        columnId: 'estado',
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <TableCellLayout>
            <D365StatusBadge
              status={item.activo ? 'activo' : 'inactivo'}
              text={item.activo ? 'Activo' : 'Inactivo'}
            />
          </TableCellLayout>
        ),
      }),
    ],
    [navigate]
  );

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} />
      <D365CommandBar ariaLabel="Barra de comandos de plantillas de trabajo">
        <D365CommandButton
          icon={<Add16Regular />}
          tone="create"
          onClick={() => navigate('/servicio-campo/plantillas-trabajo/nuevo')}
        >
          Nuevo
        </D365CommandButton>
        <D365CommandButton
          icon={<Edit16Regular />}
          disabled={seleccionados.size !== 1}
          onClick={() => itemSeleccionado && navigate(`/servicio-campo/plantillas-trabajo/${itemSeleccionado.id}`)}
        >
          Editar
        </D365CommandButton>
        <D365CommandButton
          icon={itemSeleccionado?.activo ? <DismissCircle16Regular /> : <Checkmark16Regular />}
          disabled={seleccionados.size === 0}
          onClick={() => void cambiarEstado()}
        >
          {seleccionados.size === 1
            ? (itemSeleccionado?.activo ? 'Desactivar' : 'Activar')
            : 'Cambiar Estado'}
        </D365CommandButton>
        <D365CommandButton
          icon={<Delete16Regular />}
          tone="danger"
          disabled={seleccionados.size === 0}
          onClick={() => void eliminarSeleccionado()}
        >
          Eliminar
        </D365CommandButton>
        <D365CommandDivider />
        <D365CommandButton
          icon={<ArrowClockwise16Regular />}
          onClick={() => void cargar()}
        >
          Actualizar
        </D365CommandButton>
      </D365CommandBar>

      {error && (
        <div style={{ padding: '8px 16px' }}>
          <D365MessageBar intent="error" onDismiss={() => setError(null)}>
            {error}
          </D365MessageBar>
        </div>
      )}

      {/* Selector de Vistas y Buscador Estándar */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {nombresVistaPlantillas[vista]}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              {(Object.keys(nombresVistaPlantillas) as VistaPlantillas[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={vista === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => {
                    setVista(v);
                    setSeleccionados(new Set());
                  }}
                >
                  {nombresVistaPlantillas[v]}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        <div className={styles.viewToolsRight}>
          <D365TableToolbarTools
            tableRef={tableRef}
            searchValue={buscar}
            onSearchChange={setBuscar}
            searchPlaceholder="Buscar por código, nombre o servicio..."
            searchAriaLabel="Buscar plantilla de trabajo"
          />
        </div>
      </div>

      <D365EntityTable
        ref={tableRef}
        entityName="Plantillas de Trabajo"
        tableId="plantillas-trabajo"
        items={filtrados}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={() => void cargar()}
        selectionMode="multiselect"
        selectedItems={seleccionados}
        onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)}
        onRowDoubleClick={(row) => navigate(`/servicio-campo/plantillas-trabajo/${row.id}`)}
      />

      <footer className={styles.footer}>
        <div>
          1-{filtrados.length} de {filtrados.length}
          {seleccionados.size > 0 && ` (${seleccionados.size} seleccionados)`}
        </div>
        <div>Página 1</div>
      </footer>
    </div>
  );
}
