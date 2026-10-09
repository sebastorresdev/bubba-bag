import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TableCellLayout,
  Badge,
  createTableColumn,
  tokens,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Text,
  Input,
  Link,
} from '@fluentui/react-components';
import type { TableColumnDefinition, SelectionItemId } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  Search16Regular,
  Box16Regular,
  ChevronDown16Regular,
  Checkmark16Regular,
  DocumentTable20Regular,
  DocumentText20Regular,
  ArrowTrendingLines20Regular,
  ArrowDownLeft16Regular,
  ArrowUpRight16Regular,
  CheckmarkCircle16Filled,
  Clock16Regular,
  DismissCircle16Filled,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { AjusteService } from '../services/ajuste.service';
import type { AjusteInventarioDto } from '../types/ajuste.types';
import { exportToExcel, exportToCSV, type ExportColumn } from '../../../../utils/exportUtils';

const formatoMoneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

type VistaId = 'todos' | 'borradores' | 'aplicados' | 'entradas' | 'salidas';

const filterFields: D365FilterField[] = [
  { id: 'numero', label: 'Código de Ajuste', type: 'string' },
  {
    id: 'tipo',
    label: 'Tipo de Ajuste',
    type: 'string',
    options: [
      { value: 'Entrada', label: 'Ingreso por ajuste (+)' },
      { value: 'Salida', label: 'Salida por ajuste (-)' },
      { value: 'ConteoFisico', label: 'Ajuste por conteo físico' },
    ],
  },
  { id: 'nombreAlmacen', label: 'Almacén', type: 'string' },
  { id: 'motivo', label: 'Motivo', type: 'string' },
  { id: 'documentoReferencia', label: 'Doc. Referencia', type: 'string' },
  {
    id: 'estado',
    label: 'Estado',
    type: 'string',
    options: [
      { value: 'Borrador', label: 'Borrador' },
      { value: 'Aplicado', label: 'Aplicado' },
      { value: 'Anulado', label: 'Anulado' },
    ],
  },
  { id: 'totalCantidad', label: 'Cantidad Total', type: 'number' },
  { id: 'valorTotal', label: 'Valor Total', type: 'number' },
];

const columnasExportacion: ExportColumn<AjusteInventarioDto>[] = [
  { header: 'Código de Ajuste', accessor: a => a.numero },
  { header: 'Tipo', accessor: a => a.tipo },
  { header: 'Almacén', accessor: a => a.nombreAlmacen },
  { header: 'Motivo', accessor: a => a.motivo },
  { header: 'Doc. Referencia', accessor: a => a.documentoReferencia || '' },
  { header: 'Fecha', accessor: a => a.fecha },
  { header: 'Estado', accessor: a => a.estado },
  { header: 'Total Ítems', accessor: a => a.totalItems },
  { header: 'Cantidad Total', accessor: a => a.totalCantidad },
  { header: 'Valor Total (S/)', accessor: a => a.valorTotal },
  { header: 'Usuario Registro', accessor: a => a.usuarioRegistro },
];

