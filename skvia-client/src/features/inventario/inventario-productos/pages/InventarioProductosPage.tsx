import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  TableCellLayout,
  Text,
  createTableColumn,
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  ArrowClockwise16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
} from '../../../../components/common/D365EntityTable';
import type { D365FilterField } from '../../../../components/common/D365FiltrosAvanzadosDrawer';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { AlmacenService } from '../../almacenes/services/almacen.service';
import type { AlmacenDto } from '../../almacenes/types/almacen.types';
import { InventarioProductoService } from '../services/inventario-producto.service';
import type { InventarioProductoDto } from '../types/inventario-producto.types';
import { SeriesAlmacenDrawer } from '../components/SeriesAlmacenDrawer';

const formatoCantidad = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 4 });
const formatoMoneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export type InventarioProductoItem = InventarioProductoDto & { id: string };

const filterFields: D365FilterField[] = [
  { id: 'codigoProducto', label: 'Código de producto', type: 'string' },
  { id: 'nombreProducto', label: 'Producto', type: 'string' },
  { id: 'nombreAlmacen', label: 'Almacén', type: 'string' },
  { id: 'nombreUbicacion', label: 'Ubicación', type: 'string' },
  { id: 'condicion', label: 'Condición', type: 'string' },
  { id: 'nombreUnidadMedida', label: 'Unidad', type: 'string' },
  { id: 'cantidadDisponible', label: 'Disponible', type: 'number' },
  { id: 'cantidadReservada', label: 'Reservado', type: 'number' },
  { id: 'cantidadTotal', label: 'Existencia', type: 'number' },
  { id: 'valorInventario', label: 'Valor', type: 'number' },
];

