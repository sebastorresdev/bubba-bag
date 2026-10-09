import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TableCellLayout,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
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
  SplitButton,
  type MenuButtonProps,
} from '@fluentui/react-components';
import type { TableColumnDefinition, SelectionItemId } from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  Search16Regular,
  ChevronDown16Regular,
  Checkmark16Regular,
  Delete16Regular,
  Eye16Regular,
  DocumentTable20Regular,
  DocumentText20Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
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
      { value: 'EnRevision', label: 'En revisión' },
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
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ajustesAEliminar, setAjustesAEliminar] = useState<AjusteInventarioDto[] | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const itemsSeleccionados = useMemo(() => {
    return ajustes.filter(a => selectedIds.has(a.id));
  }, [ajustes, selectedIds]);

  const borradoresSeleccionados = useMemo(() => {
    return itemsSeleccionados.filter(a => a.estado === 'Borrador');
  }, [itemsSeleccionados]);

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
          <Link
            as="button"
            title={`Abrir ajuste ${item.numero}`}
            onClick={e => {
              e.stopPropagation();
              navigate(`/servicio-campo/ajustes-inventario/${item.id}`);
            }}
          >
            {item.numero}
          </Link>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'tipo',
      compare: (a, b) => a.tipo.localeCompare(b.tipo),
      renderHeaderCell: () => 'Tipo',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <Text>{item.tipo === 'Entrada' ? 'Entrada (+)' : 'Salida (-)'}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'almacen',
      compare: (a, b) => a.nombreAlmacen.localeCompare(b.nombreAlmacen),
      renderHeaderCell: () => 'Almacén',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <Text>{item.nombreAlmacen}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'motivo',
      compare: (a, b) => a.motivo.localeCompare(b.motivo),
      renderHeaderCell: () => 'Motivo',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <Text title={item.motivo}>{item.motivo}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'documento',
      compare: (a, b) => (a.documentoReferencia || '').localeCompare(b.documentoReferencia || ''),
      renderHeaderCell: () => 'Doc. Referencia',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <Text>{item.documentoReferencia || '—'}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'fecha',
      compare: (a, b) => a.fecha.localeCompare(b.fecha),
      renderHeaderCell: () => 'Fecha',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <Text>{new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-PE')}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'totalCantidad',
      compare: (a, b) => a.totalCantidad - b.totalCantidad,
      renderHeaderCell: () => 'Cantidad',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <Text>{item.totalCantidad.toLocaleString('es-PE')}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'valorTotal',
      compare: (a, b) => a.valorTotal - b.valorTotal,
      renderHeaderCell: () => 'Valor Total',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <Text>{formatoMoneda.format(item.valorTotal)}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'estado',
      compare: (a, b) => a.estado.localeCompare(b.estado),
      renderHeaderCell: () => 'Estado',
      renderCell: (item: AjusteInventarioDto) => (
        <TableCellLayout truncate>
          <D365StatusBadge status={item.estado} />
        </TableCellLayout>
      ),
    }),
  ], [navigate]);

  return (
    <div className={listStyles.root}>
      {mensaje && (
        <D365MessageBar intent="success" onDismiss={() => setMensaje(null)}>
          {mensaje}
        </D365MessageBar>
      )}
      {error && (
        <D365MessageBar intent="error" onDismiss={() => setError(null)}>
          {error}
        </D365MessageBar>
      )}

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
          <D365CommandDivider />

          {selectedIds.size === 1 && (() => {
            const itemSel = itemsSeleccionados[0] ?? ajustes.find((a) => selectedIds.has(a.id));
            const esBorrador = itemSel?.estado === 'Borrador';
            const idSel = itemSel?.id;
            return (
              <>
                <D365CommandButton
                  icon={<Eye16Regular />}
                  onClick={() => idSel && navigate(`/servicio-campo/ajustes-inventario/${idSel}`)}
                >
                  Ver detalle
                </D365CommandButton>
                {esBorrador && (
                  <D365CommandButton
                    icon={<Delete16Regular />}
                    tone="danger"
                    onClick={() => itemSel && setAjustesAEliminar([itemSel])}
                  >
                    Eliminar
                  </D365CommandButton>
                )}
                <D365CommandDivider />
              </>
            );
          })()}

          {selectedIds.size > 1 && (
            <>
              {borradoresSeleccionados.length > 0 && (
                <D365CommandButton
                  icon={<Delete16Regular />}
                  tone="danger"
                  onClick={() => setAjustesAEliminar(borradoresSeleccionados)}
                >
                  Eliminar ({borradoresSeleccionados.length})
                </D365CommandButton>
              )}
              <D365CommandDivider />
            </>
          )}

          <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void cargar()}>
            Actualizar
          </D365CommandButton>
          <Menu positioning="below-start">
            <MenuTrigger disableButtonEnhancement>
              {(triggerProps: MenuButtonProps) => (
                <SplitButton
                  menuButton={triggerProps}
                  primaryActionButton={{
                    onClick: handleExportarExcel,
                    title: 'Exportar a Excel (*.xlsx)',
                  }}
                  icon={<ArrowDownload16Regular />}
                  appearance="subtle"
                  size="medium"
                  disabled={ajustesFiltrados.length === 0}
                >
                  Exportar a Excel
                </SplitButton>
              )}
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
        onRowDoubleClick={(item) => navigate(`/servicio-campo/ajustes-inventario/${item.id}`)}
      />

      {/* 4. Footer estándar D365 */}
      <footer className={listStyles.footer}>
        <div>
          1-{ajustesFiltrados.length} de {ajustesFiltrados.length}
          {selectedIds.size > 0 && ` (${selectedIds.size} seleccionados)`}
        </div>
        <div>Página 1</div>
      </footer>

      {/* Diálogo de confirmación para eliminar borrador(es) */}
      <Dialog
        open={Boolean(ajustesAEliminar && ajustesAEliminar.length > 0)}
        onOpenChange={(_, data) => {
          if (!data.open && !eliminando) setAjustesAEliminar(null);
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {ajustesAEliminar?.length === 1
                ? 'Eliminar borrador'
                : `Eliminar ${ajustesAEliminar?.length} borradores`}
            </DialogTitle>
            <DialogContent>
              {ajustesAEliminar?.length === 1 ? (
                <Text>
                  ¿Está seguro de que desea eliminar el borrador{' '}
                  <strong>{ajustesAEliminar[0]?.numero}</strong>? Esta acción no se puede deshacer.
                </Text>
              ) : (
                <>
                  <Text>
                    ¿Está seguro de que desea eliminar los{' '}
                    <strong>{ajustesAEliminar?.length}</strong> borradores seleccionados? Esta acción no se puede deshacer.
                  </Text>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                    {ajustesAEliminar?.map((t) => t.numero).join(', ')}
                  </div>
                  {itemsSeleccionados.length > (ajustesAEliminar?.length ?? 0) && (
                    <div style={{ marginTop: '8px', color: tokens.colorPaletteGoldForeground2, fontSize: '12px' }}>
                      ℹ️ Nota: {itemsSeleccionados.length - (ajustesAEliminar?.length ?? 0)} registro(s) seleccionados no están en estado Borrador y no serán eliminados.
                    </div>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                disabled={eliminando}
                onClick={() => setAjustesAEliminar(null)}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: '#fff' }}
                disabled={eliminando}
                onClick={async () => {
                  if (!ajustesAEliminar || ajustesAEliminar.length === 0) return;
                  setEliminando(true);
                  try {
                    let exitosos = 0;
                    for (const a of ajustesAEliminar) {
                      await AjusteService.eliminarAjuste(a.id);
                      exitosos++;
                    }
                    setSelectedIds(new Set());
                    setAjustesAEliminar(null);
                    setMensaje(
                      ajustesAEliminar.length === 1
                        ? `Borrador ${ajustesAEliminar[0].numero} eliminado exitosamente.`
                        : `Se eliminaron ${exitosos} borradores exitosamente.`
                    );
                    await cargar();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Error al eliminar');
                  } finally {
                    setEliminando(false);
                  }
                }}
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
