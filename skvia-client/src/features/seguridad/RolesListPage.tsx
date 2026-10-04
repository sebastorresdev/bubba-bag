import { useEffect, useMemo, useState } from 'react';
import { Link, Input, createTableColumn } from '@fluentui/react-components';
import { ArrowClockwise16Regular } from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../components/common/D365CommandBar';
import { D365EntityTable } from '../../components/common/D365EntityTable';
import { useD365ListStyles } from '../../styles/d365ListStyles';
import { SeguridadService, type RolDto } from './seguridad.service';
import { PermisosDrawer } from './PermisosDrawer';

export function RolesListPage() {
  const styles = useD365ListStyles();
  const [items, setItems] = useState<RolDto[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(''), [selected, setSelected] = useState<RolDto | null>(null);
  const load = async () => { setLoading(true); setError(null); try { setItems(await SeguridadService.roles()); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar roles.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const columns = useMemo(() => [
    createTableColumn<RolDto>({ columnId: 'nombre', renderHeaderCell: () => 'Rol', renderCell: x => <Link as="button" onClick={() => setSelected(x)}>{x.nombreVisible}</Link> }),
    createTableColumn<RolDto>({ columnId: 'codigo', renderHeaderCell: () => 'Código para importación', renderCell: x => x.codigo }),
    createTableColumn<RolDto>({ columnId: 'modulo', compare: (a, b) => a.modulo.localeCompare(b.modulo), renderHeaderCell: () => 'Módulo', renderCell: x => x.modulo }),
    createTableColumn<RolDto>({ columnId: 'descripcion', renderHeaderCell: () => 'Alcance', renderCell: x => x.descripcion }),
    createTableColumn<RolDto>({ columnId: 'permisos', renderHeaderCell: () => 'Permisos', renderCell: x => x.permisos.length }),
  ], []);
  return <div className={styles.root}>
    <D365CommandBar ariaLabel="Acciones de seguridad"><D365CommandButton icon={<ArrowClockwise16Regular />} disabled={loading} onClick={() => void load()}>Actualizar</D365CommandButton></D365CommandBar>
    <div className={styles.viewHeader}><strong>Roles y permisos del sistema</strong><Input aria-label="Buscar roles" placeholder="Buscar" value={search} onChange={(_, d) => setSearch(d.value)} /></div>
    <D365EntityTable items={items.filter(x => `${x.nombreVisible} ${x.modulo}`.toLowerCase().includes(search.toLowerCase()))} columns={columns} loading={loading} error={error} onRetry={() => void load()} />
    <PermisosDrawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.modulo} · ${selected.nombreVisible}` : 'Permisos'} permisos={selected?.permisos ?? []} />
  </div>;
}
