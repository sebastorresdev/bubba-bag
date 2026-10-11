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
import { TipoOrdenService } from '../services/tipoOrden.service';
import type { TipoOrdenTrabajoDto } from '../types/tipoOrden.types';

type VistaTipos = 'activos' | 'todos' | 'inactivos';

const nombresVistaTipos: Record<VistaTipos, string> = {
  activos: 'Tipos de orden activos',
  todos: 'Todos los tipos de orden',
  inactivos: 'Tipos de orden desactivados',
};

export function TiposOrdenListPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const tableRef = useRef<D365EntityTableRef>(null);
  const toasterId = useId('tipos-orden-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const notifySuccess = useCallback((msg: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{msg}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  const [datos, setDatos] = useState<TipoOrdenTrabajoDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [vista, setVista] = useState<VistaTipos>('activos');
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await TipoOrdenService.getTiposOrden();
      setDatos(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los tipos de orden.');
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
      if (vista === 'activos' && !item.activo) return false;
      if (vista === 'inactivos' && item.activo) return false;
      if (!q) return true;
      return (
        item.nombre.toLowerCase().includes(q) ||
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
        await TipoOrdenService.cambiarEstado(item.id, !item.activo);
      }
      notifySuccess(
        itemsACambiar.length === 1
          ? `Tipo de orden ${itemsACambiar[0].activo ? 'desactivado' : 'activado'} correctamente.`
          : `${itemsACambiar.length} tipos de orden actualizados correctamente.`
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
        ? `¿Está seguro de eliminar el tipo de orden "${itemsAEliminar[0].nombre}"?`
        : `¿Está seguro de eliminar los ${itemsAEliminar.length} tipos de orden seleccionados?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      for (const item of itemsAEliminar) {
        await TipoOrdenService.eliminarTipoOrden(item.id);
      }
      notifySuccess(
        itemsAEliminar.length === 1
          ? 'Tipo de orden eliminado correctamente.'
          : `${itemsAEliminar.length} tipos de orden eliminados correctamente.`
      );
      setSeleccionados(new Set());
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar tipo de orden.');
      setLoading(false);
    }
  };

  const columns: TableColumnDefinition<TipoOrdenTrabajoDto>[] = useMemo(
    () => [
      createTableColumn<TipoOrdenTrabajoDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Tipo de Orden',
        renderCell: (item) => (
          <TableCellLayout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: item.colorHex || '#0f6cbd',
                  flexShrink: 0,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                }}
              />
              <Link
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/servicio-campo/tipos-orden/${item.id}`);
                }}
              >
                {item.nombre}
              </Link>
            </div>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TipoOrdenTrabajoDto>({
        columnId: 'visitaCampo',
        renderHeaderCell: () => 'Visita en Campo',
        renderCell: (item) => (
          <TableCellLayout>
            <Badge
              appearance="tint"
              shape="rounded"
              color={item.requiereVisitaCampo ? 'brand' : 'subtle'}
            >
              {item.requiereVisitaCampo ? 'Sí, requiere' : 'Remoto / Virtual'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TipoOrdenTrabajoDto>({
        columnId: 'firmaCliente',
        renderHeaderCell: () => 'Exige Firma',
        renderCell: (item) => (
          <TableCellLayout>
            <Badge
              appearance="tint"
              shape="rounded"
              color={item.exigeFirmaCliente ? 'informative' : 'subtle'}
            >
              {item.exigeFirmaCliente ? 'Firma requerida' : 'Opcional'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TipoOrdenTrabajoDto>({
        columnId: 'evidencias',
        renderHeaderCell: () => 'Fotos / Evidencias',
        renderCell: (item) => (
          <TableCellLayout>
            <Badge
              appearance="tint"
              shape="rounded"
              color={item.exigeEvidenciasFotograficas ? 'warning' : 'subtle'}
            >
              {item.exigeEvidenciasFotograficas ? 'Evidencias exigidas' : 'Sin fotos'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TipoOrdenTrabajoDto>({
        columnId: 'descripcion',
        renderHeaderCell: () => 'Descripción',
        renderCell: (item) => (
          <TableCellLayout>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              {item.descripcion || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<TipoOrdenTrabajoDto>({
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
      <D365CommandBar ariaLabel="Barra de comandos de tipos de orden">
        <D365CommandButton
          icon={<Add16Regular />}
          tone="create"
          onClick={() => navigate('/servicio-campo/tipos-orden/nuevo')}
        >
          Nuevo
        </D365CommandButton>
        <D365CommandButton
          icon={<Edit16Regular />}
          disabled={seleccionados.size !== 1}
          onClick={() => itemSeleccionado && navigate(`/servicio-campo/tipos-orden/${itemSeleccionado.id}`)}
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
                {nombresVistaTipos[vista]}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              {(Object.keys(nombresVistaTipos) as VistaTipos[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={vista === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => {
                    setVista(v);
                    setSeleccionados(new Set());
                  }}
                >
                  {nombresVistaTipos[v]}
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
            searchPlaceholder="Buscar por nombre o descripción..."
            searchAriaLabel="Buscar tipo de orden"
          />
        </div>
      </div>

      <D365EntityTable
        ref={tableRef}
        entityName="Tipos de Orden"
        tableId="tipos-orden"
        items={filtrados}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={() => void cargar()}
        selectionMode="multiselect"
        selectedItems={seleccionados}
        onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)}
        onRowDoubleClick={(row) => navigate(`/servicio-campo/tipos-orden/${row.id}`)}
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
