import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Tab, TabList, Textarea, makeStyles, tokens } from '@fluentui/react-components';
import { Add16Regular, ArrowLeft16Regular, Box16Regular, Delete16Regular, Save16Regular, SaveMultiple16Regular, Table16Regular } from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { AlmacenService } from '../../almacenes/services/almacen.service';
import type { AlmacenDto } from '../../almacenes/types/almacen.types';
import { ProductoService } from '../../productos/services/producto.service';
import type { ProductoDto } from '../../productos/types/producto.types';
import { TransferenciaService } from '../services/transferencia.service';

const useStyles = makeStyles({
  lineas: { display: 'flex', flexDirection: 'column', gap: '8px' },
  linea: { display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 180px 40px', gap: '12px', alignItems: 'end' },
  encabezado: { display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 180px 40px', gap: '12px', color: tokens.colorNeutralForeground3 },
});

type Linea = { clave: string; productoId: string; cantidad: string };
const nuevaLinea = (): Linea => ({ clave: crypto.randomUUID(), productoId: '', cantidad: '' });

export function TransferenciaFormPage() {
  const formStyles = useD365FormStyles(); const styles = useStyles(); const navigate = useNavigate();
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]); const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [origenId, setOrigenId] = useState(''); const [destinoId, setDestinoId] = useState(''); const [observacion, setObservacion] = useState('');
  const [lineas, setLineas] = useState<Linea[]>([nuevaLinea()]); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'general' | 'productos'>('general');
  const [numeroGuardado, setNumeroGuardado] = useState<string | null>(null);
  useEffect(() => { void Promise.all([AlmacenService.getAlmacenes(true), ProductoService.getProductos(undefined, undefined, true)]).then(([a, p]) => { setAlmacenes(a); setProductos(p.filter(x => (x.tipo === 1 || x.tipo === 'Inventario') && !x.esSerializado)); }).catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar los catálogos.')); }, []);
  const productosDisponibles = useMemo(() => productos, [productos]);
  const actualizarLinea = (clave: string, cambio: Partial<Linea>) => setLineas(actuales => actuales.map(x => x.clave === clave ? { ...x, ...cambio } : x));
  const guardar = async (cerrar: boolean) => {
    if (numeroGuardado) { if (cerrar) navigate('/servicio-campo/transferencias'); return; }
    if (!origenId || !destinoId || origenId === destinoId || lineas.some(x => !x.productoId || Number(x.cantidad) <= 0)) { setError('Complete los almacenes y todas las líneas con cantidades mayores a cero.'); return; }
    try { setSaving(true); setError(null); const resultado = await TransferenciaService.crear({ almacenOrigenId: origenId, almacenDestinoId: destinoId, observacion: observacion.trim() || null, lineas: lineas.map(x => ({ productoId: x.productoId, cantidad: Number(x.cantidad) })) }); setNumeroGuardado(resultado.numero); if (cerrar) navigate('/servicio-campo/transferencias', { state: { successMessage: `Transferencia ${resultado.numero} registrada.` } }); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo registrar la transferencia.'); } finally { setSaving(false); }
  };
  const nuevo = () => { setOrigenId(''); setDestinoId(''); setObservacion(''); setLineas([nuevaLinea()]); setNumeroGuardado(null); setSelectedTab('general'); setError(null); };
  return <div className={formStyles.root}>
    {error && <D365MessageBar intent="error" onDismiss={() => setError(null)}>{error}</D365MessageBar>}
    <D365CommandBar ariaLabel="Comandos de transferencia" busy={saving} busyLabel="Guardando..."><div className={formStyles.toolbarLeft}>
      <D365CommandButton icon={<ArrowLeft16Regular />} tone="brand" aria-label="Volver" onClick={() => navigate('/servicio-campo/transferencias')} />
      <D365CommandDivider />
      <D365CommandButton icon={<Save16Regular />} tone="save" onClick={() => void guardar(false)} disabled={saving || Boolean(numeroGuardado)}>Guardar</D365CommandButton>
      <D365CommandButton icon={<SaveMultiple16Regular />} tone="save" onClick={() => void guardar(true)} disabled={saving}>Guardar y cerrar</D365CommandButton>
      <D365CommandDivider />
      <D365CommandButton icon={<Add16Regular />} tone="create" onClick={nuevo} disabled={saving}>Nuevo</D365CommandButton>
    </div></D365CommandBar>
    <D365EntityHeader
      title={numeroGuardado ?? 'Nueva transferencia'}
      subtitle="Transferencia de inventario"
      avatarName={numeroGuardado ?? 'Transferencia'}
      metadata={[{ label: 'Estado', value: numeroGuardado ? 'Registrada' : 'Borrador' }]}
      tabs={<TabList selectedValue={selectedTab} onTabSelect={(_, data) => setSelectedTab(data.value as 'general' | 'productos')}>
        <Tab value="general" icon={<Box16Regular />}>General</Tab>
        <Tab value="productos" icon={<Table16Regular />}>Productos</Tab>
      </TabList>}
    />
    <div className={formStyles.contentBody}>{selectedTab === 'general' ? <div className={formStyles.card}>
      <div className={formStyles.grid2Cols}>
        <D365FormField label="Almacén origen" required><Select className={formStyles.d365ControlFull} value={origenId} disabled={Boolean(numeroGuardado)} onChange={(_, d) => setOrigenId(d.value)}><option value="">---</option>{almacenes.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</Select></D365FormField>
        <D365FormField label="Almacén destino" required><Select className={formStyles.d365ControlFull} value={destinoId} disabled={Boolean(numeroGuardado)} onChange={(_, d) => setDestinoId(d.value)}><option value="">---</option>{almacenes.filter(x => x.id !== origenId).map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</Select></D365FormField>
      </div>
      <D365FormField label="Observación" align="top"><Textarea className={formStyles.d365ControlFull} rows={3} placeholder="---" value={observacion} disabled={Boolean(numeroGuardado)} onChange={(_, d) => setObservacion(d.value)} /></D365FormField>
    </div> : <div className={formStyles.card}>
      <div className={styles.lineas}><div className={styles.encabezado}><span>Producto</span><span>Cantidad</span><span /></div>
        {lineas.map(linea => <div className={styles.linea} key={linea.clave}>
          <Select size="medium" value={linea.productoId} disabled={Boolean(numeroGuardado)} onChange={(_, d) => actualizarLinea(linea.clave, { productoId: d.value })}><option value="">---</option>{productosDisponibles.map(x => <option key={x.id} value={x.id}>{x.codigo} · {x.nombre}</option>)}</Select>
          <Input size="medium" type="number" min={0.00001} step="any" placeholder="---" value={linea.cantidad} disabled={Boolean(numeroGuardado)} onChange={(_, d) => actualizarLinea(linea.clave, { cantidad: d.value })} />
          <Button appearance="subtle" icon={<Delete16Regular />} aria-label="Eliminar línea" disabled={Boolean(numeroGuardado) || lineas.length === 1} onClick={() => setLineas(actuales => actuales.filter(x => x.clave !== linea.clave))} />
        </div>)}
        {!numeroGuardado && <div><Button appearance="subtle" icon={<Add16Regular />} onClick={() => setLineas(actuales => [...actuales, nuevaLinea()])}>Agregar producto</Button></div>}
      </div>
    </div>}</div>
  </div>;
}
