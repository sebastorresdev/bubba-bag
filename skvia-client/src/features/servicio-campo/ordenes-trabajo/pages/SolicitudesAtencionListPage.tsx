import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  DocumentTable20Regular,
  DocumentText20Regular,
  Open16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { D365ViewSelector } from '../../../../components/common/D365ViewSelector';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { OrdenTrabajoService } from '../services/ordenTrabajo.service';
import type { OrdenTrabajoListadoItemDto } from '../types/ordenTrabajo.types';
import { exportToExcel, exportToCSV, type ExportColumn } from '../../../../utils/exportUtils';

type VistaSolicitudes =
  | 'mis_solicitudes'
  | 'equipo'
  | 'todas'
  | 'borrador'
  | 'por_programar'
  | 'en_curso'
  | 'finalizadas';

const vistasSistemaSolicitudes = [
  { key: 'mis_solicitudes', label: 'Mis Solicitudes activas' },
  { key: 'equipo', label: 'Solicitudes de mi equipo a cargo' },
  { key: 'todas', label: 'Todas las solicitudes comerciales' },
  { key: 'borrador', label: 'Borradores / Por coordinar' },
  { key: 'por_programar', label: 'Enviadas a Despacho (Pendientes programar)' },
  { key: 'en_curso', label: 'En atención técnica / En curso' },
  { key: 'finalizadas', label: 'Solicitudes atendidas / Completadas' },
];

