import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TableCellLayout,
  createTableColumn,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Text,
  Input,
  SplitButton,
  Button,
  Badge,
  tokens,
  type MenuButtonProps,
} from '@fluentui/react-components';
import type { TableColumnDefinition, SelectionItemId } from '@fluentui/react-components';
import {
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  Search16Regular,
  HistoryRegular,
  ChevronDown16Regular,
  Checkmark16Regular,
  DocumentTable20Regular,
  DocumentText20Regular,
  Warning16Filled,
  CheckmarkCircle16Filled,
  DismissCircle16Filled,
  Box16Regular,
} from '@fluentui/react-icons';
import { HistorialSerieDrawer } from './HistorialSerieDrawer';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../components/common/D365EntityTable';
import { D365StatusBadge } from '../../../components/common/D365StatusBadge';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { AlmacenService } from '../almacenes/services/almacen.service';
import type { AlmacenDto } from '../almacenes/types/almacen.types';
import { InventarioProductoService } from '../inventario-productos/services/inventario-producto.service';
import type { ItemSeriadoStockDto } from '../inventario-productos/types/inventario-producto.types';
import { exportToExcel, exportToCSV, type ExportColumn } from '../../../utils/exportUtils';

export interface SlaInfo {
  dias: number | null;
  estadoSla: 'EnSla' | 'EnRiesgo' | 'Vencido' | 'Instalado';
  label: string;
  badgeColor: 'success' | 'warning' | 'danger' | 'informative';
  fechaLlegada: string;
}

export function obtenerSlaInfo(item: ItemSeriadoStockDto): SlaInfo {
  const fechaRefStr = item.fechaLlegadaAlmacen || item.createdAt;
  const fechaRef = new Date(fechaRefStr);
  const ahora = new Date();

  if (item.estado === 'InstaladoEnCliente') {
    return {
      dias: item.diasEnAlmacen ?? null,
      estadoSla: 'Instalado',
      label: 'Instalado',
      badgeColor: 'informative',
      fechaLlegada: fechaRefStr,
    };
  }

  const dias =
    typeof item.diasEnAlmacen === 'number'
      ? item.diasEnAlmacen
      : Math.max(0, Math.floor((ahora.getTime() - fechaRef.getTime()) / (1000 * 60 * 60 * 24)));

  if (dias <= 15) {
    return {
      dias,
      estadoSla: 'EnSla',
      label: 'En SLA (≤ 15d)',
      badgeColor: 'success',
      fechaLlegada: fechaRefStr,
    };
  }

  if (dias <= 30) {
    return {
      dias,
      estadoSla: 'EnRiesgo',
      label: 'En Riesgo (16-30d)',
      badgeColor: 'warning',
      fechaLlegada: fechaRefStr,
    };
  }

  return {
    dias,
    estadoSla: 'Vencido',
    label: `Vencido (${dias}d > 30d)`,
    badgeColor: 'danger',
    fechaLlegada: fechaRefStr,
  };
}

const columnasExportacion: ExportColumn<ItemSeriadoStockDto>[] = [
  { header: 'Número de Serie', accessor: s => s.numeroSerie },
  { header: 'Código de Producto', accessor: s => s.codigoProducto },
  { header: 'Producto', accessor: s => s.nombreProducto },
  { header: 'Estado de Custodia', accessor: s => s.estado },
  { header: 'Almacén / Custodio', accessor: s => (s.nombreAlmacen || '').replace(/^[\p{Emoji}\s]+/u, '').trim() },
  { header: 'Fecha Llegada / Ingreso', accessor: s => new Date(s.fechaLlegadaAlmacen || s.createdAt).toLocaleDateString('es-PE') },
  { header: 'Días en Almacén', accessor: s => {
    const sla = obtenerSlaInfo(s);
    return sla.dias !== null ? String(sla.dias) : '—';
  }},
  { header: 'SLA', accessor: s => obtenerSlaInfo(s).label },
  { header: 'Ubicación', accessor: s => s.nombreUbicacion || '' },
  { header: 'Condición', accessor: s => s.condicion || '' },
  { header: 'SmartCard', accessor: s => s.numeroSmartCard || '' },
  { header: 'MAC Address', accessor: s => s.macAddress || '' },
];

