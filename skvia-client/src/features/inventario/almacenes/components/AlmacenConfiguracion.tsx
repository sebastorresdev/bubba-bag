import { useEffect, useState } from 'react';
import { Button, Checkbox, Input, Select, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@fluentui/react-components';
import { AlmacenService } from '../services/almacen.service';
import type { UbicacionInventarioDto } from '../types/almacen.types';
import { apiClient } from '../../../../services/apiClient';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365FormField } from '../../../../components/common/D365FormField';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';

type Permisos = { usuarioId: string; puedeConsultar: boolean; puedeDespachar: boolean; puedeRecepcionar: boolean; esSupervisor: boolean; activo: boolean };
type Usuario = { id: string; nombreCompleto: string; email: string; esActivo: boolean };
const inicial: Permisos = { usuarioId: '', puedeConsultar: true, puedeDespachar: false, puedeRecepcionar: false, esSupervisor: false, activo: true };

export function AlmacenConfiguracion({ almacenId, puedeSupervisar }: { almacenId: string; puedeSupervisar: boolean }) {
  const user = useCurrentUser();
  const administra = user.isAuthenticated && user.roles.some(r => ['SuperAdmin', 'ServicioCampoAdmin', 'InventarioAdmin'].includes(r));
  const [ubicaciones, setUbicaciones] = useState<UbicacionInventarioDto[]>([]);
  const [permisos, setPermisos] = useState<Permisos[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [edicion, setEdicion] = useState<Permisos>(inicial);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const u = await AlmacenService.getUbicaciones(almacenId);
        if (vigente) setUbicaciones(u);
        if (puedeSupervisar || administra) {
          const a = await AlmacenService.getAutorizaciones(almacenId);
          if (vigente) setPermisos(a);
        }
        if (administra) {
          const cuentas = await apiClient<Usuario[]>('/api/inventario/almacenes/usuarios-autorizables');
          if (vigente) setUsuarios(cuentas);
        }
      } catch (e) { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo cargar la configuración.'); }
    };
    void cargar();
    return () => { vigente = false; };
  }, [almacenId, puedeSupervisar, administra]);
  const ejecutar = async (accion: () => Promise<unknown>) => {
    setOcupado(true); setError('');
    try { await accion(); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar.'); }
    finally { setOcupado(false); }
  };
  return <div>
    {error && <D365MessageBar intent="error">{error}</D365MessageBar>}
    <h3>Ubicaciones del almacén</h3>
    <Table aria-label="Ubicaciones"><TableHeader><TableRow><TableHeaderCell>Código</TableHeaderCell><TableHeaderCell>Nombre</TableHeaderCell><TableHeaderCell>Principal</TableHeaderCell></TableRow></TableHeader><TableBody>
      {ubicaciones.map(u => <TableRow key={u.id}><TableCell>{u.codigo}</TableCell><TableCell>{u.nombre}</TableCell><TableCell>{u.esPrincipal ? 'Sí' : 'No'}</TableCell></TableRow>)}
    </TableBody></Table>
    {puedeSupervisar && <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
      <D365FormField label="Código" htmlFor="ubicacion-codigo"><Input id="ubicacion-codigo" value={codigo} maxLength={50} onChange={(_, d) => setCodigo(d.value)} /></D365FormField>
      <D365FormField label="Nombre" htmlFor="ubicacion-nombre"><Input id="ubicacion-nombre" value={nombre} maxLength={150} onChange={(_, d) => setNombre(d.value)} /></D365FormField>
      <Button disabled={ocupado || !codigo.trim() || !nombre.trim()} onClick={() => void ejecutar(async () => { await AlmacenService.crearUbicacion(almacenId, codigo, nombre); setUbicaciones(await AlmacenService.getUbicaciones(almacenId)); setCodigo(''); setNombre(''); })}>Crear ubicación</Button>
    </div>}
    {(puedeSupervisar || administra) && <>
      <h3>Usuarios autorizados</h3>
      <Table aria-label="Autorizaciones"><TableHeader><TableRow><TableHeaderCell>Usuario</TableHeaderCell><TableHeaderCell>Consulta</TableHeaderCell><TableHeaderCell>Despacho</TableHeaderCell><TableHeaderCell>Recepción</TableHeaderCell><TableHeaderCell>Supervisor</TableHeaderCell><TableHeaderCell>Activo</TableHeaderCell></TableRow></TableHeader><TableBody>
        {permisos.map(p => <TableRow key={p.usuarioId} onClick={() => administra && setEdicion(p)}><TableCell>{usuarios.find(u => u.id === p.usuarioId)?.nombreCompleto ?? p.usuarioId}</TableCell><TableCell>{p.puedeConsultar ? 'Sí' : 'No'}</TableCell><TableCell>{p.puedeDespachar ? 'Sí' : 'No'}</TableCell><TableCell>{p.puedeRecepcionar ? 'Sí' : 'No'}</TableCell><TableCell>{p.esSupervisor ? 'Sí' : 'No'}</TableCell><TableCell>{p.activo ? 'Sí' : 'No'}</TableCell></TableRow>)}
      </TableBody></Table>
      {administra && <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Select aria-label="Usuario a autorizar" value={edicion.usuarioId} onChange={(_, d) => setEdicion(permisos.find(p => p.usuarioId === d.value) ?? { ...inicial, usuarioId: d.value })}>
          <option value="">Seleccione un usuario</option>{usuarios.map(u => <option value={u.id} key={u.id}>{u.nombreCompleto} ({u.email})</option>)}
        </Select>
        {(['puedeConsultar', 'puedeDespachar', 'puedeRecepcionar', 'esSupervisor', 'activo'] as const).map((campo, i) => <Checkbox key={campo} label={['Consultar', 'Despachar', 'Recepcionar', 'Supervisor', 'Activo'][i]} checked={edicion[campo]} onChange={(_, d) => setEdicion(p => ({ ...p, [campo]: Boolean(d.checked) }))} />)}
        <Button disabled={ocupado || !edicion.usuarioId} onClick={() => void ejecutar(async () => { await AlmacenService.guardarAutorizacion(almacenId, edicion.usuarioId, edicion); setPermisos(await AlmacenService.getAutorizaciones(almacenId)); })}>Guardar permisos</Button>
      </div>}
    </>}
  </div>;
}
