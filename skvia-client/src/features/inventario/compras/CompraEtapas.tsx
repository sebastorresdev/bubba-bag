import { Text, makeStyles, tokens, Tooltip } from '@fluentui/react-components';
import {
  CheckmarkCircle16Filled,
  Warning16Filled,
} from '@fluentui/react-icons';
import type { CompraDto } from './compra.service';

interface EtapaConfig {
  id: string;
  nombre: string;
  descripcion: string;
  subtitulo: string;
}

const ETAPAS: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Borrador', descripcion: 'Edición y preparación de la orden de compra', subtitulo: 'Registro inicial' },
  { id: 'Solicitada', nombre: 'Solicitada', descripcion: 'Orden aprobada y emitida al proveedor', subtitulo: 'Aprobada' },
  { id: 'Enviada', nombre: 'Enviada', descripcion: 'Mercadería en tránsito hacia almacén de destino', subtitulo: 'En despacho' },
  { id: 'Recibida', nombre: 'Recibida', descripcion: 'Control físico y stock ingresado en almacén', subtitulo: 'Ingreso final' },
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

export function CompraEtapas({
  estado,
  embedded = false,
}: {
  estado: CompraDto['estado'];
  embedded?: boolean;
}) {
  const styles = useStyles();
  const esFaltantes = estado === 'Recibida con faltantes';
  const indiceActual = esFaltantes ? 3 : ETAPAS.findIndex(e => e.id === estado);
  const actual = indiceActual >= 0 ? indiceActual : 0;

  return (
    <div
      className={embedded ? styles.containerEmbedded : styles.container}
      aria-label="Progreso del ciclo de compra"
    >
      <div className={styles.scrollWrapper}>
        <ol className={styles.track} role="list">
          {ETAPAS.map((etapa, index) => {
            const esUltima = index === ETAPAS.length - 1;
            const esUltimaConFaltante = esUltima && esFaltantes;
            const textoEtapa = esUltimaConFaltante ? 'Recibida con faltantes' : etapa.nombre;
            const esCompletada = index < actual;
            const esActiva = index === actual;

            // Tokens oficiales de Fluent UI: adaptabilidad automática a modo claro y oscuro
            let bg = tokens.colorNeutralBackground1;
            let stroke = tokens.colorNeutralStroke2;

            if (esUltimaConFaltante) {
              bg = tokens.colorPaletteYellowBackground2;
              stroke = tokens.colorPaletteYellowBorder2;
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
                content={
                  esUltimaConFaltante
                    ? 'Recepción física concluida con faltantes o discrepancias registradas.'
                    : etapa.descripcion
                }
                relationship="description"
              >
                <li
                  className={`${styles.step} ${index === 0 ? styles.stepFirst : ''}`}
                  style={{
                    backgroundColor: bg,
                    zIndex: ETAPAS.length - index,
                  }}
                  aria-current={esActiva ? 'step' : undefined}
                >
                  {/* Indicador de estado circular */}
                  {esUltimaConFaltante ? (
                    <Warning16Filled
                      style={{ color: tokens.colorPaletteYellowForeground2, fontSize: '18px', flexShrink: 0 }}
                      aria-label="Con faltantes"
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

                  {/* Textos de la etapa con tokens adaptativos de tema */}
                  <div className={styles.content}>
                    <Text
                      className={styles.title}
                      weight={esActiva ? 'bold' : esCompletada ? 'semibold' : 'regular'}
                      style={{
                        color: esUltimaConFaltante
                          ? tokens.colorPaletteYellowForeground2
                          : esActiva
                          ? tokens.colorNeutralForegroundOnBrand
                          : esCompletada
                          ? tokens.colorNeutralForeground1
                          : tokens.colorNeutralForeground4,
                      }}
                    >
                      {textoEtapa}
                    </Text>
                    <span
                      className={styles.subtitle}
                      style={{
                        color: esUltimaConFaltante
                          ? tokens.colorPaletteYellowForeground2
                          : esActiva
                          ? tokens.colorNeutralForegroundOnBrand
                          : esCompletada
                          ? tokens.colorNeutralForeground3
                          : tokens.colorNeutralForeground4,
                        opacity: esActiva ? 0.85 : 1,
                      }}
                    >
                      {esUltimaConFaltante
                        ? 'Diferencias'
                        : esActiva
                        ? 'Etapa actual'
                        : esCompletada
                        ? 'Completada'
                        : 'Pendiente'}
                    </span>
                  </div>

                  {/* Flecha Chevron conectora dinámica adaptada al tema */}
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
                      {/* Cuerpo de la flecha relleno del token de fondo de la etapa */}
                      <path d="M0,0 L14,23 L0,46 Z" fill={bg} />
                      {/* Línea divisoria en punta de flecha */}
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
}
