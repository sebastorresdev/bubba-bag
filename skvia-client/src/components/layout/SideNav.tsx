import React from 'react';
import {
  makeStyles,
  tokens,
  mergeClasses,
  Text,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  Tooltip,
  Button,
  NavDrawer,
  NavDrawerBody,
  NavDrawerFooter,
  Nav,
  NavItem,
  NavSubItem,
  NavCategory,
  NavCategoryItem,
  NavSubItemGroup,
  NavSectionHeader,
} from '@fluentui/react-components';
import {
  ChevronUpDown20Regular,
  Checkmark20Regular,
  Navigation20Regular,
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
  ArrowUpload20Filled,
  ArrowUpload20Regular,
} from '@fluentui/react-icons';
import type { NavArea, NavItem as NavItemData } from '../../types/navigation.types';
import { semanticTokens } from '../../styles/semanticTokens';

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
  ArrowUpload: bundleIcon(ArrowUpload20Filled, ArrowUpload20Regular),
};

const useStyles = makeStyles({
  // Header row with Hamburger button at top-left
  topHamburgerRow: {
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '4px',
    paddingRight: '4px',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  hamburgerBtn: {
    minWidth: '40px',
    width: '40px',
    height: '36px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground2,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground4Hover,
      color: tokens.colorNeutralForeground1,
    },
    ':active': {
      backgroundColor: tokens.colorNeutralBackground4Pressed,
    },
  },

  // Compact Rail (WinUI / Dynamics 365 collapsed mode)
  compactRail: {
    width: '48px',
    minWidth: '48px',
    maxWidth: '48px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground4,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    boxSizing: 'border-box',
    flexShrink: 0,
    userSelect: 'none',
    zIndex: 10,
  },
  compactBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexGrow: 1,
    width: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '4px 0',
    gap: '2px',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  compactDivider: {
    width: '24px',
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
    margin: '6px 0',
    flexShrink: 0,
  },
  compactItem: {
    width: '40px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground2,
    cursor: 'pointer',
    transition: 'background-color 0.12s ease, color 0.12s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground4Hover,
      color: tokens.colorNeutralForeground1,
    },
    ':active': {
      backgroundColor: tokens.colorNeutralBackground4Pressed,
    },
  },
  compactItemActive: {
    backgroundColor: tokens.colorSubtleBackgroundSelected,
    color: tokens.colorNeutralForeground1,
    ':hover': {
      backgroundColor: tokens.colorSubtleBackgroundSelected,
    },
  },
  // Selection Indicator: vertical accent pill on the left edge
  activePill: {
    position: 'absolute',
    left: '0px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '16px',
    borderRadius: '2px',
    backgroundColor: tokens.colorCompoundBrandForeground1,
  },
  compactFooter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '6px 0',
    gap: '4px',
    width: '100%',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  compactAreaButton: {
    width: '40px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground4Hover,
    },
  },
  compactAreaBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '3px',
    backgroundColor: semanticTokens.navigation.background,
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: semanticTokens.typography.bold,
    fontSize: '10px',
  },
  compactFlyoutMenu: {
    minWidth: '200px',
  },
  flyoutHeader: {
    padding: '6px 12px',
    color: tokens.colorNeutralForeground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: '4px',
  },

  // Expanded NavDrawer mode (Dynamics 365 style)
  navDrawer: {
    height: '100%',
    width: '260px',
    boxSizing: 'border-box',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground4,
  },
  drawerBody: {
    paddingInlineStart: '0px',
    paddingInlineEnd: '0px',
    flexGrow: 1,
    overflowY: 'auto',
  },
  sectionHeader: {
    marginTop: '8px',
    marginBottom: '4px',
  },
  drawerFooter: {
    padding: '8px 12px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
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
      backgroundColor: tokens.colorNeutralBackground4Hover,
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
    backgroundColor: semanticTokens.navigation.background,
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: semanticTokens.typography.bold,
    fontSize: semanticTokens.typography.caption,
    flexShrink: 0,
  },
  areaText: {
    fontSize: semanticTokens.typography.bodySmall,
    fontWeight: semanticTokens.typography.semibold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: tokens.colorNeutralForeground1,
  },
  areaMenu: { minWidth: '220px' },
  areaMenuHeader: {
    padding: '8px 12px 4px 12px',
    color: semanticTokens.text.muted,
  },
  areaMenuBadge: {
    width: '20px',
    height: '20px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: semanticTokens.navigation.background,
    color: semanticTokens.navigation.foreground,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: semanticTokens.typography.bold,
    fontSize: semanticTokens.typography.caption,
  },
  selectedCheck: { color: tokens.colorCompoundBrandForeground1 },
});

