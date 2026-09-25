import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CdkMenuModule } from '@angular/cdk/menu';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NavigationService, ErpModule, ModuleMenuItem, NavigationArea } from '../../services/navigation.service';
import { AppIconComponent, IconName } from '../../../shared/components/icon';
import { ToastContainerComponent } from '../../services/toast-container.component';

export interface GlobalSearchItem {
  title: string;
  category: string;
  path: string;
  icon?: string;
  keywords?: string[];
}

export interface GlobalSearchGroup {
  category: string;
  items: GlobalSearchItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CdkMenuModule,
    AppIconComponent,
    ToastContainerComponent,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  isCollapsed = false;
  isAppLauncherVisible = false;
  isMobileSiderVisible = false;
  isSearchFocused = false;

  private router = inject(Router);
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  navService = inject(NavigationService);

  readonly currentUser = this.authService.currentUser;
  readonly userInitials = computed(() => this.authService.getUserInitials());

  searchQuery = signal<string>('');

  readonly searchIndex = computed<GlobalSearchItem[]>(() => {
    const items: GlobalSearchItem[] = [
      {
        title: 'Registrar Nuevo Colaborador',
        category: 'Acciones Rápidas',
        path: '/rrhh/empleados/nuevo',
        icon: 'user',
        keywords: ['nuevo', 'crear', 'empleado', 'colaborador', 'alta'],
      },
      {
        title: 'Registrar Nuevo Usuario',
        category: 'Acciones Rápidas',
        path: '/configuracion/usuarios/nuevo',
        icon: 'user',
        keywords: ['nuevo', 'crear', 'usuario', 'cuenta', 'acceso'],
      },
      {
        title: 'Centro de Aplicaciones (Dashboard)',
        category: 'Navegación General',
        path: '/dashboard',
        icon: 'grid',
        keywords: ['inicio', 'home', 'portal', 'dashboard', 'apps'],
      },
    ];

    for (const mod of this.navService.modules) {
      for (const item of mod.items || []) {
        if (item.path) {
          items.push({
            title: item.title,
            category: mod.title,
            path: item.path,
            icon: item.icon || mod.icon,
            keywords: [mod.title, item.title],
          });
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.path) {
              items.push({
                title: child.title,
                category: `${mod.title} / ${item.title}`,
                path: child.path,
                icon: child.icon || item.icon || mod.icon,
                keywords: [mod.title, item.title, child.title],
              });
            }
          }
        }
      }
    }

    return items;
  });

  readonly groupedSearchResults = computed<GlobalSearchGroup[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const all = this.searchIndex();

    if (!query) {
      const defaults = all.slice(0, 6);
      return this.groupItemsByCategory(defaults);
    }

    const matches = all.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchCat = item.category.toLowerCase().includes(query);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(query));
      return matchTitle || matchCat || matchKeywords;
    });

    return this.groupItemsByCategory(matches.slice(0, 10));
  });

  private groupItemsByCategory(items: GlobalSearchItem[]): GlobalSearchGroup[] {
    const groupMap = new Map<string, GlobalSearchItem[]>();
    for (const it of items) {
      if (!groupMap.has(it.category)) {
        groupMap.set(it.category, []);
      }
      groupMap.get(it.category)!.push(it);
    }

    return Array.from(groupMap.entries()).map(([category, groupItems]) => ({
      category,
      items: groupItems,
    }));
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onSelectSearchResult(item: GlobalSearchItem): void {
    this.searchQuery.set('');
    this.isSearchFocused = false;
    this.router.navigate([item.path]);
  }

  constructor() {
    this.router.events.subscribe(() => {
      this.closeMobileSider();
    });
  }

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleMobileSider(): void {
    this.isMobileSiderVisible = !this.isMobileSiderVisible;
  }

  closeMobileSider(): void {
    this.isMobileSiderVisible = false;
  }

  openAppLauncher(): void {
    this.isAppLauncherVisible = true;
  }

  closeAppLauncher(): void {
    this.isAppLauncherVisible = false;
  }

  selectModuleAndClose(module: ErpModule): void {
    this.closeAppLauncher();
    this.selectModule(module);
  }

  goToDashboardAndClose(): void {
    this.closeAppLauncher();
    this.goToDashboard();
  }

  isActive(item: ModuleMenuItem): boolean {
    if (!item.path) return false;
    if (item.matchPrefix) {
      return this.router.url.startsWith(item.path);
    }
    return this.router.url === item.path;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToConfiguracion(): void {
    this.router.navigate(['/configuracion/usuarios']);
  }

  selectModule(module: ErpModule): void {
    this.navService.switchToModule(module);
  }

  selectArea(area: NavigationArea): void {
    this.navService.switchToArea(area);
  }

  getNavIcon(iconName?: string): IconName {
    if (!iconName) return 'file-text';
    switch (iconName) {
      case 'dashboard':
      case 'appstore':
        return 'grid';
      case 'team':
      case 'user':
        return 'users';
      case 'folder':
        return 'folder';
      case 'tool':
      case 'wrench':
        return 'wrench';
      case 'box':
      case 'inbox':
        return 'box';
      case 'setting':
      case 'settings':
        return 'settings';
      case 'calendar':
        return 'calendar';
      case 'clock':
        return 'clock';
      case 'tag':
        return 'tag';
      default:
        return 'file-text';
    }
  }
}
