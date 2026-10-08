import { makeStyles, tokens, shorthands } from '@fluentui/react-components';
import { Checkmark16Regular } from '@fluentui/react-icons';
import type { EstadoAjuste } from '../types/ajuste.types';

const ETAPAS = [
  { id: 'Borrador', numero: 1, nombre: 'Borrador' },
  { id: 'EnRevision', numero: 2, nombre: 'En revisión' },
  { id: 'Aplicado', numero: 3, nombre: 'Aplicado' },
];

const useStyles = makeStyles({
  container: {
    padding: '8px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  track: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    overflowX: 'auto',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    cursor: 'default',
    userSelect: 'none',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground3,
  },
  stepActive: {
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.borderColor(tokens.colorBrandBackground),
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
  },
  stepCompleted: {
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderColor(tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground1,
  },
  circle: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: tokens.fontWeightBold,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
  },
  circleActive: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorBrandForeground1,
  },
  circleCompleted: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  arrow: {
    color: tokens.colorNeutralForeground4,
    fontSize: '12px',
    margin: '0 2px',
  },
});

export function AjusteEtapas({ estado }: { estado: EstadoAjuste }) {
  const styles = useStyles();

  const getStepIndex = (e: EstadoAjuste) => {
    if (e === 'Aplicado') return 2;
    if (e === 'Anulado') return -1;
    return 0; // Borrador
  };

  const activeIndex = getStepIndex(estado);

  if (estado === 'Anulado') {
    return (
      <div className={styles.container}>
        <div style={{ color: tokens.colorPaletteRedForeground1, fontWeight: tokens.fontWeightSemibold, fontSize: '13px' }}>
          Este ajuste de inventario ha sido anulado.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ol className={styles.track}>
        {ETAPAS.map((etapa, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          let stepClass = styles.step;
          let circleClass = styles.circle;

          if (isActive) {
            stepClass = `${styles.step} ${styles.stepActive}`;
            circleClass = `${styles.circle} ${styles.circleActive}`;
          } else if (isCompleted) {
            stepClass = `${styles.step} ${styles.stepCompleted}`;
            circleClass = `${styles.circle} ${styles.circleCompleted}`;
          }

          return (
            <li key={etapa.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div className={stepClass}>
                <div className={circleClass}>
                  {isCompleted ? <Checkmark16Regular /> : etapa.numero}
                </div>
                <span>{etapa.nombre}</span>
              </div>
              {idx < ETAPAS.length - 1 && <span className={styles.arrow}>›</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
