import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link, Button, Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, TableCellLayout, Text, createTableColumn, tokens } from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import { Add16Regular, ArrowClockwise16Regular, Checkmark16Regular, ChevronDown16Regular, Delete16Regular, Eye16Regular } from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { D365EntityTable, D365TableToolbarTools, type D365EntityTableRef } from '../../../components/common/D365EntityTable';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { CompraService } from './compra.service';
import type { CompraDto } from './compra.service';

type Vista = 'recientes' | 'todas' | 'Borrador' | 'Solicitada' | 'Enviada' | 'Recibida';
const nombresVista: Record<Vista, string> = { recientes: 'Compras recientes', todas: 'Todas las compras', Borrador: 'Compras en borrador', Solicitada: 'Compras solicitadas', Enviada: 'Compras enviadas', Recibida: 'Compras recibidas' };

export function ComprasListPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [datos, setDatos] = useState<CompraDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [vista, setVista] = useState<Vista>('recientes');
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [comprasAEliminar, setComprasAEliminar] = useState<CompraDto[] | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const tableRef = useRef<D365EntityTableRef>(null);

  const cargar = useCallback(async () => {
    try { setLoading(true); setError(null); setDatos(await CompraService.obtener()); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar las compras.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);
  useEffect(() => {
    const texto = (location.state as { successMessage?: string } | null)?.successMessage;
    if (!texto) return;
    setMensaje(texto);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const filtrados = useMemo(() => {
    const limite = new Date(); limite.setDate(limite.getDate() - 30);
    const q = buscar.trim().toLowerCase();
    return datos.filter((item) => {
      if (vista === 'recientes' && new Date(item.fechaDocumento + 'T00:00:00') < limite) return false;
      if (vista !== 'recientes' && vista !== 'todas' && item.estado !== vista) return false;
      return !q || [item.numero, item.proveedor, item.numeroDocumento, item.almacen, item.estado, item.recibidoPor || ''].some((valor) => valor.toLowerCase().includes(q));
    });
  }, [buscar, datos, vista]);

  const columns: TableColumnDefinition<CompraDto>[] = useMemo(() => [
    createTableColumn({ columnId: 'numero', compare: (a: CompraDto, b: CompraDto) => a.numero.localeCompare(b.numero), renderHeaderCell: () => 'Código de compra', renderCell: (x: CompraDto) => <TableCellLayout truncate><Link as="button" title={x.numero} onClick={e => { e.stopPropagation(); navigate(`/servicio-campo/recepciones-compra/${x.id}`); }}>{x.numero}</Link></TableCellLayout> }),
    createTableColumn({
      columnId: 'estado',
      compare: (a: CompraDto, b: CompraDto) => a.estado.localeCompare(b.estado),
      renderHeaderCell: () => 'Estado',
      renderCell: (x: CompraDto) => (
        <TableCellLayout truncate>
          <Text>{x.estado}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn({ columnId: 'fecha', compare: (a: CompraDto, b: CompraDto) => a.fechaDocumento.localeCompare(b.fechaDocumento), renderHeaderCell: () => 'Fecha', renderCell: (x: CompraDto) => <TableCellLayout truncate><Text>{new Date(x.fechaDocumento + 'T00:00:00').toLocaleDateString('es-PE')}</Text></TableCellLayout> }),
    createTableColumn({ columnId: 'origen', compare: (a: CompraDto, b: CompraDto) => a.proveedor.localeCompare(b.proveedor), renderHeaderCell: () => 'Proveedor', renderCell: (x: CompraDto) => <TableCellLayout truncate><Text>{x.proveedor}</Text></TableCellLayout> }),
    createTableColumn({ columnId: 'destino', compare: (a: CompraDto, b: CompraDto) => a.almacen.localeCompare(b.almacen), renderHeaderCell: () => 'Almacén', renderCell: (x: CompraDto) => <TableCellLayout truncate><Text>{x.almacen}</Text></TableCellLayout> }),
    createTableColumn({
      columnId: 'recibidoPor',
      compare: (a: CompraDto, b: CompraDto) => (a.recibidoPor || '').localeCompare(b.recibidoPor || ''),
      renderHeaderCell: () => 'Recibido por',
      renderCell: (x: CompraDto) => {
        if (!x.estado.startsWith('Recibida') || !x.recibidoPor) {
          return <TableCellLayout truncate><Text style={{ color: tokens.colorNeutralForeground4 }}>—</Text></TableCellLayout>;
        }
        return (
          <TableCellLayout truncate>
            <Text>{x.recibidoPor}</Text>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({
      columnId: 'fechaRecepcion',
      compare: (a: CompraDto, b: CompraDto) => (a.fechaRecepcion || '').localeCompare(b.fechaRecepcion || ''),
      renderHeaderCell: () => 'Fecha de recepción',
      renderCell: (x: CompraDto) => {
        if (!x.fechaRecepcion) {
          return <TableCellLayout><Text style={{ color: tokens.colorNeutralForeground4 }}>—</Text></TableCellLayout>;
        }
        return (
          <TableCellLayout>
            <Text>{new Date(x.fechaRecepcion).toLocaleString('es-PE')}</Text>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({ columnId: 'producto', compare: (a: CompraDto, b: CompraDto) => a.numeroDocumento.localeCompare(b.numeroDocumento), renderHeaderCell: () => 'Comprobante', renderCell: (x: CompraDto) => <TableCellLayout truncate>{x.numeroDocumento}</TableCellLayout> }),
    createTableColumn({ columnId: 'cantidad', compare: (a: CompraDto, b: CompraDto) => a.total - b.total, renderHeaderCell: () => 'Total', renderCell: (x: CompraDto) => <TableCellLayout>{x.total.toLocaleString('es-PE', { style: 'currency', currency: x.moneda })}</TableCellLayout> }),
  ], [navigate]);

  const itemsSeleccionados = useMemo(() => {
    return datos.filter((d) => seleccionados.has(d.id));
  }, [datos, seleccionados]);

  const borradoresSeleccionados = useMemo(() => {
    return itemsSeleccionados.filter((d) => d.estado === 'Borrador');
  }, [itemsSeleccionados]);

  return <div className={styles.root}>
    {mensaje && <D365MessageBar intent="success" onDismiss={() => setMensaje(null)}>{mensaje}</D365MessageBar>}
    <D365CommandBar ariaLabel="Comandos de compras">
      <div className={styles.toolbarLeft}>
        <D365CommandButton icon={<Add16Regular />} tone="create" onClick={() => navigate('/servicio-campo/recepciones-compra/nuevo')}>Nuevo</D365CommandButton>
        <D365CommandDivider />
        {seleccionados.size === 1 && (() => {
          const itemSel = itemsSeleccionados[0] ?? datos.find((d) => seleccionados.has(d.id));
          const esBorrador = itemSel?.estado === 'Borrador';
          const idSel = itemSel?.id;
          return (
            <>
              <D365CommandButton
                icon={<Eye16Regular />}
                onClick={() => idSel && navigate(`/servicio-campo/recepciones-compra/${idSel}`)}
              >
                Ver detalle
              </D365CommandButton>
              {esBorrador && (
                <D365CommandButton
                  icon={<Delete16Regular />}
                  tone="danger"
                  onClick={() => itemSel && setComprasAEliminar([itemSel])}
                >
                  Eliminar
                </D365CommandButton>
              )}
              <D365CommandDivider />
            </>
          );
        })()}
        {seleccionados.size > 1 && (
          <>
            {borradoresSeleccionados.length > 0 && (
              <D365CommandButton
                icon={<Delete16Regular />}
                tone="danger"
                onClick={() => setComprasAEliminar(borradoresSeleccionados)}
              >
                Eliminar ({borradoresSeleccionados.length})
              </D365CommandButton>
            )}
            <D365CommandDivider />
          </>
        )}
        <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void cargar()}>Actualizar</D365CommandButton>
      </div>
    </D365CommandBar>
    <div className={styles.viewHeader}>
      <Menu><MenuTrigger disableButtonEnhancement><div className={styles.viewSelectorTab} title="Seleccionar vista"><Text weight="semibold" size={400}>{nombresVista[vista]}</Text><ChevronDown16Regular /></div></MenuTrigger>
        <MenuPopover><MenuList className={styles.viewMenuPopover}>{(Object.keys(nombresVista) as Vista[]).map(v => <MenuItem key={v} icon={vista === v ? <Checkmark16Regular /> : undefined} onClick={() => setVista(v)}>{nombresVista[v]}</MenuItem>)}</MenuList></MenuPopover>
      </Menu>
      <div className={styles.viewToolsRight}>
        <D365TableToolbarTools tableRef={tableRef} searchValue={buscar} onSearchChange={setBuscar} searchPlaceholder="Buscar" />
      </div>
    </div>
    <D365EntityTable
      ref={tableRef}
      entityName="Compras"
      tableId="compras"
      items={filtrados}
      columns={columns}
      loading={loading}
      error={error}
      onRetry={() => void cargar()}
      selectionMode="multiselect"
      selectedItems={seleccionados}
      onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)}
      onRowDoubleClick={(item) => navigate(`/servicio-campo/recepciones-compra/${item.id}`)}
    />
    <footer className={styles.footer}><div>1-{filtrados.length} de {filtrados.length} ({seleccionados.size} seleccionados)</div><div>Página 1</div></footer>

    <Dialog
      open={Boolean(comprasAEliminar && comprasAEliminar.length > 0)}
      onOpenChange={(_, data) => {
        if (!data.open && !eliminando) setComprasAEliminar(null);
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {comprasAEliminar?.length === 1
              ? 'Eliminar borrador de compra'
              : `Eliminar ${comprasAEliminar?.length} borradores de compra`}
          </DialogTitle>
          <DialogContent>
            {comprasAEliminar?.length === 1 ? (
              <>
                ¿Está seguro de que desea eliminar el borrador de compra{' '}
                <strong>{comprasAEliminar[0]?.numero}</strong>? Esta acción no se puede deshacer.
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  ¿Está seguro de que desea eliminar los{' '}
                  <strong>{comprasAEliminar?.length}</strong> borradores de compra seleccionados? Esta acción no se puede deshacer.
                </div>
                <div
                  style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    backgroundColor: tokens.colorNeutralBackground2,
                    padding: '8px 12px',
                    borderRadius: tokens.borderRadiusMedium,
                    fontSize: '12px',
                  }}
                >
                  {comprasAEliminar?.map((c) => c.numero).join(', ')}
                </div>
                {itemsSeleccionados.length > (comprasAEliminar?.length ?? 0) && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    ℹ️ Nota: {itemsSeleccionados.length - (comprasAEliminar?.length ?? 0)} registro(s) seleccionados no se encuentran en estado Borrador y se mantendrán intactos.
                  </Text>
                )}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              appearance="secondary"
              disabled={eliminando}
              onClick={() => setComprasAEliminar(null)}
            >
              Cancelar
            </Button>
            <Button
              appearance="primary"
              style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: '#fff' }}
              disabled={eliminando}
              onClick={async () => {
                if (!comprasAEliminar || comprasAEliminar.length === 0) return;
                try {
                  setEliminando(true);
                  let exitosos = 0;
                  const errores: string[] = [];
                  for (const c of comprasAEliminar) {
                    try {
                      await CompraService.eliminar(c.id);
                      exitosos++;
                    } catch (err) {
                      errores.push(`${c.numero}: ${err instanceof Error ? err.message : 'Error al eliminar'}`);
                    }
                  }

                  if (exitosos > 0) {
                    setMensaje(
                      exitosos === 1
                        ? `Borrador ${comprasAEliminar[0].numero} eliminado exitosamente.`
                        : `Se eliminaron ${exitosos} borradores exitosamente.`
                    );
                  }
                  if (errores.length > 0) {
                    setError(`No se pudieron eliminar ${errores.length} registros: ${errores.join('; ')}`);
                  }
                  setComprasAEliminar(null);
                  setSeleccionados(new Set());
                  await cargar();
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Error al eliminar el borrador.');
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
  </div>;
}
