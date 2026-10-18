import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TableCellLayout,
  createTableColumn,
  Text,
  Link,
  tokens,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
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
import { DevolucionProveedorService } from '../services/devolucionProveedor.service';
import type { DevolucionProveedorDto } from '../types/devolucionProveedor.types';
import { exportToExcel, type ExportColumn } from '../../../../utils/exportUtils';

type Vista = 'todas' | 'Borrador' | 'EnRetiro' | 'Completada' | 'Anulada';

const nombresVistaDefectuoso: Record<Vista, string> = {
  todas: 'Todos los retiros de material defectuoso a OL',
  Borrador: 'Retiros defectuosos en borrador',
  EnRetiro: 'Retiros defectuosos en traslado a OL',
  Completada: 'Retiros defectuosos completados por OL',
  Anulada: 'Retiros anulados',
};

const nombresVistaOk: Record<Vista, string> = {
  todas: 'Todos los retiros de material OK hacia OL',
  Borrador: 'Retiros de material OK en borrador',
  EnRetiro: 'Retiros de material OK en traslado a OL',
  Completada: 'Retiros de material OK completados por OL',
  Anulada: 'Retiros anulados',
};

export interface DevolucionesProveedorListPageProps {
  modo?: 'defectuoso' | 'ok';
}

export const DevolucionesProveedorListPage: React.FC<DevolucionesProveedorListPageProps> = ({ modo = 'defectuoso' }) => {
  const navigate = useNavigate();
  const listStyles = useD365ListStyles();
  const tableRef = useRef<D365EntityTableRef>(null);

  const baseRoute = modo === 'ok' ? '/servicio-campo/retiro-ok-proveedor' : '/servicio-campo/retiro-defectuoso-proveedor';
  const nombresVista = modo === 'ok' ? nombresVistaOk : nombresVistaDefectuoso;

  const [devoluciones, setDevoluciones] = useState<DevolucionProveedorDto[]>([]);
  const [buscar, setBuscar] = useState('');
  const [vista, setVista] = useState<Vista>('todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const cargarDevoluciones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DevolucionProveedorService.obtenerTodas();
      setDevoluciones(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las devoluciones a proveedor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDevoluciones();
  }, [cargarDevoluciones]);

  const filterFields: D365FilterField[] = useMemo(() => [
    { id: 'numero', label: 'N° Devolución', type: 'string' },
    { id: 'proveedor', label: 'Proveedor', type: 'string' },
    { id: 'almacenNombre', label: 'Almacén de Salida', type: 'string' },
    { id: 'numeroDocumento', label: 'N° Documento / Guía', type: 'string' },
    {
      id: 'estado',
      label: 'Estado',
      type: 'string',
      options: [
        { value: 'Completada', label: 'Completada' },
        { value: 'Borrador', label: 'Borrador' },
        { value: 'Anulada', label: 'Anulada' },
      ],
    },
    { id: 'motivo', label: 'Motivo', type: 'string' },
  ], []);

  const columnasExportacion: ExportColumn<DevolucionProveedorDto>[] = useMemo(() => [
    { header: 'N° Devolución', accessor: d => d.numero },
    { header: 'Proveedor', accessor: d => d.proveedor },
    { header: 'Almacén Origen', accessor: d => d.almacenNombre },
    { header: 'N° Guía / Acta', accessor: d => d.numeroDocumento },
    { header: 'Fecha', accessor: d => d.fechaDocumento },
    { header: 'Motivo', accessor: d => d.motivo },
    { header: 'Total Cantidad', accessor: d => d.totalCantidad },
    { header: 'Estado', accessor: d => d.estado },
    { header: 'Registrado Por', accessor: d => d.usuarioNombre },
  ], []);

  const handleExportarExcel = () => {
    if (devoluciones.length === 0) return;
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = modo === 'ok' ? `Retiro_Material_OK_${fecha}` : `Retiro_Material_Defectuoso_${fecha}`;
    exportToExcel(filtrados, columnasExportacion, nombreArchivo);
  };

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return devoluciones.filter((item) => {
      // Filtrar según el modo (Opción B: Separación entre Defectuoso y OK)
      if (modo === 'ok') {
        const tieneDefectuosos = item.lineas?.some(l => l.condicion === 'Defectuoso');
        const esMotivoFalla = /garant[ií]a|falla|aver[ií]a|doa|inoperativo|daño|siniestro|defecto/i.test(item.motivo || '');
        if (tieneDefectuosos || esMotivoFalla) return false;
      } else if (modo === 'defectuoso') {
        const esMotivoOk = /ok|rotaci[oó]n|activaci[oó]n|exceso|sobrestock|desmovilizaci[oó]n|cese/i.test(item.motivo || '');
        const todosUtilizables = item.lineas && item.lineas.length > 0 && item.lineas.every(l => l.condicion === 'Utilizable');
        if (esMotivoOk && todosUtilizables) return false;
      }

      if (vista !== 'todas') {
        if (vista === 'EnRetiro') {
          if (item.estado !== 'EnRetiro' && item.estado !== 'EnTransito') return false;
        } else if (item.estado !== vista) {
          return false;
        }
      }
      return (
        !q ||
        [
          item.numero,
          item.proveedor,
          item.almacenNombre,
          item.numeroDocumento,
          item.motivo,
          item.usuarioNombre,
          item.estado,
        ].some(v => (v || '').toLowerCase().includes(q))
      );
    });
  }, [buscar, devoluciones, vista, modo]);

  const columns: TableColumnDefinition<DevolucionProveedorDto>[] = useMemo(() => [
    createTableColumn<DevolucionProveedorDto>({
      columnId: 'numero',
      compare: (a, b) => a.numero.localeCompare(b.numero),
      renderHeaderCell: () => (modo === 'ok' ? 'N° Retiro OK' : 'N° Retiro Defectuoso'),
      renderCell: (item) => (
        <TableCellLayout truncate>
          <Link
            as="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${baseRoute}/${item.id}`);
            }}
          >
            {item.numero}
          </Link>
        </TableCellLayout>
      ),
    }),
    createTableColumn<DevolucionProveedorDto>({
      columnId: 'proveedor',
      compare: (a, b) => a.proveedor.localeCompare(b.proveedor),
      renderHeaderCell: () => 'Proveedor',
      renderCell: (item) => (
        <TableCellLayout truncate>
          <Text weight="semibold">{item.proveedor}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<DevolucionProveedorDto>({
      columnId: 'almacen',
      compare: (a, b) => a.almacenNombre.localeCompare(b.almacenNombre),
      renderHeaderCell: () => 'Almacén de Salida',
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
            <Text>{item.almacenNombre}</Text>
          )}
        </TableCellLayout>
      ),
    }),
    createTableColumn<DevolucionProveedorDto>({
      columnId: 'documento',
      compare: (a, b) => a.numeroDocumento.localeCompare(b.numeroDocumento),
      renderHeaderCell: () => 'N° Guía / Acta',
      renderCell: (item) => (
        <TableCellLayout truncate>
          <Text style={{ fontFamily: 'monospace' }}>{item.numeroDocumento}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<DevolucionProveedorDto>({
      columnId: 'fecha',
      compare: (a, b) => a.fechaDocumento.localeCompare(b.fechaDocumento),
      renderHeaderCell: () => 'Fecha',
      renderCell: (item) => (
        <TableCellLayout truncate>
          <Text>{item.fechaDocumento}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<DevolucionProveedorDto>({
      columnId: 'motivo',
      compare: (a, b) => a.motivo.localeCompare(b.motivo),
      renderHeaderCell: () => 'Motivo',
      renderCell: (item) => (
        <TableCellLayout truncate>
          <Text>{item.motivo}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<DevolucionProveedorDto>({
      columnId: 'unidades',
      compare: (a, b) => a.totalCantidad - b.totalCantidad,
      renderHeaderCell: () => 'Cant. Total',
      renderCell: (item) => (
        <TableCellLayout truncate>
          <Text weight="semibold">{item.totalCantidad}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<DevolucionProveedorDto>({
      columnId: 'respaldo',
      renderHeaderCell: () => 'Respaldo Firmado',
      renderCell: (item) => (
        <TableCellLayout truncate>
          {item.documentoRespaldoUrl ? (
            <Link
              onClick={(e) => {
                e.stopPropagation();
                window.open(item.documentoRespaldoUrl!, '_blank');
              }}
              title="Ver documento de respaldo firmado"
            >
              Ver Acta
            </Link>
          ) : (
            <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
              Sin archivo
            </Text>
          )}
        </TableCellLayout>
      ),
    }),
    createTableColumn<DevolucionProveedorDto>({
      columnId: 'estado',
      compare: (a, b) => a.estado.localeCompare(b.estado),
      renderHeaderCell: () => 'Estado',
      renderCell: (item) => (
        <TableCellLayout truncate>
          <D365StatusBadge status={item.estado} />
        </TableCellLayout>
      ),
    }),
  ], [navigate, modo, baseRoute]);

  return (
    <div className={listStyles.root}>
      {/* 1. Command Bar */}
      <D365CommandBar ariaLabel={modo === 'ok' ? 'Comandos de Retiro Material OK hacia OL' : 'Comandos de Retiro Material Defectuoso a OL'}>
        <div className={listStyles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            onClick={() => navigate(`${baseRoute}/nuevo`)}
            tone="create"
          >
            Nuevo
          </D365CommandButton>
          {selectedIds.size === 1 && (
            <D365CommandButton
              icon={<Eye16Regular />}
              onClick={() => {
                const selId = Array.from(selectedIds)[0];
                navigate(`${baseRoute}/${selId}`);
              }}
            >
              Ver Detalle
            </D365CommandButton>
          )}
          <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={cargarDevoluciones}>
            Actualizar
          </D365CommandButton>
          <D365CommandButton
            icon={<ArrowDownload16Regular />}
            onClick={handleExportarExcel}
            disabled={filtrados.length === 0}
          >
            Exportar a Excel
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. Encabezado de Vista: Selector de vistas y cuadro de búsqueda */}
      <div className={listStyles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={listStyles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>{nombresVista[vista]}</Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={listStyles.viewMenuPopover}>
              {(Object.keys(nombresVista) as Vista[]).map(v => (
                <MenuItem
                  key={v}
                  icon={vista === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => setVista(v)}
                >
                  {nombresVista[v]}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        <div className={listStyles.viewToolsRight}>
          <D365TableToolbarTools
            tableRef={tableRef}
            searchValue={buscar}
            onSearchChange={setBuscar}
            searchPlaceholder="Buscar en esta vista"
          />
        </div>
      </div>

      {/* 3. Tabla D365EntityTable */}
      <D365EntityTable
        ref={tableRef}
        entityName={modo === 'ok' ? 'Retiros de Material OK hacia OL' : 'Retiros de Material Defectuoso a OL'}
        tableId={modo === 'ok' ? 'retiros-ok-proveedor-grid' : 'retiros-defectuoso-proveedor-grid'}
        items={filtrados}
        columns={columns}
        filterFields={filterFields}
        loading={loading}
        error={error}
        onRetry={cargarDevoluciones}
        onRowDoubleClick={(item) => navigate(`${baseRoute}/${item.id}`)}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
      />

      {/* 4. Footer */}
      <footer className={listStyles.footer}>
        <div>1-{filtrados.length} de {filtrados.length} ({selectedIds.size} seleccionados)</div>
        <div>Página 1</div>
      </footer>
    </div>
  );
};
