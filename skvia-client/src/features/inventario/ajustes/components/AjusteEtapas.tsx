import React from 'react';
import { Text, makeStyles, tokens, Tooltip } from '@fluentui/react-components';
import {
  CheckmarkCircle16Filled,
  DismissCircle16Filled,
} from '@fluentui/react-icons';
import type { EstadoAjuste } from '../types/ajuste.types';

export interface EtapaConfig {
  id: string;
  nombre: string;
  descripcion: string;
  subtitulo: string;
}

const ETAPAS_AJUSTE: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Borrador', descripcion: 'Información base y preparación de líneas de ajuste', subtitulo: 'Registro inicial' },
  { id: 'EnRevision', nombre: 'En Revisión', descripcion: 'Verificación de diferencias y autorizaciones', subtitulo: 'En revisión' },
  { id: 'Aplicado', nombre: 'Aplicado', descripcion: 'Ajuste consolidado e impacto en stock registrado', subtitulo: 'Completado' },
];

const useStyles = makeStyles({
  container: {
    padding: '8px 24px 12px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  containerEmbedded: {
    padding: '0',
    backgroundColor: 'transparent',
    borderBottom: 'none',
  },
  scrollWrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  track: {
    display: 'flex',
    alignItems: 'stretch',
    minWidth: '540px',
    height: '46px',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    boxShadow: tokens.shadow2,
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
    lineHeight: '1.2',
  },
  title: {
    fontSize: '13px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    fontSize: '10px',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginTop: '2px',
  },
});

interface AjusteEtapasProps {
  estado?: EstadoAjuste | string | null;
  embedded?: boolean;
}

export const AjusteEtapas: React.FC<AjusteEtapasProps> = ({
  estado = 'Borrador',
  embedded = false,
}) => {
  const styles = useStyles();

  const esAnulado = estado === 'Anulado';
  const esAplicado = estado === 'Aplicado';
  const esRevision = estado === 'EnRevision' || estado === 'En revisión';

  let actual = 0;
  if (esAplicado) {
    actual = 2;
  } else if (esRevision) {
    actual = 1;
  } else {
    actual = 0;
  }

  return (
    <div
      className={embedded ? styles.containerEmbedded : styles.container}
      aria-label="Progreso del ciclo de ajuste de inventario"
    >
      <div className={styles.scrollWrapper}>
        <ol className={styles.track} role="list">
          {ETAPAS_AJUSTE.map((etapa, index) => {
            const esUltima = index === ETAPAS_AJUSTE.length - 1;
            const esCompletada = esAplicado ? true : index < actual;
            const esActiva = !esAplicado && index === actual;

            let bg = tokens.colorNeutralBackground1;
            let stroke = tokens.colorNeutralStroke2;

            if (esAnulado) {
              bg = tokens.colorNeutralBackground3;
              stroke = tokens.colorNeutralStroke3;
            } else if (esActiva) {
              bg = tokens.colorBrandBackground;
              stroke = tokens.colorBrandStroke1;
            } else if (esCompletada) {
              bg = tokens.colorNeutralBackground2;
              stroke = tokens.colorNeutralStroke2;
            } else {
              bg = tokens.colorNeutralBackground1;
              stroke = tokens.colorNeutralStroke2;
            }

            return (
              <Tooltip
                key={etapa.id}
                content={esAnulado ? 'Ajuste anulado' : etapa.descripcion}
                relationship="description"
              >
                <li
                  className={`${styles.step} ${index === 0 ? styles.stepFirst : ''}`}
                  style={{
                    backgroundColor: bg,
                    zIndex: ETAPAS_AJUSTE.length - index,
                  }}
                  aria-current={esActiva ? 'step' : undefined}
                >
                  {/* Indicador de estado */}
                  {esAnulado ? (
                    <DismissCircle16Filled
                      style={{ color: tokens.colorPaletteRedForeground1, fontSize: '18px', flexShrink: 0 }}
                      aria-label="Anulado"
                    />
                  ) : esCompletada ? (
                    <CheckmarkCircle16Filled
                      style={{ color: tokens.colorPaletteGreenForeground1, fontSize: '18px', flexShrink: 0 }}
                      aria-label="Completado"
                    />
                  ) : esActiva ? (
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: tokens.colorNeutralForegroundOnBrand,
                        color: tokens.colorBrandForeground1,
                        fontWeight: 'bold',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: tokens.shadow2,
                      }}
                    >
                      {index + 1}
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `1.5px solid ${tokens.colorNeutralStroke2}`,
                        color: tokens.colorNeutralForeground4,
                        fontWeight: 'bold',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>
                  )}

                  {/* Textos de la etapa */}
                  <div className={styles.content}>
                    <Text
                      className={styles.title}
                      weight={esActiva ? 'bold' : esCompletada ? 'semibold' : 'regular'}
                      style={{
                        color: esActiva
                          ? tokens.colorNeutralForegroundOnBrand
                          : esCompletada
                          ? tokens.colorNeutralForeground1
                          : tokens.colorNeutralForeground4,
                      }}
                    >
                      {etapa.nombre}
                    </Text>
                    <span
                      className={styles.subtitle}
                      style={{
                        color: esActiva
                          ? tokens.colorNeutralForegroundOnBrand
                          : esCompletada
                          ? tokens.colorNeutralForeground3
                          : tokens.colorNeutralForeground4,
                        opacity: esActiva ? 0.85 : 1,
                      }}
                    >
                      {esAnulado
                        ? 'Anulada'
                        : esActiva
                        ? 'Etapa actual'
                        : esCompletada
                        ? 'Completada'
                        : 'Pendiente'}
                    </span>
                  </div>

                  {/* Flecha Chevron conectora */}
                  {!esUltima && (
                    <svg
                      style={{
                        position: 'absolute',
                        right: '-13px',
                        top: 0,
                        width: '14px',
                        height: '100%',
                        zIndex: 10,
                        pointerEvents: 'none',
                      }}
                      viewBox="0 0 14 46"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path d="M0,0 L14,23 L0,46 Z" fill={bg} />
                      <path d="M0,0 L14,23 L0,46" fill="none" stroke={stroke} strokeWidth="1.5" />
                    </svg>
                  )}
                </li>
              </Tooltip>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
