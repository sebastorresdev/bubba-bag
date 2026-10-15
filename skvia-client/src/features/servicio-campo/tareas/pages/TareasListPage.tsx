import { confirmAction } from '../../../../services/uiFeedback';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TableCellLayout,
  Text,
  Badge,
  Input,
  Checkbox,
  Textarea,
  Button,
  Link,
  Toaster,
  Toast,
  ToastTitle,
  useId,
  useToastController,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  tokens,
  createTableColumn,
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  Edit16Regular,
  Delete16Regular,
  Timer16Regular,
  Camera16Regular,
  Checkmark16Regular,
  Dismiss24Regular,
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
import type { TareaDto, GuardarTareaDto } from '../../configuraciones-servicio/types/configuracionServicio.types';

export function TareasListPage() {
  const styles = useD365ListStyles();
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

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState<TareaDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [drawerErrors, setDrawerErrors] = useState<Record<string, string>>({});

  // Form state
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formDuracion, setFormDuracion] = useState(30);
  const [formEvidencia, setFormEvidencia] = useState(false);

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
        t.codigo.toLowerCase().includes(q) ||
        t.nombre.toLowerCase().includes(q) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(q))
    );
  }, [buscar, datos]);

  const itemSeleccionado = useMemo(() => {
    if (seleccionados.size !== 1) return null;
    const idSel = Array.from(seleccionados)[0] as string;
    return datos.find((x) => x.id === idSel) || null;
  }, [seleccionados, datos]);

  const abrirNuevo = () => {
    setEditingTarea(null);
    setFormCodigo('');
    setFormNombre('');
    setFormDescripcion('');
    setFormDuracion(30);
    setFormEvidencia(false);
    setDrawerErrors({});
    setDrawerOpen(true);
  };

  const abrirEditar = (t?: TareaDto) => {
    const target = t || itemSeleccionado;
    if (!target) return;
    setEditingTarea(target);
    setFormCodigo(target.codigo);
    setFormNombre(target.nombre);
    setFormDescripcion(target.descripcion || '');
    setFormDuracion(target.duracionEstimadaMinutos);
    setFormEvidencia(target.requiereEvidenciaFotografica);
    setDrawerErrors({});
    setDrawerOpen(true);
  };

  const guardarTarea = async () => {
    const errs: Record<string, string> = {};
    if (!formNombre.trim()) errs.nombre = 'El nombre de la tarea es obligatorio.';
    if (formDuracion < 1) errs.duracion = 'La duración debe ser mayor a 0 minutos.';
    setDrawerErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setSaving(true);
      const payload: GuardarTareaDto = {
        codigo: formCodigo.trim() || undefined,
        nombre: formNombre.trim(),
        descripcion: formDescripcion.trim() || undefined,
        duracionEstimadaMinutos: formDuracion,
        requiereEvidenciaFotografica: formEvidencia,
      };

      if (editingTarea) {
        await TareaService.actualizarTarea(editingTarea.id, payload);
        notifySuccess(`Tarea "${formNombre}" actualizada correctamente.`);
      } else {
        await TareaService.crearTarea(payload);
        notifySuccess(`Tarea "${formNombre}" registrada en el catálogo maestro.`);
      }

      setDrawerOpen(false);
      void cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar tarea.');
    } finally {
      setSaving(false);
    }
  };

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
            <Link onClick={() => abrirEditar(item)}>
              {item.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaDto>({
        columnId: 'descripcion',
        compare: (a, b) => (a.descripcion || '').localeCompare(b.descripcion || ''),
        renderHeaderCell: () => 'Descripción / Alcance',
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
            <Badge appearance="ghost" color="informative" icon={<Timer16Regular />}>
              {item.duracionEstimadaMinutos} min
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TareaDto>({
        columnId: 'evidencia',
        compare: (a, b) => Number(a.requiereEvidenciaFotografica) - Number(b.requiereEvidenciaFotografica),
        renderHeaderCell: () => 'Evidencia Fotográfica',
        renderCell: (item) => (
          <TableCellLayout>
            {item.requiereEvidenciaFotografica ? (
              <Badge appearance="filled" color="important" icon={<Camera16Regular />}>
                Exigida
              </Badge>
            ) : (
              <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
                Opcional
              </Text>
            )}
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
    []
  );

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} />

      {/* 1. Barra de Comandos Superior */}
      <D365CommandBar ariaLabel="Barra de comandos de Catálogo de Tareas">
        <D365CommandButton icon={<Add16Regular />} tone="create" onClick={abrirNuevo}>
          Nuevo
        </D365CommandButton>
        <D365CommandButton
          icon={<Edit16Regular />}
          tone="save"
          disabled={seleccionados.size !== 1}
          onClick={() => abrirEditar()}
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
        onRowDoubleClick={(row) => abrirEditar(row)}
      />

      <footer className={styles.footer}>
        <div>
          1-{filtrados.length} de {filtrados.length}
          {seleccionados.size > 0 && ` (${seleccionados.size} seleccionados)`}
        </div>
        <div>Página 1</div>
      </footer>

      {/* 5. Drawer Lateral Derecho para Crear / Editar Tarea */}
      <OverlayDrawer
        position="end"
        open={drawerOpen}
        onOpenChange={(_, { open }) => setDrawerOpen(open)}
        style={{ width: 440, maxWidth: '95vw' }}
      >
        <DrawerHeader style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={() => setDrawerOpen(false)}
              />
            }
          >
            {editingTarea ? 'Editar Tarea de Servicio' : 'Nueva Tarea de Servicio'}
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text weight="semibold" size={200}>Nombre de la Tarea *</Text>
            <Input
              value={formNombre}
              onChange={(_, d) => setFormNombre(d.value)}
              style={{ width: '100%' }}
            />
            {drawerErrors.nombre && (
              <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>
                {drawerErrors.nombre}
              </Text>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text weight="semibold" size={200}>Duración Estimada (minutos) *</Text>
            <Input
              type="number"
              min={1}
              value={formDuracion.toString()}
              onChange={(_, d) => setFormDuracion(Math.max(1, parseInt(d.value) || 1))}
              style={{ width: '100%' }}
            />
            {drawerErrors.duracion && (
              <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>
                {drawerErrors.duracion}
              </Text>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Text weight="semibold" size={200}>Descripción / Alcance Técnico</Text>
            <Textarea
              value={formDescripcion}
              onChange={(_, d) => setFormDescripcion(d.value)}
              rows={3}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginTop: 8 }}>
            <Checkbox
              checked={formEvidencia}
              onChange={(_, d) => setFormEvidencia(Boolean(d.checked))}
              label="Exige captura de evidencia fotográfica para validación"
            />
          </div>
        </DrawerBody>

        <DrawerFooter style={{ borderTop: `1px solid ${tokens.colorNeutralStroke2}`, padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button appearance="secondary" onClick={() => setDrawerOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            appearance="primary"
            icon={<Checkmark16Regular />}
            onClick={() => void guardarTarea()}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Tarea'}
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
    </div>
  );
}