export const SolicitudesAtencionListPage: React.FC = () => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const tableRef = useRef<D365EntityTableRef>(null);

  const [ordenes, setOrdenes] = useState<OrdenTrabajoListadoItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeView, setActiveView] = useState<VistaSolicitudes>('mis_solicitudes');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mapeo a las vistas soportadas en backend
      let vistaBackend = 'activas';
      if (activeView === 'borrador') vistaBackend = 'borrador';
      else if (activeView === 'por_programar') vistaBackend = 'pendientes';
      else if (activeView === 'en_curso') vistaBackend = 'en_progreso';
      else if (activeView === 'finalizadas') vistaBackend = 'finalizadas_mes';
      else if (activeView === 'equipo') vistaBackend = 'equipo';

      const data = await OrdenTrabajoService.obtenerOrdenes({
        search: searchKeyword.trim() || undefined,
        vista: vistaBackend,
        esSolicitudAtencion: true,
        soloMisSolicitudes: activeView === 'mis_solicitudes',
      });
      setOrdenes(data);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar la lista de solicitudes de atención.');
    } finally {
      setLoading(false);
    }
  }, [activeView, searchKeyword]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filteredOrdenes = useMemo(() => {
    let result = [...ordenes];

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (o) =>
          o.codigoWo.toLowerCase().includes(q) ||
          (o.numeroOrden && o.numeroOrden.toLowerCase().includes(q)) ||
          (o.codigoContrato && o.codigoContrato.toLowerCase().includes(q)) ||
          (o.clienteServicioCodigo && o.clienteServicioCodigo.toLowerCase().includes(q)) ||
          (o.clienteServicioCodigoExterno && o.clienteServicioCodigoExterno.toLowerCase().includes(q)) ||
          o.clienteFacturacionNombre.toLowerCase().includes(q) ||
          o.clienteServicioNombre.toLowerCase().includes(q) ||
          o.tipoOrdenNombre.toLowerCase().includes(q) ||
          (o.direccionServicio && o.direccionServicio.toLowerCase().includes(q)) ||
          (o.ubigeoTexto && o.ubigeoTexto.toLowerCase().includes(q)) ||
          (o.unidadOrganizativaNombre && o.unidadOrganizativaNombre.toLowerCase().includes(q))
      );
    }

    return result;
  }, [ordenes, searchKeyword]);

  const handleExportarExcel = () => {
    const cols: ExportColumn<OrdenTrabajoListadoItemDto>[] = [
      { header: 'Código Solicitud / WO', accessor: (o) => o.codigoWo },
      { header: 'Tipo de Servicio', accessor: (o) => o.tipoOrdenNombre },
      { header: 'Cliente / Abonado', accessor: (o) => o.clienteServicioNombre },
      { header: 'Cód. Abonado / Contrato', accessor: (o) => o.clienteServicioCodigoExterno || o.codigoContrato || '-' },
      { header: 'Dirección de Atención', accessor: (o) => o.direccionServicio || '-' },
      { header: 'Distrito / Ubigeo', accessor: (o) => o.ubigeoTexto || '-' },
      { header: 'Sede Operativa', accessor: (o) => o.unidadOrganizativaNombre || '-' },
      { header: 'Fecha Registro', accessor: (o) => o.fechaCreacion ? new Date(o.fechaCreacion).toLocaleDateString() : '-' },
      { header: 'Estado Sistema', accessor: (o) => String(o.estadoSistema) },
      { header: 'Estado Operativo', accessor: (o) => o.estado },
    ];
    exportToExcel(filteredOrdenes, cols, `Solicitudes_Atencion_${activeView}`);
  };

  const handleExportarCSV = () => {
    const cols: ExportColumn<OrdenTrabajoListadoItemDto>[] = [
      { header: 'Codigo', accessor: (o) => o.codigoWo },
      { header: 'TipoServicio', accessor: (o) => o.tipoOrdenNombre },
      { header: 'Cliente', accessor: (o) => o.clienteServicioNombre },
      { header: 'Direccion', accessor: (o) => o.direccionServicio || '' },
      { header: 'Distrito', accessor: (o) => o.ubigeoTexto || '' },
      { header: 'Estado', accessor: (o) => o.estado },
      { header: 'Fecha', accessor: (o) => o.fechaCreacion },
    ];
    exportToCSV(filteredOrdenes, cols, `Solicitudes_Atencion_${activeView}`);
  };

  const columns: TableColumnDefinition<OrdenTrabajoListadoItemDto>[] = useMemo(
    () => [
      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'codigoWo',
        compare: (a, b) => a.codigoWo.localeCompare(b.codigoWo),
        renderHeaderCell: () => 'Código Solicitud / WO',
        renderCell: (item) => (
          <TableCellLayout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontWeight: 600,
                  color: tokens.colorBrandForegroundLink,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/servicio-campo/ordenes/${item.id}`);
                }}
              >
                {item.codigoWo}
              </span>
            </div>
          </TableCellLayout>
        ),
      }),

            createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'clienteServicioNombre',
        compare: (a, b) => a.clienteServicioNombre.localeCompare(b.clienteServicioNombre),
        renderHeaderCell: () => 'Cliente / Solicitante',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text weight="semibold" size={200}>
              {item.clienteServicioNombre}
            </Text>
          </TableCellLayout>
        ),
      }),

      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'codigoAbonado',
        compare: (a, b) => (a.clienteServicioCodigoExterno || a.codigoContrato || '').localeCompare(b.clienteServicioCodigoExterno || b.codigoContrato || ''),
        renderHeaderCell: () => 'Cód. Abonado',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200}>
              {item.clienteServicioCodigoExterno || item.codigoContrato || '---'}
            </Text>
          </TableCellLayout>
        ),
      }),

      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'tipoOrdenNombre',
        compare: (a, b) => a.tipoOrdenNombre.localeCompare(b.tipoOrdenNombre),
        renderHeaderCell: () => 'Servicio Solicitado',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: item.tipoOrdenColor || tokens.colorBrandBackground,
                  flexShrink: 0,
                }}
              />
              <Text size={200}>{item.tipoOrdenNombre}</Text>
            </div>
          </TableCellLayout>
        ),
      }),

      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'ubicacion',
        renderHeaderCell: () => 'Dirección y Distrito',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text size={200} truncate title={item.direccionServicio || '-'}>
                {item.direccionServicio || '-'}
              </Text>
              {item.ubigeoTexto && (
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  {item.ubigeoTexto}
                </Text>
              )}
            </div>
          </TableCellLayout>
        ),
      }),

      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'fechaCreacion',
        compare: (a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime(),
        renderHeaderCell: () => 'Fecha Registro',
        renderCell: (item) => (
          <TableCellLayout>
            <Text size={200}>
              {item.fechaCreacion
                ? new Date(item.fechaCreacion).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '-'}
            </Text>
          </TableCellLayout>
        ),
      }),

      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'sede',
        renderHeaderCell: () => 'Sede Operativa',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200}>{item.unidadOrganizativaNombre || '-'}</Text>
          </TableCellLayout>
        ),
      }),

      createTableColumn<OrdenTrabajoListadoItemDto>({
        columnId: 'estadoSistema',
        compare: (a, b) => String(a.estadoSistema).localeCompare(String(b.estadoSistema)),
        renderHeaderCell: () => 'Estado Sistema',
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

  const filterFields: D365FilterField[] = [
    { id: 'codigoWo', label: 'Código Solicitud / WO', type: 'string' },
    { id: 'codigoAbonado', label: 'Cód. Abonado', type: 'string' },
    { id: 'clienteServicioNombre', label: 'Cliente / Abonado', type: 'string' },
    { id: 'tipoOrdenNombre', label: 'Servicio Solicitado', type: 'string' },
    { id: 'direccionServicio', label: 'Dirección', type: 'string' },
    { id: 'ubigeoTexto', label: 'Distrito', type: 'string' },
  ];

  const selectedItem = useMemo(() => {
    if (selectedIds.size !== 1) return null;
    const firstId = Array.from(selectedIds)[0];
    return ordenes.find((o) => o.id === firstId) || null;
  }, [selectedIds, ordenes]);

  return (
    <div className={styles.root}>
      {/* 1. Barra de Comandos D365 */}
      <D365CommandBar ariaLabel="Comandos de Solicitudes de Atención" busy={loading}>
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/solicitud-atencion/nuevo')}
          >
            Nuevo
          </D365CommandButton>

          {selectedItem && (
            <D365CommandButton
              icon={<Open16Regular />}
              onClick={() => navigate(`/servicio-campo/ordenes/${selectedItem.id}`)}
            >
              Abrir Orden
            </D365CommandButton>
          )}

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

      {/* 2. Selector de Vistas y Herramientas */}
      <div className={styles.viewHeader}>
        <D365ViewSelector
          entityName="solicitudes"
          vistasSistema={vistasSistemaSolicitudes}
          activeViewKey={activeView}
          onSelectSystemView={(key) => setActiveView(key as VistaSolicitudes)}
          tableRef={tableRef}
          onRefreshData={cargar}
        />

        <D365TableToolbarTools
          tableRef={tableRef}
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          searchPlaceholder="Buscar por código, cliente, dirección, distrito..."
        />
      </div>

      {/* 3. Grid de Datos */}
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
        entityName="solicitudes"
        tableId="solicitudes-atencion-grid"
      />

      {/* 4. Footer */}
      <div className={styles.footer}>
        <Text>
          {filteredOrdenes.length} {filteredOrdenes.length === 1 ? 'solicitud' : 'solicitudes'}
        </Text>
      </div>
    </div>
  );
};

export default SolicitudesAtencionListPage;
