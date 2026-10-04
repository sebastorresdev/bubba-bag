import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '12px 24px',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  filterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    ...typographyStyles.caption1Strong,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
  },
  metricsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
    padding: '12px 24px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  metricCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '8px 12px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  metricValue: {
    ...typographyStyles.subtitle2,
    fontWeight: tokens.fontWeightBold,
  },
  metricLabel: {
    ...typographyStyles.caption2,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
  },
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
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Métricas de estado
  const metricas = useMemo(() => {
    let enAlmacen = 0;
    let enTransito = 0;
    let enTecnico = 0;
    let enCliente = 0;
    let averiado = 0;

    series.forEach(s => {
      if (s.estado === 'EnAlmacen') enAlmacen++;
      else if (s.estado === 'EnTransito') enTransito++;
      else if (s.estado === 'EnCustodiaTecnico') enTecnico++;
      else if (s.estado === 'InstaladoEnCliente') enCliente++;
      else if (s.estado === 'AveriadoEnAlmacen' || s.estado === 'RetiradoPorAveria') averiado++;
    });

    return {
      total: series.length,
      enAlmacen,
      enTransito,
      enTecnico,
      enCliente,
      averiado,
    };
  }, [series]);

  // Exportar a CSV (Auditorías DIRECTV)
  const exportarCSV = () => {
    if (seriesFiltradas.length === 0) return;
    const encabezados = ['Serie', 'CodigoProducto', 'Producto', 'Estado', 'Almacen', 'SmartCard', 'MAC', 'FechaIngreso'];
    const filas = seriesFiltradas.map(s => [
      `"${s.numeroSerie}"`,
      `"${s.codigoProducto}"`,
      `"${s.nombreProducto}"`,
      `"${s.estado}"`,
      `"${s.nombreAlmacen || ''}"`,
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
      columnId: 'producto',
      compare: (a, b) => a.nombreProducto.localeCompare(b.nombreProducto),
      renderHeaderCell: () => 'Producto',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout truncate>
          <div>
            <div style={{ fontWeight: 600 }}>{item.nombreProducto}</div>
            <div style={{ ...typographyStyles.caption2, color: tokens.colorNeutralForeground3 }}>
              Cód: {item.codigoProducto}
            </div>
          </div>
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
              <Badge appearance="tint" color="success" icon={<CheckmarkCircle16Filled />}>
                En Almacén
              </Badge>
            </TableCellLayout>
          );
        }
        if (item.estado === 'EnTransito') {
          return (
            <TableCellLayout>
              <Badge appearance="tint" color="warning" icon={<ArrowClockwise16Regular />}>
                En Tránsito
              </Badge>
            </TableCellLayout>
          );
        }
        if (item.estado === 'EnCustodiaTecnico') {
          return (
            <TableCellLayout>
              <Badge appearance="tint" color="informative" icon={<VehicleCarProfile16Regular />}>
                En Camioneta / Técnico
              </Badge>
            </TableCellLayout>
          );
        }
        if (item.estado === 'InstaladoEnCliente') {
          return (
            <TableCellLayout>
              <Badge appearance="tint" color="brand" icon={<Person16Regular />}>
                Instalado en Cliente
              </Badge>
            </TableCellLayout>
          );
        }
        if (item.estado === 'AveriadoEnAlmacen' || item.estado === 'RetiradoPorAveria') {
          return (
            <TableCellLayout>
              <Badge appearance="tint" color="danger" icon={<Warning16Filled />}>
                Averiado
              </Badge>
            </TableCellLayout>
          );
        }
        return (
          <TableCellLayout>
            <Badge appearance="outline" color="subtle">
              {item.estado}
            </Badge>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({
      columnId: 'ubicacion',
      compare: (a, b) => (a.nombreAlmacen ?? '').localeCompare(b.nombreAlmacen ?? ''),
      renderHeaderCell: () => 'Almacén / Custodio',
      renderCell: (item: ItemSeriadoStockDto) => (
        <TableCellLayout truncate>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Box16Regular style={{ color: tokens.colorNeutralForeground3 }} />
            <span>
              {item.estado === 'EnTransito' ? `En tránsito · ${item.transferenciaNumero ?? ''}` : `${item.nombreAlmacen ?? ''} · ${item.nombreUbicacion ?? ''} · ${item.condicion}`}
            </span>
          </div>
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

      {/* Tarjetas de Métricas de Custodia */}
      <div className={styles.metricsBar}>
        <div className={styles.metricCard}>
          <span className={styles.metricValue}>{metricas.total}</span>
          <span className={styles.metricLabel}>Total Registradas</span>
        </div>
        <div className={styles.metricCard}>
          <span className={`${styles.metricValue}`} style={{ color: tokens.colorPaletteGreenForeground1 }}>
            {metricas.enAlmacen}
          </span>
          <span className={styles.metricLabel}>En Almacén Base</span>
        </div>
        <div className={styles.metricCard}>
          <span className={`${styles.metricValue}`} style={{ color: tokens.colorPaletteYellowForeground1 }}>
            {metricas.enTransito}
          </span>
          <span className={styles.metricLabel}>En Tránsito</span>
        </div>
        <div className={styles.metricCard}>
          <span className={`${styles.metricValue}`} style={{ color: tokens.colorPaletteBlueForeground2 }}>
            {metricas.enTecnico}
          </span>
          <span className={styles.metricLabel}>En Custodia Técnico</span>
        </div>
        <div className={styles.metricCard}>
          <span className={`${styles.metricValue}`} style={{ color: tokens.colorPaletteBerryForeground1 }}>
            {metricas.enCliente}
          </span>
          <span className={styles.metricLabel}>En Cliente Abonado</span>
        </div>
        <div className={styles.metricCard}>
          <span className={`${styles.metricValue}`} style={{ color: tokens.colorPaletteRedForeground1 }}>
            {metricas.averiado}
          </span>
          <span className={styles.metricLabel}>Averiadas / Retiradas</span>
        </div>
      </div>

      {/* Filtros Operativos */}
      <div className={styles.filterBar}>
        <div className={styles.filterItem}>
          <span className={styles.filterLabel}>Almacén:</span>
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

        <div className={styles.filterItem}>
          <span className={styles.filterLabel}>Estado:</span>
          <Select
            size="small"
            value={estadoFiltro}
            onChange={(_, d) => setEstadoFiltro(d.value)}
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

        <div style={{ flexGrow: 1, maxWidth: '400px', marginLeft: 'auto' }}>
          <Input
            size="small"
            style={{ width: '100%' }}
            placeholder="Buscar" aria-label="Buscar por serie, smartcard, MAC o producto"
            contentBefore={<Search16Regular />}
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

      {/* Footer */}
      <footer className={listStyles.footer}>
        <div>
          Mostrando {seriesFiltradas.length} de {series.length} series registradas
        </div>
        <div>
          SKVIA Field Service • Control de Series 360°
        </div>
      </footer>
    </div>
  );
}
