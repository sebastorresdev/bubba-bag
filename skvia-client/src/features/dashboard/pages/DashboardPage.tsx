import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Card,
  Button,
  ProgressBar,
  Spinner,
  Select,
  Badge,
} from '@fluentui/react-components';
import {
  ClipboardTask24Regular,
  CalendarToday24Regular,
  PlayCircle24Regular,
  CheckmarkCircle24Regular,
  Add20Regular,
  ArrowRight16Regular,
  Box20Regular,
  VehicleCarProfile20Regular,
  ArrowClockwise16Regular,
  DocumentTable20Regular,
  Person16Regular,
  Alert16Regular,
} from '@fluentui/react-icons';
import { OrdenTrabajoService } from '../../servicio-campo/ordenes-trabajo/services/ordenTrabajo.service';
import type { OrdenTrabajoListadoItemDto } from '../../servicio-campo/ordenes-trabajo/types/ordenTrabajo.types';
import { D365StatusBadge } from '../../../components/common/D365StatusBadge';

const useStyles = makeStyles({
  container: {
    padding: '24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1440px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
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
    gap: '8px',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiIconWrapper: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '1.9fr 1.1fr',
    gap: '20px',
    '@media (max-width: 950px)': {
      gridTemplateColumns: '1fr',
    },
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
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
  quickActionGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  quickActionBtn: {
    justifyContent: 'flex-start',
    padding: '12px 16px',
    height: 'auto',
  },
});

export const DashboardPage: React.FC = () => {
  const styles = useStyles();
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
      subtitle: `${pendientes.length} por programar / ${programadas.length} agendadas`,
      icon: <ClipboardTask24Regular style={{ color: '#0f6cbd' }} />,
      bgIcon: '#ebf3fc',
    },
    {
      title: 'Citas para Hoy',
      value: citasHoy.length,
      subtitle: `${citasHoy.filter((c) => c.estadoSistema === 'Completado').length} finalizadas hoy`,
      icon: <CalendarToday24Regular style={{ color: '#8764b8' }} />,
      bgIcon: '#f3edfc',
    },
    {
      title: 'En Curso (Campo)',
      value: enProgreso.length,
      subtitle: 'Técnicos realizando labor en vivo',
      icon: <PlayCircle24Regular style={{ color: '#0078d4' }} />,
      bgIcon: '#e6f2fb',
    },
    {
      title: 'Efectividad y Cierre',
      value: `${efectividad}%`,
      subtitle: `${completadas.length} completadas de ${ordenesPeriodo.length}`,
      icon: <CheckmarkCircle24Regular style={{ color: '#107c41' }} />,
      bgIcon: '#ebf7ee',
    },
  ];

  return (
    <div className={styles.container}>
      {/* 1. Header */}
      <div className={styles.header}>
        <div>
          <Text size={600} weight="bold" block>
            Panel de Control de Supervisión
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Dynamics 365 Field Service &bull; Visión ejecutiva y analítica de campo
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            appearance="secondary"
            icon={<DocumentTable20Regular />}
            onClick={() => navigate('/servicio-campo/reportes')}
          >
            Centro de Reportes
          </Button>
          <Button
            appearance="subtle"
            icon={<ArrowClockwise16Regular />}
            onClick={() => void cargarDatos()}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            appearance="primary"
            icon={<Add20Regular />}
            onClick={() => navigate('/servicio-campo/ordenes/nuevo')}
          >
            Nueva Orden
          </Button>
        </div>
      </div>

      {/* 2. Barra de Filtro de Periodo */}
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text size={200} weight="semibold">Periodo analizado:</Text>
          <Select
            size="small"
            value={periodo}
            onChange={(_, d) => setPeriodo(d.value as any)}
          >
            <option value="hoy">Jornada de Hoy</option>
            <option value="7dias">Últimos 7 días</option>
            <option value="mes">Mes actual</option>
            <option value="todos">Histórico Completo</option>
          </Select>
        </div>

        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Carga técnica acumulada:{' '}
          <strong style={{ color: tokens.colorBrandForeground1 }}>{totalPuntos} puntos técnicos</strong>
        </Text>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner label="Consolidando métricas operativas..." />
        </div>
      ) : (
        <>
          {/* 3. Tarjetas KPI */}
          <div className={styles.kpiGrid}>
            {kpis.map((kpi, idx) => (
              <div key={idx} className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <Text size={200} weight="medium" style={{ color: tokens.colorNeutralForeground2 }}>
                    {kpi.title}
                  </Text>
                  <div className={styles.kpiIconWrapper} style={{ backgroundColor: kpi.bgIcon }}>
                    {kpi.icon}
                  </div>
                </div>
                <Text size={700} weight="bold" block>
                  {kpi.value}
                </Text>
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  {kpi.subtitle}
                </Text>
              </div>
            ))}
          </div>

          {/* 4. Layout Principal */}
          <div className={styles.twoColumnLayout}>
            {/* Columna Izquierda: Órdenes Recientes y Ranking Técnico */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Órdenes Recientes */}
              <Card style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <Text size={400} weight="semibold" block>
                      Órdenes en Operación ({ordenesPeriodo.length})
                    </Text>
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
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    No hay órdenes registradas para el periodo seleccionado.
                  </Text>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${tokens.colorNeutralStroke2}`, textAlign: 'left' }}>
                          <th className={styles.tableCell}><Text size={200} weight="semibold">Código WO</Text></th>
                          <th className={styles.tableCell}><Text size={200} weight="semibold">Cliente / Abonado</Text></th>
                          <th className={styles.tableCell}><Text size={200} weight="semibold">Técnico</Text></th>
                          <th className={styles.tableCell}><Text size={200} weight="semibold">Fecha Cita</Text></th>
                          <th className={styles.tableCell}><Text size={200} weight="semibold">Estado</Text></th>
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
              </Card>

              {/* Ranking de Productividad por Técnico */}
              <Card style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <Text size={400} weight="semibold" block>
                      Top Técnicos en Rendimiento
                    </Text>
                    <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                      Puntos y efectividad de liquidación en el periodo
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
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    No hay asignaciones técnicas registradas.
                  </Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {rankingTecnicos.map((t, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
                          <Person16Regular style={{ color: tokens.colorBrandForeground1 }} />
                          <Text size={200} weight="semibold">{t.nombre}</Text>
                        </div>
                        <div style={{ flexGrow: 1, maxWidth: '200px' }}>
                          <ProgressBar
                            value={t.ordenes > 0 ? t.completadas / t.ordenes : 0}
                            color={t.completadas === t.ordenes ? 'success' : 'brand'}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '130px', justifyContent: 'flex-end' }}>
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
              </Card>
            </div>

            {/* Columna Derecha: Alertas SLA, Desglose y Accesos Rápidos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Alertas SLA / Citas en Riesgo */}
              <Card style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Alert16Regular style={{ color: tokens.colorPaletteDarkOrangeForeground1 }} />
                  <Text size={300} weight="semibold">
                    Citas Críticas / Requieren Atención ({citasAlerta.length})
                  </Text>
                </div>
                {citasAlerta.length === 0 ? (
                  <Text size={100} style={{ color: tokens.colorPaletteGreenForeground1 }}>
                    ✓ Todas las citas están al día según su programación.
                  </Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {citasAlerta.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: '8px 10px',
                          backgroundColor: tokens.colorNeutralBackground2,
                          borderLeft: `3px solid ${tokens.colorPaletteDarkOrangeForeground1}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/servicio-campo/ordenes/${c.id}`)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text size={200} weight="semibold" style={{ color: tokens.colorBrandForeground1 }}>
                            {c.codigoWo}
                          </Text>
                          <Badge size="small" appearance="tint" color="warning">
                            {c.fechaProgramada}
                          </Badge>
                        </div>
                        <Text size={100} block style={{ color: tokens.colorNeutralForeground3 }}>
                          {c.clienteServicioNombre} &bull; {c.recursoTecnicoNombre || 'Sin técnico'}
                        </Text>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Desglose por Tipo de Servicio */}
              <Card style={{ padding: '20px' }}>
                <Text size={300} weight="semibold" block style={{ marginBottom: '12px' }}>
                  Distribución de Servicios
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {desgloseServicios.map((s, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <Text size={100}>{s.tipo}</Text>
                        <Text size={100} weight="semibold">{s.count} ({s.porcentaje}%)</Text>
                      </div>
                      <ProgressBar value={s.porcentaje / 100} color="brand" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Accesos Rápidos */}
              <Card style={{ padding: '20px' }}>
                <Text size={300} weight="semibold" block style={{ marginBottom: '12px' }}>
                  Accesos Rápidos de Supervisión
                </Text>
                <div className={styles.quickActionGrid}>
                  <Button
                    className={styles.quickActionBtn}
                    appearance="subtle"
                    icon={<DocumentTable20Regular />}
                    onClick={() => navigate('/servicio-campo/reportes')}
                  >
                    Centro de Reportes y Liquidación
                  </Button>
                  <Button
                    className={styles.quickActionBtn}
                    appearance="subtle"
                    icon={<CalendarToday24Regular />}
                    onClick={() => navigate('/servicio-campo/mis-citas')}
                  >
                    Mis Citas de Hoy (Móvil Técnico)
                  </Button>
                  <Button
                    className={styles.quickActionBtn}
                    appearance="subtle"
                    icon={<VehicleCarProfile20Regular />}
                    onClick={() => navigate('/servicio-campo/despacho-tecnicos')}
                  >
                    Despacho de Materiales a Técnicos
                  </Button>
                  <Button
                    className={styles.quickActionBtn}
                    appearance="subtle"
                    icon={<Box20Regular />}
                    onClick={() => navigate('/servicio-campo/inventario-productos')}
                  >
                    Stock e Inventario por Almacén
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
