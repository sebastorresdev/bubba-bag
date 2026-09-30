import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell, DataGridRow, Input, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, TableCellLayout, Text, Tooltip, createTableColumn } from '@fluentui/react-components';
import type { SelectionItemId, TableColumnDefinition } from '@fluentui/react-components';
import { Add16Regular, ArrowClockwise16Regular, Checkmark16Regular, ChevronDown16Regular, DataFunnel20Regular, Search16Regular, TableEdit16Regular } from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import { D365ListState } from '../../../../components/common/D365ListState';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { TransferenciaService } from '../services/transferencia.service';
import type { TransferenciaInventarioDto } from '../types/transferencia.types';

type Vista = 'recientes' | 'todas';

export function TransferenciasListPage() {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [datos, setDatos] = useState<TransferenciaInventarioDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [vista, setVista] = useState<Vista>('recientes');
  const [seleccionados, setSeleccionados] = useState<Set<SelectionItemId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try { setLoading(true); setError(null); setDatos(await TransferenciaService.obtener()); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar las transferencias.'); }
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
      if (vista === 'recientes' && new Date(item.fecha) < limite) return false;
      return !q || [item.numero, item.producto, item.almacenOrigen, item.almacenDestino].some((valor) => valor.toLowerCase().includes(q));
    });
  }, [buscar, datos, vista]);

  const columns: TableColumnDefinition<TransferenciaInventarioDto>[] = useMemo(() => [
    createTableColumn({ columnId: 'numero', compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) => a.numero.localeCompare(b.numero), renderHeaderCell: () => 'Número', renderCell: (x: TransferenciaInventarioDto) => <TableCellLayout><Text weight="semibold">{x.numero}</Text></TableCellLayout> }),
    createTableColumn({ columnId: 'fecha', compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(), renderHeaderCell: () => 'Fecha', renderCell: (x: TransferenciaInventarioDto) => <TableCellLayout>{new Date(x.fecha).toLocaleString('es-PE')}</TableCellLayout> }),
    createTableColumn({ columnId: 'origen', compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) => a.almacenOrigen.localeCompare(b.almacenOrigen), renderHeaderCell: () => 'Origen', renderCell: (x: TransferenciaInventarioDto) => <TableCellLayout>{x.almacenOrigen}</TableCellLayout> }),
    createTableColumn({ columnId: 'destino', compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) => a.almacenDestino.localeCompare(b.almacenDestino), renderHeaderCell: () => 'Destino', renderCell: (x: TransferenciaInventarioDto) => <TableCellLayout>{x.almacenDestino}</TableCellLayout> }),
    createTableColumn({ columnId: 'producto', compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) => a.producto.localeCompare(b.producto), renderHeaderCell: () => 'Producto', renderCell: (x: TransferenciaInventarioDto) => <TableCellLayout truncate>{x.producto}</TableCellLayout> }),
    createTableColumn({ columnId: 'cantidad', compare: (a: TransferenciaInventarioDto, b: TransferenciaInventarioDto) => a.cantidad - b.cantidad, renderHeaderCell: () => 'Cantidad', renderCell: (x: TransferenciaInventarioDto) => <TableCellLayout>{x.cantidad.toLocaleString('es-PE')} {x.unidad ?? ''}</TableCellLayout> }),
  ], []);

  return <div className={styles.root}>
    {mensaje && <D365MessageBar intent="success" onDismiss={() => setMensaje(null)}>{mensaje}</D365MessageBar>}
    <D365CommandBar ariaLabel="Comandos de transferencias"><div className={styles.toolbarLeft}>
      <D365CommandButton icon={<Add16Regular />} tone="create" onClick={() => navigate('/servicio-campo/transferencias/nuevo')}>Nuevo</D365CommandButton>
      <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void cargar()}>Actualizar</D365CommandButton>
    </div></D365CommandBar>
    <div className={styles.viewHeader}>
      <Menu><MenuTrigger disableButtonEnhancement><div className={styles.viewSelectorTab} title="Seleccionar vista"><Text weight="semibold" size={400}>{vista === 'recientes' ? 'Transferencias recientes' : 'Todas las transferencias'}</Text><ChevronDown16Regular /></div></MenuTrigger>
        <MenuPopover><MenuList className={styles.viewMenuPopover}><MenuItem icon={vista === 'recientes' ? <Checkmark16Regular /> : undefined} onClick={() => setVista('recientes')}>Transferencias recientes</MenuItem><MenuItem icon={vista === 'todas' ? <Checkmark16Regular /> : undefined} onClick={() => setVista('todas')}>Todas las transferencias</MenuItem></MenuList></MenuPopover>
      </Menu>
      <div className={styles.viewToolsRight}>
        <Tooltip content="Modificar orden y visibilidad de columnas" relationship="label"><Button appearance="subtle" size="medium" icon={<TableEdit16Regular className={styles.iconBrand} />}>Editar columnas</Button></Tooltip>
        <Tooltip content="Editar filtros de la consulta" relationship="label"><Button appearance="subtle" size="medium" icon={<DataFunnel20Regular className={styles.iconBrand} />}>Editar filtros</Button></Tooltip>
        <Input className={styles.searchBox} size="medium" contentBefore={<Search16Regular />} placeholder="---" value={buscar} onChange={(_, d) => setBuscar(d.value)} />
      </div>
    </div>
    <div className={styles.gridContainer}><D365ListState loading={loading} error={error} onRetry={() => void cargar()} loadingLabel="Cargando transferencias...">
      <DataGrid items={filtrados} columns={columns} sortable selectionMode="multiselect" selectedItems={seleccionados} onSelectionChange={(_, data) => setSeleccionados(data.selectedItems)} getRowId={(item) => item.id} focusMode="composite" size="medium" className={styles.table}>
        <DataGridHeader><DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow></DataGridHeader>
        {filtrados.length === 0 ? <TableEmptyState /> : <DataGridBody<TransferenciaInventarioDto>>{({ item, rowId }) => <DataGridRow<TransferenciaInventarioDto> key={rowId} className={styles.dataRow}>{({ renderCell }) => <DataGridCell className={styles.dataCell}>{renderCell(item)}</DataGridCell>}</DataGridRow>}</DataGridBody>}
      </DataGrid>
    </D365ListState></div>
    <footer className={styles.footer}><div>1-{filtrados.length} de {filtrados.length} ({seleccionados.size} seleccionados)</div><div>Página 1</div></footer>
  </div>;
}
