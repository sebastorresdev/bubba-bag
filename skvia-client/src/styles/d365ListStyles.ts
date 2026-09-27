import { makeStyles, tokens } from '@fluentui/react-components';

export const useD365ListStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    userSelect: 'none',
  },
  // 1. Dynamics 365 Standard Top Command Bar
  commandBar: {
    height: '44px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    flexShrink: 0,
    zIndex: 10,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  transparentToolbar: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  iconNewGreen: {
    color: tokens.colorPaletteGreenForeground1,
  },
  iconPrimary: {
    color: tokens.colorBrandForeground1,
  },
  iconBrand: {
    color: tokens.colorCompoundBrandForeground1,
  },
  iconDanger: {
    color: tokens.colorStatusDangerForeground1,
  },
  iconChevronMargin: {
    marginLeft: '4px',
  },
  dangerText: {
    color: tokens.colorStatusDangerForeground1,
  },
  dangerIcon32: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: '32px',
  },
  viewMenuPopover: {
    minWidth: '220px',
  },

  // 2. View Header Row (Selector + Tools + Search)
  viewHeader: {
    height: '42px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    flexShrink: 0,
  },
  viewSelectorTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    padding: '4px 8px',
    borderRadius: tokens.borderRadiusMedium,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  viewToolsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  searchBox: {
    width: '240px',
  },

  // 3. Grid Container & Table
  gridWrapper: {
    flexGrow: 1,
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  gridContainer: {
    flexGrow: 1,
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  table: {
    width: '100%',
    minWidth: '800px',
    userSelect: 'text',
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
    cursor: 'text',
  },
  noWrapCell: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    userSelect: 'text',
  },
  primaryLink: {
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    userSelect: 'text',
    textAlign: 'left',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  codeCell: {
    fontFamily: 'Consolas, monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightMedium,
  },
  footer: {
    height: '32px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },

  // Common State Feedback (Loading, Empty, Error)
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '12px',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 16px',
    gap: '12px',
    color: tokens.colorNeutralForeground3,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
    gap: '12px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
    gap: '12px',
  },
  statusActive: {
    color: tokens.colorPaletteGreenForeground1,
    fontWeight: tokens.fontWeightSemibold,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusInactive: {
    color: tokens.colorNeutralForeground4,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusDotActive: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: tokens.colorPaletteGreenForeground1,
    display: 'inline-block',
    flexShrink: 0,
  },
  statusDotInactive: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: tokens.colorNeutralForeground4,
    display: 'inline-block',
    flexShrink: 0,
  },
  flexRowGap6: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  mutedIcon: {
    color: tokens.colorNeutralForeground4,
  },
});
