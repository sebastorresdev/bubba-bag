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
import type { TerritorioDto } from '../types/organizacion.types';

type VistaTerritorios = 'activos' | 'todos' | 'inactivos';

const nombresVistaTerritorios: Record<VistaTerritorios, string> = {
  activos: 'Territorios activos',
  todos: 'Todos los territorios',
  inactivos: 'Territorios inactivos',
};

export function TerritoriosListPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const [datos, setDatos] = useState<TerritorioDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [vista, setVista] = useState<VistaTerritorios>('activos');
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [importDrawerOpen, setImportDrawerOpen] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await OrganizacionService.getTerritorios();
      setDatos(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los territorios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return datos.filter((t) => {
      if (vista === 'activos' && !t.activo) return false;
      if (vista === 'inactivos' && t.activo) return false;
      if (!q) return true;
      return (
        t.nombre.toLowerCase().includes(q) ||
        t.codigo.toLowerCase().includes(q) ||
        t.unidadOrganizativaNombre.toLowerCase().includes(q)
      );
    });
  }, [buscar, datos, vista]);

  const itemSeleccionado = useMemo(() => {
    if (seleccionados.size !== 1) return null;
    const idSel = Array.from(seleccionados)[0] as string;
    return datos.find((t) => t.id === idSel) || null;
  }, [seleccionados, datos]);

  const cambiarEstado = async () => {
    if (!itemSeleccionado) return;
    try {
      setLoading(true);
      const nuevoEstado = !itemSeleccionado.activo;
      await OrganizacionService.cambiarEstadoTerritorio(itemSeleccionado.id, nuevoEstado);
      setMensaje(`Territorio "${itemSeleccionado.nombre}" ${nuevoEstado ? 'activado' : 'desactivado'}.`);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar estado.');
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumnDefinition<TerritorioDto>[] = useMemo(
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
                navigate(`/servicio-campo/territorios/${x.id}`);
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
        renderHeaderCell: () => 'Territorio / Zona',
        renderCell: (x) => (
          <TableCellLayout>
            <Text>{x.nombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'sede',
        compare: (a, b) => a.unidadOrganizativaNombre.localeCompare(b.unidadOrganizativaNombre),
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
        columnId: 'almacen',
        renderHeaderCell: () => 'Almacén de Abastecimiento',
        renderCell: (x) => <TableCellLayout>{x.almacenPredeterminadoNombre || '—'}</TableCellLayout>,
      }),
      createTableColumn({
        columnId: 'proveedor',
        renderHeaderCell: () => 'Código Proveedor (DIRECTV)',
        renderCell: (x) => <TableCellLayout truncate>{x.descripcionProveedor || '—'}</TableCellLayout>,
      }),
      createTableColumn({
        columnId: 'estado',
        renderHeaderCell: () => 'Estado',
        renderCell: (x) => (
          <TableCellLayout>
            <Badge appearance="tint" shape="rounded" color={x.activo ? 'success' : 'danger'}>
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

      <D365CommandBar ariaLabel="Comandos de territorios">
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/territorios/nuevo')}
          >
            Nuevo
          </D365CommandButton>

          {itemSeleccionado && (
            <>
              <D365CommandButton
                icon={<Eye16Regular />}
                onClick={() => navigate(`/servicio-campo/territorios/${itemSeleccionado.id}`)}
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
            onClick={() => void OrganizacionService.descargarPlantillaTerritorios()}
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
                {nombresVistaTerritorios[vista]}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              {(Object.keys(nombresVistaTerritorios) as VistaTerritorios[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={vista === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => {
                    setVista(v);
                    setSeleccionados(new Set());
                  }}
                >
                  {nombresVistaTerritorios[v]}
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
            placeholder="Buscar por territorio, código o sede..."
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
        targetEntityName="Territorio"
        onSuccess={cargar}
      />
    </div>
  );
}
