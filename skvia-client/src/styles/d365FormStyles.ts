import { makeStyles, tokens } from '@fluentui/react-components';
import { semanticTokens } from './semanticTokens';

export const useD365FormStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    minWidth: 0,
    backgroundColor: tokens.colorNeutralBackground2,
    overflow: 'hidden',
    userSelect: 'none',
  },
  messageBarContainer: {
    width: '100%',
    borderRadius: 0,
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    flexShrink: 0,
    zIndex: 100,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  iconNewGreen: {
    color: semanticTokens.status.success,
  },

  // 2. Dynamics 365 Entity Header Summary
  headerContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '12px 24px 0 24px',
    flexShrink: 0,
  },
  avatar: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },

  // 3. Form Content Body
  contentBody: {
    flexGrow: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '20px 24px 36px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    boxSizing: 'border-box',
    margin: '0',
    minWidth: 0,
  },
  grid2Cols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '20px',
    width: '100%',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    padding: '20px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
  },
  halfCardWrapper: {
    width: '50%',
    minWidth: 'min(100%, 640px)',
    maxWidth: '100%',
    boxSizing: 'border-box',
    '@media (max-width: 900px)': {
      width: '100%',
      minWidth: '0',
    },
  },
  cardSectionTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    paddingBottom: '8px',
    marginBottom: '4px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },

  // Dynamics standard 2-column field rows
  d365FieldRow: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '40px',
    padding: '2px 0',
    gap: '16px',
  },
  d365FieldRowTop: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '4px 0',
    gap: '16px',
  },
  d365LabelCol: {
    width: '220px',
    minWidth: '220px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  d365LabelColTop: {
    width: '220px',
    minWidth: '220px',
    flexShrink: 0,
    paddingTop: '6px',
    display: 'flex',
    alignItems: 'flex-start',
    whiteSpace: 'nowrap',
  },
  d365ControlCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  d365ControlFull: {
    width: '100%',
  },
  fieldErrorText: {
    color: semanticTokens.status.dangerSubtle,
    fontSize: tokens.fontSizeBase100,
    marginTop: '2px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  unitIcon: {
    color: tokens.colorBrandForeground1,
  },
  categoryIcon: {
    color: tokens.colorBrandForeground1,
  },
  statusDotActive: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: tokens.colorPaletteGreenForeground1,
    display: 'inline-block',
    marginRight: '6px',
    flexShrink: 0,
  },
  statusDotInactive: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: tokens.colorNeutralForeground4,
    display: 'inline-block',
    marginRight: '6px',
    flexShrink: 0,
  },
  fieldHint: {
    color: tokens.colorNeutralForeground3,
  },
  fieldRowFlex: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  fieldColumnFlex: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  dialogSurface: {
    minWidth: '480px',
  },
  dialogForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '12px',
  },
  dialogRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  dialogGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },
  skeletonHeader: {
    width: '120px',
    marginBottom: '16px',
  },
  skeletonSub140: {
    width: '140px',
    marginBottom: '16px',
  },
  skeletonFull: {
    width: '100%',
  },
  skeletonTextarea72: {
    width: '100%',
    height: '72px',
  },
  labelSmallBlock: {
    marginBottom: '4px',
    display: 'block',
  },
  paddingTop4: {
    paddingTop: '4px',
  },
  iconBrand: {
    color: tokens.colorCompoundBrandForeground1,
  },
  iconDanger: {
    color: tokens.colorStatusDangerForeground1,
  },
  dataRow: {
    userSelect: 'text',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  dataCell: {
    userSelect: 'text',
  },
});