export function InventarioProductosPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const tableRef = useRef<D365EntityTableRef>(null);
  const [registros, setRegistros] = useState<InventarioProductoDto[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [almacenId, setAlmacenId] = useState('');
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [itemParaVerSeries, setItemParaVerSeries] = useState<InventarioProductoDto | null>(null);

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
      // Excluir artículos sin existencias ni stock disponible
      if (registro.cantidadTotal <= 0 && registro.cantidadDisponible <= 0) return false;
      if (almacenId && registro.almacenId !== almacenId) return false;
      if (!termino) return true;
      return [registro.codigoProducto, registro.nombreProducto, registro.nombreAlmacen]
        .some((valor) => valor.toLocaleLowerCase('es').includes(termino));
    });
  }, [almacenId, buscar, registros]);

  const itemsConId: InventarioProductoItem[] = useMemo(() => {
    return registrosFiltrados.map((item) => ({
      ...item,
      id: item.stockId,
    }));
  }, [registrosFiltrados]);

  const totales = useMemo(() => registrosFiltrados.reduce(
    (acumulado, registro) => ({
      disponible: acumulado.disponible + registro.cantidadDisponible,
      reservado: acumulado.reservado + registro.cantidadReservada,
      valor: acumulado.valor + registro.valorInventario,
    }),
    { disponible: 0, reservado: 0, valor: 0 },
  ), [registrosFiltrados]);

  const columns: TableColumnDefinition<InventarioProductoItem>[] = useMemo(() => [
    createTableColumn({
      columnId: 'codigoProducto',
      compare: (a, b) => a.codigoProducto.localeCompare(b.codigoProducto),
      renderHeaderCell: () => 'Código',
      renderCell: (item: InventarioProductoItem) => <TableCellLayout>{item.codigoProducto}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'nombreProducto',
      compare: (a, b) => a.nombreProducto.localeCompare(b.nombreProducto),
      renderHeaderCell: () => 'Producto',
      renderCell: (item: InventarioProductoItem) => (
        <TableCellLayout truncate>
          <Link
            as="button"
            className={styles.primaryLink}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/servicio-campo/productos/${item.productoId}`);
            }}
          >
            {item.nombreProducto}
          </Link>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'nombreAlmacen',
      compare: (a, b) => a.nombreAlmacen.localeCompare(b.nombreAlmacen),
      renderHeaderCell: () => 'Almacén',
      renderCell: (item: InventarioProductoItem) => (
        <TableCellLayout truncate>
          <Link
            as="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/servicio-campo/almacenes/${item.almacenId}`);
            }}
          >
            {item.nombreAlmacen}
          </Link>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'nombreUbicacion',
      compare: (a, b) => (a.nombreUbicacion || '').localeCompare(b.nombreUbicacion || ''),
      renderHeaderCell: () => 'Ubicación',
      renderCell: (item: InventarioProductoItem) => <TableCellLayout>{item.nombreUbicacion || '—'}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'condicion',
      compare: (a, b) => (a.condicion || '').localeCompare(b.condicion || ''),
      renderHeaderCell: () => 'Condición',
      renderCell: (item: InventarioProductoItem) => <TableCellLayout>{item.condicion || '—'}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'nombreUnidadMedida',
      compare: (a, b) => (a.nombreUnidadMedida || '').localeCompare(b.nombreUnidadMedida || ''),
      renderHeaderCell: () => 'Unidad',
      renderCell: (item: InventarioProductoItem) => <TableCellLayout>{item.nombreUnidadMedida ?? '—'}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'cantidadDisponible',
      compare: (a, b) => a.cantidadDisponible - b.cantidadDisponible,
      renderHeaderCell: () => 'Disponible',
      renderCell: (item: InventarioProductoItem) => <TableCellLayout>{formatoCantidad.format(item.cantidadDisponible)}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'cantidadReservada',
      compare: (a, b) => a.cantidadReservada - b.cantidadReservada,
      renderHeaderCell: () => 'Reservado',
      renderCell: (item: InventarioProductoItem) => <TableCellLayout>{formatoCantidad.format(item.cantidadReservada)}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'cantidadTotal',
      compare: (a, b) => a.cantidadTotal - b.cantidadTotal,
      renderHeaderCell: () => 'Existencia',
      renderCell: (item: InventarioProductoItem) => (
        <TableCellLayout>
          {item.esSerializado && item.cantidadTotal > 0 ? (
            <Link
              as="button"
              style={{ fontWeight: 600, textDecoration: 'underline' }}
              onClick={(e) => {
                e.stopPropagation();
                setItemParaVerSeries(item);
              }}
              title="Clic para ver detalle de series registradas"
            >
              {formatoCantidad.format(item.cantidadTotal)} (Ver series)
            </Link>
          ) : (
            formatoCantidad.format(item.cantidadTotal)
          )}
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'valorInventario',
      compare: (a, b) => a.valorInventario - b.valorInventario,
      renderHeaderCell: () => 'Valor',
      renderCell: (item: InventarioProductoItem) => <TableCellLayout>{formatoMoneda.format(item.valorInventario)}</TableCellLayout>,
    }),
  ], [navigate, styles.primaryLink]);

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
          <D365TableToolbarTools
            tableRef={tableRef}
            searchValue={buscar}
            onSearchChange={setBuscar}
            searchPlaceholder="Buscar en inventario"
          />
        </div>
      </div>

      <D365EntityTable
        ref={tableRef}
        entityName="Inventario de Productos"
        tableId="inventario-productos"
        items={itemsConId}
        columns={columns}
        loading={cargando}
        error={error}
        onRetry={cargar}
        filterFields={filterFields}
        selectionMode="multiselect"
        selectedItems={seleccionados}
        onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)}
        onRowDoubleClick={(item) => navigate(`/servicio-campo/productos/${item.productoId}`)}
      />

      <footer className={styles.footer}>
        <div>
          1-{registrosFiltrados.length} de {registrosFiltrados.length} ({seleccionados.size} seleccionados)
        </div>
        <div>
          Disponible: {formatoCantidad.format(totales.disponible)} · Reservado: {formatoCantidad.format(totales.reservado)} · Valor: {formatoMoneda.format(totales.valor)}
        </div>
      </footer>

      <SeriesAlmacenDrawer item={itemParaVerSeries} alCerrar={() => setItemParaVerSeries(null)} />
    </div>
  );
}
