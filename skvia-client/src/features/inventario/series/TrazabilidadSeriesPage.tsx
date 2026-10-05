import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Input,
  Select,
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
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Tooltip,
  Text,
} from '@fluentui/react-components';
import type { TableColumnDefinition } from '@fluentui/react-components';
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
  DataFunnel20Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import { D365ListState } from '../../../components/common/D365ListState';
import { TableEmptyState } from '../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { AlmacenService } from '../almacenes/services/almacen.service';
import type { AlmacenDto } from '../almacenes/types/almacen.types';
import { InventarioProductoService } from '../inventario-productos/services/inventario-producto.service';
import type { ItemSeriadoStockDto } from '../inventario-productos/types/inventario-producto.types';

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
  const [series, setSeries] = useState<ItemSeriadoStockDto[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [almacenId, setAlmacenId] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [vistaActual, setVistaActual] = useState<'todas' | 'almacen' | 'transito' | 'tecnico' | 'cliente' | 'averiado'>('todas');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [filtroPopoverOpen, setFiltroPopoverOpen] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Exportar a CSV (Auditorías DIRECTV)
  const exportarCSV = () => {
    if (seriesFiltradas.length === 0) return;
    const encabezados = ['Serie', 'CodigoProducto', 'Producto', 'Estado', 'Almacen', 'Ubicacion', 'Condicion', 'SmartCard', 'MAC', 'FechaIngreso'];
    const filas = seriesFiltradas.map(s => [
      `"${s.numeroSerie}"`,
      `"${s.codigoProducto}"`,
      `"${s.nombreProducto}"`,
      `"${s.estado}"`,
      `"${(s.nombreAlmacen || '').replace(/^[\p{Emoji}\s]+/u, '').trim()}"`,
      `"${s.nombreUbicacion || ''}"`,
      `"${s.condicion || ''}"`,
      `"${s.numeroSmartCard || ''}"`,
      `"${s.macAddress || ''}"`,
      `"${new Date(s.createdAt).toISOString()}"`,
    ]);
    const contenido = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\r\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Trazabilidad_Series_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            <TableCellLayout>
              <Badge appearance="tint" shape="rounded" color="success" icon={<CheckmarkCircle16Filled />}>
                En Almacén
              </Badge>
            </TableCellLayout>
          );
        }
        if (item.estado === 'EnTransito') {
          return (
            <TableCellLayout>
              <Badge appearance="tint" shape="rounded" color="warning" icon={<ArrowClockwise16Regular />}>
                En Tránsito
              </Badge>
            </TableCellLayout>
          );
        }
        if (item.estado === 'EnCustodiaTecnico') {
          return (
            <TableCellLayout>
              <Badge appearance="tint" shape="rounded" color="informative" icon={<VehicleCarProfile16Regular />}>
                En Camioneta / Técnico
              </Badge>
            </TableCellLayout>
          );
        }
        if (item.estado === 'InstaladoEnCliente') {
          return (
            <TableCellLayout>
              <Badge appearance="tint" shape="rounded" color="brand" icon={<Person16Regular />}>
                Instalado en Cliente
              </Badge>
            </TableCellLayout>
          );
        }
        if (item.estado === 'AveriadoEnAlmacen' || item.estado === 'RetiradoPorAveria') {
          return (
            <TableCellLayout>
              <Badge appearance="tint" shape="rounded" color="danger" icon={<Warning16Filled />}>
                Averiado
              </Badge>
            </TableCellLayout>
          );
        }
        return (
          <TableCellLayout>
            <Badge appearance="outline" shape="rounded" color="subtle">
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
          <D365CommandButton
            icon={<ArrowDownload16Regular />}
            disabled={seriesFiltradas.length === 0}
            onClick={exportarCSV}
          >
            Exportar a Excel / CSV
          </D365CommandButton>
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
          <Popover
            open={filtroPopoverOpen}
            onOpenChange={(_, data) => setFiltroPopoverOpen(data.open)}
            positioning="below-end"
          >
            <PopoverTrigger disableButtonEnhancement>
              <Tooltip content="Filtrar por almacén y estado" relationship="label">
                <Button
                  appearance={almacenId || (estadoFiltro !== 'TODOS' && vistaActual === 'todas') ? 'primary' : 'subtle'}
                  size="medium"
                  icon={<DataFunnel20Regular className={almacenId ? undefined : listStyles.iconBrand} />}
                >
                  {almacenId ? 'Filtros (1)' : 'Editar filtros'}
                </Button>
              </Tooltip>
            </PopoverTrigger>
            <PopoverSurface style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text weight="semibold">Filtros de consulta</Text>
                {(almacenId || estadoFiltro !== 'TODOS') && (
                  <Button
                    size="small"
                    appearance="subtle"
                    onClick={() => {
                      setAlmacenId('');
                      setEstadoFiltro('TODOS');
                      setVistaActual('todas');
                    }}
                  >
                    Restablecer
                  </Button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>ALMACÉN</Text>
                <Select
                  size="small"
                  value={almacenId}
                  onChange={(_, d) => setAlmacenId(d.value)}
                >
                  <option value="">Todos los almacenes</option>
                  {almacenes.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>ESTADO DE CUSTODIA</Text>
                <Select
                  size="small"
                  value={estadoFiltro}
                  onChange={(_, d) => {
                    setEstadoFiltro(d.value);
                    const match = vistas.find(v => v.estado === d.value);
                    if (match) setVistaActual(match.id as any);
                    else setVistaActual('todas');
                  }}
                >
                  <option value="TODOS">Todos los estados</option>
                  <option value="EnAlmacen">En Almacén</option>
                  <option value="EnTransito">En Tránsito</option>
                  <option value="EnCustodiaTecnico">En Camioneta / Técnico</option>
                  <option value="InstaladoEnCliente">Instalado en Cliente</option>
                  <option value="AveriadoEnAlmacen">Averiado</option>
                  <option value="DevueltoAProveedor">Devuelto a DIRECTV</option>
                </Select>
              </div>
            </PopoverSurface>
          </Popover>

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

      {/* Grid de Series */}
      <div className={listStyles.gridContainer}>
        <D365ListState
          loading={cargando}
          error={error}
          onRetry={() => void cargar()}
          loadingLabel="Cargando trazabilidad de series..."
        >
          <DataGrid
            items={seriesFiltradas}
            columns={columns}
            sortable
            selectionMode="multiselect"
            selectedItems={selectedIds}
            onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
            getRowId={item => item.id}
            focusMode="composite"
            size="medium"
            className={listStyles.table}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            {seriesFiltradas.length === 0 ? (
              <TableEmptyState />
            ) : (
              <DataGridBody<ItemSeriadoStockDto>>
                {({ item, rowId }) => (
                  <DataGridRow<ItemSeriadoStockDto> key={rowId} className={listStyles.dataRow}>
                    {({ renderCell }) => (
                      <DataGridCell className={listStyles.dataCell}>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            )}
          </DataGrid>
        </D365ListState>
      </div>

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
