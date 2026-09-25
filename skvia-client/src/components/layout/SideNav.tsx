import React from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  Tooltip,
  NavDrawer,
  NavDrawerHeader,
  NavDrawerBody,
  NavDrawerFooter,
  NavItem,
  NavSectionHeader,
  NavDivider,
  Hamburger,
} from '@fluentui/react-components';
import {
  bundleIcon,
  Box20Filled,
  Box20Regular,
  FolderOpen20Filled,
  FolderOpen20Regular,
  Ruler20Filled,
  Ruler20Regular,
  TasksApp20Filled,
  TasksApp20Regular,
  Warning20Filled,
  Warning20Regular,
  ClipboardTask20Filled,
  ClipboardTask20Regular,
  Board20Filled,
  Board20Regular,
  People20Filled,
  People20Regular,
  PersonAccounts20Filled,
  PersonAccounts20Regular,
  BuildingBank20Filled,
  BuildingBank20Regular,
  BoxCheckmark20Filled,
  BoxCheckmark20Regular,
  ArrowRepeatAll20Filled,
  ArrowRepeatAll20Regular,
  Person20Filled,
  Person20Regular,
  Shield20Filled,
  Shield20Regular,
  Tag20Filled,
  Tag20Regular,
  Clock20Filled,
  Clock20Regular,
  Money20Filled,
  Money20Regular,
  ChevronUpDown20Regular,
  Checkmark20Regular,
} from '@fluentui/react-icons';
import type { NavArea, NavItem as NavItemData } from '../../types/navigation.types';

// Bundled Fluent UI v9 icons: switches between Filled and Regular automatically on active state
const ICONS_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Box: bundleIcon(Box20Filled, Box20Regular),
  FolderOpen: bundleIcon(FolderOpen20Filled, FolderOpen20Regular),
  Ruler: bundleIcon(Ruler20Filled, Ruler20Regular),
  TasksApp: bundleIcon(TasksApp20Filled, TasksApp20Regular),
  TaskList: bundleIcon(TasksApp20Filled, TasksApp20Regular),
  Warning: bundleIcon(Warning20Filled, Warning20Regular),
  ClipboardTask: bundleIcon(ClipboardTask20Filled, ClipboardTask20Regular),
  Board: bundleIcon(Board20Filled, Board20Regular),
  People: bundleIcon(People20Filled, People20Regular),
  PersonAccounts: bundleIcon(PersonAccounts20Filled, PersonAccounts20Regular),
  BuildingBank: bundleIcon(BuildingBank20Filled, BuildingBank20Regular),
  BoxCheckmark: bundleIcon(BoxCheckmark20Filled, BoxCheckmark20Regular),
  ArrowRepeatAll: bundleIcon(ArrowRepeatAll20Filled, ArrowRepeatAll20Regular),
  Person: bundleIcon(Person20Filled, Person20Regular),
  Shield: bundleIcon(Shield20Filled, Shield20Regular),
  Tag: bundleIcon(Tag20Filled, Tag20Regular),
  Barcode: bundleIcon(Tag20Filled, Tag20Regular),
  Clock: bundleIcon(Clock20Filled, Clock20Regular),
  Money: bundleIcon(Money20Filled, Money20Regular),
};

