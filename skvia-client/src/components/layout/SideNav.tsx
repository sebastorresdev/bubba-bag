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
  navDrawer: {
    height: '100%',
    boxSizing: 'border-box',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  drawerBody: {
    paddingInlineStart: '0px',
    paddingInlineEnd: '0px',
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
}) => {
  const styles = useStyles();

  const handleItemClick = (item: NavItemData) => {
    onSelectItem(item);
    // On overlay / mobile mode, close drawer after selecting item
    if (type === 'overlay') {
      onOpenChange(false);
    }
  };

  const handleAreaSelect = (area: NavArea) => {
    onSelectArea(area);
    // Changing areas navigates too, so close the modal drawer on compact screens.
    if (type === 'overlay') {
      onOpenChange(false);
    }
  };

  return (
    <NavDrawer
      type={type}
      open={open}
      onOpenChange={(_, data) => onOpenChange(data.open)}
      selectedValue={activeItem?.id || ''}
      className={styles.navDrawer}
    >
      {/* Body with Fluent UI v9 Nav, Sections, Items and SubItems */}
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

                // If item has sub-items, render as NavCategory + NavSubItem
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

                // Standard NavItem
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

      {/* Footer with clean Area Switcher Menu */}
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
                <div
                  className={styles.areaBadge}
                >
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
                      <Checkmark20Regular
                        className={styles.selectedCheck}
                      />
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
