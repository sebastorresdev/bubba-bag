import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Input, Link, Select, createTableColumn } from '@fluentui/react-components';
import { Add16Regular, ArrowClockwise16Regular, ArrowUpload16Regular } from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../components/common/D365CommandBar';
import { D365EntityTable } from '../../components/common/D365EntityTable';
import { ImportacionDrawer } from '../../components/common/ImportacionDrawer';
import { useD365ListStyles } from '../../styles/d365ListStyles';
import { useAuthSession } from '../../services/authSession';
import { SeguridadService, type UsuarioDto } from './seguridad.service';

export function UsuariosListPage() {
  const styles = useD365ListStyles(), navigate = useNavigate();
  const { permisos } = useAuthSession(), canEdit = permisos.includes('seguridad.usuarios.gestionar');
  const [items, setItems] = useState<UsuarioDto[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(''), [estado, setEstado] = useState('todos'), [importOpen, setImportOpen] = useState(false);
  const load = async () => { setLoading(true); setError(null); try { setItems(await SeguridadService.usuarios()); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar usuarios.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const filtered = items.filter(x => (estado === 'todos' || x.esActivo === (estado === 'activos')) && `${x.nombreCompleto} ${x.email} ${x.roles.join(' ')}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const columns = useMemo(() => [
    createTableColumn<UsuarioDto>({ columnId: 'nombre', compare: (a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto), renderHeaderCell: () => 'Nombre', renderCell: x => <Link as="button" onClick={() => navigate(`/configuracion/usuarios/${x.id}`)}>{x.nombreCompleto}</Link> }),
    createTableColumn<UsuarioDto>({ columnId: 'email', compare: (a, b) => a.email.localeCompare(b.email), renderHeaderCell: () => 'Correo electrónico', renderCell: x => x.email }),
    createTableColumn<UsuarioDto>({ columnId: 'roles', renderHeaderCell: () => 'Roles', renderCell: x => x.roles.join(', ') || 'Sin roles' }),
    createTableColumn<UsuarioDto>({ columnId: 'estado', renderHeaderCell: () => 'Estado', renderCell: x => <Badge appearance="tint" color={x.esActivo ? 'success' : 'subtle'}>{x.esActivo ? 'Activo' : 'Inactivo'}</Badge> }),
  ], [navigate]);
  return <div className={styles.root}>
    <D365CommandBar ariaLabel="Acciones de seguridad"><div className={styles.toolbarLeft}>
      {canEdit && <><D365CommandButton tone="create" icon={<Add16Regular />} onClick={() => navigate('/configuracion/usuarios/nuevo')}>Nuevo</D365CommandButton>
        <D365CommandButton icon={<ArrowUpload16Regular />} onClick={() => setImportOpen(true)}>Importar usuarios</D365CommandButton></>}
      <D365CommandButton icon={<ArrowClockwise16Regular />} disabled={loading} onClick={() => void load()}>Actualizar</D365CommandButton>
    </div></D365CommandBar>
    <div className={styles.viewHeader}><strong>Usuarios</strong><div className={styles.viewToolsRight}>
      <Select aria-label="Estado de usuarios" value={estado} onChange={(_, d) => setEstado(d.value)}><option value="todos">Todos</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option></Select>
      <Input aria-label="Buscar usuarios" placeholder="Buscar" value={search} onChange={(_, d) => setSearch(d.value)} />
    </div></div>
    <D365EntityTable items={filtered} columns={columns} loading={loading} error={error} onRetry={() => void load()} />
    <div className={styles.footer}>{filtered.length} usuarios</div>
    <ImportacionDrawer open={importOpen} onOpenChange={setImportOpen} targetEntityName="Usuario" onSuccess={() => { setImportOpen(false); void load(); }} />
  </div>;
}
