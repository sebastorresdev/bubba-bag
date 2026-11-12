import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  ProgressBar,
  Spinner,
  Dropdown,
  Option,
  Badge,
} from '@fluentui/react-components';
import {
  ClipboardTask24Regular,
  CalendarToday24Regular,
  PlayCircle24Regular,
  CheckmarkCircle24Regular,
  Add16Regular,
  ArrowRight16Regular,
  Box20Regular,
  VehicleCarProfile20Regular,
  ArrowClockwise16Regular,
  DocumentTable20Regular,
  Person16Regular,
  Alert16Regular,
  Board24Regular,
  CalendarClock20Regular,
  ChevronRight16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import { useD365ListStyles } from '../../../styles/d365ListStyles';
import { OrdenTrabajoService } from '../../servicio-campo/ordenes-trabajo/services/ordenTrabajo.service';
import type { OrdenTrabajoListadoItemDto } from '../../servicio-campo/ordenes-trabajo/types/ordenTrabajo.types';
import { D365StatusBadge } from '../../../components/common/D365StatusBadge';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  content: {
    padding: '20px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    maxWidth: '1600px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    padding: '16px 20px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease, transform 0.15s ease',
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
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiIconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: '28px',
    lineHeight: '34px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '1.85fr 1.15fr',
    gap: '20px',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  },
  sectionCard: {
    padding: '20px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    boxShadow: tokens.shadow2,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableTh: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    borderBottom: `2px solid ${tokens.colorNeutralStroke2}`,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    textAlign: 'left',
  },
  tableRow: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  tableCell: {
    padding: '10px 12px',
    fontSize: '13px',
  },
  emptyStateBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px 20px',
    gap: '10px',
    textAlign: 'center',
  },
  emptyStateIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  quickActionBtn: {
    justifyContent: 'space-between',
    padding: '12px 14px',
    height: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    backgroundColor: tokens.colorNeutralBackground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
});

const PERIODO_LABELS: Record<'hoy' | '7dias' | 'mes' | 'todos', string> = {
  hoy: 'Jornada de Hoy',
  '7dias': 'Últimos 7 días',
  mes: 'Mes actual',
  todos: 'Histórico Completo',
};

