import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TableCellLayout,
  Badge,
  createTableColumn,
  makeStyles,
  tokens,
  typographyStyles,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Text,
  Input,
  SplitButton,
  type MenuButtonProps,
} from '@fluentui/react-components';
import type { TableColumnDefinition, SelectionItemId } from '@fluentui/react-components';
import {
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  Search16Regular,
  CheckmarkCircle16Filled,
  VehicleCarProfile16Regular,
  Person16Regular,
  Warning16Filled,
  Box16Regular,
  ChevronDown16Regular,
  Checkmark16Regular,
  DocumentTable20Regular,
  DocumentText20Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../components/common/D365EntityTable';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { AlmacenService } from '../almacenes/services/almacen.service';
import type { AlmacenDto } from '../almacenes/types/almacen.types';
import { InventarioProductoService } from '../inventario-productos/services/inventario-producto.service';
import type { ItemSeriadoStockDto } from '../inventario-productos/types/inventario-producto.types';
import { exportToExcel, exportToCSV, type ExportColumn } from '../../../utils/exportUtils';



const columnasExportacion: ExportColumn<ItemSeriadoStockDto>[] = [
  { header: 'Número de Serie', accessor: s => s.numeroSerie },
  { header: 'Código de Producto', accessor: s => s.codigoProducto },
  { header: 'Producto', accessor: s => s.nombreProducto },
  { header: 'Estado de Custodia', accessor: s => s.estado },
  { header: 'Almacén / Custodio', accessor: s => (s.nombreAlmacen || '').replace(/^[\p{Emoji}\s]+/u, '').trim() },
  { header: 'Ubicación', accessor: s => s.nombreUbicacion || '' },
  { header: 'Condición', accessor: s => s.condicion || '' },
  { header: 'SmartCard', accessor: s => s.numeroSmartCard || '' },
  { header: 'MAC Address', accessor: s => s.macAddress || '' },
  { header: 'Fecha de Ingreso', accessor: s => new Date(s.createdAt).toLocaleDateString('es-PE') },
];

const useStyles = makeStyles({
  serieText: {
    fontFamily: 'monospace',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
  },
});

export function TrazabilidadSeriesPage() {
  const styles = useStyles();
  const listStyles = useD365ListStyles();
  const tableRef = useRef<D365EntityTableRef>(null);
  const [series, setSeries] = useState<ItemSeriadoStockDto[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [almacenId] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [vistaActual, setVistaActual] = useState<'todas' | 'almacen' | 'transito' | 'tecnico' | 'cliente' | 'averiado'>('todas');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterFields = useMemo<D365FilterField[]>(() => [
    { id: 'numeroSerie', label: 'Número de Serie', type: 'string' },
    { id: 'codigoProducto', label: 'Código', type: 'string' },
    { id: 'nombreProducto', label: 'Producto', type: 'string' },
    {
      id: 'estado',
      label: 'Estado de Custodia',
      type: 'string',
      options: [
        { value: 'EnAlmacen', label: 'En Almacén' },
        { value: 'EnTransito', label: 'En Tránsito' },
        { value: 'EnCustodiaTecnico', label: 'Custodia Técnico' },
        { value: 'InstaladoEnCliente', label: 'Instalado en Cliente' },
        { value: 'AveriadoEnAlmacen', label: 'Averiado' },
        { value: 'DevueltoAProveedor', label: 'Devuelto a DIRECTV' },
      ],
    },
    {
      id: 'nombreAlmacen',
      label: 'Almacén / Custodio',
      type: 'string',
      options: almacenes.map(a => ({ value: a.nombre, label: a.nombre })),
    },
    { id: 'nombreUbicacion', label: 'Ubicación', type: 'string' },
    { id: 'condicion', label: 'Condición', type: 'string' },
    { id: 'numeroSmartCard', label: 'SmartCard', type: 'string' },
    { id: 'macAddress', label: 'MAC', type: 'string' },
  ], [almacenes]);

  const vistas = useMemo(() => [
    { id: 'todas', nombre: 'Todas las Series', estado: 'TODOS' },
    { id: 'almacen', nombre: 'Series en Almacén', estado: 'EnAlmacen' },
    { id: 'transito', nombre: 'Series en Tránsito', estado: 'EnTransito' },
    { id: 'tecnico', nombre: 'Series en Custodia Técnico', estado: 'EnCustodiaTecnico' },
    { id: 'cliente', nombre: 'Series en Cliente Abonado', estado: 'InstaladoEnCliente' },
    { id: 'averiado', nombre: 'Series Averiadas / Retiradas', estado: 'AveriadoEnAlmacen' },
  ], []);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const [dataSeries, dataAlmacenes] = await Promise.all([
        InventarioProductoService.obtenerSeries(almacenId || undefined, undefined, undefined, undefined, true),
        AlmacenService.getAlmacenes(true),
      ]);
      setSeries(dataSeries);
      setAlmacenes(dataAlmacenes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las series.');
    } finally {
      setCargando(false);
    }
  }, [almacenId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Filtrado en memoria
  const seriesFiltradas = useMemo(() => {
    const termino = buscar.trim().toUpperCase();
    return series.filter(item => {
      // Filtro de estado
      if (estadoFiltro !== 'TODOS' && item.estado !== estadoFiltro) {
        return false;
      }
      // Filtro de búsqueda
      if (!termino) return true;
      return (
        item.numeroSerie.includes(termino) ||
        item.nombreProducto.toUpperCase().includes(termino) ||
        item.codigoProducto.toUpperCase().includes(termino) ||
        (item.nombreAlmacen && item.nombreAlmacen.toUpperCase().includes(termino)) ||
        (item.numeroSmartCard && item.numeroSmartCard.includes(termino)) ||
        (item.macAddress && item.macAddress.includes(termino))
      );
    });
  }, [series, estadoFiltro, buscar]);

  // Exportar a Excel (.xlsx) y CSV (.csv)
  const exportarExcel = () => {
    if (seriesFiltradas.length === 0) return;
    const fecha = new Date().toISOString().slice(0, 10);
    exportToExcel(seriesFiltradas, columnasExportacion, `Trazabilidad_Series_${fecha}`);
  };

  const exportarCSV = () => {
    if (seriesFiltradas.length === 0) return;
    const fecha = new Date().toISOString().slice(0, 10);
    exportToCSV(seriesFiltradas, columnasExportacion, `Trazabilidad_Series_${fecha}`);
  };

  const columns: TableColumnDefinition<ItemSeriadoStockDto>[] = useMemo(() => [
    createTableColumn({
      columnId: 'serie',
      compare: (a, b) => a.numeroSerie.localeCompare(b.numeroSerie),
      renderHeaderCell: () => 'Número de Serie',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout>
          <span className={styles.serieText}>{item.numeroSerie}</span>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'codigo',
      compare: (a, b) => a.codigoProducto.localeCompare(b.codigoProducto),
      renderHeaderCell: () => 'Código',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout>
          <span style={{ fontFamily: 'Consolas, Monaco, monospace', fontWeight: 600, fontSize: '13px' }}>
            {item.codigoProducto}
          </span>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'producto',
      compare: (a, b) => a.nombreProducto.localeCompare(b.nombreProducto),
      renderHeaderCell: () => 'Producto',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout truncate>
          <span style={{ fontWeight: 600 }}>{item.nombreProducto}</span>
        </TableCellLayout>
      ),
    }),
      createTableColumn({
        columnId: 'estado',
        compare: (a, b) => a.estado.localeCompare(b.estado),
        renderHeaderCell: () => 'Estado de Custodia',
        renderCell: (item: ItemSeriadoStockDto) => {
          if (item.estado === 'EnAlmacen') {
            return (
              <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
                <Badge appearance="tint" shape="rounded" color="success" icon={<CheckmarkCircle16Filled />} style={{ whiteSpace: 'nowrap' }}>
                  En Almacén
                </Badge>
              </TableCellLayout>
            );
          }
          if (item.estado === 'EnTransito') {
            return (
              <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
                <Badge appearance="tint" shape="rounded" color="warning" icon={<ArrowClockwise16Regular />} style={{ whiteSpace: 'nowrap' }}>
                  En Tránsito
                </Badge>
              </TableCellLayout>
            );
          }
          if (item.estado === 'EnCustodiaTecnico') {
            return (
              <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
                <Badge appearance="tint" shape="rounded" color="informative" icon={<VehicleCarProfile16Regular />} style={{ whiteSpace: 'nowrap' }}>
                  Custodia Técnico
                </Badge>
              </TableCellLayout>
            );
          }
          if (item.estado === 'InstaladoEnCliente') {
            return (
              <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
                <Badge appearance="tint" shape="rounded" color="brand" icon={<Person16Regular />} style={{ whiteSpace: 'nowrap' }}>
                  Instalado en Cliente
                </Badge>
              </TableCellLayout>
            );
          }
          if (item.estado === 'AveriadoEnAlmacen' || item.estado === 'RetiradoPorAveria') {
            return (
              <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
                <Badge appearance="tint" shape="rounded" color="danger" icon={<Warning16Filled />} style={{ whiteSpace: 'nowrap' }}>
                  Averiado
                </Badge>
              </TableCellLayout>
            );
          }
          return (
            <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
              <Badge appearance="outline" shape="rounded" color="subtle" style={{ whiteSpace: 'nowrap' }}>
                {item.estado}
              </Badge>
            </TableCellLayout>
          );
        },
      }),
    createTableColumn({
      columnId: 'almacen',
      compare: (a, b) => (a.nombreAlmacen ?? '').localeCompare(b.nombreAlmacen ?? ''),
      renderHeaderCell: () => 'Almacén / Custodio',
      renderCell: (item: ItemSeriadoStockDto) => {
        const nombreLimpio = item.nombreAlmacen
          ? item.nombreAlmacen.replace(/^[\p{Emoji}\s]+/u, '').trim()
          : '—';
        return (
          <TableCellLayout truncate>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Box16Regular style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }} />
              <span>{item.estado === 'EnTransito' ? `En tránsito · ${item.transferenciaNumero ?? ''}` : nombreLimpio}</span>
            </div>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({
      columnId: 'ubicacion',
      compare: (a, b) => (a.nombreUbicacion ?? '').localeCompare(b.nombreUbicacion ?? ''),
      renderHeaderCell: () => 'Ubicación',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout truncate>
          <span>{item.nombreUbicacion || '—'}</span>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'condicion',
      compare: (a, b) => (a.condicion ?? '').localeCompare(b.condicion ?? ''),
      renderHeaderCell: () => 'Condición',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout>
          {item.condicion === 'Utilizable' ? (
            <Badge appearance="tint" shape="rounded" color="success">
              Utilizable
            </Badge>
          ) : item.condicion === 'Defectuoso' ? (
            <Badge appearance="tint" shape="rounded" color="danger">
              Defectuoso
            </Badge>
          ) : (
            <Badge appearance="outline" shape="rounded" color="subtle">
              {item.condicion || '—'}
            </Badge>
          )}
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'smartcard',
      renderHeaderCell: () => 'SmartCard / MAC',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout>
          <div style={typographyStyles.caption1}>
            {item.numeroSmartCard && <div>SC: {item.numeroSmartCard}</div>}
            {item.macAddress && <div>MAC: {item.macAddress}</div>}
            {!item.numeroSmartCard && !item.macAddress && <span style={{ color: tokens.colorNeutralForeground4 }}>—</span>}
          </div>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'fecha',
      compare: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      renderHeaderCell: () => 'Fecha Ingreso',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout>
          {new Date(item.createdAt).toLocaleDateString('es-PE')}
        </TableCellLayout>
      ),
    }),
  ], [styles.serieText]);

  return (
    <div className={listStyles.root}>
      {/* Barra de comandos */}
      <D365CommandBar ariaLabel="Comandos de trazabilidad de series">
        <div className={listStyles.toolbarLeft}>
          <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void cargar()}>
            Actualizar
          </D365CommandButton>
          <Menu positioning="below-start">
            <MenuTrigger disableButtonEnhancement>
              {(triggerProps: MenuButtonProps) => (
                <SplitButton
                  menuButton={triggerProps}
                  primaryActionButton={{
                    onClick: exportarExcel,
                    title: 'Exportar a Excel (*.xlsx)',
                  }}
                  icon={<ArrowDownload16Regular />}
                  appearance="subtle"
                  size="medium"
                  disabled={seriesFiltradas.length === 0}
                >
                  Exportar a Excel
                </SplitButton>
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<DocumentTable20Regular />} onClick={exportarExcel}>
                  Libro de Excel estático (*.xlsx)
                </MenuItem>
                <MenuItem icon={<DocumentText20Regular />} onClick={exportarCSV}>
                  Valores separados por comas (*.csv)
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </D365CommandBar>

      {/* 2. VIEW HEADER ROW (Selector de Vista + Filtros + Búsqueda) */}
      <div className={listStyles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={listStyles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {vistas.find(v => v.id === vistaActual)?.nombre || 'Todas las Series'}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={listStyles.viewMenuPopover}>
              {vistas.map(v => (
                <MenuItem
                  key={v.id}
                  icon={vistaActual === v.id ? <Checkmark16Regular /> : undefined}
                  onClick={() => {
                    setVistaActual(v.id as any);
                    setEstadoFiltro(v.estado);
                  }}
                >
                  {v.nombre}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        <div className={listStyles.viewToolsRight}>
          <D365TableToolbarTools tableRef={tableRef} />
          <Input
            className={listStyles.searchBox}
            size="medium"
            contentBefore={<Search16Regular />}
            placeholder="Buscar serie, producto, MAC..."
            aria-label="Buscar en esta vista"
            value={buscar}
            onChange={(_, d) => setBuscar(d.value)}
          />
        </div>
      </div>

      {/* Grid de Series con Redimensionamiento, Ordenamiento y Filtros Dynamics 365 */}
      <D365EntityTable
        ref={tableRef}
        entityName="Series de Inventario"
        tableId="series-inventario"
        items={seriesFiltradas}
        columns={columns}
        filterFields={filterFields}
        loading={cargando}
        error={error}
        onRetry={() => void cargar()}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
      />

      {/* Footer Estándar D365 */}
      <footer className={listStyles.footer}>
        <div>
          1-{seriesFiltradas.length} de {seriesFiltradas.length}
          {selectedIds.size > 0 && ` (${selectedIds.size} seleccionados)`}
        </div>
        <div>Página 1</div>
      </footer>
    </div>
  );
}
