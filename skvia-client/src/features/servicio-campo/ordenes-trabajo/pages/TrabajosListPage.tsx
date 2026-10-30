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

  MenuDivider,

  tokens,

  type TableColumnDefinition,

  type SelectionItemId,

} from '@fluentui/react-components';

import {

  Add16Regular,

  ArrowClockwise16Regular,

  ArrowDownload16Regular,

  ArrowUpload16Regular,

  ChevronDown16Regular,

  Checkmark16Regular,

  Eye16Regular,

  Wrench20Regular,

} from '@fluentui/react-icons';

import { useAuthSession } from '../../../../services/authSession';

import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';

import {

  D365EntityTable,

  D365TableToolbarTools,

  type D365EntityTableRef,

  type D365FilterField,

} from '../../../../components/common/D365EntityTable';

import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';

import { useD365ListStyles } from '../../../../styles/d365ListStyles';

import { OrdenTrabajoService } from '../services/ordenTrabajo.service';

import type { TrabajoListadoItemDto } from '../types/ordenTrabajo.types';

import { exportToExcel, exportToCSV, type ExportColumn } from '../../../../utils/exportUtils';

import { ImportarSiebelDrawer } from '../components/ImportarSiebelDrawer';



type VistaTrabajos =
  | 'activos'
  | 'pendientes'
  | 'en_progreso'
  | 'finalizados_mes'
  | 'finalizados_3meses';

const nombresVistaTrabajos: Record<VistaTrabajos, string> = {
  activos: 'Trabajos activos (Pendientes por trabajar)',
  pendientes: 'Trabajos pendientes',
  en_progreso: 'Trabajos en curso (In Progress)',
  finalizados_mes: 'Trabajos finalizados del mes',
  finalizados_3meses: 'Trabajos finalizados (Últimos 3 meses)',
};



