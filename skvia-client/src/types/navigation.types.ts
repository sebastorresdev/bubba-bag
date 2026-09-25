export interface NavItem {
  id: string;
  title: string;
  path: string;
  iconName: string;
  badge?: string;
  description?: string;
  subItems?: NavItem[];
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export interface NavArea {
  id: string;
  name: string;
  shortCode: string;
  iconName: string;
  color: string;
  defaultPath: string;
  groups: NavGroup[];
}

export interface EnterpriseApp {
  id: string;
  name: string;
  subtitle: string;
  shortCode: string;
  iconName: string;
  color: string;
  description: string;
  areas: NavArea[];
}
