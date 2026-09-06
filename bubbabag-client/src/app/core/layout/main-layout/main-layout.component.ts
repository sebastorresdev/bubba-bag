import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NavigationService, ErpModule, ModuleMenuItem } from '../../services/navigation.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzButtonModule,
    NzTooltipModule,
    NzAvatarModule,
    NzDropdownModule,
    NzInputModule,
    NzBadgeModule,
    NzDividerModule,
    NzDrawerModule,
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
  private router = inject(Router);
  private authService = inject(AuthService);
  themeService = inject(ThemeService);
  navService = inject(NavigationService);

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

  selectModule(module: ErpModule) {
    this.navService.switchToModule(module);
  }
}
