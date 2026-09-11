import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NavigationService, ErpModule, ModuleMenuItem } from '../../services/navigation.service';

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
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzButtonModule,
    NzTooltipModule,
    NzAvatarModule,
    NzDropdownModule,
    NzInputModule,
    NzBadgeModule,
    NzDividerModule,
    NzDrawerModule,
    NzTagModule,
    NzAutocompleteModule,
  ],
  templateUrl: './main-layout.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class MainLayoutComponent {
  isCollapsed = false;
  isAppLauncherVisible = false;
  isMobileSiderVisible = false;
  private router = inject(Router);
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  navService = inject(NavigationService);

  readonly currentUser = this.authService.currentUser;
  readonly userInitials = computed(() => this.authService.getUserInitials());

  // Búsqueda global interactiva estilo Algolia / Dynamics 365
  searchQuery = signal<string>('');

  // Índice completo de rutas y páginas indexables del ERP
  readonly searchIndex = computed<GlobalSearchItem[]>(() => {
    const items: GlobalSearchItem[] = [];

    // Accesos Rápidos
    items.push(
      {
        title: 'Registrar Nuevo Colaborador',
        category: 'Acciones Rápidas',
        path: '/rrhh/empleados/nuevo',
        icon: 'user-add',
        keywords: ['nuevo', 'crear', 'empleado', 'colaborador', 'alta'],
      },
      {
        title: 'Registrar Nuevo Usuario',
        category: 'Acciones Rápidas',
        path: '/configuracion/usuarios/nuevo',
        icon: 'user-add',
        keywords: ['nuevo', 'crear', 'usuario', 'cuenta', 'acceso'],
      },
      {
        title: 'Centro de Aplicaciones (Dashboard)',
        category: 'Navegación General',
        path: '/dashboard',
        icon: 'appstore',
        keywords: ['inicio', 'home', 'portal', 'dashboard', 'apps'],
      }
    );

    // Módulos y submódulos de NavigationService
    for (const mod of this.navService.modules) {
      for (const item of mod.items) {
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

  // Resultados agrupados en tiempo real según el texto ingresado
  readonly groupedSearchResults = computed<GlobalSearchGroup[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const all = this.searchIndex();

    if (!query) {
      // Sugerencias por defecto si el input está enfocado pero vacío
      const defaults = all.slice(0, 6);
      return this.groupItemsByCategory(defaults);
    }

    // Filtrar por título, categoría o keywords
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
    this.router.navigate([item.path]);
  }

  constructor() {
    this.router.events.subscribe(() => {
      this.closeMobileSider();
    });
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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToConfiguracion() {
    this.router.navigate(['/configuracion/usuarios']);
  }

  selectModule(module: ErpModule) {
    this.navService.switchToModule(module);
  }
}