const filterFields: D365FilterField[] = [

  { id: 'codigoTrabajo', label: 'Cód. Trabajo', type: 'string' },

  { id: 'codigoExterno', label: 'N° WO IBS / Ext.', type: 'string' },

  { id: 'codigoWo', label: 'Código WO', type: 'string' },

  { id: 'numeroOrden', label: 'N° Orden Siebel', type: 'string' },

  { id: 'codigoContrato', label: 'Cód. Abonado / Cliente', type: 'string' },

  { id: 'productoNombre', label: 'Servicio / Producto', type: 'string' },

  { id: 'clienteServicioNombre', label: 'Abonado / Contacto', type: 'string' },

  { id: 'clienteFacturacionNombre', label: 'Cliente Facturación', type: 'string' },

  { id: 'recursoTecnicoNombre', label: 'Técnico Asignado', type: 'string' },

  { id: 'unidadOrganizativaNombre', label: 'Sede Operativa', type: 'string' },

  { id: 'zonaOperativaNombre', label: 'Zona / Territorio', type: 'string' },

  {

    id: 'estado',

    label: 'Estado del Trabajo',

    type: 'string',

    options: [

      { value: 'Pendiente', label: 'Pendiente' },

      { value: 'Asignado', label: 'Asignado' },

      { value: 'EnProgreso', label: 'En Progreso' },

      { value: 'Completado', label: 'Completado' },

      { value: 'Cancelado', label: 'Cancelado' },

      { value: 'Rechazado', label: 'Rechazado' },

    ],

  },

  {

    id: 'estadoSistemaOrden',

    label: 'Estado Orden Padre',

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



export const TrabajosListPage: React.FC = () => {

  const { permisos } = useAuthSession();

  const styles = useD365ListStyles();

  const navigate = useNavigate();

  const tableRef = useRef<D365EntityTableRef>(null);



  const [trabajos, setTrabajos] = useState<TrabajoListadoItemDto[]>([]);

  const [loading, setLoading] = useState(true);

  const [importarSiebelOpen, setImportarSiebelOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [searchKeyword, setSearchKeyword] = useState('');

  const [activeView, setActiveView] = useState<VistaTrabajos>('activos');

  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());



  const puedeCrear = permisos.includes('serviciocampo.ordenes.crear');



  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await OrdenTrabajoService.obtenerTrabajos({
        search: searchKeyword.trim() || undefined,
        vista: activeView,
      });
      setTrabajos(data);
    } catch (err: unknown) {
      console.error('Error al cargar trabajos:', err);
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [activeView, searchKeyword]);



  useEffect(() => {

    cargarDatos();

  }, [cargarDatos]);



  const filteredTrabajos = useMemo(() => {

    let result = [...trabajos];



// El filtro por vista se resuelve de forma eficiente y acotada directamente en el backend



    // Filtro de búsqueda rápida

    if (searchKeyword.trim()) {

      const q = searchKeyword.toLowerCase().trim();

      result = result.filter(

        (t) =>

          t.codigoTrabajo.toLowerCase().includes(q) ||

          (t.codigoExterno && t.codigoExterno.toLowerCase().includes(q)) ||

          t.codigoWo.toLowerCase().includes(q) ||

          (t.numeroOrden && t.numeroOrden.toLowerCase().includes(q)) ||

          (t.codigoContrato && t.codigoContrato.toLowerCase().includes(q)) ||

          t.productoNombre.toLowerCase().includes(q) ||

          t.productoCodigo.toLowerCase().includes(q) ||

          t.clienteServicioNombre.toLowerCase().includes(q) ||

          t.clienteFacturacionNombre.toLowerCase().includes(q) ||

          (t.recursoTecnicoNombre && t.recursoTecnicoNombre.toLowerCase().includes(q)) ||

          (t.unidadOrganizativaNombre && t.unidadOrganizativaNombre.toLowerCase().includes(q)) ||

          (t.zonaOperativaNombre && t.zonaOperativaNombre.toLowerCase().includes(q))

      );

    }



    return result;

  }, [trabajos, activeView, searchKeyword]);



  const selectedTrabajo = useMemo(() => {

    if (selectedIds.size !== 1) return null;

    const selectedId = Array.from(selectedIds)[0];

    return trabajos.find((t) => t.id === selectedId) || null;

  }, [selectedIds, trabajos]);



  const handleExportarExcel = () => {

    const cols: ExportColumn<TrabajoListadoItemDto>[] = [

      { header: 'Cód. Trabajo', accessor: (t) => t.codigoTrabajo },

      { header: 'N° WO IBS / Ext.', accessor: (t) => t.codigoExterno || '-' },

      { header: 'Código WO', accessor: (t) => t.codigoWo },

      { header: 'N° Orden Ext.', accessor: (t) => t.numeroOrden || '-' },

      { header: 'Cód. Abonado', accessor: (t) => t.clienteServicioCodigo || t.codigoContrato || '-' },

      { header: 'Servicio / Producto', accessor: (t) => t.productoNombre },

      { header: 'Cód. Servicio', accessor: (t) => t.productoCodigo },

      { header: 'Estado del Trabajo', accessor: (t) => t.estado },

      { header: 'Estado de la Orden', accessor: (t) => t.estadoSistemaOrden },

      { header: 'Puntos', accessor: (t) => t.puntos },

      { header: 'Tarifa Base', accessor: (t) => t.tarifaBase },

      { header: 'Abonado / Contacto', accessor: (t) => t.clienteServicioNombre },

      { header: 'Dirección Servicio', accessor: (t) => t.clienteServicioDireccion || '-' },

      { header: 'Cliente Facturación', accessor: (t) => t.clienteFacturacionNombre },

      { header: 'Técnico Asignado', accessor: (t) => t.recursoTecnicoNombre || 'Sin asignar' },

      { header: 'Fecha Cita', accessor: (t) => t.fechaProgramada || '-' },

      { header: 'Bloque Horario', accessor: (t) => t.bloqueHorario || '-' },

      { header: 'Sede Operativa', accessor: (t) => t.unidadOrganizativaNombre || '-' },

      { header: 'Zona / Territorio', accessor: (t) => t.zonaOperativaNombre || '-' },

      { header: 'Tareas Avance', accessor: (t) => `${t.cantidadTareasCompletadas}/${t.cantidadTareas}` },

      { header: 'Fecha Creación', accessor: (t) => t.fechaCreacion },

    ];

    exportToExcel(filteredTrabajos, cols, `Trabajos_${activeView}`);

  };



  const handleExportarCSV = () => {

    const cols: ExportColumn<TrabajoListadoItemDto>[] = [

      { header: 'Cód. Trabajo', accessor: (t) => t.codigoTrabajo },

      { header: 'N° WO IBS / Ext.', accessor: (t) => t.codigoExterno || '-' },

      { header: 'Código WO', accessor: (t) => t.codigoWo },

      { header: 'N° Orden Ext.', accessor: (t) => t.numeroOrden || '-' },

      { header: 'Cód. Abonado', accessor: (t) => t.clienteServicioCodigo || t.codigoContrato || '-' },

      { header: 'Servicio / Producto', accessor: (t) => t.productoNombre },

      { header: 'Estado Trabajo', accessor: (t) => t.estado },

      { header: 'Estado Orden', accessor: (t) => t.estadoSistemaOrden },

      { header: 'Puntos', accessor: (t) => t.puntos },

      { header: 'Abonado', accessor: (t) => t.clienteServicioNombre },

      { header: 'Técnico', accessor: (t) => t.recursoTecnicoNombre || '' },

      { header: 'Fecha', accessor: (t) => t.fechaProgramada || '' },

      { header: 'Sede', accessor: (t) => t.unidadOrganizativaNombre || '' },

      { header: 'Zona', accessor: (t) => t.zonaOperativaNombre || '' },

    ];

    exportToCSV(filteredTrabajos, cols, `Trabajos_${activeView}`);

  };



  const columns: TableColumnDefinition<TrabajoListadoItemDto>[] = useMemo(

    () => [

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'codigoTrabajo',

        compare: (a, b) => a.codigoTrabajo.localeCompare(b.codigoTrabajo),

        renderHeaderCell: () => 'Cód. Trabajo',

        renderCell: (item) => (

          <TableCellLayout media={<Wrench20Regular style={{ color: tokens.colorBrandForeground1 }} />}>

            <Link

              as="button"

              className={styles.primaryLink}

              onClick={(e) => {

                e.stopPropagation();

                navigate(`/servicio-campo/ordenes/${item.ordenTrabajoId}`);

              }}

              title={`Abrir orden de trabajo ${item.codigoWo}`}

            >

              {item.codigoTrabajo}

            </Link>

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'codigoExterno',

        compare: (a, b) => (a.codigoExterno || '').localeCompare(b.codigoExterno || ''),

        renderHeaderCell: () => 'N° WO IBS / Ext.',

        renderCell: (item) => (

          <TableCellLayout truncate>

            <Text weight="semibold" style={{ fontSize: tokens.fontSizeBase200 }}>

              {item.codigoExterno || '—'}

            </Text>

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'codigoWo',

        compare: (a, b) => a.codigoWo.localeCompare(b.codigoWo),

        renderHeaderCell: () => 'Orden WO',

        renderCell: (item) => (

          <TableCellLayout truncate>

            <div style={{ display: 'flex', flexDirection: 'column' }}>

              <Link

                as="button"

                className={styles.primaryLink}

                onClick={(e) => {

                  e.stopPropagation();

                  navigate(`/servicio-campo/ordenes/${item.ordenTrabajoId}`);

                }}

              >

                {item.codigoWo}

              </Link>

              {item.numeroOrden && item.numeroOrden !== item.codigoWo && (

                <Text style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 }}>

                  Ext: {item.numeroOrden}

                </Text>

              )}

            </div>

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'productoNombre',

        compare: (a, b) => a.productoNombre.localeCompare(b.productoNombre),

        renderHeaderCell: () => 'Servicio Técnico',

        renderCell: (item) => (

          <TableCellLayout truncate>

            <div style={{ display: 'flex', flexDirection: 'column' }}>

              <Text weight="medium" style={{ fontSize: tokens.fontSizeBase300 }}>

                {item.productoNombre}

              </Text>

              {item.productoCodigo && (

                <Text style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground4 }}>

                  {item.productoCodigo}

                </Text>

              )}

            </div>

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'estado',

        compare: (a, b) => a.estado.localeCompare(b.estado),

        renderHeaderCell: () => 'Estado Trabajo',

        renderCell: (item) => (

          <TableCellLayout>

            <D365StatusBadge status={item.estado} />

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'estadoSistemaOrden',

        compare: (a, b) => a.estadoSistemaOrden.localeCompare(b.estadoSistemaOrden),

        renderHeaderCell: () => 'Estado Orden',

        renderCell: (item) => (

          <TableCellLayout>

            <D365StatusBadge status={item.estadoSistemaOrden} />

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'puntos',

        compare: (a, b) => a.puntos - b.puntos,

        renderHeaderCell: () => 'Puntos',

        renderCell: (item) => (

          <TableCellLayout>

            <Text weight="medium">{item.puntos}</Text>

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'clienteServicioNombre',

        compare: (a, b) => a.clienteServicioNombre.localeCompare(b.clienteServicioNombre),

        renderHeaderCell: () => 'Abonado / Contacto',

        renderCell: (item) => {

          const cod = item.clienteServicioCodigo || item.codigoContrato;

          return (

            <TableCellLayout truncate>

              <div style={{ display: 'flex', flexDirection: 'column' }}>

                <Text weight="medium">{item.clienteServicioNombre}</Text>

                {cod && (

                  <Text style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 }}>

                    Abonado: {cod}

                  </Text>

                )}

              </div>

            </TableCellLayout>

          );

        },

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'clienteFacturacionNombre',

        compare: (a, b) => a.clienteFacturacionNombre.localeCompare(b.clienteFacturacionNombre),

        renderHeaderCell: () => 'Cliente Facturación',

        renderCell: (item) => (

          <TableCellLayout truncate>

            <Text>{item.clienteFacturacionNombre}</Text>

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'recursoTecnicoNombre',

        compare: (a, b) => (a.recursoTecnicoNombre || '').localeCompare(b.recursoTecnicoNombre || ''),

        renderHeaderCell: () => 'Técnico Asignado',

        renderCell: (item) => (

          <TableCellLayout truncate>

            <Text>{item.recursoTecnicoNombre || 'Sin asignar'}</Text>

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'fechaProgramada',

        compare: (a, b) => (a.fechaProgramada || '').localeCompare(b.fechaProgramada || ''),

        renderHeaderCell: () => 'Fecha Cita',

        renderCell: (item) => (

          <TableCellLayout truncate>

            <div style={{ display: 'flex', flexDirection: 'column' }}>

              <Text>{item.fechaProgramada || '—'}</Text>

              {item.bloqueHorario && (

                <Text style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 }}>

                  {item.bloqueHorario}

                </Text>

              )}

            </div>

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'unidadOrganizativaNombre',

        compare: (a, b) => (a.unidadOrganizativaNombre || '').localeCompare(b.unidadOrganizativaNombre || ''),

        renderHeaderCell: () => 'Sede Operativa',

        renderCell: (item) => (

          <TableCellLayout truncate>

            <Text>{item.unidadOrganizativaNombre || '—'}</Text>

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'zonaOperativaNombre',

        compare: (a, b) => (a.zonaOperativaNombre || '').localeCompare(b.zonaOperativaNombre || ''),

        renderHeaderCell: () => 'Zona / Territorio',

        renderCell: (item) => (

          <TableCellLayout truncate>

            <Text>{item.zonaOperativaNombre || '—'}</Text>

          </TableCellLayout>

        ),

      }),

      createTableColumn<TrabajoListadoItemDto>({

        columnId: 'tareas',

        renderHeaderCell: () => 'Tareas',

        renderCell: (item) => (

          <TableCellLayout>

            <Text>

              {item.cantidadTareas > 0 ? `${item.cantidadTareasCompletadas} / ${item.cantidadTareas}` : '—'}

            </Text>

          </TableCellLayout>

        ),

      }),

    ],

    [navigate, styles.primaryLink]

  );



  return (

    <div className={styles.root}>

      {/* 1. Barra de Comandos Superior */}

      <D365CommandBar ariaLabel="Barra de comandos de Trabajos">

        {puedeCrear && (

          <D365CommandButton

            icon={<Add16Regular />}

            tone="create"

            onClick={() => navigate('/servicio-campo/ordenes/nuevo')}

          >

            Nueva Orden

          </D365CommandButton>

        )}



        <D365CommandButton

          icon={<ArrowClockwise16Regular />}

          onClick={cargarDatos}

        >

          Actualizar

        </D365CommandButton>



        {selectedTrabajo && (

          <D365CommandButton

            icon={<Eye16Regular />}

            onClick={() => navigate(`/servicio-campo/ordenes/${selectedTrabajo.ordenTrabajoId}`)}

          >

            Ver Orden ({selectedTrabajo.codigoWo})

          </D365CommandButton>

        )}



        {puedeCrear && (

          <D365CommandButton

            icon={<ArrowUpload16Regular />}

            onClick={() => setImportarSiebelOpen(true)}

          >

            Importar Siebel

          </D365CommandButton>

        )}



        <D365CommandDivider />



        <Menu>

          <MenuTrigger disableButtonEnhancement>

            <D365CommandButton icon={<ArrowDownload16Regular />}>

              Exportar

            </D365CommandButton>

          </MenuTrigger>

          <MenuPopover>

            <MenuList className={styles.viewMenuPopover}>

              <MenuItem onClick={handleExportarExcel}>

                Exportar a Excel (.xlsx)

              </MenuItem>

              <MenuItem onClick={handleExportarCSV}>

                Exportar a CSV (.csv)

              </MenuItem>

            </MenuList>

          </MenuPopover>

        </Menu>

      </D365CommandBar>



      {/* 2. Selector de Vistas y Herramientas */}

      <div className={styles.viewHeader}>

        <Menu>

          <MenuTrigger disableButtonEnhancement>

            <div className={styles.viewSelectorTab} title="Seleccionar vista">

              <Text weight="semibold" size={400}>

                {nombresVistaTrabajos[activeView]}

              </Text>

              <ChevronDown16Regular />

            </div>

          </MenuTrigger>

          <MenuPopover>

            <MenuList className={styles.viewMenuPopover}>
              {(['activos', 'pendientes', 'en_progreso'] as VistaTrabajos[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={activeView === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => setActiveView(v)}
                >
                  {nombresVistaTrabajos[v]}
                </MenuItem>
              ))}
              <MenuDivider />
              {(['finalizados_mes', 'finalizados_3meses'] as VistaTrabajos[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={activeView === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => setActiveView(v)}
                >
                  {nombresVistaTrabajos[v]}
                </MenuItem>
              ))}
            </MenuList>

          </MenuPopover>

        </Menu>



        <div className={styles.viewToolsRight}>

          <D365TableToolbarTools

            tableRef={tableRef}

            searchValue={searchKeyword}

            onSearchChange={setSearchKeyword}

            searchPlaceholder="Buscar por trabajo, N° WO IBS, servicio, cliente..."

          />

        </div>

      </div>



      {/* 3. Tabla Avanzada D365 */}

      <D365EntityTable<TrabajoListadoItemDto>

        ref={tableRef}

        items={filteredTrabajos}

        columns={columns}

        loading={loading}

        error={error}

        onRetry={cargarDatos}

        selectionMode="multiselect"

        selectedItems={selectedIds}

        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}

        onRowDoubleClick={(item) => navigate(`/servicio-campo/ordenes/${item.ordenTrabajoId}`)}

        filterFields={filterFields}

        entityName="trabajos"

        tableId="trabajos-grid"

      />



      {/* 4. Barra de Estado Inferior */}

      <footer className={styles.footer}>

        <div>

          1-{filteredTrabajos.length} de {filteredTrabajos.length}

          {selectedIds.size > 0 && ` (${selectedIds.size} seleccionados)`}

        </div>

        <div>Página 1</div>

      </footer>



      {/* 5. Drawer de Importación Siebel / IBS */}

      <ImportarSiebelDrawer

        open={importarSiebelOpen}

        onOpenChange={setImportarSiebelOpen}

        onSuccess={() => void cargarDatos()}

      />

    </div>

  );

};

export default TrabajosListPage;

