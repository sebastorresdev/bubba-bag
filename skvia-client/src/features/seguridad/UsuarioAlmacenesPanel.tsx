import { useEffect, useState } from 'react';
import { Button, Checkbox, Link, Spinner, Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Text } from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';
import { AlmacenService } from '../inventario/almacenes/services/almacen.service';
import { D365MessageBar } from '../../components/common/D365MessageBar';

type Scope = { puedeConsultar: boolean; puedeDespachar: boolean; puedeRecepcionar: boolean; esSupervisor: boolean; activo: boolean };
type Row = Scope & { id: string; nombre: string; dirty: boolean };
const fields = ['puedeConsultar', 'puedeDespachar', 'puedeRecepcionar', 'esSupervisor', 'activo'] as const;
const labels = ['Consultar', 'Despachar', 'Recepcionar', 'Supervisar', 'Autorización activa'];
export function UsuarioAlmacenesPanel({ usuarioId }: { usuarioId: string }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  useEffect(() => {
    let current = true;
    void (async () => {
      try {
        const warehouses = await AlmacenService.getAlmacenes(true);
        const data = await Promise.all(warehouses.map(async w => {
          const existing = (await AlmacenService.getAutorizaciones(w.id)).find(a => a.usuarioId === usuarioId);
          return { id: w.id, nombre: w.nombre, puedeConsultar: false, puedeDespachar: false, puedeRecepcionar: false, esSupervisor: false, activo: false, ...existing, dirty: false };
        }));
        if (current) setRows(data);
      } catch (e) { if (current) setError(e instanceof Error ? e.message : 'No se pudo cargar autorizaciones.'); }
      finally { if (current) setLoading(false); }
    })();
    return () => { current = false; };
  }, [usuarioId]);
  const save = async (row: Row) => {
    setBusy(true); setError(''); setSuccess('');
    try {
      await AlmacenService.guardarAutorizacion(row.id, usuarioId, row);
      setRows(previous => previous.map(r => r.id === row.id ? { ...r, dirty: false } : r));
      setSuccess(`Autorización guardada para ${row.nombre}.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar.'); }
    finally { setBusy(false); }
  };
  if (loading) return <Spinner label="Cargando autorizaciones por almacén..." />;
  return <>
    {error && <D365MessageBar intent="error">{error}</D365MessageBar>}{success && <D365MessageBar intent="success" onDismiss={() => setSuccess('')}>{success}</D365MessageBar>}
    {!rows.length ? <Text>No hay almacenes.</Text> : <Table aria-label="Almacenes autorizados al usuario">
      <TableHeader><TableRow><TableHeaderCell>Almacén</TableHeaderCell>{labels.map(l => <TableHeaderCell key={l}>{l}</TableHeaderCell>)}<TableHeaderCell>Acción</TableHeaderCell></TableRow></TableHeader>
      <TableBody>{rows.map(row => <TableRow key={row.id}>
        <TableCell><Link as="button" onClick={() => navigate(`/servicio-campo/almacenes/${row.id}`)}>{row.nombre}</Link></TableCell>
        {fields.map((field, i) => <TableCell key={field}><Checkbox aria-label={`${labels[i]} en ${row.nombre}`} disabled={busy} checked={row[field]} onChange={(_, d) => {
          setRows(previous => previous.map(r => r.id === row.id ? { ...r, [field]: !!d.checked, dirty: true } : r));
        }} /></TableCell>)}
        <TableCell><Button disabled={busy || !row.dirty} onClick={() => void save(row)}>Guardar autorización</Button></TableCell>
      </TableRow>)}</TableBody>
    </Table>}
  </>;
}
