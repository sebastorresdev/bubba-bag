import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TableCellLayout,
  createTableColumn,
  Text,
  Link,
  tokens,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  type TableColumnDefinition,
  type SelectionItemId,
} from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  ChevronDown16Regular,
  Checkmark16Regular,
  Eye16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { AlmacenService } from '../services/almacen.service';
import type { DocumentoDoaDto } from '../types/almacen.types';
import { exportToExcel, type ExportColumn } from '../../../../utils/exportUtils';

export const DeclaracionesDoaListPage: React.FC = () => {
  const navigate = useNavigate();
  const listStyles = useD365ListStyles();
  const tableRef = useRef<D365EntityTableRef>(null);

  const [items, setItems] = useState<DocumentoDoaDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());
  const [vista, setVista] = useState<'todas' | 'recientes'>('todas');

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AlmacenService.obtenerReclasificacionesDoa();
      setItems(data || []);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar el historial de declaraciones DOA.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const filterFields: D365FilterField[] = useMemo(
    () => [
      { id: 'numero', label: 'N° Documento', type: 'string' },
      { id: 'almacenNombre', label: 'Almacén Base', type: 'string' },
      { id: 'ubicacionDestinoNombre', label: 'Ubicación Destino', type: 'string' },
      { id: 'observaciones', label: 'Observaciones', type: 'string' },
    ],
    []
  );

  const columnasExportacion: ExportColumn<DocumentoDoaDto>[] = useMemo(
    () => [
      { header: 'N° Documento', accessor: (d) => d.numero },
      {
        header: 'Fecha',
        accessor: (d) =>
          d.fecha ? new Date(d.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—',
      },
      { header: 'Almacén Base', accessor: (d) => d.almacenNombre },
      { header: 'Ubicación Origen', accessor: (d) => d.ubicacionOrigenNombre },
      { header: 'Ubicación Destino', accessor: (d) => d.ubicacionDestinoNombre },
      { header: 'Total Equipos', accessor: (d) => d.totalEquipos },
      { header: 'Estado', accessor: (d) => d.estado },
      { header: 'Responsable', accessor: (d) => d.usuarioNombre || 'Almacenero' },
      { header: 'Observaciones', accessor: (d) => d.observaciones || '—' },
    ],
    []
  );

  const handleExportar = useCallback(() => {
    exportToExcel(items, columnasExportacion, 'Declaraciones_DOA');
  }, [items, columnasExportacion]);

  // Filtrado rápido por texto y vista seleccionada
  const itemsFiltrados = useMemo(() => {
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);
    const term = buscar.trim().toLowerCase();

    return items.filter((i) => {
      if (vista === 'recientes' && i.fecha && new Date(i.fecha) < limite) {
        return false;
      }
      if (!term) return true;
      return (
        i.numero?.toLowerCase().includes(term) ||
        i.almacenNombre?.toLowerCase().includes(term) ||
        i.ubicacionDestinoNombre?.toLowerCase().includes(term) ||
        i.observaciones?.toLowerCase().includes(term) ||
        i.items?.some(it => it.numeroSerie?.toLowerCase().includes(term) || it.productoNombre?.toLowerCase().includes(term))
      );
    });
  }, [items, buscar, vista]);

  const columns: TableColumnDefinition<DocumentoDoaDto>[] = useMemo(
    () => [
      createTableColumn<DocumentoDoaDto>({
        columnId: 'numero',
        compare: (a, b) => a.numero.localeCompare(b.numero),
        renderHeaderCell: () => 'N° Documento',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/servicio-campo/declaracion-doa/${item.id}`);
              }}
            >
              {item.numero}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DocumentoDoaDto>({
        columnId: 'fecha',
        compare: (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
        renderHeaderCell: () => 'Fecha / Hora',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
              {item.fecha
                ? new Date(item.fecha).toLocaleString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DocumentoDoaDto>({
        columnId: 'almacenNombre',
        compare: (a, b) => a.almacenNombre.localeCompare(b.almacenNombre),
        renderHeaderCell: () => 'Almacén Base',
        renderCell: (item) => (
          <TableCellLayout truncate>
            {item.almacenId ? (
              <Link
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/servicio-campo/almacenes/${item.almacenId}`);
                }}
              >
                {item.almacenNombre}
              </Link>
            ) : (
              <Text weight="medium">{item.almacenNombre}</Text>
            )}
          </TableCellLayout>
        ),
      }),
      createTableColumn<DocumentoDoaDto>({
        columnId: 'ubicacionDestinoNombre',
        renderHeaderCell: () => 'Ubicación Destino',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200}>{item.ubicacionDestinoNombre || 'Devolución'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DocumentoDoaDto>({
        columnId: 'totalEquipos',
        compare: (a, b) => a.totalEquipos - b.totalEquipos,
        renderHeaderCell: () => 'Equipos Reclasificados',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200} weight="semibold">{item.totalEquipos} equipo(s)</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DocumentoDoaDto>({
        columnId: 'estado',
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <D365StatusBadge status={item.estado || 'Reclasificado'} />
          </TableCellLayout>
        ),
      }),
    ],
    [navigate]
  );

  return (
    <div className={listStyles.root}>
      {/* 1. Command Bar */}
      <D365CommandBar ariaLabel="Comandos de Declaración DOA">
        <div className={listStyles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/declaracion-doa/nuevo')}
          >
            Nuevo
          </D365CommandButton>

          {selectedIds.size === 1 && (
            <D365CommandButton
              icon={<Eye16Regular />}
              onClick={() => {
                const selId = Array.from(selectedIds)[0];
                navigate(`/servicio-campo/declaracion-doa/${selId}`);
              }}
            >
              Ver Detalle
            </D365CommandButton>
          )}

          <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={() => void cargarDatos()}>
            Actualizar
          </D365CommandButton>

          <D365CommandButton
            icon={<ArrowDownload16Regular />}
            onClick={handleExportar}
            disabled={items.length === 0}
          >
            Exportar a Excel
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. Header de Vista (Selector de Vista D365) */}
      <div className={listStyles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={listStyles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {vista === 'recientes'
                  ? 'Declaraciones Recientes (Últimos 30 días)'
                  : 'Todas las Declaraciones DOA'}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={listStyles.viewMenuPopover}>
              <MenuItem
                icon={vista === 'todas' ? <Checkmark16Regular /> : undefined}
                onClick={() => setVista('todas')}
              >
                Todas las Declaraciones DOA
              </MenuItem>
              <MenuItem
                icon={vista === 'recientes' ? <Checkmark16Regular /> : undefined}
                onClick={() => setVista('recientes')}
              >
                Declaraciones Recientes (Últimos 30 días)
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        <div className={listStyles.viewToolsRight}>
          <D365TableToolbarTools
            tableRef={tableRef}
            searchValue={buscar}
            onSearchChange={setBuscar}
            searchPlaceholder="Buscar documento, almacén, serie..."
          />
        </div>
      </div>

      {/* 3. Tabla D365EntityTable */}
      <D365EntityTable
        ref={tableRef}
        entityName="DeclaracionesDoa"
        tableId="declaraciones-doa-grid"
        items={itemsFiltrados}
        columns={columns}
        filterFields={filterFields}
        loading={loading}
        error={error}
        onRetry={cargarDatos}
        onRowDoubleClick={(item) => navigate(`/servicio-campo/declaracion-doa/${item.id}`)}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
      />

      {/* 4. Footer */}
      <footer className={listStyles.footer}>
        <div>1-{itemsFiltrados.length} de {itemsFiltrados.length} ({selectedIds.size} seleccionados)</div>
        <div>Página 1</div>
      </footer>
    </div>
  );
};