export function AjustesListPage() {
  const listStyles = useD365ListStyles();
  const navigate = useNavigate();
  const tableRef = useRef<D365EntityTableRef>(null);

  const [ajustes, setAjustes] = useState<AjusteInventarioDto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buscar, setBuscar] = useState('');
  const [vistaActual, setVistaActual] = useState<VistaId>('todos');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const vistas = useMemo(() => [
    { id: 'todos', nombre: 'Todos los Ajustes' },
    { id: 'borradores', nombre: 'Ajustes en Borrador' },
    { id: 'aplicados', nombre: 'Ajustes Aplicados' },
    { id: 'entradas', nombre: 'Ingresos por Ajuste (+)' },
    { id: 'salidas', nombre: 'Salidas por Ajuste (-)' },
  ], []);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await AjusteService.obtenerAjustes();
      setAjustes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los ajustes de inventario.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Filtrado por vista y buscador
  const ajustesFiltrados = useMemo(() => {
    const q = buscar.trim().toUpperCase();
    return ajustes.filter(item => {
      // Filtro de vista rápida
      if (vistaActual === 'borradores' && item.estado !== 'Borrador') return false;
      if (vistaActual === 'aplicados' && item.estado !== 'Aplicado') return false;
      if (vistaActual === 'entradas' && item.tipo !== 'Entrada') return false;
      if (vistaActual === 'salidas' && item.tipo !== 'Salida') return false;

      // Filtro de búsqueda
      if (!q) return true;
      return (
        item.numero.toUpperCase().includes(q) ||
        item.nombreAlmacen.toUpperCase().includes(q) ||
        item.motivo.toUpperCase().includes(q) ||
        (item.documentoReferencia && item.documentoReferencia.toUpperCase().includes(q)) ||
        (item.observaciones && item.observaciones.toUpperCase().includes(q))
      );
    });
  }, [ajustes, vistaActual, buscar]);

  const handleExportarExcel = () => {
    if (ajustesFiltrados.length === 0) return;
    const fecha = new Date().toISOString().slice(0, 10);
    exportToExcel(ajustesFiltrados, columnasExportacion, `Ajustes_Inventario_${fecha}`);
  };

  const handleExportarCSV = () => {
    if (ajustesFiltrados.length === 0) return;
    const fecha = new Date().toISOString().slice(0, 10);
    exportToCSV(ajustesFiltrados, columnasExportacion, `Ajustes_Inventario_${fecha}`);
  };

  const columns: TableColumnDefinition<AjusteInventarioDto>[] = useMemo(() => [
    createTableColumn({
      columnId: 'numero',
      compare: (a, b) => a.numero.localeCompare(b.numero),
      renderHeaderCell: () => 'Código de Ajuste',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Link
              as="button"
              title={`Abrir ajuste ${item.numero}`}
              style={{ textDecoration: 'none' }}
              onClick={e => {
                e.stopPropagation();
                navigate(`/servicio-campo/ajustes-inventario/${item.id}`);
              }}
            >
              {item.numero}
            </Link>
            {item.numeroAprobacion && (
              <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground4, fontFamily: 'Consolas, monospace' }}>
                N° Aprob: {item.numeroAprobacion}
              </span>
            )}
          </div>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'tipo',
      compare: (a, b) => a.tipo.localeCompare(b.tipo),
      renderHeaderCell: () => 'Tipo',
      renderCell: (item: AjusteInventarioDto) => {
        if (item.tipo === 'Entrada') {
          return (
            <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
              <Badge appearance="tint" shape="rounded" color="success" icon={<ArrowDownLeft16Regular />}>
                Ingreso (+)
              </Badge>
            </TableCellLayout>
          );
        }
        if (item.tipo === 'Salida') {
          return (
            <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
              <Badge appearance="tint" shape="rounded" color="danger" icon={<ArrowUpRight16Regular />}>
                Salida (-)
              </Badge>
            </TableCellLayout>
          );
        }
        return (
          <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
            <Badge appearance="tint" shape="rounded" color="informative" icon={<ArrowTrendingLines20Regular />}>
              Conteo Físico
            </Badge>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({
      columnId: 'almacen',
      compare: (a, b) => a.nombreAlmacen.localeCompare(b.nombreAlmacen),
      renderHeaderCell: () => 'Almacén',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Box16Regular style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }} />
            <span>{item.nombreAlmacen}</span>
          </div>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'motivo',
      compare: (a, b) => a.motivo.localeCompare(b.motivo),
      renderHeaderCell: () => 'Motivo',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <span title={item.motivo}>{item.motivo}</span>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'documento',
      compare: (a, b) => (a.documentoReferencia || '').localeCompare(b.documentoReferencia || ''),
      renderHeaderCell: () => 'Doc. Referencia',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <span style={{ fontFamily: 'Consolas, monospace', fontSize: '12px' }}>
            {item.documentoReferencia || '—'}
          </span>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'fecha',
      compare: (a, b) => a.fecha.localeCompare(b.fecha),
      renderHeaderCell: () => 'Fecha',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout>
          {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-PE')}
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'totalCantidad',
      compare: (a, b) => a.totalCantidad - b.totalCantidad,
      renderHeaderCell: () => 'Cantidad',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout>
          <span>{item.totalCantidad.toLocaleString('es-PE')}</span>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'valorTotal',
      compare: (a, b) => a.valorTotal - b.valorTotal,
      renderHeaderCell: () => 'Valor Total',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout>
          <span style={{ fontWeight: 500 }}>{formatoMoneda.format(item.valorTotal)}</span>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'estado',
      compare: (a, b) => a.estado.localeCompare(b.estado),
      renderHeaderCell: () => 'Estado',
      renderCell: (item: AjusteInventarioDto) => {
        if (item.estado === 'Aplicado') {
          return (
            <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
              <Badge appearance="filled" shape="rounded" color="success" icon={<CheckmarkCircle16Filled />}>
                Aplicado
              </Badge>
            </TableCellLayout>
          );
        }
        if (item.estado === 'EnRevision') {
          return (
            <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
              <Badge appearance="tint" shape="rounded" color="brand" icon={<Clock16Regular />}>
                En Revisión
              </Badge>
            </TableCellLayout>
          );
        }
        if (item.estado === 'Borrador') {
          return (
            <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
              <Badge appearance="tint" shape="rounded" color="warning" icon={<Clock16Regular />}>
                Borrador
              </Badge>
            </TableCellLayout>
          );
        }
        return (
          <TableCellLayout style={{ whiteSpace: 'nowrap' }}>
            <Badge appearance="tint" shape="rounded" color="danger" icon={<DismissCircle16Filled />}>
              Anulado
            </Badge>
          </TableCellLayout>
        );
      },
    }),
  ], [navigate]);

  return (
    <div className={listStyles.root}>
      {/* 1. Barra de comandos estándar D365 */}
      <D365CommandBar ariaLabel="Comandos de Ajustes de Inventario">
        <div className={listStyles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/ajustes-inventario/nuevo')}
          >
            Nuevo
          </D365CommandButton>
          <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void cargar()}>
            Actualizar
          </D365CommandButton>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <D365CommandButton
                icon={<ArrowDownload16Regular />}
                disabled={ajustesFiltrados.length === 0}
              >
                Exportar a Excel / CSV
              </D365CommandButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<DocumentTable20Regular />} onClick={handleExportarExcel}>
                  Libro de Excel estático (*.xlsx)
                </MenuItem>
                <MenuItem icon={<DocumentText20Regular />} onClick={handleExportarCSV}>
                  Valores separados por comas (*.csv)
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </D365CommandBar>

      {/* 2. Cabecera de Vista (Selector de vista + Herramientas + Búsqueda) */}
      <div className={listStyles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={listStyles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {vistas.find(v => v.id === vistaActual)?.nombre || 'Todos los Ajustes'}
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
                  onClick={() => setVistaActual(v.id as VistaId)}
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
            placeholder="Buscar por código, almacén, motivo..."
            aria-label="Buscar en esta vista"
            value={buscar}
            onChange={(_, d) => setBuscar(d.value)}
          />
        </div>
      </div>

      {/* 3. Grid de Datos D365 */}
      <D365EntityTable
        ref={tableRef}
        entityName="Ajustes de Inventario"
        tableId="ajustes-inventario"
        items={ajustesFiltrados}
        columns={columns}
        filterFields={filterFields}
        loading={cargando}
        error={error}
        onRetry={() => void cargar()}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
      />

      {/* 4. Footer estándar D365 */}
      <footer className={listStyles.footer}>
        <div>
          1-{ajustesFiltrados.length} de {ajustesFiltrados.length}
          {selectedIds.size > 0 && ` (${selectedIds.size} seleccionados)`}
        </div>
        <div>Página 1</div>
      </footer>
    </div>
  );
}
