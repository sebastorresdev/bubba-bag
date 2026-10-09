import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link,
  TableCellLayout,
  Text,
  createTableColumn,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  tokens,
  type TableColumnDefinition,
  type SelectionItemId,
} from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  ChevronDown16Regular,
  Checkmark16Regular,
  DocumentTable20Regular,
  DocumentText20Regular,
  ClipboardTask20Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { OrdenTrabajoService } from '../services/ordenTrabajo.service';
import type { OrdenTrabajoListadoItemDto } from '../types/ordenTrabajo.types';
import { exportToExcel, exportToCSV, type ExportColumn } from '../../../../utils/exportUtils';

type VistaOrdenes =
  | 'todas'
  | 'programadas'
  | 'pendientes'
  | 'en_progreso'
  | 'completadas'
  | 'borrador';

const nombresVistaOrdenes: Record<VistaOrdenes, string> = {
  todas: 'Todas las órdenes de trabajo',
  programadas: 'Órdenes programadas (Scheduled)',
  pendientes: 'Pendientes de programar (Unscheduled)',
  en_progreso: 'Órdenes en curso (In Progress)',
  completadas: 'Órdenes completadas (Completed)',
  borrador: 'Borradores (Draft)',
};

const filterFields: D365FilterField[] = [
  { id: 'codigoWo', label: 'Código WO', type: 'string' },
  { id: 'clienteFacturacionNombre', label: 'Cliente Facturación', type: 'string' },
  { id: 'clienteServicioNombre', label: 'Abonado / Contacto', type: 'string' },
  { id: 'tipoOrdenNombre', label: 'Tipo de Orden', type: 'string' },
  { id: 'zonaOperativaNombre', label: 'Zona / Territorio', type: 'string' },
  { id: 'recursoTecnicoNombre', label: 'Técnico Asignado', type: 'string' },
  {
    id: 'estadoSistema',
    label: 'Estado del Sistema',
    type: 'string',
    options: [
      { value: 'Borrador', label: 'Borrador' },
      { value: 'PendienteProgramar', label: 'Sin Programar' },
      { value: 'Programado', label: 'Programado' },
      { value: 'EnProgreso', label: 'En Progreso' },
      { value: 'Completado', label: 'Completado' },
      { value: 'Cancelado', label: 'Cancelado' },
    ],
  },
];

