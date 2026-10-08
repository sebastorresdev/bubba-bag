import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Link,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  TableCellLayout,
  Text,
  createTableColumn,
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  DismissCircle16Regular,
  Eye16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
} from '../../../components/common/D365EntityTable';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { OrganizacionService } from '../services/organizacion.service';
import type { RecursoDto } from '../types/organizacion.types';

type VistaRecursos = 'activos' | 'todos' | 'tecnicos' | 'despachadores' | 'sinUsuario' | 'inactivos';

const nombresVistaRecursos: Record<VistaRecursos, string> = {
  activos: 'Recursos activos',
  todos: 'Todos los recursos',
  tecnicos: 'Técnicos de campo',
  despachadores: 'Despachadores',
  sinUsuario: 'Sin usuario de acceso',
  inactivos: 'Recursos inactivos',
};

export function RecursosListPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const tableRef = useRef<D365EntityTableRef>(null);
  const [datos, setDatos] = useState<RecursoDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [vista, setVista] = useState<VistaRecursos>('activos');
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await OrganizacionService.getRecursos();
      setDatos(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los recursos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return datos.filter((r) => {
      if (vista === 'activos' && !r.activo) return false;
      if (vista === 'inactivos' && r.activo) return false;
      if (vista === 'tecnicos' && r.tipo !== 1) return false;
      if (vista === 'despachadores' && r.tipo !== 4) return false;
      if (vista === 'sinUsuario' && r.usuarioId) return false;
      if (!q) return true;
      return (
        r.nombreCompleto.toLowerCase().includes(q) ||
        r.codigo.toLowerCase().includes(q) ||
        (r.unidadOrganizativaNombre && r.unidadOrganizativaNombre.toLowerCase().includes(q)) ||
        (r.documentoIdentidad && r.documentoIdentidad.toLowerCase().includes(q)) ||
        (r.usuarioNombre && r.usuarioNombre.toLowerCase().includes(q)) ||
        (r.usuarioEmail && r.usuarioEmail.toLowerCase().includes(q))
      );
    });
  }, [buscar, datos, vista]);

  const itemSeleccionado = useMemo(() => {
    if (seleccionados.size !== 1) return null;
    const idSel = Array.from(seleccionados)[0] as string;
    return datos.find((r) => r.id === idSel) || null;
  }, [seleccionados, datos]);

  const cambiarEstado = async () => {
    if (!itemSeleccionado) return;
    try {
      setLoading(true);
      const nuevoEstado = !itemSeleccionado.activo;
      await OrganizacionService.cambiarEstadoRecurso(itemSeleccionado.id, nuevoEstado);
      setMensaje(`Recurso "${itemSeleccionado.nombreCompleto}" ${nuevoEstado ? 'activado' : 'desactivado'}.`);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar estado.');
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumnDefinition<RecursoDto>[] = useMemo(
    () => [
      createTableColumn({
        columnId: 'codigo',
        compare: (a, b) => a.codigo.localeCompare(b.codigo),
        renderHeaderCell: () => 'Código',
        renderCell: (x) => (
          <TableCellLayout>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/servicio-campo/recursos/${x.id}`);
              }}
            >
              {x.codigo}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'nombre',
        compare: (a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto),
        renderHeaderCell: () => 'Nombre Completo',
        renderCell: (x) => (
          <TableCellLayout>
            <Text>{x.nombreCompleto}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'tipo',
        compare: (a, b) => a.tipo - b.tipo,
        renderHeaderCell: () => 'Rol / Tipo',
        renderCell: (x) => (
          <TableCellLayout>
            <Badge
              appearance="tint"
              shape="rounded"
              color={x.tipo === 1 ? 'informative' : x.tipo === 4 ? 'important' : 'subtle'}
            >
              {x.tipoNombre}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'usuario',
        compare: (a, b) => (a.usuarioNombre || a.usuarioEmail || '').localeCompare(b.usuarioNombre || b.usuarioEmail || ''),
        renderHeaderCell: () => 'Usuario de Acceso',
        renderCell: (x) => (
          <TableCellLayout truncate>
            {x.usuarioId ? (
              <Badge appearance="tint" shape="rounded" color="success">
                {x.usuarioNombre || x.usuarioEmail || 'Vinculado'}
              </Badge>
            ) : (
              <Badge appearance="tint" shape="rounded" color="warning">
                Sin usuario
              </Badge>
            )}
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'sede',
        compare: (a, b) => (a.unidadOrganizativaNombre || '').localeCompare(b.unidadOrganizativaNombre || ''),
        renderHeaderCell: () => 'Unidad Organizativa',
        renderCell: (x) => (
          <TableCellLayout>
            {x.unidadOrganizativaId ? (
              <Link
                as="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/servicio-campo/unidades-organizativas/${x.unidadOrganizativaId}`);
                }}
              >
                {x.unidadOrganizativaNombre}
              </Link>
            ) : (
              x.unidadOrganizativaNombre || '—'
            )}
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'dni',
        renderHeaderCell: () => 'DNI / Doc',
        renderCell: (x) => <TableCellLayout>{x.documentoIdentidad || '—'}</TableCellLayout>,
      }),
      createTableColumn({
        columnId: 'telefono',
        renderHeaderCell: () => 'Teléfono',
        renderCell: (x) => <TableCellLayout>{x.telefono || '—'}</TableCellLayout>,
      }),
      createTableColumn({
        columnId: 'almacenBase',
        renderHeaderCell: () => 'Bodega Base Asignada',
        renderCell: (x) => <TableCellLayout>{x.almacenBaseNombre || '—'}</TableCellLayout>,
      }),
      createTableColumn({
        columnId: 'estado',
        renderHeaderCell: () => 'Estado',
        renderCell: (x) => (
          <TableCellLayout>
            <Badge
              appearance="tint"
              shape="rounded"
              color={x.activo ? 'success' : 'danger'}
            >
              {x.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </TableCellLayout>
        ),
      }),
    ],
    [navigate]
  );

  return (
    <div className={styles.root}>
      {mensaje && (
        <D365MessageBar intent="success" onDismiss={() => setMensaje(null)}>
          {mensaje}
        </D365MessageBar>
      )}

      <D365CommandBar ariaLabel="Comandos de recursos">
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/recursos/nuevo')}
          >
            Nuevo
          </D365CommandButton>

          {itemSeleccionado && (
            <>
              <D365CommandButton
                icon={<Eye16Regular />}
                onClick={() => navigate(`/servicio-campo/recursos/${itemSeleccionado.id}`)}
              >
                Ver detalle
              </D365CommandButton>
              <D365CommandButton
                icon={itemSeleccionado.activo ? <DismissCircle16Regular /> : <Checkmark16Regular />}
                tone={itemSeleccionado.activo ? 'danger' : 'create'}
                onClick={() => void cambiarEstado()}
              >
                {itemSeleccionado.activo ? 'Desactivar' : 'Activar'}
              </D365CommandButton>
            </>
          )}

          <D365CommandDivider />
          <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void cargar()}>
            Actualizar
          </D365CommandButton>
        </div>
      </D365CommandBar>

      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {nombresVistaRecursos[vista]}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              {(Object.keys(nombresVistaRecursos) as VistaRecursos[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={vista === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => {
                    setVista(v);
                    setSeleccionados(new Set());
                  }}
                >
                  {nombresVistaRecursos[v]}
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
            searchPlaceholder="Buscar por nombre, código o DNI..."
            searchAriaLabel="Buscar en esta vista"
          />
        </div>
      </div>

      <D365EntityTable
        ref={tableRef}
        entityName="Recursos"
        tableId="recursos"
        items={filtrados}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={() => void cargar()}
        selectionMode="multiselect"
        selectedItems={seleccionados}
        onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)}
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
