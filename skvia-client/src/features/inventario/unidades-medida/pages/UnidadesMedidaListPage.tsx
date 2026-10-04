import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell,
  DataGridRow, Input, Link, TableCellLayout, Text, createTableColumn,
} from '@fluentui/react-components';
import type { TableColumnDefinition, TableRowId } from '@fluentui/react-components';
import { Add16Regular, ArrowClockwise16Regular, Search16Regular } from '@fluentui/react-icons';
import { GrupoUnidadMedidaService } from '../services/unidadMedida.service';
import type { GrupoUnidadMedidaDto } from '../types/unidadMedida.types';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import { D365ListState } from '../../../../components/common/D365ListState';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { CrearGrupoModal } from '../components/CrearGrupoModal';

export interface UnidadesMedidaListPageProps {
  onNew?: () => void;
  onSelect?: (item: GrupoUnidadMedidaDto) => void;
}

export const UnidadesMedidaListPage: React.FC<UnidadesMedidaListPageProps> = ({ onSelect }) => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const [items, setItems] = useState<GrupoUnidadMedidaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<TableRowId>>(new Set());
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

  const columns: TableColumnDefinition<GrupoUnidadMedidaDto>[] = [
    createTableColumn({
      columnId: 'grupo', renderHeaderCell: () => 'Grupo de unidades',
      renderCell: (g) => <TableCellLayout><Link as="button" onClick={(event) => {
        event.stopPropagation();
        open(g);
      }}>{g.nombre}</Link></TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'base', renderHeaderCell: () => 'Unidad base',
      renderCell: (g) => {
        const base = g.unidades.find((u) => u.esUnidadBase);
        return <TableCellLayout>{base?.nombre || 'Sin unidad base'}</TableCellLayout>;
      },
    }),
    createTableColumn({
      columnId: 'unidades', renderHeaderCell: () => 'Unidades',
      renderCell: (g) => <TableCellLayout>{g.unidades.length}</TableCellLayout>,
    }),
    createTableColumn({
      columnId: 'estado', renderHeaderCell: () => 'Estado',
      renderCell: (g) => <TableCellLayout><Text>{g.estaActivo ? 'Activo' : 'Inactivo'}</Text></TableCellLayout>,
    }),
  ];

  return <div className={styles.root}>
    <D365CommandBar ariaLabel="Comandos de grupos de unidades">
      <div className={styles.toolbarLeft}>
        <D365CommandButton icon={<Add16Regular />} tone="create" onClick={() => setCreateOpen(true)}>Nuevo grupo de unidades</D365CommandButton>
        <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={loadData}>Actualizar</D365CommandButton>
      </div>
    </D365CommandBar>
    <div className={styles.viewHeader}>
      <Text weight="semibold" size={400}>Grupos y unidades de medida</Text>
      <div className={styles.viewToolsRight}>
        <Input className={styles.searchBox} contentBefore={<Search16Regular />} value={search}
          placeholder="Buscar" aria-label="Buscar grupo o unidad" onChange={(_, d) => setSearch(d.value)} />
      </div>
    </div>
    <div className={styles.gridWrapper}>
      <D365ListState loading={loading} error={error} onRetry={loadData} loadingLabel="Cargando grupos...">
        <DataGrid
          items={filtered}
          columns={columns}
          selectionMode="multiselect"
          selectedItems={selectedIds}
          onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
          getRowId={(g) => g.id}
          focusMode="composite"
          size="medium"
          className={styles.table}
        >
          <DataGridHeader><DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow></DataGridHeader>
          {filtered.length === 0 ? <TableEmptyState /> : <DataGridBody<GrupoUnidadMedidaDto>>
            {({ item, rowId }) => <DataGridRow key={rowId} className={styles.dataRow} onDoubleClick={() => open(item)}>
              {({ renderCell }) => <DataGridCell className={styles.dataCell}>{renderCell(item)}</DataGridCell>}
            </DataGridRow>}
          </DataGridBody>}
        </DataGrid>
      </D365ListState>
    </div>
    <CrearGrupoModal
      abierto={createOpen}
      alCerrar={() => setCreateOpen(false)}
      alCrear={(id) => {
        setCreateOpen(false);
        navigate(`/grupos-unidades/${id}`);
      }}
    />
  </div>;
};

export default UnidadesMedidaListPage;
