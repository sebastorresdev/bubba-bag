import { confirmAction } from '../../../../services/uiFeedback';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TableCellLayout,
  Text,
  Link,
  Toaster,
  Toast,
  ToastTitle,
  useId,
  useToastController,
  createTableColumn,
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  Edit16Regular,
  Delete16Regular,
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
import { TareaService } from '../services/tarea.service';
import type { TareaDto } from '../../configuraciones-servicio/types/configuracionServicio.types';

export function TareasListPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const tableRef = useRef<D365EntityTableRef>(null);
  const toasterId = useId('tareas-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const notifySuccess = useCallback((msg: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{msg}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  const [datos, setDatos] = useState<TareaDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await TareaService.getTareas();
      setDatos(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo de tareas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return datos;
    return datos.filter(
      (t) =>
        t.nombre.toLowerCase().includes(q) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(q))
    );
  }, [buscar, datos]);

  const itemSeleccionado = useMemo(() => {
    if (seleccionados.size !== 1) return null;
    const idSel = Array.from(seleccionados)[0] as string;
    return datos.find((x) => x.id === idSel) || null;
  }, [seleccionados, datos]);

  const eliminarTarea = async () => {
    if (seleccionados.size === 0) return;
    const itemsAEliminar = datos.filter((x) => seleccionados.has(x.id));
    if (itemsAEliminar.length === 0) return;

    const mensajeConfirm =
      itemsAEliminar.length === 1
        ? `¿Está seguro de eliminar la tarea "${itemsAEliminar[0].nombre}"?`
        : `¿Está seguro de eliminar las ${itemsAEliminar.length} tareas seleccionadas?`;

    if (!await confirmAction(mensajeConfirm)) return;

    try {
      setLoading(true);
      for (const item of itemsAEliminar) {
        await TareaService.eliminarTarea(item.id);
      }
      notifySuccess(
        itemsAEliminar.length === 1
          ? 'Tarea eliminada del catálogo.'
          : `${itemsAEliminar.length} tareas eliminadas del catálogo.`
      );
      setSeleccionados(new Set());
      void cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la tarea.');
      setLoading(false);
    }
  };

  const columnas: TableColumnDefinition<TareaDto>[] = useMemo(
    () => [
      createTableColumn<TareaDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre de la Tarea',
        renderCell: (item) => (
          <TableCellLayout>
            <Link
              as="button"
              className={styles.primaryLink}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/servicio-campo/tareas/${item.id}`);
              }}
            >
              {item.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
            createTableColumn<TareaDto>({
        columnId: 'descripcion',
        compare: (a, b) => (a.descripcion || '').localeCompare(b.descripcion || ''),
        renderHeaderCell: () => 'Observación',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.descripcion || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaDto>({
        columnId: 'duracion',
        compare: (a, b) => a.duracionEstimadaMinutos - b.duracionEstimadaMinutos,
        renderHeaderCell: () => 'Duración Est.',
        renderCell: (item) => (
          <TableCellLayout>
            <Text>{item.duracionEstimadaMinutos} min</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaDto>({
        columnId: 'evidencia',
        compare: (a, b) => Number(a.requiereEvidenciaFotografica) - Number(b.requiereEvidenciaFotografica),
        renderHeaderCell: () => 'Evidencia Fotográfica',
        renderCell: (item) => (
          <TableCellLayout>
            <Text>
              {item.requiereEvidenciaFotografica ? 'Exigida' : 'Opcional'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaDto>({
        columnId: 'activo',
        compare: (a, b) => Number(a.activo) - Number(b.activo),
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <TableCellLayout>
            <D365StatusBadge status={item.activo ? 'Activo' : 'Inactivo'} />
          </TableCellLayout>
        ),
      }),
    ],
    [navigate]
  );

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} />

      {/* 1. Barra de Comandos Superior */}
      <D365CommandBar ariaLabel="Barra de comandos de Catálogo de Tareas">
        <D365CommandButton
          icon={<Add16Regular />}
          tone="create"
          onClick={() => navigate('/servicio-campo/tareas/nuevo')}
        >
          Nuevo
        </D365CommandButton>
        <D365CommandButton
          icon={<Edit16Regular />}
          tone="save"
          disabled={seleccionados.size !== 1}
          onClick={() => {
            if (itemSeleccionado) {
              navigate(`/servicio-campo/tareas/${itemSeleccionado.id}`);
            }
          }}
        >
          Editar
        </D365CommandButton>
        <D365CommandButton
          icon={<Delete16Regular />}
          tone="danger"
          disabled={seleccionados.size === 0}
          onClick={() => void eliminarTarea()}
        >
          Eliminar
        </D365CommandButton>
        <D365CommandDivider />
        <D365CommandButton
          icon={<ArrowClockwise16Regular />}
          onClick={() => void cargar()}
          title="Actualizar lista"
        >
          Actualizar
        </D365CommandButton>
      </D365CommandBar>

      {/* 2. Mensajes y Alertas de Error */}
      {error && (
        <div style={{ padding: '0 24px', marginTop: 12 }}>
          <D365MessageBar intent="error" onDismiss={() => setError(null)}>
            {error}
          </D365MessageBar>
        </div>
      )}

      {/* 3. Selector de Vistas y Buscador Estándar */}
      <div className={styles.viewHeader}>
        <div className={styles.viewSelectorTab} style={{ cursor: 'default' }}>
          <Text weight="semibold" size={400}>
            Catálogo Maestro de Tareas
          </Text>
        </div>

        <div className={styles.viewToolsRight}>
          <D365TableToolbarTools
            tableRef={tableRef}
            searchValue={buscar}
            onSearchChange={setBuscar}
            searchPlaceholder="Buscar por código o nombre..."
            searchAriaLabel="Buscar tarea"
          />
        </div>
      </div>

      {/* 4. Tabla de Entidades */}
      <D365EntityTable<TareaDto>
        ref={tableRef}
        entityName="Tareas de Servicio"
        tableId="tareas-catalogo"
        items={filtrados}
        columns={columnas}
        loading={loading}
        error={error}
        onRetry={() => void cargar()}
        selectionMode="multiselect"
        selectedItems={seleccionados}
        onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)}
        onRowDoubleClick={(row) => navigate(`/servicio-campo/tareas/${row.id}`)}
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
