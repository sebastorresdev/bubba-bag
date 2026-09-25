import React from 'react';
import {
  makeStyles,
  tokens,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Add16Regular,
  Edit16Regular,
  Delete16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  DataFunnel20Regular,
} from '@fluentui/react-icons';

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
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: 0,
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
          icon={<ArrowLeft16Regular />}
          onClick={onBack}
          title="Atrás"
          aria-label="Volver atrás"
        />
      )}

      {/* Action buttons starting from the left */}
      <Toolbar className={styles.toolbar} size="small">
        <ToolbarButton
          appearance="subtle"
          icon={<Add16Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />}
          onClick={onNew}
          style={{ fontWeight: 600 }}
        >
          Nuevo
        </ToolbarButton>

        <ToolbarButton icon={<Edit16Regular />}>
          Editar
        </ToolbarButton>

        <ToolbarButton icon={<Delete16Regular />}>
          Eliminar
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          icon={<ArrowClockwise16Regular />}
          onClick={onRefresh}
        >
          Actualizar
        </ToolbarButton>

        <ToolbarButton icon={<ArrowDownload16Regular />}>
          Exportar a Excel
        </ToolbarButton>

        <ToolbarButton icon={<DataFunnel20Regular />}>
          Editar Filtros
        </ToolbarButton>
      </Toolbar>
    </div>
  );
};
