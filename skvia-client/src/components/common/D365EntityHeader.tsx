import React, { type ReactNode } from 'react';
import { Avatar, Divider, makeStyles, Skeleton, SkeletonItem, Tab, TabList, Text, tokens } from '@fluentui/react-components';
import { semanticTokens } from '../../styles/semanticTokens';
import { D365StatusBadge } from './D365StatusBadge';

const useStyles = makeStyles({
  root: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '12px 24px 0',
    '@media (max-width: 767px)': { padding: '12px 16px 0' },
    flexShrink: 0,
  },
  topRow: {
    minHeight: '56px',
    flexWrap: 'wrap',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalM,
  },
  identity: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalL, minWidth: 0 },
  titleGroup: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  title: {
    overflowWrap: 'anywhere',
    '@media (max-width: 767px)': { fontSize: tokens.fontSizeBase500, lineHeight: tokens.lineHeightBase500 },
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightHero700,
  },
  subtitle: { fontSize: tokens.fontSizeBase300, color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalXXS },
  avatar: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    flexShrink: 0,
  },
  avatarSubtle: {
    backgroundColor: semanticTokens.status.successBackground,
    color: semanticTokens.status.successSubtle,
    fontWeight: tokens.fontWeightBold,
    flexShrink: 0,
  },
  metadata: { flexWrap: 'wrap', display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalL, flexShrink: 0 },
  metadataItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
  metadataLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightBase200,
  },
  metadataValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightBase300,
    display: 'flex',
    alignItems: 'center',
  },
  metadataDivider: { height: '28px' },
  processFlow: {
    margin: '0 -24px',
    overflowX: 'auto',
    '@media (max-width: 767px)': { margin: '0 -16px' },
    padding: '0',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  tabs: { marginTop: tokens.spacingVerticalXS },
  titleSkeleton: { width: '280px', maxWidth: '100%', marginBottom: tokens.spacingVerticalXS },
  subtitleSkeleton: { width: '180px' },
  metadataSkeleton: { width: '80px' },
});

export interface D365EntityMetadata {
  label: ReactNode;
  value: ReactNode;
}

export interface D365EntityHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  avatarName?: string;
  avatarInitials?: string;
  avatarIcon?: ReactNode;
  avatarSize?: 48 | 56;
  subtleAvatar?: boolean;
  metadata?: D365EntityMetadata[];
  processFlow?: ReactNode;
  tabs?: ReactNode;
  loading?: boolean;
  className?: string;
}

export const D365EntityHeader: React.FC<D365EntityHeaderProps> = ({
  title,
  subtitle,
  avatarName = typeof title === 'string' ? title : 'Registro',
  avatarInitials,
  avatarIcon,
  avatarSize = 56,
  subtleAvatar = false,
  metadata = [],
  processFlow,
  tabs,
  loading = false,
  className,
}) => {
  const styles = useStyles();

  return (
    <header className={className ? `${styles.root} ${className}` : styles.root}>
      <div className={styles.topRow}>
        <div className={styles.identity}>
          {loading ? (
            <Skeleton animation="pulse">
              <SkeletonItem shape="circle" size={avatarSize} />
            </Skeleton>
          ) : (
            <Avatar
              name={avatarName}
              initials={avatarInitials}
              icon={avatarIcon as React.ReactElement | undefined}
              size={avatarSize}
              className={subtleAvatar ? styles.avatarSubtle : styles.avatar}
            />
          )}
          <div className={styles.titleGroup}>
            {loading ? (
              <Skeleton animation="pulse">
                <SkeletonItem size={24} className={styles.titleSkeleton} />
                <SkeletonItem size={16} className={styles.subtitleSkeleton} />
              </Skeleton>
            ) : (
              <>
                <Text as="h1" style={{ margin: 0 }} className={styles.title}>{title}</Text>
                {subtitle != null && <Text className={styles.subtitle}>{subtitle}</Text>}
              </>
            )}
          </div>
        </div>

        {metadata.length > 0 && (
          <div className={styles.metadata}>
            {metadata.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider vertical className={styles.metadataDivider} />}
                <div className={styles.metadataItem}>
                  {loading ? (
                    <Skeleton animation="pulse"><SkeletonItem size={16} className={styles.metadataSkeleton} /></Skeleton>
                  ) : typeof item.label === 'string' && (item.label.toLowerCase() === 'estado' || item.label.toLowerCase() === 'status') && (typeof item.value === 'string' || typeof item.value === 'number' || typeof item.value === 'boolean') ? (
                    <div><D365StatusBadge status={item.value as string} size="small" /></div>
                  ) : React.isValidElement(item.value) ? (
                    <div className={styles.metadataValue}>{item.value}</div>
                  ) : (
                    <Text className={styles.metadataValue}>{item.value != null && item.value !== '' ? item.value : '—'}</Text>
                  )}
                  <Text className={styles.metadataLabel}>{item.label}</Text>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      {processFlow && <div className={styles.processFlow}>{processFlow}</div>}
      <div className={styles.tabs}>
        {tabs ?? (
          <TabList selectedValue="general">
            <Tab value="general">General</Tab>
          </TabList>
        )}
      </div>
    </header>
  );
};

export default D365EntityHeader;
