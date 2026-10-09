import { makeStyles, tokens } from '@fluentui/react-components';
import { semanticTokens } from './semanticTokens';

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
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  iconNewGreen: {
    color: semanticTokens.status.success,
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
    fontSize: tokens.fontSizeBase300,
    fontFamily: tokens.fontFamilyBase,
  },
  dataRow: {
    userSelect: 'text',
    cursor: 'pointer',
    height: '38px',
    minHeight: '38px',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  dataCell: {
    userSelect: 'text',
    cursor: 'text',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightBase300,
    '& *': {
      fontSize: tokens.fontSizeBase300,
      fontWeight: tokens.fontWeightRegular,
    },
  },
  primaryLink: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorBrandForegroundLink,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    userSelect: 'text',
    textAlign: 'left',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
      color: tokens.colorBrandForegroundLinkHover,
    },
  },
  footer: {
    height: '32px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    fontSize: tokens.fontSizeBase200,
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
  statusDotActive: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: semanticTokens.status.success,
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
});
