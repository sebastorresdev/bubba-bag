import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Input,
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
  ArrowDownload16Regular,
  ArrowUpload16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  DismissCircle16Regular,
  Eye16Regular,
  Search16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365EntityTable } from '../../../components/common/D365EntityTable';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { ImportacionDrawer } from '../../../components/common/ImportacionDrawer';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { OrganizacionService } from '../services/organizacion.service';
import type { UnidadOrganizativaDto } from '../types/organizacion.types';

type VistaUnidades = 'activas' | 'todas' | 'principales' | 'inactivas';

const nombresVistaUnidades: Record<VistaUnidades, string> = {
  activas: 'Sedes y bases activas',
  todas: 'Todas las unidades organizativas',
  principales: 'Sedes principales',
  inactivas: 'Unidades inactivas',
};

export function UnidadesOrganizativasListPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const [datos, setDatos] = useState<UnidadOrganizativaDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [vista, setVista] = useState<VistaUnidades>('activas');
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [importDrawerOpen, setImportDrawerOpen] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await OrganizacionService.getUnidadesOrganizativas();
      setDatos(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las unidades organizativas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return datos.filter((u) => {
      if (vista === 'activas' && !u.activo) return false;
      if (vista === 'inactivas' && u.activo) return false;
      if (vista === 'principales' && !u.esSedePrincipal) return false;
      if (!q) return true;
      return (
        u.nombre.toLowerCase().includes(q) ||
        u.codigo.toLowerCase().includes(q) ||
        (u.ciudad && u.ciudad.toLowerCase().includes(q))
      );
    });
  }, [buscar, datos, vista]);

  const itemSeleccionado = useMemo(() => {
    if (seleccionados.size !== 1) return null;
    const idSel = Array.from(seleccionados)[0] as string;
    return datos.find((u) => u.id === idSel) || null;
  }, [seleccionados, datos]);

  const cambiarEstado = async () => {
    if (!itemSeleccionado) return;
    try {
      setLoading(true);
      const nuevoEstado = !itemSeleccionado.activo;
      await OrganizacionService.cambiarEstadoUnidadOrganizativa(itemSeleccionado.id, nuevoEstado);
      setMensaje(`Unidad "${itemSeleccionado.nombre}" ${nuevoEstado ? 'activada' : 'desactivada'} correctamente.`);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar estado.');
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumnDefinition<UnidadOrganizativaDto>[] = useMemo(
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
                navigate(`/servicio-campo/unidades-organizativas/${x.id}`);
              }}
            >
              {x.codigo}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre / Sede',
        renderCell: (x) => (
          <TableCellLayout>
            <Text>{x.nombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'ciudad',
        renderHeaderCell: () => 'Ciudad',
        renderCell: (x) => <TableCellLayout>{x.ciudad || '—'}</TableCellLayout>,
      }),
      createTableColumn({
        columnId: 'direccion',
        renderHeaderCell: () => 'Dirección',
        renderCell: (x) => <TableCellLayout truncate>{x.direccion || '—'}</TableCellLayout>,
      }),
      createTableColumn({
        columnId: 'telefono',
        renderHeaderCell: () => 'Teléfono',
        renderCell: (x) => <TableCellLayout>{x.telefono || '—'}</TableCellLayout>,
      }),
      createTableColumn({
        columnId: 'tipo',
        renderHeaderCell: () => 'Jerarquía',
        renderCell: (x) => (
          <TableCellLayout>
            {x.esSedePrincipal ? (
              <Badge appearance="tint" shape="rounded" color="important">
                Sede Principal
              </Badge>
            ) : (
              <Badge appearance="tint" shape="rounded" color="informative">
                Base Zonal
              </Badge>
            )}
          </TableCellLayout>
        ),
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

      <D365CommandBar ariaLabel="Comandos de unidades organizativas">
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/unidades-organizativas/nuevo')}
          >
            Nuevo
          </D365CommandButton>

          {itemSeleccionado && (
            <>
              <D365CommandButton
                icon={<Eye16Regular />}
                onClick={() => navigate(`/servicio-campo/unidades-organizativas/${itemSeleccionado.id}`)}
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
          <D365CommandButton
            icon={<ArrowDownload16Regular />}
            onClick={() => void OrganizacionService.descargarPlantillaUnidadesOrganizativas()}
          >
            Descargar plantilla
          </D365CommandButton>
          <D365CommandButton
            icon={<ArrowUpload16Regular />}
            onClick={() => setImportDrawerOpen(true)}
          >
            Importar de Excel
          </D365CommandButton>
        </div>
      </D365CommandBar>

      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {nombresVistaUnidades[vista]}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              {(Object.keys(nombresVistaUnidades) as VistaUnidades[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={vista === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => {
                    setVista(v);
                    setSeleccionados(new Set());
                  }}
                >
                  {nombresVistaUnidades[v]}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        <div className={styles.viewToolsRight}>
          <Input
            className={styles.searchBox}
            size="medium"
            contentBefore={<Search16Regular />}
            placeholder="Buscar por nombre, código o ciudad..."
            aria-label="Buscar en esta vista"
            value={buscar}
            onChange={(_, d) => setBuscar(d.value)}
          />
        </div>
      </div>

      <D365EntityTable
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

      <ImportacionDrawer
        open={importDrawerOpen}
        onOpenChange={setImportDrawerOpen}
        targetEntityName="UnidadOrganizativa"
        onSuccess={cargar}
      />
    </div>
  );
}
