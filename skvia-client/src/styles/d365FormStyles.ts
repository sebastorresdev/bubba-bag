import { makeStyles, tokens } from '@fluentui/react-components';

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
  // 1. Dynamics 365 Standard Top Command Bar
  commandBar: {
    height: '44px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '8px',
    paddingRight: '16px',
    flexShrink: 0,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  iconPrimary: {
    color: tokens.colorBrandForeground1,
  },
  iconSaveLilac: {
    color: tokens.colorPaletteLilacBorderActive,
  },
  iconNewGreen: {
    color: tokens.colorPaletteGreenForeground1,
  },

  // 2. Dynamics 365 Entity Header Summary
  headerContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '12px 24px 0 24px',
    flexShrink: 0,
  },
  headerTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerAvatar: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
    fontWeight: tokens.fontWeightBold,
  },
  avatar: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  mainTitle: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.2',
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.2',
  },
  subTitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  headerMetaRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  metaLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: tokens.fontWeightSemibold,
  },
  metaValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginTop: '2px',
  },
  metaDivider: {
    height: '28px',
    width: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
  },
  tabList: {
    marginTop: '4px',
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
    width: '170px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  d365LabelColTop: {
    width: '170px',
    flexShrink: 0,
    paddingTop: '6px',
    display: 'flex',
    alignItems: 'flex-start',
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
    color: tokens.colorPaletteRedForeground1,
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
  tagPickerControl: {
    width: '100%',
    minHeight: '32px',
    height: '32px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    paddingTop: '0px',
    paddingBottom: '0px',
    flexWrap: 'nowrap',
  },
  tagPickerGroup: {
    paddingTop: '0px',
    paddingBottom: '0px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  tagPickerInput: {
    paddingTop: '0px',
    paddingBottom: '0px',
    minHeight: '28px',
  },
  unitIcon: {
    color: tokens.colorBrandForeground1,
  },
  categoryIcon: {
    color: tokens.colorBrandForeground1,
  },
  secondaryOptionText: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
    lineHeight: tokens.lineHeightBase100,
  },
  quickCreateFooter: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  skeletonTitle: {
    width: '280px',
    marginBottom: '8px',
  },
  skeletonSub: {
    width: '180px',
  },
  skeletonHeader: {
    width: '120px',
    marginBottom: '16px',
  },
  skeletonSub140: {
    width: '140px',
    marginBottom: '16px',
  },
  skeletonBadge60: {
    width: '60px',
    marginTop: '4px',
  },
  skeletonBadge80: {
    width: '80px',
    marginTop: '4px',
  },
  skeletonFull: {
    width: '100%',
  },
  skeletonTextarea72: {
    width: '100%',
    height: '72px',
  },
  dropdownEmptyOption: {
    padding: '8px 12px',
    color: tokens.colorNeutralForeground4,
    fontSize: '13px',
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
  primaryLink: {
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    userSelect: 'text',
    textAlign: 'left',
    textDecoration: 'none',
    cursor: 'pointer',
    color: tokens.colorBrandForegroundLink,
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    ':hover': {
      textDecoration: 'underline',
    },
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
