import React from 'react';
import {
  makeStyles,
  tokens,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
} from '@fluentui/react-components';
import { FluentIcon } from '../common/FluentIcon';

const useStyles = makeStyles({
  root: {
    height: '44px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '8px',
    paddingRight: '16px',
    flexShrink: 0,
    userSelect: 'none',
    gap: '8px',
  },
  backButton: {
    minWidth: '32px',
    width: '32px',
    height: '32px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    backgroundColor: 'transparent',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
});

interface D365CommandBarProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onRefresh?: () => void;
  onNew?: () => void;
}

export const D365CommandBar: React.FC<D365CommandBarProps> = ({
  showBackButton,
  onBack,
  onRefresh,
  onNew,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {showBackButton && (
        <ToolbarButton
          className={styles.backButton}
          icon={<FluentIcon name="ArrowLeft" fontSize={16} />}
          onClick={onBack}
          title="Atrás"
          aria-label="Volver atrás"
        />
      )}

      {/* Action buttons starting from the left */}
      <Toolbar className={styles.toolbar} size="small">
        <ToolbarButton
          appearance="subtle"
          icon={<FluentIcon name="Add" fontSize={16} style={{ color: '#107c41' }} />}
          onClick={onNew}
          style={{ fontWeight: 600 }}
        >
          Nuevo
        </ToolbarButton>

        <ToolbarButton icon={<FluentIcon name="Edit" fontSize={16} />}>
          Editar
        </ToolbarButton>

        <ToolbarButton icon={<FluentIcon name="Delete" fontSize={16} />}>
          Eliminar
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          icon={<FluentIcon name="ArrowClockwise" fontSize={16} />}
          onClick={onRefresh}
        >
          Actualizar
        </ToolbarButton>

        <ToolbarButton icon={<FluentIcon name="ArrowDownload" fontSize={16} />}>
          Exportar a Excel
        </ToolbarButton>

        <ToolbarButton icon={<FluentIcon name="Filter" fontSize={16} />}>
          Editar Filtros
        </ToolbarButton>
      </Toolbar>
    </div>
  );
};
