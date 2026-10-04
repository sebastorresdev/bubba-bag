import { Badge, Text, makeStyles, tokens } from '@fluentui/react-components';
import { Checkmark16Regular, ChevronRight16Regular } from '@fluentui/react-icons';
import type { CompraDto } from './compra.service';

const etapas = ['Borrador', 'Solicitada', 'Enviada', 'Recibida'] as const;
const useStyles = makeStyles({
  root: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', padding: '12px 24px', margin: '0', listStyleType: 'none', backgroundColor: tokens.colorNeutralBackground1, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  step: { display: 'flex', alignItems: 'center', gap: '8px' },
  current: { color: tokens.colorBrandForeground1, fontWeight: tokens.fontWeightSemibold },
  upcoming: { color: tokens.colorNeutralForeground3 },
});

export function CompraEtapas({ estado }: { estado: CompraDto['estado'] }) {
  const styles = useStyles();
  const esFaltantes = estado === 'Recibida con faltantes';
  const actual = esFaltantes ? 3 : etapas.indexOf(estado as (typeof etapas)[number]);
  return <ol className={styles.root} aria-label="Etapas de la compra">
    {etapas.map((etapa, index) => {
      const esUltimaConFaltante = index === 3 && esFaltantes;
      const textoEtapa = esUltimaConFaltante ? 'Recibida con faltantes' : etapa;
      return (
        <li key={etapa} className={styles.step} aria-current={index === actual ? 'step' : undefined}>
          {index > 0 && <ChevronRight16Regular />}
          <Badge
            appearance={index === actual ? 'filled' : 'outline'}
            color={esUltimaConFaltante ? 'warning' : index <= actual ? 'brand' : 'subtle'}
            icon={index < actual ? <Checkmark16Regular /> : undefined}
          >
            {index < actual ? undefined : index + 1}
          </Badge>
          <Text className={index === actual ? styles.current : index > actual ? styles.upcoming : undefined}>
            {textoEtapa}
          </Text>
        </li>
      );
    })}
  </ol>;
}
