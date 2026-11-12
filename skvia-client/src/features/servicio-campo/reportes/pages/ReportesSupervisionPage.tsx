import React, { useState, useEffect, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  TabList,
  Tab,
  Dropdown,
  Option,
  Button,
  Badge,
  ProgressBar,
  Spinner,
} from '@fluentui/react-components';
import {
  DocumentTable20Regular,
  ArrowDownload16Regular,
  ArrowClockwise16Regular,
  Person16Regular,
  Filter16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { OrdenTrabajoService } from '../../ordenes-trabajo/services/ordenTrabajo.service';
import type { OrdenTrabajoListadoItemDto, TrabajoListadoItemDto } from '../../ordenes-trabajo/types/ordenTrabajo.types';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { exportToExcel, type ExportColumn } from '../../../../utils/exportUtils';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    overflowY: 'auto',
  },
  content: {
    padding: '20px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '1440px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
  },
  filterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  kpiBox: {
    padding: '14px 18px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'box-shadow 0.15s ease',
    ':hover': {
      boxShadow: tokens.shadow4,
    },
  },
  kpiAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
  },
  tableWrapper: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    overflow: 'hidden',
    boxShadow: tokens.shadow2,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    borderBottom: `2px solid ${tokens.colorNeutralStroke2}`,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  td: {
    padding: '10px 14px',
    fontSize: '13px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  rowHover: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
});

export interface TecnicoProductividad {
  recursoId?: string;
  nombre: string;
  totalAsignadas: number;
  completadas: number;
  enProgreso: number;
  pendientes: number;
  canceladasORechazadas: number;
  totalPuntos: number;
  tasaEfectividad: number;
}

const PERIODO_LABELS: Record<'hoy' | '7dias' | 'mes' | 'todos', string> = {
  hoy: 'Hoy',
  '7dias': 'Últimos 7 días',
  mes: 'Mes actual',
  todos: 'Todo el historial',
};

const ESTADO_LABELS: Record<string, string> = {
  todos: 'Todos los estados',
  Completado: 'Completadas',
  EnProgreso: 'En Progreso',
  Programado: 'Programadas',
  PendienteProgramar: 'Sin Programar',
  Cancelado: 'Canceladas',
};

