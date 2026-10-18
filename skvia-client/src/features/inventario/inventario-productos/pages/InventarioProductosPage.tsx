import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link,
  Button,
  Tooltip,
  tokens,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  SplitButton,
  type MenuButtonProps,
  TableCellLayout,
  Text,
  createTableColumn,
} from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import {
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  BarcodeScanner20Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  DocumentTable20Regular,
  DocumentText20Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { AlmacenService } from '../../almacenes/services/almacen.service';
import type { AlmacenDto } from '../../almacenes/types/almacen.types';
import { InventarioProductoService } from '../services/inventario-producto.service';
import type { InventarioProductoDto, ItemSeriadoStockDto } from '../types/inventario-producto.types';
import { exportToExcel, exportToCSV, type ExportColumn } from '../../../../utils/exportUtils';
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
  { id: 'cantidadTotal', label: 'Cantidad', type: 'number' },
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
      cantidad: acumulado.cantidad + registro.cantidadTotal,
      valor: acumulado.valor + registro.valorInventario,
    }),
    { cantidad: 0, valor: 0 },
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
      columnId: 'cantidadTotal',
      compare: (a, b) => a.cantidadTotal - b.cantidadTotal,
      renderHeaderCell: () => 'Cantidad',
      renderCell: (item: InventarioProductoItem) => (
        <TableCellLayout>
          {formatoCantidad.format(item.cantidadTotal)}
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'series',
      renderHeaderCell: () => 'Series',
      renderCell: (item: InventarioProductoItem) => (
        <TableCellLayout>
          {item.esSerializado && item.cantidadTotal > 0 ? (
            <Tooltip content="Ver detalle de series" relationship="label">
              <Button
                size="small"
                appearance="subtle"
                icon={<BarcodeScanner20Regular />}
                onClick={(e) => {
                  e.stopPropagation();
                  setItemParaVerSeries(item);
                }}
                aria-label="Ver series registradas"
              />
            </Tooltip>
          ) : (
            <Text style={{ color: tokens.colorNeutralForeground4 }}>—</Text>
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

  const handleExportExcel = () => {
    const cols: ExportColumn<InventarioProductoItem>[] = [
      { header: 'Código', accessor: x => x.codigoProducto },
      { header: 'Producto', accessor: x => x.nombreProducto },
      { header: 'Almacén', accessor: x => x.nombreAlmacen },
      { header: 'Ubicación', accessor: x => x.nombreUbicacion || 'Principal' },
      { header: 'Condición', accessor: x => x.condicion || 'Utilizable' },
      { header: 'Unidad', accessor: x => x.nombreUnidadMedida || 'UND' },
      { header: 'Cantidad', accessor: x => x.cantidadTotal },
      { header: 'Valor (PEN)', accessor: x => x.valorInventario },
    ];
    const nombreAlm = almacenId ? (almacenes.find(a => a.id === almacenId)?.nombre || 'Almacen').replace(/\s+/g, '_') : 'General';
    exportToExcel(itemsConId, cols, `Existencias_Inventario_${nombreAlm}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportSeriesReporte34 = async () => {
    try {
      setCargando(true);
      const seriesData = await InventarioProductoService.obtenerSeries(almacenId || undefined);
      if (!seriesData || seriesData.length === 0) {
        alert('No se encontraron series registradas para el almacén seleccionado.');
        return;
      }
      const cols: ExportColumn<ItemSeriadoStockDto>[] = [
        { header: 'Almacén / Organización', accessor: s => (s.nombreAlmacen || '').replace(/^[\p{Emoji}\s]+/u, '').trim() },
        { header: 'Subinventario / Ubicación', accessor: s => s.nombreUbicacion || 'Principal' },
        { header: 'Código de Producto (SKU)', accessor: s => s.codigoProducto },
        { header: 'Descripción del Producto', accessor: s => s.nombreProducto },
        { header: 'Número de Serie', accessor: s => s.numeroSerie },
        { header: 'SmartCard', accessor: s => s.numeroSmartCard || '' },
        { header: 'MAC Address', accessor: s => s.macAddress || '' },
        { header: 'Estado del Material', accessor: s => s.condicion || (s.estado === 'EnAlmacen' ? 'Disponible' : s.estado) },
        { header: 'Cantidad en Existencia', accessor: () => 1 },
        { header: 'Unidad de Medida', accessor: () => 'Unidad' },
        { header: 'Fecha de Recepción / Ingreso', accessor: s => s.createdAt ? new Date(s.createdAt).toLocaleString('es-PE') : '' },
      ];
      const nombreAlm = almacenId ? (almacenes.find(a => a.id === almacenId)?.nombre || 'Almacen').replace(/\s+/g, '_') : 'General';
      exportToExcel(seriesData, cols, `Reporte34_Series_Ubicaciones_${nombreAlm}_${new Date().toISOString().split('T')[0]}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al exportar el reporte de series.');
    } finally {
      setCargando(false);
    }
  };

  const handleExportCSV = () => {
    const cols: ExportColumn<InventarioProductoItem>[] = [
      { header: 'Código', accessor: x => x.codigoProducto },
      { header: 'Producto', accessor: x => x.nombreProducto },
      { header: 'Almacén', accessor: x => x.nombreAlmacen },
      { header: 'Ubicación', accessor: x => x.nombreUbicacion || 'Principal' },
      { header: 'Condición', accessor: x => x.condicion || 'Utilizable' },
      { header: 'Unidad', accessor: x => x.nombreUnidadMedida || 'UND' },
      { header: 'Disponible', accessor: x => x.cantidadDisponible },
      { header: 'Reservado', accessor: x => x.cantidadReservada },
      { header: 'Total', accessor: x => x.cantidadTotal },
      { header: 'Valor (PEN)', accessor: x => x.valorInventario },
    ];
    const nombreAlm = almacenId ? (almacenes.find(a => a.id === almacenId)?.nombre || 'Almacen').replace(/\s+/g, '_') : 'General';
    exportToCSV(itemsConId, cols, `Existencias_Inventario_${nombreAlm}_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className={styles.root}>
      <D365CommandBar ariaLabel="Comandos de inventario de productos">
        <div className={styles.toolbarLeft}>
          <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void cargar()}>
            Actualizar
          </D365CommandButton>
          <D365CommandDivider />
          <Menu positioning="below-end">
            <MenuTrigger disableButtonEnhancement>
              {(triggerProps: MenuButtonProps) => (
                <SplitButton
                  menuButton={triggerProps}
                  primaryActionButton={{
                    onClick: handleExportExcel,
                    title: 'Exportar existencias a Excel (*.xlsx)',
                  }}
                  icon={<ArrowDownload16Regular />}
                  appearance="subtle"
                  size="medium"
                  disabled={cargando || itemsConId.length === 0}
                >
                  Exportar a Excel
                </SplitButton>
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<DocumentTable20Regular />} onClick={handleExportExcel}>
                  Libro de Excel estático (*.xlsx)
                </MenuItem>
                <MenuItem icon={<DocumentTable20Regular />} onClick={() => void handleExportSeriesReporte34()}>
                  Reporte 34 (Series y Ubicaciones)
                </MenuItem>
                <MenuItem icon={<DocumentText20Regular />} onClick={handleExportCSV}>
                  Valores separados por comas (*.csv)
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
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
          Cantidad: {formatoCantidad.format(totales.cantidad)} · Valor: {formatoMoneda.format(totales.valor)}
        </div>
      </footer>

      <SeriesAlmacenDrawer item={itemParaVerSeries} alCerrar={() => setItemParaVerSeries(null)} />
    </div>
  );
}