export const DashboardPage: React.FC = () => {
  const styles = useStyles();
  const listStyles = useD365ListStyles();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'hoy' | '7dias' | 'mes' | 'todos'>('mes');
  const [todasOrdenes, setTodasOrdenes] = useState<OrdenTrabajoListadoItemDto[]>([]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await OrdenTrabajoService.obtenerOrdenes({ vista: 'todas' });
      setTodasOrdenes(data);
    } catch (err) {
      console.error('Error cargando datos del dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  // Filtrado reactivo por periodo
  const ordenesPeriodo = useMemo(() => {
    const ahora = new Date();
    const hoyStr = ahora.toISOString().slice(0, 10);

    if (periodo === 'hoy') {
      return todasOrdenes.filter(
        (o) => o.fechaProgramada === hoyStr || o.fechaCreacion.toString().slice(0, 10) === hoyStr
      );
    }
    if (periodo === '7dias') {
      const limite = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      return todasOrdenes.filter((o) => new Date(o.fechaCreacion) >= limite);
    }
    if (periodo === 'mes') {
      const limiteMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return todasOrdenes.filter((o) => new Date(o.fechaCreacion) >= limiteMes);
    }
    return todasOrdenes;
  }, [todasOrdenes, periodo]);

  // Métricas
  const hoyStr = new Date().toISOString().slice(0, 10);
  const citasHoy = todasOrdenes.filter((o) => o.fechaProgramada === hoyStr);
  const enProgreso = todasOrdenes.filter((o) => o.estadoSistema === 'EnProgreso');
  const pendientes = ordenesPeriodo.filter((o) => o.estadoSistema === 'PendienteProgramar');
  const programadas = ordenesPeriodo.filter((o) => o.estadoSistema === 'Programado');
  const completadas = ordenesPeriodo.filter((o) => o.estadoSistema === 'Completado');

  const totalPuntos = ordenesPeriodo.reduce((acc, o) => acc + (Number(o.totalPuntos) || 0), 0);
  const efectividad = ordenesPeriodo.length > 0
    ? Math.round((completadas.length / ordenesPeriodo.length) * 100)
    : 0;

  // Ranking de Técnicos en el Periodo
  const rankingTecnicos = useMemo(() => {
    const mapa = new Map<string, { nombre: string; ordenes: number; completadas: number; puntos: number }>();

    ordenesPeriodo.forEach((o) => {
      const tec = o.recursoTecnicoNombre || 'Sin Asignar';
      if (!mapa.has(tec)) {
        mapa.set(tec, { nombre: tec, ordenes: 0, completadas: 0, puntos: 0 });
      }
      const item = mapa.get(tec)!;
      item.ordenes += 1;
      item.puntos += Number(o.totalPuntos) || 0;
      if (o.estadoSistema === 'Completado') item.completadas += 1;
    });

    return Array.from(mapa.values())
      .filter((t) => t.nombre !== 'Sin Asignar')
      .sort((a, b) => b.puntos - a.puntos)
      .slice(0, 5);
  }, [ordenesPeriodo]);

  // Desglose por Tipo de Servicio
  const desgloseServicios = useMemo(() => {
    const mapa = new Map<string, number>();
    ordenesPeriodo.forEach((o) => {
      const tipo = o.tipoOrdenNombre || 'Servicio General';
      mapa.set(tipo, (mapa.get(tipo) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([tipo, count]) => ({ tipo, count, porcentaje: Math.round((count / (ordenesPeriodo.length || 1)) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [ordenesPeriodo]);

  // Citas con Alerta (SLA en riesgo o vencidas)
  const citasAlerta = useMemo(() => {
    return todasOrdenes.filter((o) => {
      if (!o.fechaProgramada) return false;
      if (o.estadoSistema === 'Completado' || o.estadoSistema === 'Cancelado') return false;
      return o.fechaProgramada <= hoyStr;
    }).slice(0, 5);
  }, [todasOrdenes, hoyStr]);

  const kpis = [
    {
      title: 'Órdenes en Periodo',
      value: ordenesPeriodo.length,
      subtitle: `${pendientes.length} por programar · ${programadas.length} agendadas`,
      icon: <ClipboardTask24Regular style={{ color: tokens.colorBrandForeground1 }} />,
      bgIcon: tokens.colorBrandBackground2,
      accentColor: tokens.colorBrandStroke1,
    },
    {
      title: 'Citas para Hoy',
      value: citasHoy.length,
      subtitle: `${citasHoy.filter((c) => c.estadoSistema === 'Completado').length} finalizadas hoy`,
      icon: <CalendarToday24Regular style={{ color: '#8764b8' }} />,
      bgIcon: tokens.colorNeutralBackground3,
      accentColor: '#8764b8',
    },
    {
      title: 'En Curso (Campo)',
      value: enProgreso.length,
      subtitle: 'Técnicos realizando labor en vivo',
      icon: <PlayCircle24Regular style={{ color: tokens.colorPaletteBlueForeground2 }} />,
      bgIcon: tokens.colorNeutralBackground3,
      accentColor: tokens.colorPaletteBlueBorderActive,
    },
    {
      title: 'Efectividad y Cierre',
      value: `${efectividad}%`,
      subtitle: `${completadas.length} completadas de ${ordenesPeriodo.length}`,
      icon: <CheckmarkCircle24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />,
      bgIcon: tokens.colorNeutralBackground3,
      accentColor: tokens.colorPaletteGreenBorderActive,
    },
  ];

  return (
    <div className={styles.container}>
      {/* 1. D365 Command Bar Oficial */}
      <D365CommandBar ariaLabel="Comandos del Panel de Control">
        <D365CommandButton
          tone="create"
          icon={<Add16Regular />}
          onClick={() => navigate('/servicio-campo/ordenes/nuevo')}
        >
          Nueva Orden
        </D365CommandButton>
        <D365CommandButton
          icon={<ArrowClockwise16Regular />}
          onClick={() => void cargarDatos()}
          disabled={loading}
        >
          Actualizar
        </D365CommandButton>
        <D365CommandButton
          icon={<DocumentTable20Regular />}
          onClick={() => navigate('/servicio-campo/reportes')}
        >
          Centro de Reportes
        </D365CommandButton>
        <D365CommandButton
          icon={<CalendarToday24Regular />}
          onClick={() => navigate('/servicio-campo/programacion')}
        >
          Tablero de Programación
        </D365CommandButton>
      </D365CommandBar>

      {/* 2. D365 View Header */}
      <div className={listStyles.viewHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Board24Regular style={{ color: tokens.colorBrandForeground1 }} />
          <div>
            <Text size={400} weight="semibold" block>
              Panel de Control de Supervisión
            </Text>
            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
              Dynamics 365 Field Service &bull; Visión ejecutiva y analítica de campo
            </Text>
          </div>
        </div>

        {/* Selector de Periodo con Fluent UI Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
            Periodo analizado:
          </Text>
          <Dropdown
            size="small"
            value={PERIODO_LABELS[periodo]}
            selectedOptions={[periodo]}
            onOptionSelect={(_, data) => {
              if (data.optionValue) setPeriodo(data.optionValue as any);
            }}
            style={{ minWidth: '170px' }}
          >
            <Option value="hoy" text="Jornada de Hoy">Jornada de Hoy</Option>
            <Option value="7dias" text="Últimos 7 días">Últimos 7 días</Option>
            <Option value="mes" text="Mes actual">Mes actual</Option>
            <Option value="todos" text="Histórico Completo">Histórico Completo</Option>
          </Dropdown>
          <Badge appearance="tint" color="brand" style={{ padding: '6px 12px' }}>
            {totalPuntos} pts acumulados
          </Badge>
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <Spinner label="Consolidando métricas operativas de campo..." />
          </div>
        ) : (
          <>
            {/* 3. Tarjetas KPI */}
            <div className={styles.kpiGrid}>
              {kpis.map((kpi, idx) => (
                <div key={idx} className={styles.kpiCard}>
                  <div className={styles.kpiAccent} style={{ backgroundColor: kpi.accentColor }} />
                  <div className={styles.kpiHeader}>
                    <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
                      {kpi.title}
                    </Text>
                    <div className={styles.kpiIconWrapper} style={{ backgroundColor: kpi.bgIcon }}>
                      {kpi.icon}
                    </div>
                  </div>
                  <div className={styles.kpiValue}>
                    {kpi.value}
                  </div>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {kpi.subtitle}
                  </Text>
                </div>
              ))}
            </div>

            {/* 4. Layout Principal */}
            <div className={styles.twoColumnLayout}>
              {/* Columna Izquierda: Órdenes Recientes y Ranking Técnico */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Órdenes en Operación */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text size={400} weight="semibold">
                          Órdenes en Operación
                        </Text>
                        <Badge appearance="tint" color="brand">
                          {ordenesPeriodo.length}
                        </Badge>
                      </div>
                      <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                        Monitoreo de citas y estados en tiempo real
                      </Text>
                    </div>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ArrowRight16Regular />}
                      iconPosition="after"
                      onClick={() => navigate('/servicio-campo/ordenes')}
                    >
                      Ver grilla completa
                    </Button>
                  </div>

                  {ordenesPeriodo.length === 0 ? (
                    <div className={styles.emptyStateBox}>
                      <div className={styles.emptyStateIcon}>
                        <ClipboardTask24Regular style={{ color: tokens.colorNeutralForeground3 }} />
                      </div>
                      <Text size={300} weight="semibold" style={{ color: tokens.colorNeutralForeground1 }}>
                        No hay órdenes registradas para el periodo seleccionado
                      </Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3, maxWidth: '400px' }}>
                        Las órdenes de trabajo creadas o programadas en este rango de fechas se listarán aquí automáticamente.
                      </Text>
                      <Button
                        appearance="outline"
                        size="small"
                        icon={<Add16Regular />}
                        onClick={() => navigate('/servicio-campo/ordenes/nuevo')}
                        style={{ marginTop: '4px' }}
                      >
                        Crear Orden de Trabajo
                      </Button>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.tableTh}>Código WO</th>
                            <th className={styles.tableTh}>Cliente / Abonado</th>
                            <th className={styles.tableTh}>Técnico</th>
                            <th className={styles.tableTh}>Fecha Cita</th>
                            <th className={styles.tableTh}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ordenesPeriodo.slice(0, 6).map((o) => (
                            <tr
                              key={o.id}
                              className={styles.tableRow}
                              onClick={() => navigate(`/servicio-campo/ordenes/${o.id}`)}
                            >
                              <td className={styles.tableCell}>
                                <Text size={200} weight="semibold" style={{ color: tokens.colorBrandForeground1 }}>
                                  {o.codigoWo}
                                </Text>
                              </td>
                              <td className={styles.tableCell}>
                                <Text size={200} block style={{ maxWidth: '190px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {o.clienteServicioNombre || o.clienteFacturacionNombre}
                                </Text>
                              </td>
                              <td className={styles.tableCell}>
                                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                                  {o.recursoTecnicoNombre || 'Sin asignar'}
                                </Text>
                              </td>
                              <td className={styles.tableCell}>
                                <Text size={200}>
                                  {o.fechaProgramada || 'Por programar'}
                                </Text>
                              </td>
                              <td className={styles.tableCell}>
                                <D365StatusBadge status={o.estadoSistema} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Ranking de Productividad por Técnico */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <Text size={400} weight="semibold" block>
                        Top Técnicos en Rendimiento
                      </Text>
                      <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                        Puntos técnicos acumulados y efectividad de liquidación
                      </Text>
                    </div>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ArrowRight16Regular />}
                      iconPosition="after"
                      onClick={() => navigate('/servicio-campo/reportes')}
                    >
                      Ver informe completo
                    </Button>
                  </div>

                  {rankingTecnicos.length === 0 ? (
                    <div className={styles.emptyStateBox}>
                      <div className={styles.emptyStateIcon}>
                        <Person16Regular style={{ color: tokens.colorNeutralForeground3 }} />
                      </div>
                      <Text size={300} weight="semibold" style={{ color: tokens.colorNeutralForeground1 }}>
                        Sin asignaciones técnicas registradas
                      </Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        No se registran órdenes asignadas a técnicos en el periodo seleccionado.
                      </Text>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {rankingTecnicos.map((t, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            padding: '8px 12px',
                            backgroundColor: tokens.colorNeutralBackground2,
                            borderRadius: '6px',
                            border: `1px solid ${tokens.colorNeutralStroke2}`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px' }}>
                            <Badge appearance="filled" color={idx === 0 ? 'brand' : 'subtle'} size="small">
                              #{idx + 1}
                            </Badge>
                            <Text size={200} weight="semibold">{t.nombre}</Text>
                          </div>
                          <div style={{ flexGrow: 1, maxWidth: '220px' }}>
                            <ProgressBar
                              value={t.ordenes > 0 ? t.completadas / t.ordenes : 0}
                              color={t.completadas === t.ordenes ? 'success' : 'brand'}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '140px', justifyContent: 'flex-end' }}>
                            <Badge appearance="tint" color="subtle">
                              {t.completadas}/{t.ordenes} WOs
                            </Badge>
                            <Text size={200} weight="bold" style={{ color: tokens.colorBrandForeground1 }}>
                              {t.puntos} pts
                            </Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Alertas SLA, Desglose y Accesos Rápidos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Alertas SLA / Citas en Riesgo */}
                <div className={styles.sectionCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Alert16Regular style={{ color: tokens.colorPaletteDarkOrangeForeground1 }} />
                    <Text size={300} weight="semibold">
                      Citas Críticas / Requieren Atención ({citasAlerta.length})
                    </Text>
                  </div>
                  {citasAlerta.length === 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        backgroundColor: tokens.colorNeutralBackground2,
                        borderRadius: '6px',
                        border: `1px solid ${tokens.colorNeutralStroke2}`,
                      }}
                    >
                      <CheckmarkCircle24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
                      <div>
                        <Text size={200} weight="semibold" block style={{ color: tokens.colorPaletteGreenForeground1 }}>
                          Sin alertas de programación
                        </Text>
                        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                          Todas las citas se encuentran al día según su programación y SLA.
                        </Text>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {citasAlerta.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            padding: '10px 12px',
                            backgroundColor: tokens.colorNeutralBackground2,
                            borderLeft: `3px solid ${tokens.colorPaletteDarkOrangeForeground1}`,
                            borderRadius: '4px',
                            borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
                            borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
                            borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/servicio-campo/ordenes/${c.id}`)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text size={200} weight="semibold" style={{ color: tokens.colorBrandForeground1 }}>
                              {c.codigoWo}
                            </Text>
                            <Badge size="small" appearance="tint" color="warning">
                              {c.fechaProgramada}
                            </Badge>
                          </div>
                          <Text size={100} block style={{ color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                            {c.clienteServicioNombre} &bull; {c.recursoTecnicoNombre || 'Sin técnico'}
                          </Text>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desglose por Tipo de Servicio */}
                <div className={styles.sectionCard}>
                  <Text size={300} weight="semibold" block style={{ marginBottom: '14px' }}>
                    Distribución de Servicios
                  </Text>
                  {desgloseServicios.length === 0 ? (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Sin datos de tipos de orden en este periodo.
                    </Text>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {desgloseServicios.map((s, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <Text size={200}>{s.tipo}</Text>
                            <Text size={200} weight="semibold">{s.count} ({s.porcentaje}%)</Text>
                          </div>
                          <ProgressBar value={s.porcentaje / 100} color="brand" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Accesos Rápidos de Supervisión */}
                <div className={styles.sectionCard}>
                  <Text size={300} weight="semibold" block style={{ marginBottom: '14px' }}>
                    Accesos Rápidos de Supervisión
                  </Text>
                  <div className={styles.quickActionGrid}>
                    <Button
                      className={styles.quickActionBtn}
                      appearance="subtle"
                      icon={<DocumentTable20Regular style={{ color: tokens.colorBrandForeground1 }} />}
                      onClick={() => navigate('/servicio-campo/reportes')}
                    >
                      <span style={{ flexGrow: 1, textAlign: 'left', marginLeft: '6px' }}>Centro de Reportes y Liquidación</span>
                      <ChevronRight16Regular style={{ color: tokens.colorNeutralForeground4 }} />
                    </Button>
                    <Button
                      className={styles.quickActionBtn}
                      appearance="subtle"
                      icon={<CalendarToday24Regular style={{ color: '#8764b8' }} />}
                      onClick={() => navigate('/servicio-campo/mis-citas')}
                    >
                      <span style={{ flexGrow: 1, textAlign: 'left', marginLeft: '6px' }}>Mis Citas de Hoy (Móvil Técnico)</span>
                      <ChevronRight16Regular style={{ color: tokens.colorNeutralForeground4 }} />
                    </Button>
                    <Button
                      className={styles.quickActionBtn}
                      appearance="subtle"
                      icon={<CalendarClock20Regular style={{ color: tokens.colorPaletteBlueForeground2 }} />}
                      onClick={() => navigate('/servicio-campo/programacion')}
                    >
                      <span style={{ flexGrow: 1, textAlign: 'left', marginLeft: '6px' }}>Tablero de Programación de Rutas</span>
                      <ChevronRight16Regular style={{ color: tokens.colorNeutralForeground4 }} />
                    </Button>
                    <Button
                      className={styles.quickActionBtn}
                      appearance="subtle"
                      icon={<VehicleCarProfile20Regular style={{ color: tokens.colorPaletteDarkOrangeForeground1 }} />}
                      onClick={() => navigate('/servicio-campo/despacho-tecnicos')}
                    >
                      <span style={{ flexGrow: 1, textAlign: 'left', marginLeft: '6px' }}>Despacho de Materiales a Técnicos</span>
                      <ChevronRight16Regular style={{ color: tokens.colorNeutralForeground4 }} />
                    </Button>
                    <Button
                      className={styles.quickActionBtn}
                      appearance="subtle"
                      icon={<Box20Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />}
                      onClick={() => navigate('/servicio-campo/inventario-productos')}
                    >
                      <span style={{ flexGrow: 1, textAlign: 'left', marginLeft: '6px' }}>Stock e Inventario por Almacén</span>
                      <ChevronRight16Regular style={{ color: tokens.colorNeutralForeground4 }} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
