import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Button,
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
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  ArrowClockwise16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  DataFunnel20Regular,
  Search16Regular,
  TableEdit16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import { D365ListState } from '../../../../components/common/D365ListState';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { AlmacenService } from '../../almacenes/services/almacen.service';
import type { AlmacenDto } from '../../almacenes/types/almacen.types';
import { InventarioProductoService } from '../services/inventario-producto.service';
import type { InventarioProductoDto } from '../types/inventario-producto.types';

const formatoCantidad = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 4 });
const formatoMoneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export function InventarioProductosPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const [registros, setRegistros] = useState<InventarioProductoDto[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [almacenId, setAlmacenId] = useState('');
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const [inventario, catalogoAlmacenes] = await Promise.all([
        InventarioProductoService.obtener(),
        AlmacenService.getAlmacenes(true),
      ]);
      setRegistros(inventario);
      setAlmacenes(catalogoAlmacenes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el inventario.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const registrosFiltrados = useMemo(() => {
    const termino = buscar.trim().toLocaleLowerCase('es');
    return registros.filter((registro) => {
      if (almacenId && registro.almacenId !== almacenId) return false;
      if (!termino) return true;
      return [registro.codigoProducto, registro.nombreProducto, registro.nombreAlmacen]
        .some((valor) => valor.toLocaleLowerCase('es').includes(termino));
    });
  }, [almacenId, buscar, registros]);

  const totales = useMemo(() => registrosFiltrados.reduce(
    (acumulado, registro) => ({
      disponible: acumulado.disponible + registro.cantidadDisponible,
      reservado: acumulado.reservado + registro.cantidadReservada,
      valor: acumulado.valor + registro.valorInventario,
    }),
    { disponible: 0, reservado: 0, valor: 0 },
  ), [registrosFiltrados]);

  const columns: TableColumnDefinition<InventarioProductoDto>[] = useMemo(() => [
    createTableColumn({
      columnId: 'codigo',
      renderHeaderCell: () => 'Código',
      renderCell: (item: InventarioProductoDto) => <TableCellLayout>{item.codigoProducto}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'producto',
      renderHeaderCell: () => 'Producto',
      renderCell: (item: InventarioProductoDto) => (
        <TableCellLayout truncate>
          <Link as="button" onClick={() => navigate(`/servicio-campo/productos/${item.productoId}`)}>
            {item.nombreProducto}
          </Link>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'almacen',
      renderHeaderCell: () => 'Almacén',
      renderCell: (item: InventarioProductoDto) => (
        <TableCellLayout truncate>
          <Link as="button" onClick={() => navigate(`/servicio-campo/almacenes/${item.almacenId}`)}>
            {item.nombreAlmacen}
          </Link>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'unidad',
      renderHeaderCell: () => 'Unidad',
      renderCell: (item: InventarioProductoDto) => <TableCellLayout>{item.nombreUnidadMedida ?? '—'}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'disponible',
      renderHeaderCell: () => 'Disponible',
      renderCell: (item: InventarioProductoDto) => <TableCellLayout>{formatoCantidad.format(item.cantidadDisponible)}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'reservado',
      renderHeaderCell: () => 'Reservado',
      renderCell: (item: InventarioProductoDto) => <TableCellLayout>{formatoCantidad.format(item.cantidadReservada)}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'total',
      renderHeaderCell: () => 'Existencia',
      renderCell: (item: InventarioProductoDto) => <TableCellLayout>{formatoCantidad.format(item.cantidadTotal)}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'valor',
      renderHeaderCell: () => 'Valor',
      renderCell: (item: InventarioProductoDto) => <TableCellLayout>{formatoMoneda.format(item.valorInventario)}</TableCellLayout>,
    }),
  ], [navigate]);

  return (
    <div className={styles.root}>
      <D365CommandBar ariaLabel="Comandos de inventario de productos">
        <div className={styles.toolbarLeft}>
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
                {almacenId
                  ? almacenes.find((almacen) => almacen.id === almacenId)?.nombre ?? 'Inventario de productos'
                  : 'Inventario de productos'}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              <MenuItem
                icon={!almacenId ? <Checkmark16Regular /> : undefined}
                onClick={() => setAlmacenId('')}
              >
                Inventario de productos
              </MenuItem>
              {almacenes.map((almacen) => (
                <MenuItem
                  key={almacen.id}
                  icon={almacenId === almacen.id ? <Checkmark16Regular /> : undefined}
                  onClick={() => setAlmacenId(almacen.id)}
                >
                  {almacen.nombre}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>
        <div className={styles.viewToolsRight}>
          <Tooltip content="Modificar orden y visibilidad de columnas" relationship="label">
            <Button appearance="subtle" size="medium" icon={<TableEdit16Regular className={styles.iconBrand} />}>
              Editar columnas
            </Button>
          </Tooltip>
          <Tooltip content="Filtrar por almacén desde el selector de vista" relationship="label">
            <Button appearance="subtle" size="medium" icon={<DataFunnel20Regular className={styles.iconBrand} />}>
              Editar filtros
            </Button>
          </Tooltip>
          <Input
            className={styles.searchBox}
            size="medium"
            contentBefore={<Search16Regular />}
            placeholder="---"
            value={buscar}
            onChange={(_, data) => setBuscar(data.value)}
          />
        </div>
      </div>

      <div className={styles.gridContainer}>
        <D365ListState loading={cargando} error={error} onRetry={() => void cargar()} loadingLabel="Cargando inventario...">
          <DataGrid
            items={registrosFiltrados}
            columns={columns}
            sortable
            selectionMode="multiselect"
            selectedItems={seleccionados}
            onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)}
            getRowId={(item) => item.stockId}
            focusMode="composite"
            size="medium"
            className={styles.table}
          >
            <DataGridHeader>
              <DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow>
            </DataGridHeader>
            {registrosFiltrados.length === 0 ? <TableEmptyState /> : (
              <DataGridBody<InventarioProductoDto>>
                {({ item, rowId }) => (
                  <DataGridRow<InventarioProductoDto> key={rowId} className={styles.dataRow}>
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
          1-{registrosFiltrados.length} de {registrosFiltrados.length} ({seleccionados.size} seleccionados)
        </div>
        <div>
          Disponible: {formatoCantidad.format(totales.disponible)} · Reservado: {formatoCantidad.format(totales.reservado)} · Valor: {formatoMoneda.format(totales.valor)}
        </div>
      </footer>
    </div>
  );
}
