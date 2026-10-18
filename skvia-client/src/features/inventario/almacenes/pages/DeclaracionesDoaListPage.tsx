import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TableCellLayout,
  createTableColumn,
  Badge,
  Text,
  type TableColumnDefinition,
  type SelectionItemId,
} from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  Warning16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { AlmacenService } from '../services/almacen.service';
import type { ReclasificacionDoaDto } from '../types/almacen.types';
import { exportToExcel, type ExportColumn } from '../../../../utils/exportUtils';

export const DeclaracionesDoaListPage: React.FC = () => {
  const navigate = useNavigate();
  const listStyles = useD365ListStyles();
  const tableRef = useRef<D365EntityTableRef>(null);

  const [items, setItems] = useState<ReclasificacionDoaDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

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
      { id: 'numeroSerie', label: 'Número de Serie', type: 'string' },
      { id: 'productoNombre', label: 'Producto / Modelo', type: 'string' },
      { id: 'almacenNombre', label: 'Almacén', type: 'string' },
      { id: 'observaciones', label: 'Motivo / Detalle', type: 'string' },
    ],
    []
  );

  const columnasExportacion: ExportColumn<ReclasificacionDoaDto>[] = useMemo(
    () => [
      {
        header: 'Fecha',
        accessor: (d) =>
          d.fecha ? new Date(d.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—',
      },
      { header: 'Número de Serie', accessor: (d) => d.numeroSerie },
      { header: 'SmartCard / MAC', accessor: (d) => d.numeroSmartCard || '—' },
      { header: 'Producto', accessor: (d) => d.productoNombre },
      { header: 'Almacén', accessor: (d) => d.almacenNombre },
      { header: 'Ubicación Origen', accessor: (d) => d.ubicacionOrigenNombre },
      { header: 'Ubicación Destino', accessor: (d) => d.ubicacionDestinoNombre },
      { header: 'Observaciones / Motivo', accessor: (d) => d.observaciones || '—' },
      { header: 'Condición', accessor: (d) => d.condicion },
    ],
    []
  );

  const handleExportar = useCallback(() => {
    exportToExcel(items, columnasExportacion, 'Declaraciones_DOA');
  }, [items, columnasExportacion]);

  // Filtrado rápido por texto
  const itemsFiltrados = useMemo(() => {
    if (!buscar.trim()) return items;
    const term = buscar.trim().toLowerCase();
    return items.filter(
      (i) =>
        i.numeroSerie?.toLowerCase().includes(term) ||
        i.productoNombre?.toLowerCase().includes(term) ||
        i.almacenNombre?.toLowerCase().includes(term) ||
        i.observaciones?.toLowerCase().includes(term) ||
        i.numeroSmartCard?.toLowerCase().includes(term)
    );
  }, [items, buscar]);

  const columns: TableColumnDefinition<ReclasificacionDoaDto>[] = useMemo(
    () => [
      createTableColumn<ReclasificacionDoaDto>({
        columnId: 'fecha',
        compare: (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
        renderHeaderCell: () => 'Fecha / Hora',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200} style={{ color: '#605e5c' }}>
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
      createTableColumn<ReclasificacionDoaDto>({
        columnId: 'numeroSerie',
        compare: (a, b) => a.numeroSerie.localeCompare(b.numeroSerie),
        renderHeaderCell: () => 'Número de Serie',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text weight="semibold" style={{ fontFamily: 'Consolas, monospace' }}>
              {item.numeroSerie}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ReclasificacionDoaDto>({
        columnId: 'productoNombre',
        compare: (a, b) => a.productoNombre.localeCompare(b.productoNombre),
        renderHeaderCell: () => 'Producto / Modelo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.productoNombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ReclasificacionDoaDto>({
        columnId: 'almacenNombre',
        compare: (a, b) => a.almacenNombre.localeCompare(b.almacenNombre),
        renderHeaderCell: () => 'Almacén Base',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.almacenNombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ReclasificacionDoaDto>({
        columnId: 'ubicacionDestinoNombre',
        renderHeaderCell: () => 'Ubicación Destino',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Badge appearance="tint" color="danger">
              {item.ubicacionDestinoNombre || 'Devolución'}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ReclasificacionDoaDto>({
        columnId: 'observaciones',
        renderHeaderCell: () => 'Motivo / Detalle Falla',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200} title={item.observaciones || ''}>
              {item.observaciones || 'Defecto de fábrica (DOA)'}
            </Text>
          </TableCellLayout>
        ),
      }),
    ],
    []
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
            Nueva Declaración DOA
          </D365CommandButton>

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

      {/* 2. Header de Vista */}
      <div className={listStyles.viewHeader}>
        <div className={listStyles.viewSelectorTab} title="Declaraciones DOA / Reclasificación de Equipos">
          <Warning16Regular style={{ color: '#d83b01', marginRight: 6 }} />
          <Text weight="semibold" size={400}>
            Declaraciones DOA / Reclasificación de Equipos
          </Text>
        </div>

        <div className={listStyles.viewToolsRight}>
          <D365TableToolbarTools
            tableRef={tableRef}
            searchValue={buscar}
            onSearchChange={setBuscar}
            searchPlaceholder="Buscar serie, modelo, almacén..."
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
