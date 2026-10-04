import { useRef, useState } from 'react';
import { Button, Checkbox, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Input, Select, Textarea } from '@fluentui/react-components';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365FormField } from '../../../../components/common/D365FormField';
import { TransferenciaService } from '../services/transferencia.service';
import type { TransferenciaDetalladaDto } from '../types/transferencia.types';

export function ResolverDiferenciaDialog({ detalle, onResuelto }: { detalle: TransferenciaDetalladaDto; onResuelto: () => Promise<unknown> }) {
  const [abierto, setAbierto] = useState(false);
  const [lineaId, setLineaId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [series, setSeries] = useState<string[]>([]);
  const [resultado, setResultado] = useState('2');
  const [motivo, setMotivo] = useState('');
  const [evidencia, setEvidencia] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const operacion = useRef(crypto.randomUUID());
  const pendientes = detalle.lineas.filter(l => l.cantidadPendiente > 0);
  const linea = pendientes.find(l => l.id === lineaId);
  const confirmar = async () => {
    if (!linea) return;
    setOcupado(true); setError('');
    try {
      await TransferenciaService.resolver(detalle.id, { detalleId: linea.id, cantidad: linea.series.length ? series.length : Number(cantidad), series, resultado: Number(resultado), motivo, evidencia, operacionId: operacion.current });
      setAbierto(false); await onResuelto();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo resolver.'); }
    finally { setOcupado(false); }
  };
  if (!detalle.puedeResolver || pendientes.length === 0) return null;
  return <>
    <Button onClick={() => { operacion.current = crypto.randomUUID(); setLineaId(pendientes[0].id); setCantidad(''); setSeries([]); setMotivo(''); setEvidencia(''); setError(''); setAbierto(true); }}>Resolver diferencia</Button>
    <Dialog open={abierto} onOpenChange={(_, d) => { if (!ocupado) setAbierto(d.open); }}><DialogSurface><DialogBody>
      <DialogTitle>Regularizar material pendiente de recepción</DialogTitle><DialogContent>
        {error && <D365MessageBar intent="error">{error}</D365MessageBar>}
        <D365FormField label="Producto" htmlFor="regularizar-producto"><Select id="regularizar-producto" value={lineaId} onChange={(_, d) => { setLineaId(d.value); setSeries([]); setCantidad(''); }}>{pendientes.map(l => <option key={l.id} value={l.id}>{l.codigoProducto} · {l.productoNombre} · Pendiente: {l.cantidadPendiente}</option>)}</Select></D365FormField>
        <D365FormField label="Resultado" htmlFor="regularizar-resultado"><Select id="regularizar-resultado" value={resultado} onChange={(_, d) => setResultado(d.value)} style={{ width: '100%' }}>
          <option value="2">Ingreso comprobado en destino</option><option value="1">Restituir al origen: material comprobado allí</option>
        </Select></D365FormField>
        {linea?.series.length ? <div>{linea.series.filter(s => !s.recibida && !s.resuelta).map(s => <Checkbox key={s.numeroSerie} label={s.numeroSerie} checked={series.includes(s.numeroSerie)} onChange={(_, d) => setSeries(actual => d.checked ? [...actual, s.numeroSerie] : actual.filter(n => n !== s.numeroSerie))} />)}</div> : <D365FormField label="Cantidad" htmlFor="regularizar-cantidad"><Input id="regularizar-cantidad" type="number" min={0} max={linea?.cantidadPendiente} value={cantidad} onChange={(_, d) => setCantidad(d.value)} style={{ width: '100%' }} /></D365FormField>}
        <D365FormField label="Motivo" required htmlFor="regularizar-motivo" align="top"><Textarea id="regularizar-motivo" value={motivo} maxLength={500} onChange={(_, d) => setMotivo(d.value)} style={{ width: '100%' }} /></D365FormField>
        <D365FormField label="Evidencia" required htmlFor="regularizar-evidencia"><Input id="regularizar-evidencia" value={evidencia} maxLength={500} onChange={(_, d) => setEvidencia(d.value)} style={{ width: '100%' }} /></D365FormField>
      </DialogContent><DialogActions><Button disabled={ocupado} onClick={() => setAbierto(false)}>Cerrar</Button><Button appearance="primary" disabled={ocupado || !motivo.trim() || !evidencia.trim() || (linea?.series.length ? !series.length : !(Number(cantidad) > 0))} onClick={() => void confirmar()}>Confirmar regularización</Button></DialogActions>
    </DialogBody></DialogSurface></Dialog>
  </>;
}
