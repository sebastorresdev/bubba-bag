import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Input,
  Link,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  TableCellLayout,
  Text,
  Tooltip,
  createTableColumn,
  tokens,
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  DataFunnel20Regular,
  Eye16Regular,
  Search16Regular,
  TableEdit16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365ListState } from '../../../../components/common/D365ListState';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { TransferenciaService } from '../services/transferencia.service';
import type { TransferenciaInventarioDto } from '../types/transferencia.types';

type Vista = 'recientes' | 'todas' | 'en_transito';

export function TransferenciasListPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [datos, setDatos] = useState<TransferenciaInventarioDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [vista, setVista] = useState<Vista>('recientes');
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDatos(await TransferenciaService.obtener());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las transferencias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    const texto = (location.state as { successMessage?: string } | null)?.successMessage;
    if (!texto) return;
    setMensaje(texto);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const filtrados = useMemo(() => {
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);
    const q = buscar.trim().toLowerCase();

    return datos.filter((item) => {
      if (vista === 'recientes' && new Date(item.fecha) < limite) return false;
      if (vista === 'en_transito' && item.estado !== 'EnTransito' && item.estado !== 'ParcialmenteRecibida') {
        return false;
      }
      return (
        !q ||
        [
          item.numero,
          item.producto,
          item.almacenOrigen,
          item.almacenDestino,
          item.modalidad ?? '',
          item.estado ?? '',
        ].some((valor) => valor.toLowerCase().includes(q))
      );
    });
  }, [buscar, datos, vista]);

  const columns: TableColumnDefinition<TransferenciaInventarioDto>[] = useMemo(
    () => [
      createTableColumn({
        columnId: 'numero',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          a.numero.localeCompare(b.numero),
        renderHeaderCell: () => 'Número',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout>
            <Link
              as="button"
              style={{ fontWeight: tokens.fontWeightSemibold, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/servicio-campo/transferencias/${x.id}`);
              }}
            >
              {x.numero}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'fecha',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
        renderHeaderCell: () => 'Fecha',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout>{new Date(x.fecha).toLocaleString('es-PE')}</TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'origen',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          a.almacenOrigen.localeCompare(b.almacenOrigen),
        renderHeaderCell: () => 'Origen',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout>{x.almacenOrigen}</TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'destino',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          a.almacenDestino.localeCompare(b.almacenDestino),
        renderHeaderCell: () => 'Destino',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout>{x.almacenDestino}</TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'modalidad',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          (a.modalidad ?? '').localeCompare(b.modalidad ?? ''),
        renderHeaderCell: () => 'Modalidad',
        renderCell: (x: TransferenciaInventarioDto) => {
          const mod = x.modalidad ?? 'Inmediata';
          return (
            <TableCellLayout>
              <Badge
                appearance="tint"
                color={mod === 'ConTransito' ? 'important' : 'informative'}
                size="small"
              >
                {mod === 'ConTransito' ? 'Con Tránsito' : 'Inmediata'}
              </Badge>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn({
        columnId: 'estado',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          (a.estado ?? '').localeCompare(b.estado ?? ''),
        renderHeaderCell: () => 'Estado',
        renderCell: (x: TransferenciaInventarioDto) => {
          const est = x.estado ?? 'Cerrada';
          let color: 'informative' | 'warning' | 'important' | 'success' | 'danger' = 'informative';
          let label = est;

          if (est === 'EnTransito') {
            color = 'warning';
            label = 'En Tránsito';
          } else if (est === 'ParcialmenteRecibida') {
            color = 'important';
            label = 'Parcialmente Recibida';
          } else if (est === 'Cerrada') {
            color = 'success';
            label = 'Cerrada';
          } else if (est === 'Cancelada') {
            color = 'danger';
            label = 'Cancelada';
          }

          return (
            <TableCellLayout>
              <Badge appearance="filled" color={color} size="small">
                {label}
              </Badge>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn({
        columnId: 'items',
        renderHeaderCell: () => 'Materiales transferidos',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout truncate>
            <div>
              <Text weight="semibold">{x.resumenProductos || x.producto || 'Materiales'}</Text>
              {x.totalLineas !== undefined && (
                <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                  {x.totalLineas} {x.totalLineas === 1 ? 'producto distinto' : 'productos distintos'}
                </Text>
              )}
            </div>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'cantidad',
        compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) =>
          (a.totalCantidad ?? a.cantidad ?? 0) - (b.totalCantidad ?? b.cantidad ?? 0),
        renderHeaderCell: () => 'Total Unidades',
        renderCell: (x: TransferenciaInventarioDto) => (
          <TableCellLayout>
            <Text weight="bold">{(x.totalCantidad ?? x.cantidad ?? 0).toLocaleString('es-PE')}</Text>
          </TableCellLayout>
        ),
      }),
    ],
    [navigate]
  );

  const tituloVista = useMemo(() => {
    switch (vista) {
      case 'recientes':
        return 'Transferencias recientes';
      case 'en_transito':
        return 'Pendientes en tránsito';
      case 'todas':
        return 'Todas las transferencias';
    }
  }, [vista]);

  return (
    <div className={styles.root}>
      {mensaje && (
        <D365MessageBar intent="success" onDismiss={() => setMensaje(null)}>
          {mensaje}
        </D365MessageBar>
      )}

      <D365CommandBar ariaLabel="Comandos de transferencias">
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/transferencias/nuevo')}
          >
            Nuevo
          </D365CommandButton>
          {seleccionados.size === 1 && (
            <D365CommandButton
              icon={<Eye16Regular />}
              onClick={() => {
                const idSel = Array.from(seleccionados)[0];
                navigate(`/servicio-campo/transferencias/${idSel}`);
              }}
            >
              Ver detalle
            </D365CommandButton>
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
                {tituloVista}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              <MenuItem
                icon={vista === 'recientes' ? <Checkmark16Regular /> : undefined}
                onClick={() => setVista('recientes')}
              >
                Transferencias recientes
              </MenuItem>
              <MenuItem
                icon={vista === 'en_transito' ? <Checkmark16Regular /> : undefined}
                onClick={() => setVista('en_transito')}
              >
                Pendientes en tránsito
              </MenuItem>
              <MenuItem
                icon={vista === 'todas' ? <Checkmark16Regular /> : undefined}
                onClick={() => setVista('todas')}
              >
                Todas las transferencias
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        <div className={styles.viewToolsRight}>
          <Tooltip content="Modificar orden y visibilidad de columnas" relationship="label">
            <Button
              appearance="subtle"
              size="medium"
              icon={<TableEdit16Regular className={styles.iconBrand} />}
            >
              Editar columnas
            </Button>
          </Tooltip>
          <Tooltip content="Editar filtros de la consulta" relationship="label">
            <Button
              appearance="subtle"
              size="medium"
              icon={<DataFunnel20Regular className={styles.iconBrand} />}
            >
              Editar filtros
            </Button>
          </Tooltip>
          <Input
            className={styles.searchBox}
            size="medium"
            contentBefore={<Search16Regular />}
            placeholder="Buscar" aria-label="Buscar por número, almacén, producto"
            value={buscar}
            onChange={(_, d) => setBuscar(d.value)}
          />
        </div>
      </div>

      <div className={styles.gridContainer}>
        <D365ListState
          loading={loading}
          error={error}
          onRetry={() => void cargar()}
          loadingLabel="Cargando transferencias..."
        >
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
              <DataGridBody<TransferenciaInventarioDto>>
                {({ item, rowId }) => (
                  <DataGridRow<TransferenciaInventarioDto> key={rowId} className={styles.dataRow}>
                    {({ renderCell }) => (
                      <DataGridCell className={styles.dataCell}>{renderCell(item)}</DataGridCell>
                    )}
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