export function TrazabilidadSeriesPage() {
  const listStyles = useD365ListStyles();
  const tableRef = useRef<D365EntityTableRef>(null);
  const [series, setSeries] = useState<ItemSeriadoStockDto[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [almacenId] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [slaFiltro, setSlaFiltro] = useState<'TODOS' | 'EnSla' | 'EnRiesgo' | 'Vencido' | 'Instalado'>('TODOS');
  const [vistaActual, setVistaActual] = useState<string>('todas');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerHistorialAbierto, setDrawerHistorialAbierto] = useState(false);
  const [serieSeleccionadaHistorial, setSerieSeleccionadaHistorial] = useState<string | null>(null);

  const handleAbrirHistorial = (numeroSerie: string) => {
    setSerieSeleccionadaHistorial(numeroSerie);
    setDrawerHistorialAbierto(true);
  };

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
        { value: 'DevueltoAProveedor', label: 'Devuelto a Proveedor' },
      ],
    },
    {
      id: 'estadoSla',
      label: 'SLA',
      type: 'string',
      options: [
        { value: 'EnSla', label: 'En SLA (≤ 15 días)' },
        { value: 'EnRiesgo', label: 'En Riesgo (16 - 30 días)' },
        { value: 'Vencido', label: 'SLA Vencido (> 30 días)' },
        { value: 'Instalado', label: 'Instalado en Cliente' },
      ],
    },
    { id: 'diasEnAlmacen', label: 'Días en Almacén', type: 'number' },
    {
      id: 'nombreAlmacen',
      label: 'Almacén / Custodio',
      type: 'string',
      options: almacenes.map(a => ({ value: a.nombre, label: a.nombre })),
    },
    { id: 'nombreUbicacion', label: 'Ubicación', type: 'string' },
    { id: 'numeroSmartCard', label: 'SmartCard', type: 'string' },
    { id: 'macAddress', label: 'MAC', type: 'string' },
  ], [almacenes]);

  const vistas = useMemo(() => [
    { id: 'todas', nombre: 'Todas las Series', estado: 'TODOS', sla: 'TODOS' as const },
    { id: 'almacen', nombre: 'Series en Almacén', estado: 'EnAlmacen', sla: 'TODOS' as const },
    { id: 'sla-vencido', nombre: '🚨 SLA Vencido (> 30 días)', estado: 'TODOS', sla: 'Vencido' as const },
    { id: 'sla-riesgo', nombre: '⚠️ SLA en Riesgo (16 - 30 días)', estado: 'TODOS', sla: 'EnRiesgo' as const },
    { id: 'sla-ok', nombre: '✅ Dentro de SLA (≤ 15 días)', estado: 'TODOS', sla: 'EnSla' as const },
    { id: 'tecnico', nombre: 'Series en Custodia Técnico', estado: 'EnCustodiaTecnico', sla: 'TODOS' as const },
    { id: 'transito', nombre: 'Series en Tránsito', estado: 'EnTransito', sla: 'TODOS' as const },
    { id: 'cliente', nombre: 'Series en Cliente Abonado', estado: 'InstaladoEnCliente', sla: 'TODOS' as const },
    { id: 'averiado', nombre: 'Series Averiadas / Retiradas', estado: 'AveriadoEnAlmacen', sla: 'TODOS' as const },
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
      const slaInfo = obtenerSlaInfo(item);
      // Filtro de SLA
      if (slaFiltro !== 'TODOS' && slaInfo.estadoSla !== slaFiltro) {
        return false;
      }
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
        (item.macAddress && item.macAddress.includes(termino)) ||
        slaInfo.label.toUpperCase().includes(termino)
      );
    });
  }, [series, estadoFiltro, slaFiltro, buscar]);

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
        <TableCellLayout truncate>
          <Button
            appearance="subtle"
            size="small"
            icon={<HistoryRegular style={{ color: tokens.colorBrandForeground1 }} />}
            onClick={() => handleAbrirHistorial(item.numeroSerie)}
            style={{
              padding: '0 6px',
              height: '24px',
              fontWeight: tokens.fontWeightSemibold,
              fontFamily: 'monospace',
              color: tokens.colorBrandForeground1,
            }}
            title="Ver trazabilidad completa e historial de esta serie"
          >
            {item.numeroSerie}
          </Button>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'codigo',
      compare: (a, b) => a.codigoProducto.localeCompare(b.codigoProducto),
      renderHeaderCell: () => 'Código',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout truncate>
          <Text>{item.codigoProducto}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'producto',
      compare: (a, b) => a.nombreProducto.localeCompare(b.nombreProducto),
      renderHeaderCell: () => 'Producto',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout truncate>
          <Text>{item.nombreProducto}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'estado',
      compare: (a, b) => a.estado.localeCompare(b.estado),
      renderHeaderCell: () => 'Estado Custodia',
      renderCell: (item: ItemSeriadoStockDto) => {
        const estadoTexto =
          item.estado === 'EnAlmacen'
            ? 'En Almacén'
            : item.estado === 'EnTransito'
            ? 'En Tránsito'
            : item.estado === 'EnCustodiaTecnico'
            ? 'Custodia Técnico'
            : item.estado === 'InstaladoEnCliente'
            ? 'Instalado en Cliente'
            : item.estado === 'AveriadoEnAlmacen' || item.estado === 'RetiradoPorAveria'
            ? 'Averiado'
            : item.estado;
        return (
          <TableCellLayout truncate>
            <D365StatusBadge status={estadoTexto} />
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
            <Text>{item.estado === 'EnTransito' ? `En tránsito · ${item.transferenciaNumero ?? ''}` : nombreLimpio}</Text>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({
      columnId: 'fecha',
      compare: (a, b) => new Date(a.fechaLlegadaAlmacen || a.createdAt).getTime() - new Date(b.fechaLlegadaAlmacen || b.createdAt).getTime(),
      renderHeaderCell: () => 'Fecha Llegada',
      renderCell: (item: ItemSeriadoStockDto) => {
        const fecha = new Date(item.fechaLlegadaAlmacen || item.createdAt);
        return (
          <TableCellLayout truncate title={`Fecha llegada: ${fecha.toLocaleDateString('es-PE')} ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`}>
            <Text>{fecha.toLocaleDateString('es-PE')}</Text>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({
      columnId: 'diasEnAlmacen',
      compare: (a, b) => (obtenerSlaInfo(a).dias ?? -1) - (obtenerSlaInfo(b).dias ?? -1),
      renderHeaderCell: () => 'Días Almacén',
      renderCell: (item: ItemSeriadoStockDto) => {
        const sla = obtenerSlaInfo(item);
        if (sla.dias === null) {
          return (
            <TableCellLayout truncate>
              <Text style={{ color: tokens.colorNeutralForeground4 }}>—</Text>
            </TableCellLayout>
          );
        }
        return (
          <TableCellLayout truncate title={`${sla.dias} días transcurridos desde su llegada al almacén`}>
            <Text
              weight="semibold"
              style={{
                color:
                  sla.estadoSla === 'Vencido'
                    ? tokens.colorStatusDangerForeground1
                    : sla.estadoSla === 'EnRiesgo'
                    ? tokens.colorPaletteDarkOrangeForeground1
                    : tokens.colorNeutralForeground1,
              }}
            >
              {sla.dias}
            </Text>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({
      columnId: 'estadoSla',
      compare: (a, b) => obtenerSlaInfo(a).label.localeCompare(obtenerSlaInfo(b).label),
      renderHeaderCell: () => 'SLA',
      renderCell: (item: ItemSeriadoStockDto) => {
        const sla = obtenerSlaInfo(item);
        return (
          <TableCellLayout truncate title={`SLA: ${sla.label} (${sla.dias ?? 0} días en almacén)`}>
            <Badge
              appearance="tint"
              shape="rounded"
              color={sla.badgeColor}
              icon={
                sla.estadoSla === 'EnSla' ? (
                  <CheckmarkCircle16Filled />
                ) : sla.estadoSla === 'EnRiesgo' ? (
                  <Warning16Filled />
                ) : sla.estadoSla === 'Vencido' ? (
                  <DismissCircle16Filled />
                ) : (
                  <Box16Regular />
                )
              }
            >
              {sla.estadoSla === 'EnSla'
                ? 'En SLA'
                : sla.estadoSla === 'EnRiesgo'
                ? 'En Riesgo'
                : sla.estadoSla === 'Vencido'
                ? 'Vencido'
                : 'Instalado'}
            </Badge>
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
          <Text>{item.nombreUbicacion || '—'}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'smartcard',
      renderHeaderCell: () => 'SmartCard / MAC',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout truncate>
          <Text>{item.numeroSmartCard || item.macAddress || '—'}</Text>
        </TableCellLayout>
      ),
    }),
  ], []);

  return (
    <div className={listStyles.root}>
      {/* 1. Barra de comandos */}
      <D365CommandBar ariaLabel="Comandos de trazabilidad de series">
        <div className={listStyles.toolbarLeft}>
          <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void cargar()}>
            Actualizar
          </D365CommandButton>
          <D365CommandButton
            icon={<HistoryRegular />}
            onClick={() => {
              setSerieSeleccionadaHistorial(null);
              setDrawerHistorialAbierto(true);
            }}
          >
            Consultar Historial
          </D365CommandButton>
          <Menu positioning="below-end">
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
                    setVistaActual(v.id);
                    setEstadoFiltro(v.estado);
                    setSlaFiltro(v.sla);
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
            placeholder="Buscar por serie, producto, smartcard o SLA..."
            aria-label="Buscar en esta vista"
            value={buscar}
            onChange={(_, d) => setBuscar(d.value)}
          />
        </div>
      </div>

      {/* 4. Grid de Series con Redimensionamiento, Ordenamiento y Filtros Dynamics 365 */}
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

      {/* 5. Footer Estándar D365 */}
      <footer className={listStyles.footer}>
        <div>
          1-{seriesFiltradas.length} de {seriesFiltradas.length}
          {selectedIds.size > 0 && ` (${selectedIds.size} seleccionados)`}
        </div>
        <div>Página 1</div>
      </footer>

      {/* Drawer de Trazabilidad e Historial 360° */}
      <HistorialSerieDrawer
        open={drawerHistorialAbierto}
        onOpenChange={setDrawerHistorialAbierto}
        serieInicial={serieSeleccionadaHistorial}
      />
    </div>
  );
}
