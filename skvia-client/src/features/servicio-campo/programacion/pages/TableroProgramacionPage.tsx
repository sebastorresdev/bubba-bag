import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Spinner,
  Dropdown,
  Option,
  Badge,
  Input,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
} from '@fluentui/react-components';
import {
  ArrowClockwise16Regular,
  CalendarToday16Regular,
  ChevronLeft16Regular,
  ChevronRight16Regular,
  Search16Regular,
  Person16Regular,
  Clock16Regular,
  VehicleCarProfile16Regular,
  PlayCircle16Regular,
  CheckmarkCircle16Regular,
  DismissCircle16Regular,
  Location16Regular,
  Phone16Regular,
  Open16Regular,
  ChevronUp16Regular,
  ChevronDown16Regular,
  Add16Regular,
  CalendarClock20Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { OrdenTrabajoService } from '../../ordenes-trabajo/services/ordenTrabajo.service';
import { OrganizacionService } from '../../../organizacion/services/organizacion.service';
import type { OrdenTrabajoListadoItemDto } from '../../ordenes-trabajo/types/ordenTrabajo.types';
import type { RecursoDto, UnidadOrganizativaDto } from '../../../organizacion/types/organizacion.types';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';

const HORAS_TIMELINE = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

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
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    width: '100%',
    boxSizing: 'border-box',
  },
  kpiRibbon: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  kpiTile: {
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'relative',
    overflow: 'hidden',
  },
  kpiAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    gap: '12px',
    flexWrap: 'wrap',
    boxShadow: tokens.shadow2,
  },
  filterLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  filterRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '8px 14px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    flexWrap: 'wrap',
    fontSize: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
  },
  // Schedule Board Container
  boardWrapper: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    boxShadow: tokens.shadow2,
    overflow: 'hidden',
  },
  boardHeader: {
    display: 'flex',
    borderBottom: `2px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  resourceHeaderCell: {
    width: '260px',
    minWidth: '260px',
    padding: '10px 14px',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineHeader: {
    flexGrow: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
  },
  timelineHeaderHour: {
    padding: '10px 4px',
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  // Resource Row
  resourceRow: {
    display: 'flex',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: '68px',
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  resourceCell: {
    width: '260px',
    minWidth: '260px',
    padding: '10px 14px',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '4px',
  },
  timelineTrack: {
    flexGrow: 1,
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    minHeight: '68px',
  },
  timelineGridCell: {
    borderRight: `1px solid ${tokens.colorNeutralStroke3}`,
    height: '100%',
  },
  // Appointment Card (Booking Block)
  appointmentCard: {
    position: 'absolute',
    top: '8px',
    bottom: '8px',
    borderRadius: '5px',
    padding: '4px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    overflow: 'hidden',
    boxShadow: tokens.shadow2,
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, z-index 0.15s ease',
    zIndex: 1,
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow4,
      zIndex: 10,
    },
  },
  // Now Indicator
  nowLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: tokens.colorPaletteRedBackground3,
    zIndex: 20,
    pointerEvents: 'none',
  },
  nowBadge: {
    position: 'absolute',
    top: '-8px',
    left: '-18px',
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: tokens.fontWeightBold,
    padding: '1px 4px',
    borderRadius: '3px',
    pointerEvents: 'none',
  },
  // Unscheduled bottom drawer
  unscheduledPanel: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    boxShadow: tokens.shadow2,
    overflow: 'hidden',
  },
  unscheduledHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
  },
});

function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }
  return 0;
}

function calcularPosicionBloque(bloqueHorario?: string | null, indexFallback: number = 0): { left: number; width: number; startText: string; endText: string } {
  const startDay = 7 * 60; // 07:00
  const endDay = 19 * 60;  // 19:00
  const totalMin = endDay - startDay; // 720 minutes

  if (bloqueHorario && bloqueHorario.includes('-')) {
    const [startRaw, endRaw] = bloqueHorario.split('-');
    const startMin = parseTimeToMinutes(startRaw);
    const endMin = parseTimeToMinutes(endRaw);

    if (startMin > 0 && endMin > startMin) {
      const clampedStart = Math.max(startDay, Math.min(endDay, startMin));
      const clampedEnd = Math.max(startDay, Math.min(endDay, endMin));
      const left = ((clampedStart - startDay) / totalMin) * 100;
      const width = Math.max(5, ((clampedEnd - clampedStart) / totalMin) * 100);
      return { left, width, startText: startRaw.trim(), endText: endRaw.trim() };
    }
  }

  // Fallback escalonado si no hay bloque explícito
  const offsets = [60, 180, 300, 420];
  const offsetMin = offsets[indexFallback % offsets.length];
  const fallbackStartMin = startDay + offsetMin;
  const fallbackEndMin = fallbackStartMin + 120; // 2 horas
  const left = ((fallbackStartMin - startDay) / totalMin) * 100;
  const width = (120 / totalMin) * 100;
  const startHour = Math.floor(fallbackStartMin / 60).toString().padStart(2, '0') + ':00';
  const endHour = Math.floor(fallbackEndMin / 60).toString().padStart(2, '0') + ':00';
  return { left, width, startText: startHour, endText: endHour };
}

interface EstadoVisualConfig {
  label: string;
  bg: string;
  border: string;
  textColor: string;
  icon: React.ReactNode;
}

function getEstadoConfig(estadoSistema: string, estadoOperativo?: string): EstadoVisualConfig {
  const st = `${estadoSistema} ${estadoOperativo || ''}`.toLowerCase();

  if (st.includes('complet') || st.includes('finaliz') || st.includes('liquid')) {
    return {
      label: 'Completado',
      bg: '#e6f7ec',
      border: '#107c41',
      textColor: '#0e6233',
      icon: <CheckmarkCircle16Regular style={{ color: '#107c41', fontSize: '13px' }} />,
    };
  }
  if (st.includes('progreso') || st.includes('sitio') || st.includes('curso')) {
    return {
      label: 'En Progreso (En Sitio)',
      bg: '#fef3c7',
      border: '#d97706',
      textColor: '#78350f',
      icon: <PlayCircle16Regular style={{ color: '#d97706', fontSize: '13px' }} />,
    };
  }
  if (st.includes('ruta') || st.includes('camino') || st.includes('traslado')) {
    return {
      label: 'En Ruta',
      bg: '#f3edfc',
      border: '#8764b8',
      textColor: '#581c87',
      icon: <VehicleCarProfile16Regular style={{ color: '#8764b8', fontSize: '13px' }} />,
    };
  }
  if (st.includes('cancel') || st.includes('rechaz') || st.includes('no realiz')) {
    return {
      label: 'Cancelado / No Realizado',
      bg: '#fee2e2',
      border: '#d13438',
      textColor: '#7f1d1d',
      icon: <DismissCircle16Regular style={{ color: '#d13438', fontSize: '13px' }} />,
    };
  }
  // Predeterminado: Programado
  return {
    label: 'Programado',
    bg: '#e0f2fe',
    border: '#0f6cbd',
    textColor: '#0c4a6e',
    icon: <Clock16Regular style={{ color: '#0f6cbd', fontSize: '13px' }} />,
  };
}

export const TableroProgramacionPage: React.FC = () => {
  const styles = useStyles();
  const listStyles = useD365ListStyles();
  const navigate = useNavigate();

  // Estados de datos
  const [loading, setLoading] = useState(true);
  const [todasOrdenes, setTodasOrdenes] = useState<OrdenTrabajoListadoItemDto[]>([]);
  const [tecnicos, setTecnicos] = useState<RecursoDto[]>([]);
  const [sedes, setSedes] = useState<UnidadOrganizativaDto[]>([]);

  // Filtros de fecha y sede
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [filtroSede, setFiltroSede] = useState<string>('todas');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');

  // Detalle lateral de cita seleccionada
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTrabajoListadoItemDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Panel colapsable inferior
  const [mostrarSinAsignar, setMostrarSinAsignar] = useState(true);

  // Carga inicial
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [ordenesData, recursosData, sedesData] = await Promise.all([
        OrdenTrabajoService.obtenerOrdenes({ vista: 'todas' }),
        OrganizacionService.getRecursos(undefined, undefined, true),
        OrganizacionService.getUnidadesOrganizativas(true),
      ]);
      setTodasOrdenes(ordenesData);
      setTecnicos(recursosData);
      setSedes(sedesData);
    } catch (err) {
      console.error('Error cargando datos del tablero de programación:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // Navegación de fechas
  const cambiarDia = (offsetDias: number) => {
    const d = new Date(fechaSeleccionada);
    d.setDate(d.getDate() + offsetDias);
    setFechaSeleccionada(d.toISOString().slice(0, 10));
  };

  const irAHoy = () => {
    setFechaSeleccionada(new Date().toISOString().slice(0, 10));
  };

  // Filtrado de órdenes por fecha
  const ordenesDelDia = useMemo(() => {
    return todasOrdenes.filter((o) => {
      if (!o.fechaProgramada) return false;
      return o.fechaProgramada.slice(0, 10) === fechaSeleccionada;
    });
  }, [todasOrdenes, fechaSeleccionada]);

  // Técnicos filtrados por sede y búsqueda
  const tecnicosFiltrados = useMemo(() => {
    return tecnicos.filter((t) => {
      if (filtroSede !== 'todas' && t.unidadOrganizativaId !== filtroSede) {
        return false;
      }
      if (filtroBusqueda.trim()) {
        const query = filtroBusqueda.toLowerCase();
        const coincideTecnico = t.nombreCompleto.toLowerCase().includes(query) || (t.codigo && t.codigo.toLowerCase().includes(query));
        const tieneOrdenCoincidente = ordenesDelDia.some(
          (o) =>
            o.recursoTecnicoId === t.id &&
            (o.codigoWo.toLowerCase().includes(query) ||
              (o.clienteServicioNombre && o.clienteServicioNombre.toLowerCase().includes(query)))
        );
        if (!coincideTecnico && !tieneOrdenCoincidente) return false;
      }
      return true;
    });
  }, [tecnicos, filtroSede, filtroBusqueda, ordenesDelDia]);

  // Métricas del Ribbon (Estilo Dynamics 365 & Oracle TOA)
  const metricas = useMemo(() => {
    const totalCitas = ordenesDelDia.length;
    let completadas = 0;
    let enProgreso = 0;
    let enRuta = 0;
    let canceladas = 0;
    let programadas = 0;
    let totalPuntos = 0;

    ordenesDelDia.forEach((o) => {
      totalPuntos += Number(o.totalPuntos) || 0;
      const st = `${o.estadoSistema} ${o.estado || ''}`.toLowerCase();
      if (st.includes('complet') || st.includes('finaliz') || st.includes('liquid')) {
        completadas += 1;
      } else if (st.includes('progreso') || st.includes('sitio')) {
        enProgreso += 1;
      } else if (st.includes('ruta') || st.includes('camino')) {
        enRuta += 1;
      } else if (st.includes('cancel') || st.includes('rechaz')) {
        canceladas += 1;
      } else {
        programadas += 1;
      }
    });

    const tecnicosConCitas = new Set(ordenesDelDia.map((o) => o.recursoTecnicoId).filter(Boolean)).size;
    const efectividad = totalCitas > 0 ? Math.round((completadas / totalCitas) * 100) : 0;

    return {
      totalCitas,
      completadas,
      enProgreso,
      enRuta,
      canceladas,
      programadas,
      totalPuntos,
      tecnicosConCitas,
      efectividad,
    };
  }, [ordenesDelDia]);

  // Órdenes sin programar o sin técnico asignado
  const ordenesSinAsignar = useMemo(() => {
    return todasOrdenes.filter((o) => {
      const sinTecnico = !o.recursoTecnicoId;
      const pendiente = o.estadoSistema === 'PendienteProgramar' || !o.fechaProgramada;
      return sinTecnico || pendiente;
    }).slice(0, 30);
  }, [todasOrdenes]);

  // Indicador de "Ahora" (Línea roja actual)
  const ahora = new Date();
  const hoyStr = ahora.toISOString().slice(0, 10);
  const isToday = fechaSeleccionada === hoyStr;
  const nowMin = ahora.getHours() * 60 + ahora.getMinutes();
  const startDayMin = 7 * 60;
  const totalMin = 12 * 60;
  const nowPercentage = ((nowMin - startDayMin) / totalMin) * 100;
  const showNowLine = isToday && nowPercentage >= 0 && nowPercentage <= 100;

  // Formato legible de fecha
  const fechaLegible = useMemo(() => {
    const [y, m, d] = fechaSeleccionada.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [fechaSeleccionada]);

  return (
    <div className={styles.container}>
      {/* 1. D365 Command Bar */}
      <D365CommandBar ariaLabel="Comandos del Tablero de Programación">
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
          icon={<CalendarToday16Regular />}
          onClick={irAHoy}
        >
          Hoy
        </D365CommandButton>
        <D365CommandButton
          icon={<Open16Regular />}
          onClick={() => navigate('/servicio-campo/ordenes')}
        >
          Ver Todas las Órdenes
        </D365CommandButton>
      </D365CommandBar>

      {/* 2. D365 View Header */}
      <div className={listStyles.viewHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarClock20Regular style={{ color: tokens.colorBrandForeground1 }} />
          <div>
            <Text size={400} weight="semibold" block>
              Tablero de Programación y Despacho en Campo
            </Text>
            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
              Dynamics 365 Field Service &bull; Visión Gantt de cuadrillas, rutas y avance en tiempo real
            </Text>
          </div>
        </div>

        {/* Navegador de Fecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            size="small"
            appearance="subtle"
            icon={<ChevronLeft16Regular />}
            onClick={() => cambiarDia(-1)}
            aria-label="Día anterior"
          />
          <Badge appearance="tint" color={isToday ? 'brand' : 'subtle'} style={{ padding: '6px 14px', fontSize: '13px', fontWeight: tokens.fontWeightSemibold }}>
            {fechaLegible.toUpperCase()}
          </Badge>
          <Button
            size="small"
            appearance="subtle"
            icon={<ChevronRight16Regular />}
            onClick={() => cambiarDia(1)}
            aria-label="Día siguiente"
          />
        </div>
      </div>

      <div className={styles.content}>
        {/* 3. Ribbon de Métricas Operativas (Dynamics / Oracle TOA) */}
        <div className={styles.kpiRibbon}>
          <div className={styles.kpiTile}>
            <div className={styles.kpiAccent} style={{ backgroundColor: tokens.colorBrandStroke1 }} />
            <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>TÉCNICOS EN RUTA</Text>
            <Text size={600} weight="bold">{metricas.tecnicosConCitas} / {tecnicos.length}</Text>
          </div>
          <div className={styles.kpiTile}>
            <div className={styles.kpiAccent} style={{ backgroundColor: '#0f6cbd' }} />
            <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>CITAS PROGRAMADAS</Text>
            <Text size={600} weight="bold" style={{ color: '#0f6cbd' }}>{metricas.totalCitas}</Text>
          </div>
          <div className={styles.kpiTile}>
            <div className={styles.kpiAccent} style={{ backgroundColor: '#8764b8' }} />
            <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>EN RUTA / TRASLADO</Text>
            <Text size={600} weight="bold" style={{ color: '#8764b8' }}>{metricas.enRuta}</Text>
          </div>
          <div className={styles.kpiTile}>
            <div className={styles.kpiAccent} style={{ backgroundColor: '#d97706' }} />
            <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>EN SITIO (LABOR)</Text>
            <Text size={600} weight="bold" style={{ color: '#d97706' }}>{metricas.enProgreso}</Text>
          </div>
          <div className={styles.kpiTile}>
            <div className={styles.kpiAccent} style={{ backgroundColor: '#107c41' }} />
            <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>COMPLETADAS</Text>
            <Text size={600} weight="bold" style={{ color: '#107c41' }}>{metricas.completadas}</Text>
          </div>
          <div className={styles.kpiTile}>
            <div className={styles.kpiAccent} style={{ backgroundColor: metricas.efectividad >= 80 ? '#107c41' : '#d97706' }} />
            <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>EFECTIVIDAD DE RUTA</Text>
            <Text size={600} weight="bold">{metricas.efectividad}%</Text>
          </div>
        </div>

        {/* 4. Barra de Filtros y Leyenda */}
        <div className={styles.filterBar}>
          <div className={styles.filterLeft}>
            {/* Filtro por Sede */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Text size={200} weight="medium">Sede / Base:</Text>
              <Dropdown
                size="small"
                value={filtroSede === 'todas' ? 'Todas las sedes' : sedes.find((s) => s.id === filtroSede)?.nombre || filtroSede}
                selectedOptions={[filtroSede]}
                onOptionSelect={(_, d) => {
                  if (d.optionValue) setFiltroSede(d.optionValue);
                }}
                style={{ minWidth: '170px' }}
              >
                <Option value="todas" text="Todas las sedes">Todas las sedes</Option>
                {sedes.map((s) => (
                  <Option key={s.id} value={s.id} text={s.nombre}>{s.nombre}</Option>
                ))}
              </Dropdown>
            </div>

            {/* Búsqueda rápida */}
            <Input
              size="small"
              contentBefore={<Search16Regular />}
              placeholder="Buscar técnico o N° orden..."
              value={filtroBusqueda}
              onChange={(_, d) => setFiltroBusqueda(d.value)}
              style={{ minWidth: '220px' }}
            />
          </div>

          <div className={styles.filterRight}>
            <Badge appearance="tint" color="brand">
              Carga total: {metricas.totalPuntos} pts
            </Badge>
          </div>
        </div>

        {/* Leyenda Oficial de Colores Dynamics 365 / Oracle TOA */}
        <div className={styles.legendBar}>
          <Text size={100} weight="bold" style={{ color: tokens.colorNeutralForeground3 }}>ESTADOS:</Text>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#0f6cbd' }} />
            <span>Programado</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#8764b8' }} />
            <span>En Ruta</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#d97706' }} />
            <span>En Progreso (En Sitio)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#107c41' }} />
            <span>Completado</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#d13438' }} />
            <span>Cancelado / Rechazado</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <Spinner label="Consolidando rutas y agenda de técnicos..." />
          </div>
        ) : (
          <>
            {/* 5. TABLERO DE PROGRAMACIÓN GANTT */}
            <div className={styles.boardWrapper}>
              {/* Encabezado de Horas */}
              <div className={styles.boardHeader}>
                <div className={styles.resourceHeaderCell}>
                  <span>Técnicos ({tecnicosFiltrados.length})</span>
                  <Person16Regular />
                </div>
                <div className={styles.timelineHeader}>
                  {HORAS_TIMELINE.map((hora) => (
                    <div key={hora} className={styles.timelineHeaderHour}>
                      {hora}
                    </div>
                  ))}
                </div>
              </div>

              {/* Filas de Técnicos */}
              {tecnicosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    No hay técnicos registrados o que coincidan con los filtros aplicados.
                  </Text>
                </div>
              ) : (
                tecnicosFiltrados.map((tec) => {
                  // Citas asignadas a este técnico en la fecha seleccionada
                  const citasTecnico = ordenesDelDia.filter((o) => o.recursoTecnicoId === tec.id);
                  const puntosTecnico = citasTecnico.reduce((acc, c) => acc + (Number(c.totalPuntos) || 0), 0);

                  return (
                    <div key={tec.id} className={styles.resourceRow}>
                      {/* Celda del Técnico */}
                      <div className={styles.resourceCell}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text size={200} weight="semibold" block style={{ maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tec.nombreCompleto}
                          </Text>
                          <Badge size="small" appearance="tint" color={citasTecnico.length > 0 ? 'brand' : 'subtle'}>
                            {citasTecnico.length} WO
                          </Badge>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                          <span>{tec.unidadOrganizativaNombre || 'Sin sede'}</span>
                          <span style={{ fontWeight: tokens.fontWeightSemibold }}>{puntosTecnico} pts</span>
                        </div>
                      </div>

                      {/* Carril de Tiempo (Timeline Track) */}
                      <div className={styles.timelineTrack}>
                        {/* Celdas de cuadrícula */}
                        {HORAS_TIMELINE.map((hora) => (
                          <div key={hora} className={styles.timelineGridCell} />
                        ))}

                        {/* Indicador de "Ahora" (Línea roja) */}
                        {showNowLine && (
                          <div className={styles.nowLine} style={{ left: `${nowPercentage}%` }}>
                            <div className={styles.nowBadge}>AHORA</div>
                          </div>
                        )}

                        {/* Bloques de Citas (Bookings) */}
                        {citasTecnico.map((orden, idx) => {
                          const pos = calcularPosicionBloque(orden.bloqueHorario, idx);
                          const cfg = getEstadoConfig(orden.estadoSistema, orden.estado);

                          return (
                            <div
                              key={orden.id}
                              className={styles.appointmentCard}
                              style={{
                                left: `${pos.left}%`,
                                width: `${pos.width}%`,
                                backgroundColor: cfg.bg,
                                borderColor: cfg.border,
                                color: cfg.textColor,
                              }}
                              onClick={() => {
                                setOrdenSeleccionada(orden);
                                setDrawerOpen(true);
                              }}
                              title={`${orden.codigoWo} • ${orden.clienteServicioNombre} (${pos.startText} - ${pos.endText})`}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                <span style={{ fontWeight: tokens.fontWeightBold, fontSize: '10px' }}>
                                  {pos.startText} - {pos.endText}
                                </span>
                                {cfg.icon}
                              </div>
                              <div style={{ fontWeight: tokens.fontWeightSemibold, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '11px' }}>
                                {orden.codigoWo}
                              </div>
                              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '10px', opacity: 0.9 }}>
                                {orden.clienteServicioNombre || orden.clienteFacturacionNombre}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 6. Panel Inferior Colapsable: Órdenes Sin Programar / Sin Asignar */}
            <div className={styles.unscheduledPanel}>
              <div
                className={styles.unscheduledHeader}
                onClick={() => setMostrarSinAsignar(!mostrarSinAsignar)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Text size={300} weight="semibold">
                    Requisitos de Recursos No Programados ({ordenesSinAsignar.length})
                  </Text>
                  <Badge appearance="tint" color="warning">
                    Pendientes de Despacho
                  </Badge>
                </div>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={mostrarSinAsignar ? <ChevronUp16Regular /> : <ChevronDown16Regular />}
                />
              </div>

              {mostrarSinAsignar && (
                <div style={{ padding: '12px 16px', overflowX: 'auto' }}>
                  {ordenesSinAsignar.length === 0 ? (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      ✓ Todas las órdenes cuentan con técnico y fecha de visita asignados.
                    </Text>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${tokens.colorNeutralStroke2}` }}>
                          <th style={{ padding: '8px 10px', fontSize: '11px', color: tokens.colorNeutralForeground2, textTransform: 'uppercase' }}>Código WO</th>
                          <th style={{ padding: '8px 10px', fontSize: '11px', color: tokens.colorNeutralForeground2, textTransform: 'uppercase' }}>Cliente / Abonado</th>
                          <th style={{ padding: '8px 10px', fontSize: '11px', color: tokens.colorNeutralForeground2, textTransform: 'uppercase' }}>Tipo de Servicio</th>
                          <th style={{ padding: '8px 10px', fontSize: '11px', color: tokens.colorNeutralForeground2, textTransform: 'uppercase' }}>Dirección / Zona</th>
                          <th style={{ padding: '8px 10px', fontSize: '11px', color: tokens.colorNeutralForeground2, textTransform: 'uppercase' }}>Puntos</th>
                          <th style={{ padding: '8px 10px', fontSize: '11px', color: tokens.colorNeutralForeground2, textTransform: 'uppercase' }}>Estado</th>
                          <th style={{ padding: '8px 10px', fontSize: '11px', color: tokens.colorNeutralForeground2, textTransform: 'uppercase', textAlign: 'right' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenesSinAsignar.map((o) => (
                          <tr
                            key={o.id}
                            style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, cursor: 'pointer' }}
                            onClick={() => navigate(`/servicio-campo/ordenes/${o.id}`)}
                          >
                            <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: tokens.fontWeightSemibold, color: tokens.colorBrandForeground1 }}>
                              {o.codigoWo}
                            </td>
                            <td style={{ padding: '8px 10px', fontSize: '12px' }}>
                              {o.clienteServicioNombre || o.clienteFacturacionNombre}
                            </td>
                            <td style={{ padding: '8px 10px', fontSize: '12px' }}>
                              {o.tipoOrdenNombre}
                            </td>
                            <td style={{ padding: '8px 10px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                              {o.direccionServicio || o.zonaOperativaNombre || 'Sin dirección'}
                            </td>
                            <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: tokens.fontWeightBold }}>
                              {o.totalPuntos || 0} pts
                            </td>
                            <td style={{ padding: '8px 10px', fontSize: '12px' }}>
                              <D365StatusBadge status={o.estadoSistema} />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                              <Button
                                size="small"
                                appearance="outline"
                                icon={<Open16Regular />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/servicio-campo/ordenes/${o.id}`);
                                }}
                              >
                                Asignar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 7. Drawer Lateral de Detalle Rápido de Cita */}
      <Drawer
        open={drawerOpen}
        onOpenChange={(_, { open }) => setDrawerOpen(open)}
        position="end"
        size="medium"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<DismissCircle16Regular />}
                onClick={() => setDrawerOpen(false)}
              />
            }
          >
            Detalle de la Cita de Servicio
          </DrawerHeaderTitle>
        </DrawerHeader>

        {ordenSeleccionada && (
          <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text size={500} weight="bold" block style={{ color: tokens.colorBrandForeground1 }}>
                  {ordenSeleccionada.codigoWo}
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  {ordenSeleccionada.tipoOrdenNombre}
                </Text>
              </div>
              <D365StatusBadge status={ordenSeleccionada.estadoSistema} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock16Regular style={{ color: tokens.colorBrandForeground1 }} />
                <Text size={200} weight="semibold">
                  Horario: {ordenSeleccionada.bloqueHorario || '08:00 - 12:00'} ({ordenSeleccionada.fechaProgramada || fechaSeleccionada})
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Person16Regular style={{ color: tokens.colorBrandForeground1 }} />
                <Text size={200}>
                  Técnico: <strong>{ordenSeleccionada.recursoTecnicoNombre || 'Sin Asignar'}</strong>
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge appearance="tint" color="brand">
                  Carga: {ordenSeleccionada.totalPuntos || 0} Puntos Técnicos
                </Badge>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Text size={200} weight="semibold">Cliente / Abonado:</Text>
              <Text size={300} weight="bold">
                {ordenSeleccionada.clienteServicioNombre || ordenSeleccionada.clienteFacturacionNombre}
              </Text>
              {ordenSeleccionada.clienteServicioCodigoExterno && (
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  Código Abonado: {ordenSeleccionada.clienteServicioCodigoExterno}
                </Text>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Location16Regular style={{ color: tokens.colorNeutralForeground2 }} />
                <Text size={200} weight="semibold">Dirección de Atención:</Text>
              </div>
              <Text size={200} style={{ color: tokens.colorNeutralForeground1 }}>
                {ordenSeleccionada.direccionServicio || 'Sin dirección registrada'}
              </Text>
              {ordenSeleccionada.zonaOperativaNombre && (
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  Zona: {ordenSeleccionada.zonaOperativaNombre} &bull; Sede: {ordenSeleccionada.unidadOrganizativaNombre || '-'}
                </Text>
              )}
            </div>

            {ordenSeleccionada.clienteServicioTelefono && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone16Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
                <Text size={200}>
                  Teléfono de Contacto: <strong>{ordenSeleccionada.clienteServicioTelefono}</strong>
                </Text>
              </div>
            )}
          </DrawerBody>
        )}

        <DrawerFooter>
          {ordenSeleccionada && (
            <Button
              appearance="primary"
              icon={<Open16Regular />}
              onClick={() => {
                navigate(`/servicio-campo/ordenes/${ordenSeleccionada.id}`);
              }}
            >
              Abrir Orden de Trabajo
            </Button>
          )}
          <Button appearance="secondary" onClick={() => setDrawerOpen(false)}>
            Cerrar
          </Button>
        </DrawerFooter>
      </Drawer>
    </div>
  );
};
