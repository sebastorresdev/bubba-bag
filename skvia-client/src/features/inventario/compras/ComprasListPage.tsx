import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link, Badge, DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell, DataGridRow, Input, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, TableCellLayout, Text, createTableColumn, tokens } from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import { Add16Regular, ArrowClockwise16Regular, Checkmark16Regular, ChevronDown16Regular, Search16Regular } from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import { D365ListState } from '../../../components/common/D365ListState';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { TableEmptyState } from '../../../components/common/TableEmptyState';
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
      renderCell: (x: CompraDto) => {
        const esFaltante = x.estado === 'Recibida con faltantes';
        const esRecibida = x.estado === 'Recibida';
        const esEnviada = x.estado === 'Enviada';
        return (
          <TableCellLayout>
            <Badge
              appearance="tint"
              shape="rounded"
              color={esRecibida ? 'success' : esFaltante ? 'warning' : esEnviada ? 'informative' : 'subtle'}
            >
              {x.estado}
            </Badge>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({ columnId: 'fecha', compare: (a: CompraDto, b: CompraDto) => a.fechaDocumento.localeCompare(b.fechaDocumento), renderHeaderCell: () => 'Fecha', renderCell: (x: CompraDto) => <TableCellLayout>{new Date(x.fechaDocumento + 'T00:00:00').toLocaleDateString('es-PE')}</TableCellLayout> }),
    createTableColumn({ columnId: 'origen', compare: (a: CompraDto, b: CompraDto) => a.proveedor.localeCompare(b.proveedor), renderHeaderCell: () => 'Proveedor', renderCell: (x: CompraDto) => <TableCellLayout>{x.proveedor}</TableCellLayout> }),
    createTableColumn({ columnId: 'destino', compare: (a: CompraDto, b: CompraDto) => a.almacen.localeCompare(b.almacen), renderHeaderCell: () => 'Almacén', renderCell: (x: CompraDto) => <TableCellLayout>{x.almacen}</TableCellLayout> }),
    createTableColumn({
      columnId: 'recibidoPor',
      compare: (a: CompraDto, b: CompraDto) => (a.recibidoPor || '').localeCompare(b.recibidoPor || ''),
      renderHeaderCell: () => 'Recibido por',
      renderCell: (x: CompraDto) => {
        if (!x.estado.startsWith('Recibida')) {
          return <TableCellLayout><Text style={{ color: tokens.colorNeutralForeground4 }}>—</Text></TableCellLayout>;
        }
        return (
          <TableCellLayout truncate>
            {x.recibidoPor ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Text weight="semibold">{x.recibidoPor}</Text>
                {x.fechaRecepcion && (
                  <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                    {new Date(x.fechaRecepcion).toLocaleString('es-PE')}
                  </span>
                )}
              </div>
            ) : x.fechaRecepcion ? (
              <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                {new Date(x.fechaRecepcion).toLocaleString('es-PE')}
              </span>
            ) : (
              <Text style={{ color: tokens.colorNeutralForeground4 }}>—</Text>
            )}
          </TableCellLayout>
        );
      },
    }),
    createTableColumn({ columnId: 'producto', compare: (a: CompraDto, b: CompraDto) => a.numeroDocumento.localeCompare(b.numeroDocumento), renderHeaderCell: () => 'Comprobante', renderCell: (x: CompraDto) => <TableCellLayout truncate>{x.numeroDocumento}</TableCellLayout> }),
    createTableColumn({ columnId: 'cantidad', compare: (a: CompraDto, b: CompraDto) => a.total - b.total, renderHeaderCell: () => 'Total', renderCell: (x: CompraDto) => <TableCellLayout>{x.total.toLocaleString('es-PE', { style: 'currency', currency: x.moneda })}</TableCellLayout> }),
  ], [navigate]);

  return <div className={styles.root}>
    {mensaje && <D365MessageBar intent="success" onDismiss={() => setMensaje(null)}>{mensaje}</D365MessageBar>}
    <D365CommandBar ariaLabel="Comandos de compras"><div className={styles.toolbarLeft}>
      <D365CommandButton icon={<Add16Regular />} tone="create" onClick={() => navigate('/servicio-campo/recepciones-compra/nuevo')}>Nuevo</D365CommandButton>
      <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void cargar()}>Actualizar</D365CommandButton>
    </div></D365CommandBar>
    <div className={styles.viewHeader}>
      <Menu><MenuTrigger disableButtonEnhancement><div className={styles.viewSelectorTab} title="Seleccionar vista"><Text weight="semibold" size={400}>{nombresVista[vista]}</Text><ChevronDown16Regular /></div></MenuTrigger>
        <MenuPopover><MenuList className={styles.viewMenuPopover}>{(Object.keys(nombresVista) as Vista[]).map(v => <MenuItem key={v} icon={vista === v ? <Checkmark16Regular /> : undefined} onClick={() => setVista(v)}>{nombresVista[v]}</MenuItem>)}</MenuList></MenuPopover>
      </Menu>
      <div className={styles.viewToolsRight}>
<Input className={styles.searchBox} size="medium" contentBefore={<Search16Regular />} placeholder="Buscar" aria-label="Buscar" value={buscar} onChange={(_, d) => setBuscar(d.value)} />
      </div>
    </div>
    <div className={styles.gridContainer}><D365ListState loading={loading} error={error} onRetry={() => void cargar()} loadingLabel="Cargando compras...">
      <DataGrid items={filtrados} columns={columns} sortable selectionMode="multiselect" selectedItems={seleccionados} onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)} getRowId={(item) => item.id} focusMode="composite" size="medium" className={styles.table}>
        <DataGridHeader><DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow></DataGridHeader>
        {filtrados.length === 0 ? <TableEmptyState /> : <DataGridBody<CompraDto>>{({ item, rowId }) => <DataGridRow<CompraDto> key={rowId} className={styles.dataRow}>{({ renderCell }) => <DataGridCell className={styles.dataCell}>{renderCell(item)}</DataGridCell>}</DataGridRow>}</DataGridBody>}
      </DataGrid>
    </D365ListState></div>
    <footer className={styles.footer}><div>1-{filtrados.length} de {filtrados.length} ({seleccionados.size} seleccionados)</div><div>Página 1</div></footer>
  </div>;
}
