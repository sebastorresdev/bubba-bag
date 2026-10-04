import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Input,
  Link,
  TableCellLayout,
  Text,
  tokens,
  createTableColumn,
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  BuildingBank20Regular,
  Checkmark16Regular,
  DismissCircle16Regular,
  Eye16Regular,
  Search16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365ListState } from '../../../components/common/D365ListState';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { TableEmptyState } from '../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { OrganizacionService } from '../services/organizacion.service';
import type { UnidadOrganizativaDto } from '../types/organizacion.types';

export function UnidadesOrganizativasListPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const [datos, setDatos] = useState<UnidadOrganizativaDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

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
    if (!q) return datos;
    return datos.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.codigo.toLowerCase().includes(q) ||
        (u.ciudad && u.ciudad.toLowerCase().includes(q))
    );
  }, [buscar, datos]);

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
              style={{ fontWeight: tokens.fontWeightSemibold, cursor: 'pointer' }}
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
            <Text weight="semibold">{x.nombre}</Text>
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
              <Badge appearance="filled" color="important">
                Sede Principal
              </Badge>
            ) : (
              <Badge appearance="tint" color="informative">
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
            <Badge appearance="filled" color={x.activo ? 'success' : 'danger'}>
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
        </div>
      </D365CommandBar>

      <div className={styles.viewHeader}>
        <div className={styles.viewSelectorTab}>
          <BuildingBank20Regular />
          <Text weight="semibold" size={400}>
            Unidades Organizativas (Sedes y Bases)
          </Text>
        </div>

        <div className={styles.viewToolsRight}>
          <Input
            className={styles.searchBox}
            size="medium"
            contentBefore={<Search16Regular />}
            placeholder="Buscar" aria-label="Buscar por nombre, código o ciudad"
            value={buscar}
            onChange={(_, d) => setBuscar(d.value)}
          />
        </div>
      </div>

      <div className={styles.gridContainer}>
        <D365ListState loading={loading} error={error} onRetry={() => void cargar()}>
          <DataGrid
            items={filtrados}
            columns={columns}
            sortable
            selectionMode="multiselect"
            selectedItems={seleccionados}
            onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)}
            getRowId={(item) => item.id}
            focusMode="composite"
            size="medium"
            className={styles.table}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
              </DataGridRow>
            </DataGridHeader>
            {filtrados.length === 0 ? (
              <TableEmptyState />
            ) : (
              <DataGridBody<UnidadOrganizativaDto>>
                {({ item, rowId }) => (
                  <DataGridRow<UnidadOrganizativaDto> key={rowId} className={styles.dataRow}>
                    {({ renderCell }) => <DataGridCell className={styles.dataCell}>{renderCell(item)}</DataGridCell>}
                  </DataGridRow>
                )}
              </DataGridBody>
            )}
          </DataGrid>
        </D365ListState>
      </div>

      <footer className={styles.footer}>
        <div>
          1-{filtrados.length} de {filtrados.length} ({seleccionados.size} seleccionados)
        </div>
        <div>Página 1</div>
      </footer>
    </div>
  );
}