export const OrdenesTrabajoListPage: React.FC = () => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const tableRef = useRef<D365EntityTableRef>(null);

  const [ordenes, setOrdenes] = useState<OrdenTrabajoListadoItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeView, setActiveView] = useState<VistaOrdenes>('todas');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let estadoSistemaParam: string | undefined;
      if (activeView === 'programadas') estadoSistemaParam = 'Programado';
      else if (activeView === 'pendientes') estadoSistemaParam = 'PendienteProgramar';
      else if (activeView === 'en_progreso') estadoSistemaParam = 'EnProgreso';
      else if (activeView === 'completadas') estadoSistemaParam = 'Completado';
      else if (activeView === 'borrador') estadoSistemaParam = 'Borrador';

      const data = await OrdenTrabajoService.obtenerOrdenes({
        search: searchKeyword.trim() || undefined,
        estadoSistema: estadoSistemaParam,
      });
      setOrdenes(data);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar la lista de órdenes de trabajo.');
    } finally {
      setLoading(false);
    }
  }, [activeView, searchKeyword]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filteredOrdenes = useMemo(() => {
    let result = [...ordenes];
    if (activeView === 'programadas') {
      result = result.filter((x) => x.estadoSistema === 'Programado');
    } else if (activeView === 'pendientes') {
      result = result.filter((x) => x.estadoSistema === 'PendienteProgramar');
    } else if (activeView === 'en_progreso') {
      result = result.filter((x) => x.estadoSistema === 'EnProgreso');
    } else if (activeView === 'completadas') {
      result = result.filter((x) => x.estadoSistema === 'Completado');
    } else if (activeView === 'borrador') {
      result = result.filter((x) => x.estadoSistema === 'Borrador');
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (o) =>
          o.codigoWo.toLowerCase().includes(q) ||
          o.clienteFacturacionNombre.toLowerCase().includes(q) ||
          o.clienteServicioNombre.toLowerCase().includes(q) ||
          o.tipoOrdenNombre.toLowerCase().includes(q) ||
          (o.zonaOperativaNombre && o.zonaOperativaNombre.toLowerCase().includes(q)) ||
          (o.recursoTecnicoNombre && o.recursoTecnicoNombre.toLowerCase().includes(q))
      );
    }

    return result;
  }, [ordenes, activeView, searchKeyword]);

  const handleExportarExcel = () => {
    const cols: ExportColumn<OrdenTrabajoListadoItemDto>[] = [
      { header: 'Código WO', accessor: (o) => o.codigoWo },
      { header: 'Tipo de Servicio', accessor: (o) => o.tipoOrdenNombre },
      { header: 'Cliente Facturación', accessor: (o) => o.clienteFacturacionNombre },
      { header: 'Abonado / Contacto', accessor: (o) => o.clienteServicioNombre },
      { header: 'Zona / Territorio', accessor: (o) => o.zonaOperativaNombre || 'Sin asignar' },
      { header: 'Técnico Asignado', accessor: (o) => o.recursoTecnicoNombre || 'Sin asignar' },
      { header: 'Fecha Cita', accessor: (o) => o.fechaProgramada || '-' },
      { header: 'Bloque Horario', accessor: (o) => o.bloqueHorario || '-' },
      { header: 'System Status', accessor: (o) => o.estadoSistema },
      { header: 'Estado Operativo', accessor: (o) => o.estado },
    ];
    exportToExcel(filteredOrdenes, cols, `Ordenes_Trabajo_${activeView}`);
  };

  const handleExportarCSV = () => {
    const cols: ExportColumn<OrdenTrabajoListadoItemDto>[] = [
      { header: 'Código WO', accessor: (o) => o.codigoWo },
      { header: 'Tipo Servicio', accessor: (o) => o.tipoOrdenNombre },
      { header: 'Cliente Facturación', accessor: (o) => o.clienteFacturacionNombre },
      { header: 'Abonado', accessor: (o) => o.clienteServicioNombre },
      { header: 'Zona', accessor: (o) => o.zonaOperativaNombre || '' },
      { header: 'Técnico', accessor: (o) => o.recursoTecnicoNombre || '' },
      { header: 'Fecha', accessor: (o) => o.fechaProgramada || '' },
      { header: 'System Status', accessor: (o) => o.estadoSistema },
      { header: 'Estado', accessor: (o) => o.estado },
    ];
    exportToCSV(filteredOrdenes, cols, `Ordenes_Trabajo_${activeView}`);
  };

  const columns: TableColumnDefinition<OrdenTrabajoListadoItemDto>[] = useMemo(
    () => [
      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'codigoWo',
        compare: (a, b) => a.codigoWo.localeCompare(b.codigoWo),
        renderHeaderCell: () => 'Código WO',
        renderCell: (item) => (
          <TableCellLayout media={<ClipboardTask20Regular style={{ color: tokens.colorBrandForeground1 }} />}>
            <Link
              as="button"
              style={{ fontWeight: tokens.fontWeightSemibold, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/servicio-campo/ordenes/${item.id}`);
              }}
            >
              {item.codigoWo}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'tipoOrden',
        compare: (a, b) => a.tipoOrdenNombre.localeCompare(b.tipoOrdenNombre),
        renderHeaderCell: () => 'Tipo de Servicio',
        renderCell: (item) => (
          <TableCellLayout>
            <Text style={{ fontSize: tokens.fontSizeBase200 }}>{item.tipoOrdenNombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'clienteFacturacion',
        compare: (a, b) => a.clienteFacturacionNombre.localeCompare(b.clienteFacturacionNombre),
        renderHeaderCell: () => 'Cliente Facturación',
        renderCell: (item) => (
          <TableCellLayout>
            <Text style={{ fontSize: tokens.fontSizeBase200 }}>{item.clienteFacturacionNombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'clienteServicio',
        compare: (a, b) => a.clienteServicioNombre.localeCompare(b.clienteServicioNombre),
        renderHeaderCell: () => 'Abonado / Contacto',
        renderCell: (item) => (
          <TableCellLayout>
            <Text style={{ fontSize: tokens.fontSizeBase200 }}>{item.clienteServicioNombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'zonaOperativa',
        compare: (a, b) => (a.zonaOperativaNombre || '').localeCompare(b.zonaOperativaNombre || ''),
        renderHeaderCell: () => 'Zona / Territorio',
        renderCell: (item) => (
          <TableCellLayout>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: item.zonaOperativaNombre ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground4 }}>
              {item.zonaOperativaNombre || 'Sin asignar'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'recursoTecnico',
        compare: (a, b) => (a.recursoTecnicoNombre || '').localeCompare(b.recursoTecnicoNombre || ''),
        renderHeaderCell: () => 'Técnico Asignado',
        renderCell: (item) => (
          <TableCellLayout>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: item.recursoTecnicoNombre ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground4 }}>
              {item.recursoTecnicoNombre || 'Sin asignar'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'fechaProgramada',
        compare: (a, b) => (a.fechaProgramada || '').localeCompare(b.fechaProgramada || ''),
        renderHeaderCell: () => 'Fecha Cita',
        renderCell: (item) => (
          <TableCellLayout>
            <Text style={{ fontSize: tokens.fontSizeBase200 }}>
              {item.fechaProgramada ? `${item.fechaProgramada}${item.bloqueHorario ? ` (${item.bloqueHorario})` : ''}` : '-'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'estadoSistema',
        compare: (a, b) => String(a.estadoSistema).localeCompare(String(b.estadoSistema)),
        renderHeaderCell: () => 'System Status',
        renderCell: (item) => (
          <TableCellLayout>
            <D365StatusBadge status={item.estadoSistema} size="small" />
          </TableCellLayout>
        ),
      }),
      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'estado',
        compare: (a, b) => String(a.estado).localeCompare(String(b.estado)),
        renderHeaderCell: () => 'Estado Operativo',
        renderCell: (item) => (
          <TableCellLayout>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2 }}>
              {item.estado}
            </Text>
          </TableCellLayout>
        ),
      }),
    ],
    [navigate]
  );

  return (
    <div className={styles.root}>
      {/* 1. BARRA DE COMANDOS D365 */}
      <D365CommandBar ariaLabel="Comandos de Órdenes de Trabajo" busy={loading}>
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/ordenes/nuevo')}
          >
            Nuevo
          </D365CommandButton>

          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            tone="default"
            onClick={() => void cargar()}
          >
            Actualizar
          </D365CommandButton>

          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <D365CommandButton icon={<ArrowDownload16Regular />}>
                Exportar
              </D365CommandButton>
            </MenuTrigger>
            <MenuPopover className={styles.viewMenuPopover}>
              <MenuList>
                <MenuItem icon={<DocumentTable20Regular />} onClick={handleExportarExcel}>
                  Libro de Excel (.xlsx)
                </MenuItem>
                <MenuItem icon={<DocumentText20Regular />} onClick={handleExportarCSV}>
                  Exportar a CSV (.csv)
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </D365CommandBar>

      {/* 2. VIEW HEADER ROW (Selector + Tools) */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} role="button" tabIndex={0}>
              <Text>{nombresVistaOrdenes[activeView]}</Text>
              <ChevronDown16Regular className={styles.iconChevronMargin} />
            </div>
          </MenuTrigger>
          <MenuPopover className={styles.viewMenuPopover}>
            <MenuList>
              {(Object.keys(nombresVistaOrdenes) as VistaOrdenes[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={activeView === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => setActiveView(v)}
                >
                  {nombresVistaOrdenes[v]}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        <D365TableToolbarTools
          tableRef={tableRef}
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          searchPlaceholder="Buscar órdenes por código, cliente, técnico..."
        />
      </div>

      {/* 3. GRID PRINCIPAL */}
      <D365EntityTable<OrdenTrabajoListadoItemDto>
        ref={tableRef}
        items={filteredOrdenes}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={cargar}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
        onRowDoubleClick={(item) => navigate(`/servicio-campo/ordenes/${item.id}`)}
        filterFields={filterFields}
        entityName="ordenes"
        tableId="ordenes-grid"
      />

      {/* 4. FOOTER */}
      <div className={styles.footer}>
        <Text>
          {filteredOrdenes.length} {filteredOrdenes.length === 1 ? 'orden' : 'órdenes'}
        </Text>
      </div>
    </div>
  );
};

export default OrdenesTrabajoListPage;