export const ReportesSupervisionPage: React.FC = () => {
  const styles = useStyles();
  const listStyles = useD365ListStyles();

  const [activeTab, setActiveTab] = useState<'productividad' | 'ordenes' | 'trabajos'>('productividad');
  const [loading, setLoading] = useState(true);
  const [ordenes, setOrdenes] = useState<OrdenTrabajoListadoItemDto[]>([]);
  const [trabajos, setTrabajos] = useState<TrabajoListadoItemDto[]>([]);

  // Filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoy' | '7dias' | 'mes' | 'todos'>('mes');
  const [filtroSede, setFiltroSede] = useState<string>('todas');
  const [filtroTecnico, setFiltroTecnico] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ord, trab] = await Promise.all([
        OrdenTrabajoService.obtenerOrdenes({ vista: 'todas' }),
        OrdenTrabajoService.obtenerTrabajos({ vista: 'todos' }),
      ]);
      setOrdenes(ord);
      setTrabajos(trab);
    } catch (e) {
      console.error('Error cargando datos para reportes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  // Extraer sedes y técnicos disponibles para los selects
  const sedesDisponibles = useMemo(() => {
    const set = new Set<string>();
    ordenes.forEach((o) => {
      if (o.unidadOrganizativaNombre) set.add(o.unidadOrganizativaNombre);
    });
    return Array.from(set).sort();
  }, [ordenes]);

  const tecnicosDisponibles = useMemo(() => {
    const set = new Set<string>();
    ordenes.forEach((o) => {
      if (o.recursoTecnicoNombre) set.add(o.recursoTecnicoNombre);
    });
    return Array.from(set).sort();
  }, [ordenes]);

  // Filtrado de órdenes según controles
  const ordenesFiltradas = useMemo(() => {
    let result = [...ordenes];
    const ahora = new Date();
    const hoyStr = ahora.toISOString().slice(0, 10);

    // Filtro Periodo
    if (filtroPeriodo === 'hoy') {
      result = result.filter((o) => o.fechaProgramada === hoyStr || o.fechaCreacion.toString().slice(0, 10) === hoyStr);
    } else if (filtroPeriodo === '7dias') {
      const limite = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((o) => new Date(o.fechaCreacion) >= limite);
    } else if (filtroPeriodo === 'mes') {
      const limiteMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      result = result.filter((o) => new Date(o.fechaCreacion) >= limiteMes);
    }

    // Filtro Sede
    if (filtroSede !== 'todas') {
      result = result.filter((o) => o.unidadOrganizativaNombre === filtroSede);
    }

    // Filtro Técnico
    if (filtroTecnico !== 'todos') {
      result = result.filter((o) => o.recursoTecnicoNombre === filtroTecnico);
    }

    // Filtro Estado
    if (filtroEstado !== 'todos') {
      result = result.filter((o) => o.estadoSistema === filtroEstado);
    }

    return result;
  }, [ordenes, filtroPeriodo, filtroSede, filtroTecnico, filtroEstado]);

  // Consolidar Productividad por Técnico
  const tablaProductividad = useMemo<TecnicoProductividad[]>(() => {
    const mapa = new Map<string, TecnicoProductividad>();

    ordenesFiltradas.forEach((o) => {
      const tec = o.recursoTecnicoNombre || 'Sin Asignar';
      if (!mapa.has(tec)) {
        mapa.set(tec, {
          recursoId: o.recursoTecnicoId || undefined,
          nombre: tec,
          totalAsignadas: 0,
          completadas: 0,
          enProgreso: 0,
          pendientes: 0,
          canceladasORechazadas: 0,
          totalPuntos: 0,
          tasaEfectividad: 0,
        });
      }

      const item = mapa.get(tec)!;
      item.totalAsignadas += 1;
      item.totalPuntos += Number(o.totalPuntos) || 0;

      if (o.estadoSistema === 'Completado') {
        item.completadas += 1;
      } else if (o.estadoSistema === 'EnProgreso') {
        item.enProgreso += 1;
      } else if (o.estadoSistema === 'Cancelado' || o.estado === 'Cancelada') {
        item.canceladasORechazadas += 1;
      } else {
        item.pendientes += 1;
      }
    });

    const lista = Array.from(mapa.values());
    lista.forEach((t) => {
      t.tasaEfectividad = t.totalAsignadas > 0 ? Math.round((t.completadas / t.totalAsignadas) * 100) : 0;
    });

    return lista.sort((a, b) => b.totalPuntos - a.totalPuntos || b.completadas - a.completadas);
  }, [ordenesFiltradas]);

  // Métricas Consolidadas Generales
  const totalOrdenes = ordenesFiltradas.length;
  const totalCompletadas = ordenesFiltradas.filter((o) => o.estadoSistema === 'Completado').length;
  const totalPuntosGlobal = ordenesFiltradas.reduce((acc, o) => acc + (Number(o.totalPuntos) || 0), 0);
  const efectividadGlobal = totalOrdenes > 0 ? Math.round((totalCompletadas / totalOrdenes) * 100) : 0;

  // Exportaciones a Excel
  const exportarProductividadExcel = () => {
    const cols: ExportColumn<TecnicoProductividad>[] = [
      { header: 'Técnico Asignado', accessor: (t) => t.nombre },
      { header: 'Órdenes Asignadas', accessor: (t) => t.totalAsignadas },
      { header: 'Completadas', accessor: (t) => t.completadas },
      { header: 'En Curso', accessor: (t) => t.enProgreso },
      { header: 'Pendientes', accessor: (t) => t.pendientes },
      { header: 'Canceladas / Rechazadas', accessor: (t) => t.canceladasORechazadas },
      { header: 'Total Puntos', accessor: (t) => t.totalPuntos },
      { header: '% Efectividad', accessor: (t) => `${t.tasaEfectividad}%` },
    ];
    exportToExcel(tablaProductividad, cols, `Reporte_Productividad_Tecnicos_${new Date().toISOString().slice(0, 10)}`);
  };

  const exportarOrdenesExcel = () => {
    const cols: ExportColumn<OrdenTrabajoListadoItemDto>[] = [
      { header: 'Código WO', accessor: (o) => o.codigoWo },
      { header: 'N° Orden Ext.', accessor: (o) => o.numeroOrden || o.referenciaExterna || '-' },
      { header: 'N° WO IBS', accessor: (o) => o.codigoExternoTrabajo || '-' },
      { header: 'Abonado', accessor: (o) => o.clienteServicioCodigoExterno || o.codigoContrato || '-' },
      { header: 'Tipo Servicio', accessor: (o) => o.tipoOrdenNombre },
      { header: 'Cliente Facturación', accessor: (o) => o.clienteFacturacionNombre },
      { header: 'Contacto / Abonado', accessor: (o) => o.clienteServicioNombre },
      { header: 'Sede / Unidad', accessor: (o) => o.unidadOrganizativaNombre || '-' },
      { header: 'Zona / Territorio', accessor: (o) => o.zonaOperativaNombre || '-' },
      { header: 'Técnico Asignado', accessor: (o) => o.recursoTecnicoNombre || 'Sin Asignar' },
      { header: 'Fecha Cita', accessor: (o) => o.fechaProgramada || '-' },
      { header: 'Bloque Horario', accessor: (o) => o.bloqueHorario || '-' },
      { header: 'Puntos', accessor: (o) => o.totalPuntos },
      { header: 'Estado Sistema', accessor: (o) => o.estadoSistema },
      { header: 'Estado Operativo', accessor: (o) => o.estado },
    ];
    exportToExcel(ordenesFiltradas, cols, `Reporte_Ordenes_Supervision_${new Date().toISOString().slice(0, 10)}`);
  };

  const exportarTrabajosExcel = () => {
    const cols: ExportColumn<TrabajoListadoItemDto>[] = [
      { header: 'Código Trabajo', accessor: (t) => t.codigoTrabajo },
      { header: 'Código WO', accessor: (t) => t.codigoWo },
      { header: 'Cód. Externo IBS', accessor: (t) => t.codigoExterno || '-' },
      { header: 'Servicio / Producto', accessor: (t) => t.productoNombre },
      { header: 'Técnico', accessor: (t) => t.recursoTecnicoNombre || 'Sin Asignar' },
      { header: 'Fecha Cita', accessor: (t) => t.fechaProgramada || '-' },
      { header: 'Puntos', accessor: (t) => t.puntos },
      { header: 'Tarifa Base', accessor: (t) => t.tarifaBase },
      { header: 'Estado Trabajo', accessor: (t) => t.estado },
      { header: 'Tareas Total', accessor: (t) => t.cantidadTareas },
      { header: 'Tareas Hechas', accessor: (t) => t.cantidadTareasCompletadas },
      { header: 'Materiales Usados', accessor: (t) => t.cantidadMateriales },
    ];
    exportToExcel(trabajos, cols, `Reporte_Trabajos_Servicios_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className={styles.container}>
      {/* 1. Barra de Comandos */}
      <D365CommandBar ariaLabel="Comandos de Reportes">
        <D365CommandButton
          icon={<ArrowClockwise16Regular />}
          onClick={() => void cargarDatos()}
          disabled={loading}
        >
          Actualizar Datos
        </D365CommandButton>
        <D365CommandButton
          icon={<ArrowDownload16Regular />}
          onClick={() => {
            if (activeTab === 'productividad') exportarProductividadExcel();
            else if (activeTab === 'ordenes') exportarOrdenesExcel();
            else exportarTrabajosExcel();
          }}
          disabled={loading}
        >
          Exportar a Excel (.xlsx)
        </D365CommandButton>
      </D365CommandBar>

      {/* 2. Encabezado de Vista */}
      <div className={listStyles.viewHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DocumentTable20Regular style={{ color: tokens.colorBrandForeground1 }} />
          <Text size={400} weight="semibold">
            Centro de Reportes y Liquidación Técnica
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TabList
            selectedValue={activeTab}
            onTabSelect={(_, d) => setActiveTab(d.value as any)}
            size="small"
          >
            <Tab value="productividad">Productividad por Técnico</Tab>
            <Tab value="ordenes">Consolidado de Órdenes</Tab>
            <Tab value="trabajos">Trabajos y Servicios</Tab>
          </TabList>
        </div>
      </div>

      <div className={styles.content}>
        {/* 3. Barra de Filtros de Supervisión */}
        <div className={styles.filterBar}>
          <div className={styles.filterItem}>
            <Text size={200} weight="medium">Periodo:</Text>
            <Dropdown
              size="small"
              value={PERIODO_LABELS[filtroPeriodo]}
              selectedOptions={[filtroPeriodo]}
              onOptionSelect={(_, d) => {
                if (d.optionValue) setFiltroPeriodo(d.optionValue as any);
              }}
              style={{ minWidth: '150px' }}
            >
              <Option value="hoy" text="Hoy">Hoy</Option>
              <Option value="7dias" text="Últimos 7 días">Últimos 7 días</Option>
              <Option value="mes" text="Mes actual">Mes actual</Option>
              <Option value="todos" text="Todo el historial">Todo el historial</Option>
            </Dropdown>
          </div>

          <div className={styles.filterItem}>
            <Text size={200} weight="medium">Sede:</Text>
            <Dropdown
              size="small"
              value={filtroSede === 'todas' ? 'Todas las sedes' : filtroSede}
              selectedOptions={[filtroSede]}
              onOptionSelect={(_, d) => {
                if (d.optionValue) setFiltroSede(d.optionValue);
              }}
              style={{ minWidth: '160px' }}
            >
              <Option value="todas" text="Todas las sedes">Todas las sedes</Option>
              {sedesDisponibles.map((s) => (
                <Option key={s} value={s} text={s}>{s}</Option>
              ))}
            </Dropdown>
          </div>

          <div className={styles.filterItem}>
            <Text size={200} weight="medium">Técnico:</Text>
            <Dropdown
              size="small"
              value={filtroTecnico === 'todos' ? 'Todos los técnicos' : filtroTecnico}
              selectedOptions={[filtroTecnico]}
              onOptionSelect={(_, d) => {
                if (d.optionValue) setFiltroTecnico(d.optionValue);
              }}
              style={{ minWidth: '180px' }}
            >
              <Option value="todos" text="Todos los técnicos">Todos los técnicos</Option>
              {tecnicosDisponibles.map((t) => (
                <Option key={t} value={t} text={t}>{t}</Option>
              ))}
            </Dropdown>
          </div>

          <div className={styles.filterItem}>
            <Text size={200} weight="medium">Estado:</Text>
            <Dropdown
              size="small"
              value={ESTADO_LABELS[filtroEstado] || filtroEstado}
              selectedOptions={[filtroEstado]}
              onOptionSelect={(_, d) => {
                if (d.optionValue) setFiltroEstado(d.optionValue);
              }}
              style={{ minWidth: '160px' }}
            >
              <Option value="todos" text="Todos los estados">Todos los estados</Option>
              <Option value="Completado" text="Completadas">Completadas</Option>
              <Option value="EnProgreso" text="En Progreso">En Progreso</Option>
              <Option value="Programado" text="Programadas">Programadas</Option>
              <Option value="PendienteProgramar" text="Sin Programar">Sin Programar</Option>
              <Option value="Cancelado" text="Canceladas">Canceladas</Option>
            </Dropdown>
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              appearance="subtle"
              icon={<Filter16Regular />}
              onClick={() => {
                setFiltroPeriodo('mes');
                setFiltroSede('todas');
                setFiltroTecnico('todos');
                setFiltroEstado('todos');
              }}
            >
              Restablecer Filtros
            </Button>
          </div>
        </div>

        {/* 4. Tarjetas KPI de Resumen */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiBox}>
            <div className={styles.kpiAccent} style={{ backgroundColor: tokens.colorBrandStroke1 }} />
            <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>TOTAL ÓRDENES FILTRADAS</Text>
            <Text size={700} weight="bold">{totalOrdenes}</Text>
          </div>
          <div className={styles.kpiBox}>
            <div className={styles.kpiAccent} style={{ backgroundColor: tokens.colorPaletteGreenBorderActive }} />
            <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>ÓRDENES COMPLETADAS</Text>
            <Text size={700} weight="bold" style={{ color: tokens.colorPaletteGreenForeground1 }}>
              {totalCompletadas}
            </Text>
          </div>
          <div className={styles.kpiBox}>
            <div className={styles.kpiAccent} style={{ backgroundColor: efectividadGlobal >= 80 ? tokens.colorPaletteGreenBorderActive : tokens.colorPaletteDarkOrangeBorderActive }} />
            <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>TASA DE EFECTIVIDAD GLOBAL</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Text size={700} weight="bold">{efectividadGlobal}%</Text>
              <ProgressBar value={efectividadGlobal / 100} color={efectividadGlobal >= 80 ? 'success' : 'warning'} style={{ width: '80px' }} />
            </div>
          </div>
          <div className={styles.kpiBox}>
            <div className={styles.kpiAccent} style={{ backgroundColor: tokens.colorBrandStroke1 }} />
            <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>CARGA TÉCNICA TOTAL</Text>
            <Text size={700} weight="bold" style={{ color: tokens.colorBrandForeground1 }}>
              {totalPuntosGlobal} pts
            </Text>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Spinner label="Consolidando datos de supervisión..." />
          </div>
        ) : (
          <>
            {/* TAB 1: PRODUCTIVIDAD POR TÉCNICO */}
            {activeTab === 'productividad' && (
              <div className={styles.tableWrapper}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text size={300} weight="semibold">
                    Liquidación Técnica y Rendimiento de Personal ({tablaProductividad.length} técnicos)
                  </Text>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<ArrowDownload16Regular />}
                    onClick={exportarProductividadExcel}
                  >
                    Exportar Tabla
                  </Button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Técnico Asignado</th>
                        <th className={styles.th} style={{ textAlign: 'center' }}>Órdenes</th>
                        <th className={styles.th} style={{ textAlign: 'center' }}>Completadas</th>
                        <th className={styles.th} style={{ textAlign: 'center' }}>En Curso</th>
                        <th className={styles.th} style={{ textAlign: 'center' }}>Pendientes</th>
                        <th className={styles.th} style={{ textAlign: 'center' }}>Puntos</th>
                        <th className={styles.th} style={{ minWidth: '160px' }}>Efectividad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tablaProductividad.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                              No hay registros de técnicos para los filtros seleccionados.
                            </Text>
                          </td>
                        </tr>
                      ) : (
                        tablaProductividad.map((t, idx) => (
                          <tr key={idx} className={styles.rowHover}>
                            <td className={styles.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Person16Regular style={{ color: tokens.colorNeutralForeground2 }} />
                                <Text weight="semibold" size={200}>{t.nombre}</Text>
                              </div>
                            </td>
                            <td className={styles.td} style={{ textAlign: 'center' }}>
                              <Badge appearance="tint" color="subtle">{t.totalAsignadas}</Badge>
                            </td>
                            <td className={styles.td} style={{ textAlign: 'center' }}>
                              <Badge appearance="tint" color="success">{t.completadas}</Badge>
                            </td>
                            <td className={styles.td} style={{ textAlign: 'center' }}>
                              <Badge appearance="tint" color="informative">{t.enProgreso}</Badge>
                            </td>
                            <td className={styles.td} style={{ textAlign: 'center' }}>
                              <Badge appearance="tint" color="warning">{t.pendientes}</Badge>
                            </td>
                            <td className={styles.td} style={{ textAlign: 'center' }}>
                              <Text weight="bold" size={200} style={{ color: tokens.colorBrandForeground1 }}>
                                {t.totalPuntos} pts
                              </Text>
                            </td>
                            <td className={styles.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ProgressBar
                                  value={t.tasaEfectividad / 100}
                                  color={t.tasaEfectividad >= 80 ? 'success' : t.tasaEfectividad >= 50 ? 'brand' : 'warning'}
                                  style={{ flexGrow: 1 }}
                                />
                                <Text size={100} weight="semibold" style={{ width: '35px', textAlign: 'right' }}>
                                  {t.tasaEfectividad}%
                                </Text>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: CONSOLIDADO DE ÓRDENES */}
            {activeTab === 'ordenes' && (
              <div className={styles.tableWrapper}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text size={300} weight="semibold">
                    Listado Consolidado de Órdenes ({ordenesFiltradas.length} órdenes)
                  </Text>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<ArrowDownload16Regular />}
                    onClick={exportarOrdenesExcel}
                  >
                    Exportar Tabla
                  </Button>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
                  <table className={styles.table}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th className={styles.th}>Código WO</th>
                        <th className={styles.th}>N° IBS</th>
                        <th className={styles.th}>Tipo Servicio</th>
                        <th className={styles.th}>Cliente / Abonado</th>
                        <th className={styles.th}>Técnico Asignado</th>
                        <th className={styles.th}>Fecha Cita</th>
                        <th className={styles.th}>Puntos</th>
                        <th className={styles.th}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenesFiltradas.slice(0, 100).map((o) => (
                        <tr key={o.id} className={styles.rowHover}>
                          <td className={styles.td}>
                            <Text weight="semibold" style={{ color: tokens.colorBrandForeground1 }}>
                              {o.codigoWo}
                            </Text>
                          </td>
                          <td className={styles.td}>
                            <Text size={200} style={{ fontFamily: 'monospace' }}>
                              {o.codigoExternoTrabajo || o.referenciaExterna || '-'}
                            </Text>
                          </td>
                          <td className={styles.td}>
                            <Text size={200}>{o.tipoOrdenNombre}</Text>
                          </td>
                          <td className={styles.td}>
                            <Text size={200} block style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {o.clienteServicioNombre || o.clienteFacturacionNombre}
                            </Text>
                          </td>
                          <td className={styles.td}>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                              {o.recursoTecnicoNombre || 'Sin Asignar'}
                            </Text>
                          </td>
                          <td className={styles.td}>
                            <Text size={200}>{o.fechaProgramada || '-'}</Text>
                          </td>
                          <td className={styles.td}>
                            <Text size={200} weight="semibold">{o.totalPuntos} pts</Text>
                          </td>
                          <td className={styles.td}>
                            <D365StatusBadge status={o.estadoSistema} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: TRABAJOS Y SERVICIOS */}
            {activeTab === 'trabajos' && (
              <div className={styles.tableWrapper}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text size={300} weight="semibold">
                    Listado Detallado de Trabajos y Tareas ({trabajos.length} trabajos)
                  </Text>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<ArrowDownload16Regular />}
                    onClick={exportarTrabajosExcel}
                  >
                    Exportar Tabla
                  </Button>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
                  <table className={styles.table}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th className={styles.th}>Código Trabajo</th>
                        <th className={styles.th}>Código WO</th>
                        <th className={styles.th}>Cód. IBS</th>
                        <th className={styles.th}>Servicio Técnico</th>
                        <th className={styles.th}>Técnico</th>
                        <th className={styles.th}>Puntos</th>
                        <th className={styles.th}>Subtareas</th>
                        <th className={styles.th}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trabajos.slice(0, 100).map((t) => (
                        <tr key={t.id} className={styles.rowHover}>
                          <td className={styles.td}>
                            <Text weight="semibold" style={{ color: tokens.colorBrandForeground1 }}>
                              {t.codigoTrabajo}
                            </Text>
                          </td>
                          <td className={styles.td}>
                            <Text size={200}>{t.codigoWo}</Text>
                          </td>
                          <td className={styles.td}>
                            <Text size={200} style={{ fontFamily: 'monospace' }}>
                              {t.codigoExterno || '-'}
                            </Text>
                          </td>
                          <td className={styles.td}>
                            <Text size={200} block style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.productoNombre}
                            </Text>
                          </td>
                          <td className={styles.td}>
                            <Text size={200}>{t.recursoTecnicoNombre || 'Sin Asignar'}</Text>
                          </td>
                          <td className={styles.td}>
                            <Text size={200} weight="semibold">{t.puntos} pts</Text>
                          </td>
                          <td className={styles.td}>
                            <Badge appearance="tint" color={t.cantidadTareasCompletadas === t.cantidadTareas && t.cantidadTareas > 0 ? 'success' : 'subtle'}>
                              {t.cantidadTareasCompletadas} / {t.cantidadTareas}
                            </Badge>
                          </td>
                          <td className={styles.td}>
                            <D365StatusBadge status={t.estado} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