export interface SideNavProps {
  open: boolean;
  type: 'inline' | 'overlay';
  onOpenChange: (open: boolean) => void;
  areas: NavArea[];
  activeArea: NavArea;
  activeItem?: NavItemData;
  onSelectArea: (area: NavArea) => void;
  onSelectItem: (item: NavItemData) => void;
  onToggleNav?: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({
  open,
  type,
  onOpenChange,
  areas,
  activeArea,
  activeItem,
  onSelectArea,
  onSelectItem,
  onToggleNav,
}) => {
  const styles = useStyles();

  const handleItemClick = (item: NavItemData) => {
    onSelectItem(item);
    if (type === 'overlay') {
      onOpenChange(false);
    }
  };

  const handleAreaSelect = (area: NavArea) => {
    onSelectArea(area);
    if (type === 'overlay') {
      onOpenChange(false);
    }
  };

  const isItemActive = (item: NavItemData): boolean => {
    if (activeItem?.id === item.id) return true;
    if (item.subItems?.some((sub) => sub.id === activeItem?.id)) return true;
    return false;
  };

  const handleToggle = () => {
    if (onToggleNav) {
      onToggleNav();
    } else {
      onOpenChange(!open);
    }
  };

  // Compact Rail Mode (LeftCompact 48px)
  if (type === 'inline' && !open) {
    return (
      <aside className={styles.compactRail} aria-label="Navegación compacta">
        {/* Top: Hamburger icon only on the left */}
        <div className={styles.topHamburgerRow}>
          <Tooltip content="Expandir navegación" relationship="label" positioning="after">
            <button
              type="button"
              className={styles.hamburgerBtn}
              onClick={handleToggle}
              aria-label="Expandir navegación"
            >
              <Navigation20Regular />
            </button>
          </Tooltip>
        </div>

        {/* Body: Item icons only */}
        <div className={styles.compactBody}>
          {activeArea.groups.map((group, groupIdx) => (
            <React.Fragment key={group.id}>
              {groupIdx > 0 && <div className={styles.compactDivider} role="separator" />}
              {group.items.map((item) => {
                const IconComponent = ICONS_MAP[item.iconName] || ICONS_MAP.Box;
                const isSelected = isItemActive(item);

                if (item.subItems && item.subItems.length > 0) {
                  return (
                    <Menu key={item.id} positioning="after-top">
                      <MenuTrigger disableButtonEnhancement>
                        <Tooltip content={item.title} relationship="label" positioning="after">
                          <button
                            type="button"
                            className={mergeClasses(
                              styles.compactItem,
                              isSelected && styles.compactItemActive
                            )}
                            aria-label={item.title}
                            aria-current={isSelected ? 'page' : undefined}
                          >
                            {isSelected && <span className={styles.activePill} />}
                            <IconComponent />
                          </button>
                        </Tooltip>
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuList className={styles.compactFlyoutMenu}>
                          <div className={styles.flyoutHeader}>
                            <Text weight="semibold" size={200}>
                              {item.title}
                            </Text>
                          </div>
                          {item.subItems.map((subItem) => {
                            const isSubSelected = activeItem?.id === subItem.id;
                            return (
                              <MenuItem
                                key={subItem.id}
                                onClick={() => handleItemClick(subItem)}
                                secondaryContent={
                                  isSubSelected ? (
                                    <Checkmark20Regular className={styles.selectedCheck} />
                                  ) : undefined
                                }
                              >
                                <Text weight={isSubSelected ? 'semibold' : 'regular'}>
                                  {subItem.title}
                                </Text>
                              </MenuItem>
                            );
                          })}
                        </MenuList>
                      </MenuPopover>
                    </Menu>
                  );
                }

                return (
                  <Tooltip key={item.id} content={item.title} relationship="label" positioning="after">
                    <button
                      type="button"
                      className={mergeClasses(
                        styles.compactItem,
                        isSelected && styles.compactItemActive
                      )}
                      onClick={() => handleItemClick(item)}
                      aria-label={item.title}
                      aria-current={isSelected ? 'page' : undefined}
                    >
                      {isSelected && <span className={styles.activePill} />}
                      <IconComponent />
                    </button>
                  </Tooltip>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Footer: Area badge switcher */}
        <div className={styles.compactFooter}>
          <Menu positioning="after-bottom">
            <MenuTrigger disableButtonEnhancement>
              <Tooltip content={`Área: ${activeArea.name}`} relationship="label" positioning="after">
                <button
                  type="button"
                  className={styles.compactAreaButton}
                  aria-label={`Cambiar área: ${activeArea.name}`}
                >
                  <span className={styles.compactAreaBadge}>
                    {activeArea.shortCode}
                  </span>
                </button>
              </Tooltip>
            </MenuTrigger>
            <MenuPopover>
              <MenuList className={styles.areaMenu}>
                <div className={styles.areaMenuHeader}>
                  <Text size={200} weight="semibold">
                    CAMBIAR ÁREA
                  </Text>
                </div>
                {areas.map((area) => (
                  <MenuItem
                    key={area.id}
                    icon={
                      <div className={styles.areaMenuBadge}>
                        {area.shortCode}
                      </div>
                    }
                    secondaryContent={
                      area.id === activeArea.id ? (
                        <Checkmark20Regular className={styles.selectedCheck} />
                      ) : undefined
                    }
                    onClick={() => handleAreaSelect(area)}
                  >
                    <Text weight={area.id === activeArea.id ? 'semibold' : 'regular'}>
                      {area.name}
                    </Text>
                  </MenuItem>
                ))}
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </aside>
    );
  }

  // Expanded NavDrawer Mode (Dynamics 365 style matching media_1791178439581.png)
  return (
    <NavDrawer
      type={type}
      open={open}
      onOpenChange={(_, data) => onOpenChange(data.open)}
      selectedValue={activeItem?.id || ''}
      className={styles.navDrawer}
    >
      {/* Top: Hamburger icon on the left, clean and minimal */}
      <div className={styles.topHamburgerRow}>
        <Tooltip content="Contraer navegación" relationship="label" positioning="after">
          <Button
            appearance="subtle"
            className={styles.hamburgerBtn}
            onClick={handleToggle}
            aria-label="Contraer navegación"
            icon={<Navigation20Regular />}
          />
        </Tooltip>
      </div>

      {/* Body: Direct group headers and items, NO Home/Recent/Pinned */}
      <NavDrawerBody className={styles.drawerBody}>
        <Nav
          selectedValue={activeItem?.id || ''}
          onNavItemSelect={(_, data) => {
            for (const grp of activeArea.groups) {
              for (const itm of grp.items) {
                if (itm.id === data.value) {
                  handleItemClick(itm);
                  return;
                }
                if (itm.subItems) {
                  const foundSub = itm.subItems.find((s) => s.id === data.value);
                  if (foundSub) {
                    handleItemClick(foundSub);
                    return;
                  }
                }
              }
            }
          }}
        >
          {activeArea.groups.map((group) => (
            <React.Fragment key={group.id}>
              <NavSectionHeader className={styles.sectionHeader}>
                {group.title}
              </NavSectionHeader>

              {group.items.map((item) => {
                const IconComponent = ICONS_MAP[item.iconName] || ICONS_MAP.Box;

                if (item.subItems && item.subItems.length > 0) {
                  return (
                    <NavCategory key={item.id} value={item.id}>
                      <NavCategoryItem icon={<IconComponent />}>
                        {item.title}
                      </NavCategoryItem>
                      <NavSubItemGroup>
                        {item.subItems.map((subItem) => (
                          <NavSubItem
                            key={subItem.id}
                            value={subItem.id}
                            href={subItem.path}
                            onClick={(e: React.MouseEvent) => {
                              if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                                e.preventDefault();
                                handleItemClick(subItem);
                              }
                            }}
                          >
                            {subItem.title}
                          </NavSubItem>
                        ))}
                      </NavSubItemGroup>
                    </NavCategory>
                  );
                }

                return (
                  <NavItem
                    key={item.id}
                    value={item.id}
                    icon={<IconComponent />}
                    href={item.path}
                    onClick={(e: React.MouseEvent) => {
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                        e.preventDefault();
                        handleItemClick(item);
                      }
                    }}
                  >
                    {item.title}
                  </NavItem>
                );
              })}
            </React.Fragment>
          ))}
        </Nav>
      </NavDrawerBody>

      {/* Footer: Area Switcher Menu at bottom */}
      <NavDrawerFooter className={styles.drawerFooter}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div
              className={styles.bottomAreaSwitcher}
              title={`Área activa: ${activeArea.name}`}
              role="button"
              tabIndex={0}
            >
              <div className={styles.areaNameGroup}>
                <div className={styles.areaBadge}>
                  {activeArea.shortCode}
                </div>
                <span className={styles.areaText}>{activeArea.name}</span>
              </div>
              <ChevronUpDown20Regular />
            </div>
          </MenuTrigger>

          <MenuPopover>
            <MenuList className={styles.areaMenu}>
              <div>
                <Text size={200} weight="semibold" className={styles.areaMenuHeader}>
                  CAMBIAR ÁREA
                </Text>
              </div>
              {areas.map((area) => (
                <MenuItem
                  key={area.id}
                  icon={
                    <div className={styles.areaMenuBadge}>
                      {area.shortCode}
                    </div>
                  }
                  secondaryContent={
                    area.id === activeArea.id ? (
                      <Checkmark20Regular className={styles.selectedCheck} />
                    ) : undefined
                  }
                  onClick={() => handleAreaSelect(area)}
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