const useStyles = makeStyles({
  navDrawer: {
    height: '100%',
    transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  expanded: {
    width: '240px',
    minWidth: '240px',
  },
  collapsed: {
    width: '48px',
    minWidth: '48px',
    maxWidth: '48px',
  },
  headerExpanded: {
    display: 'flex',
    alignItems: 'center',
    paddingInlineStart: '8px',
    paddingBlock: '8px',
  },
  headerCollapsed: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingInlineStart: '0px',
    paddingInlineEnd: '0px',
    paddingBlock: '8px',
    width: '100%',
  },
  bodyExpanded: {
    overflowX: 'hidden',
  },
  bodyCollapsed: {
    paddingInlineStart: '0px',
    paddingInlineEnd: '0px',
    paddingLeft: '0px',
    paddingRight: '0px',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  collapsedNavItem: {
    minWidth: '36px',
    maxWidth: '36px',
    width: '36px',
    height: '36px',
    paddingLeft: '0px',
    paddingRight: '0px',
    paddingTop: '0px',
    paddingBottom: '0px',
    marginTop: '2px',
    marginBottom: '2px',
    marginLeft: 'auto',
    marginRight: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  divider: {
    margin: '6px 0',
    width: '32px',
  },
  footerExpanded: {
    paddingInlineStart: '8px',
    paddingInlineEnd: '8px',
  },
  footerCollapsed: {
    paddingInlineStart: '0px',
    paddingInlineEnd: '0px',
    paddingLeft: '0px',
    paddingRight: '0px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bottomAreaSwitcher: {
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: tokens.borderRadiusMedium,
    transition: 'background-color 0.12s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  bottomAreaSwitcherCollapsed: {
    height: '36px',
    width: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    margin: '0 auto',
    cursor: 'pointer',
    boxSizing: 'border-box',
    borderRadius: tokens.borderRadiusMedium,
    transition: 'background-color 0.12s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  areaNameGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    overflow: 'hidden',
  },
  areaBadge: {
    width: '22px',
    height: '22px',
    borderRadius: '2px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '11px',
    flexShrink: 0,
  },
  areaText: {
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

interface SideNavProps {
  collapsed: boolean;
  areas: NavArea[];
  activeArea: NavArea;
  activeItem: NavItemData;
  onSelectArea: (area: NavArea) => void;
  onSelectItem: (item: NavItemData) => void;
  onToggleCollapse: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({
  collapsed,
  areas,
  activeArea,
  activeItem,
  onSelectArea,
  onSelectItem,
  onToggleCollapse,
}) => {
  const styles = useStyles();

  return (
    <NavDrawer
      type="inline"
      separator
      open={true}
      selectedValue={activeItem.id}
      onNavItemSelect={(_, data) => {
        for (const grp of activeArea.groups) {
          const found = grp.items.find((i) => i.id === data.value);
          if (found) {
            onSelectItem(found);
            break;
          }
        }
      }}
      className={`${styles.navDrawer} ${collapsed ? styles.collapsed : styles.expanded}`}
    >
      {/* Header with Hamburger button */}
      <NavDrawerHeader className={collapsed ? styles.headerCollapsed : styles.headerExpanded}>
        <Tooltip
          content={collapsed ? 'Expandir mapa del sitio' : 'Contraer mapa del sitio'}
          relationship="label"
          positioning={collapsed ? 'after' : 'above'}
        >
          <Hamburger
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir navegación' : 'Contraer navegación'}
            aria-expanded={!collapsed}
          />
        </Tooltip>
      </NavDrawerHeader>

      {/* Body with Sections and Items */}
      <NavDrawerBody className={collapsed ? styles.bodyCollapsed : styles.bodyExpanded}>
        {activeArea.groups.map((group, groupIdx) => (
          <React.Fragment key={group.id}>
            {/* Show section title when expanded, or a subtle divider between groups when collapsed */}
            {!collapsed ? (
              <NavSectionHeader>{group.title}</NavSectionHeader>
            ) : (
              groupIdx > 0 && <NavDivider className={styles.divider} />
            )}

            {group.items.map((item) => {
              const IconComponent = ICONS_MAP[item.iconName] || ICONS_MAP.Box;

              const navItemElement = (
                <NavItem
                  key={item.id}
                  value={item.id}
                  icon={<IconComponent />}
                  onClick={() => onSelectItem(item)}
                  className={collapsed ? styles.collapsedNavItem : undefined}
                >
                  {!collapsed && item.title}
                </NavItem>
              );

              // In collapsed mode, wrap in Tooltip so hovering reveals item title
              if (collapsed) {
                return (
                  <Tooltip
                    key={item.id}
                    content={item.title}
                    relationship="label"
                    positioning="after"
                  >
                    {navItemElement}
                  </Tooltip>
                );
              }

              return navItemElement;
            })}
          </React.Fragment>
        ))}
      </NavDrawerBody>

      {/* Footer with Area Switcher */}
      <NavDrawerFooter className={collapsed ? styles.footerCollapsed : styles.footerExpanded}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            {collapsed ? (
              <Tooltip
                content={`Área: ${activeArea.name}`}
                relationship="label"
                positioning="after"
              >
                <div
                  className={styles.bottomAreaSwitcherCollapsed}
                  aria-label={`Área activa: ${activeArea.name}`}
                >
                  <div
                    className={styles.areaBadge}
                    style={{ backgroundColor: activeArea.color }}
                  >
                    {activeArea.shortCode}
                  </div>
                </div>
              </Tooltip>
            ) : (
              <div
                className={styles.bottomAreaSwitcher}
                title={`Área activa: ${activeArea.name}`}
              >
                <div className={styles.areaNameGroup}>
                  <div
                    className={styles.areaBadge}
                    style={{ backgroundColor: activeArea.color }}
                  >
                    {activeArea.shortCode}
                  </div>
                  <span className={styles.areaText}>{activeArea.name}</span>
                </div>
                <ChevronUpDown20Regular />
              </div>
            )}
          </MenuTrigger>

          <MenuPopover>
            <MenuList style={{ minWidth: '210px' }}>
              <div style={{ padding: '8px 12px 4px 12px' }}>
                <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground4 }}>
                  CAMBIAR ÁREA
                </Text>
              </div>
              {areas.map((area) => (
                <MenuItem
                  key={area.id}
                  icon={
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '2px',
                        backgroundColor: area.color,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '11px',
                      }}
                    >
                      {area.shortCode}
                    </div>
                  }
                  secondaryContent={
                    area.id === activeArea.id ? (
                      <Checkmark20Regular
                        style={{ color: tokens.colorCompoundBrandForeground1 }}
                      />
                    ) : undefined
                  }
                  onClick={() => onSelectArea(area)}
                >
                  <Text weight={area.id === activeArea.id ? 'semibold' : 'regular'}>
                    {area.name}
                  </Text>
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>
      </NavDrawerFooter>
    </NavDrawer>
  );
};


