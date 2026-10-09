import React from 'react';
import { Text, makeStyles, tokens, Tooltip } from '@fluentui/react-components';
import {
  CheckmarkCircle16Filled,
  DismissCircle16Filled,
  Clock16Filled,
} from '@fluentui/react-icons';
import type { EstadoSistema } from '../types/ordenTrabajo.types';

export interface EtapaConfig {
  id: EstadoSistema;
  nombre: string;
  subtitulo: string;
  descripcion: string;
}

const ETAPAS_WORK_ORDER: EtapaConfig[] = [
  {
    id: 'Borrador',
    nombre: 'Borrador',
    subtitulo: 'Registro inicial',
    descripcion: 'Captura inicial del requerimiento de servicio y cuenta',
  },
  {
    id: 'PendienteProgramar',
    nombre: 'Sin Programar',
    subtitulo: 'Pendiente despacho',
    descripcion: 'Orden validada esperando asignación de técnico y bloque horario',
  },
  {
    id: 'Programado',
    nombre: 'Programada',
    subtitulo: 'Cita agendada',
    descripcion: 'Técnico y fecha asignados; programada en el tablero de despacho',
  },
  {
    id: 'EnProgreso',
    nombre: 'En Curso',
    subtitulo: 'En atención técnica',
    descripcion: 'Técnico en camino o trabajando activamente en el domicilio',
  },
  {
    id: 'Completado',
    nombre: 'Completada',
    subtitulo: 'Servicio finalizado',
    descripcion: 'Trabajo concluido con firmas, evidencias y materiales regularizados',
  },
];

const useStyles = makeStyles({
  container: {
    padding: '0',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    width: '100%',
  },
  containerEmbedded: {
    padding: '0',
    backgroundColor: 'transparent',
    borderBottom: 'none',
    width: '100%',
  },
  scrollWrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  track: {
    display: 'flex',
    alignItems: 'stretch',
    width: '100%',
    minWidth: '600px',
    height: '46px',
    borderRadius: 0,
    border: 'none',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    boxShadow: 'none',
    margin: 0,
    padding: 0,
    listStyleType: 'none',
  },
  step: {
    flex: '1 1 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    position: 'relative',
    padding: '0 16px 0 24px',
    userSelect: 'none',
    transition: 'background-color 0.15s ease',
  },
  stepFirst: {
    paddingLeft: '16px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    lineHeight: '16px',
  },
  title: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightRegular,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  titleActive: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  subtitulo: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '14px',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    flexShrink: 0,
    zIndex: 1,
  },
  stepNumber: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: `1.5px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    backgroundColor: 'transparent',
  },
  chevronWrapper: {
    position: 'absolute',
    top: 0,
    right: '-14px',
    width: '14px',
    height: '100%',
    zIndex: 2,
    pointerEvents: 'none',
  },
  bannerCancelado: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 24px',
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderBottom: `1px solid ${tokens.colorPaletteRedBorder1}`,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
});

interface WorkOrderEtapasProps {
  estadoSistema: EstadoSistema | string;
  embedded?: boolean;
}

export const WorkOrderEtapas: React.FC<WorkOrderEtapasProps> = ({
  estadoSistema,
  embedded = false,
}) => {
  const styles = useStyles();

  const esCancelado = estadoSistema === 'Cancelado';

  const ordenEtapas: EstadoSistema[] = [
    'Borrador',
    'PendienteProgramar',
    'Programado',
    'EnProgreso',
    'Completado',
  ];

  const indiceActual = esCancelado
    ? -1
    : ordenEtapas.indexOf(estadoSistema as EstadoSistema);

  const getStepBg = (index: number) => {
    if (esCancelado) return tokens.colorNeutralBackground1;
    if (index === indiceActual) return tokens.colorBrandBackground2;
    if (index < indiceActual) return tokens.colorNeutralBackground2;
    return tokens.colorNeutralBackground1;
  };

  return (
    <div className={embedded ? styles.containerEmbedded : styles.container}>
      {esCancelado && (
        <div className={styles.bannerCancelado}>
          <DismissCircle16Filled />
          <span>ORDEN DE TRABAJO CANCELADA — El servicio fue anulado o rechazado.</span>
        </div>
      )}

      <div className={styles.scrollWrapper}>
        <ul className={styles.track} role="list">
          {ETAPAS_WORK_ORDER.map((etapa, index) => {
            const esPasada = !esCancelado && index < indiceActual;
            const esActiva = !esCancelado && index === indiceActual;
            const bg = getStepBg(index);

            return (
              <li
                key={etapa.id}
                className={`${styles.step} ${index === 0 ? styles.stepFirst : ''}`}
                style={{ backgroundColor: bg }}
              >
                <div className={styles.iconWrapper}>
                  {esPasada ? (
                    <CheckmarkCircle16Filled
                      style={{ color: tokens.colorPaletteGreenForeground1 }}
                    />
                  ) : esActiva ? (
                    <Clock16Filled
                      style={{ color: tokens.colorBrandForeground1 }}
                    />
                  ) : (
                    <div className={styles.stepNumber}>{index + 1}</div>
                  )}
                </div>

                <Tooltip content={etapa.descripcion} relationship="description">
                  <div className={styles.content}>
                    <div className={styles.titleRow}>
                      <Text
                        className={`${styles.title} ${
                          esActiva ? styles.titleActive : ''
                        }`}
                        style={{
                          color: esActiva
                            ? tokens.colorBrandForeground1
                            : esPasada
                            ? tokens.colorNeutralForeground2
                            : tokens.colorNeutralForeground3,
                        }}
                      >
                        {etapa.nombre}
                      </Text>
                    </div>
                    <Text className={styles.subtitulo}>{etapa.subtitulo}</Text>
                  </div>
                </Tooltip>

                {index < ETAPAS_WORK_ORDER.length - 1 && (
                  <div className={styles.chevronWrapper}>
                    <svg
                      viewBox="0 0 14 46"
                      preserveAspectRatio="none"
                      style={{ width: '100%', height: '100%', display: 'block' }}
                    >
                      <path
                        d="M 0,0 L 14,23 L 0,46 Z"
                        fill={bg}
                      />
                      <path
                        d="M 0,0 L 14,23 L 0,46"
                        fill="none"
                        stroke={tokens.colorNeutralStroke2}
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
