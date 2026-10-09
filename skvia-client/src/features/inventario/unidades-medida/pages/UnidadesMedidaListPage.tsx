import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link, TableCellLayout, Text, createTableColumn,
} from '@fluentui/react-components';
import type { TableColumnDefinition, SelectionItemId } from '@fluentui/react-components';
import { Add16Regular, ArrowClockwise16Regular } from '@fluentui/react-icons';
import { GrupoUnidadMedidaService } from '../services/unidadMedida.service';
import type { GrupoUnidadMedidaDto } from '../types/unidadMedida.types';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
} from '../../../../components/common/D365EntityTable';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { CrearGrupoModal } from '../components/CrearGrupoModal';

export interface UnidadesMedidaListPageProps {
  onNew?: () => void;
  onSelect?: (item: GrupoUnidadMedidaDto) => void;
}

export const UnidadesMedidaListPage: React.FC<UnidadesMedidaListPageProps> = ({ onSelect }) => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const tableRef = useRef<D365EntityTableRef>(null);
  const [items, setItems] = useState<GrupoUnidadMedidaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await GrupoUnidadMedidaService.getGrupos());
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar los grupos de unidades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((g) =>
      g.nombre.toLowerCase().includes(q) ||
      g.unidades.some((u) => u.nombre.toLowerCase().includes(q)));
  }, [items, search]);

  const open = (item: GrupoUnidadMedidaDto) => {
    if (onSelect) onSelect(item);
    else navigate(`/grupos-unidades/${item.id}`);
  };

  const columns: TableColumnDefinition<GrupoUnidadMedidaDto>[] = useMemo(
    () => [
      createTableColumn({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Grupo de unidades',
        renderCell: (g) => (
          <TableCellLayout>
            <Link
              as="button"
              onClick={(event) => {
                event.stopPropagation();
                open(g);
              }}
            >
              {g.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn({
        columnId: 'base',
        compare: (a, b) => {
          const aBase = a.unidades.find((u) => u.esUnidadBase)?.nombre || '';
          const bBase = b.unidades.find((u) => u.esUnidadBase)?.nombre || '';
          return aBase.localeCompare(bBase);
        },
        renderHeaderCell: () => 'Unidad base',
        renderCell: (g) => {
          const base = g.unidades.find((u) => u.esUnidadBase);
          return <TableCellLayout>{base?.nombre || 'Sin unidad base'}</TableCellLayout>;
        },
      }),
      createTableColumn({
        columnId: 'unidades',
        compare: (a, b) => a.unidades.length - b.unidades.length,
        renderHeaderCell: () => 'Unidades',
        renderCell: (g) => <TableCellLayout>{g.unidades.length}</TableCellLayout>,
      }),
      createTableColumn({
        columnId: 'estado',
        compare: (a, b) => Number(a.estaActivo) - Number(b.estaActivo),
        renderHeaderCell: () => 'Estado',
        renderCell: (g) => (
          <TableCellLayout>
            <D365StatusBadge status={g.estaActivo} />
          </TableCellLayout>
        ),
      }),
    ],
    []
  );

  return (
    <div className={styles.root}>
      <D365CommandBar ariaLabel="Comandos de grupos de unidades">
        <div className={styles.toolbarLeft}>
          <D365CommandButton icon={<Add16Regular />} tone="create" onClick={() => setCreateOpen(true)}>
            Nuevo grupo de unidades
          </D365CommandButton>
          <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void loadData()}>
            Actualizar
          </D365CommandButton>
        </div>
      </D365CommandBar>
      <div className={styles.viewHeader}>
        <Text weight="semibold" size={400}>Grupos y unidades de medida</Text>
        <div className={styles.viewToolsRight}>
          <D365TableToolbarTools
            tableRef={tableRef}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar"
            searchAriaLabel="Buscar grupo o unidad"
          />
        </div>
      </div>
      <D365EntityTable
        ref={tableRef}
        entityName="Unidades de Medida"
        tableId="unidades-medida"
        items={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={() => void loadData()}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
      />
      <footer className={styles.footer}>
        <div>
          1-{filtered.length} de {filtered.length}
          {selectedIds.size > 0 && ` (${selectedIds.size} seleccionados)`}
        </div>
        <div>Página 1</div>
      </footer>
      <CrearGrupoModal
        abierto={createOpen}
        alCerrar={() => setCreateOpen(false)}
        alCrear={(id) => {
          setCreateOpen(false);
          navigate(`/grupos-unidades/${id}`);
        }}
      />
    </div>
  );
};

export default UnidadesMedidaListPage;
