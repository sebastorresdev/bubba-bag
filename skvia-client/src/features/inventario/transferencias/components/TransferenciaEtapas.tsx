import React from 'react';
import { Text, makeStyles, tokens, Tooltip } from '@fluentui/react-components';
import {
  CheckmarkCircle16Filled,
  Warning16Filled,
  DismissCircle16Filled,
} from '@fluentui/react-icons';

export interface EtapaConfig {
  id: string;
  nombre: string;
  descripcion: string;
  subtitulo: string;
}

const ETAPAS_DESPACHO: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Borrador', descripcion: 'Información base y preparación de materiales', subtitulo: 'Registro inicial' },
  { id: 'EnTransito', nombre: 'Despachada', descripcion: 'Material en tránsito o asignado', subtitulo: 'En despacho' },
  { id: 'Cerrada', nombre: 'Recibida', descripcion: 'Custodia asumida y stock recibido por el técnico', subtitulo: 'Completado' },
];

const ETAPAS_DEVOLUCION: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Borrador', descripcion: 'Información base y preparación de materiales a devolver', subtitulo: 'Registro inicial' },
  { id: 'EnTransito', nombre: 'En Devolución', descripcion: 'Retorno de materiales en camino a bodega', subtitulo: 'En retorno' },
  { id: 'Cerrada', nombre: 'Recibida', descripcion: 'Material reingresado e inventariado en bodega', subtitulo: 'Completado' },
];

const ETAPAS_TRASLADO: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Borrador', descripcion: 'Edición y preparación de la transferencia', subtitulo: 'Registro inicial' },
  { id: 'EnTransito', nombre: 'En Tránsito', descripcion: 'Mercadería en carretera hacia almacén de destino', subtitulo: 'En despacho' },
  { id: 'Cerrada', nombre: 'Recibida', descripcion: 'Control físico y stock ingresado en destino', subtitulo: 'Ingreso final' },
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
    minWidth: '540px',
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

interface TransferenciaEtapasProps {
  estado?: string | null;
  tipoOperacion?: 'Despacho' | 'Devolucion' | 'Traslado' | string;
  embedded?: boolean;
}

export const TransferenciaEtapas: React.FC<TransferenciaEtapasProps> = ({
  estado = 'Borrador',
  tipoOperacion = 'Despacho',
  embedded = false,
}) => {
  const styles = useStyles();

  const etapas =
    tipoOperacion === 'Devolucion'
      ? ETAPAS_DEVOLUCION
      : tipoOperacion === 'Traslado'
      ? ETAPAS_TRASLADO
      : ETAPAS_DESPACHO;

  const esCancelada = estado === 'Cancelada';
  const esParcial = estado === 'ParcialmenteRecibida';
  const esCerrada = estado === 'Cerrada';

  let actual = 0;
  if (esCerrada) {
    actual = 2;
  } else if (esParcial) {
    actual = 2;
  } else if (estado === 'EnTransito') {
    actual = 1;
  } else {
    actual = 0;
  }

  return (
    <div
      className={embedded ? styles.containerEmbedded : styles.container}
      aria-label="Progreso del ciclo de transferencia e inventario"
    >
      <div className={styles.scrollWrapper}>
        <ol className={styles.track} role="list">
          {etapas.map((etapa, index) => {
            const esUltima = index === etapas.length - 1;
            const esCompletada = esCerrada ? true : index < actual;
            const esActiva = !esCerrada && index === actual;

            let bg = tokens.colorNeutralBackground1;
            let stroke = tokens.colorNeutralStroke2;

            if (esCancelada) {
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
                content={esCancelada ? 'Transferencia cancelada' : etapa.descripcion}
                relationship="description"
              >
                <li
                  className={`${styles.step} ${index === 0 ? styles.stepFirst : ''}`}
                  style={{
                    backgroundColor: bg,
                    zIndex: etapas.length - index,
                  }}
                  aria-current={esActiva ? 'step' : undefined}
                >
                  {/* Indicador de estado */}
                  {esCancelada ? (
                    <DismissCircle16Filled
                      style={{ color: tokens.colorPaletteRedForeground1, fontSize: '18px', flexShrink: 0 }}
                      aria-label="Cancelada"
                    />
                  ) : esParcial && esUltima ? (
                    <Warning16Filled
                      style={{ color: tokens.colorPaletteYellowForeground2, fontSize: '18px', flexShrink: 0 }}
                      aria-label="Con pendientes"
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
                      {esParcial && esUltima ? 'Parcialmente Recibida' : etapa.nombre}
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
                      {esCancelada
                        ? 'Anulada'
                        : esParcial && esUltima
                        ? 'Con saldo'
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
