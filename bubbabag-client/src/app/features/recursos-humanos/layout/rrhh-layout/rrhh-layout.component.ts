import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-rrhh-layout',
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
  ],
  templateUrl: './rrhh-layout.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./rrhh-layout.css'],
})
export class RrhhLayoutComponent {
  isCollapsed = false;
  private router = inject(Router);
  private authService = inject(AuthService);
  themeService = inject(ThemeService);

  menuItems = [
    { title: 'Gestión de Colaboradores', icon: 'team', path: '/rrhh/empleados', matchPrefix: true },
    {
      title: 'Asistencia y Turnos',
      icon: 'clock-circle',
      path: '/rrhh/asistencia',
      matchPrefix: false,
    },
    {
      title: 'Licencias y Vacaciones',
      icon: 'calendar',
      path: '/rrhh/licencias',
      matchPrefix: false,
    },
    { title: 'Planilla / Nómina', icon: 'dollar', path: '/rrhh/planilla', matchPrefix: false },
    {
      title: 'Reclutamiento (ATS)',
      icon: 'user-add',
      path: '/rrhh/reclutamiento',
      matchPrefix: false,
    },
    { title: 'Portal del Empleado', icon: 'solution', path: '/rrhh/portal', matchPrefix: false },
    {
      title: 'Desempeño y Desarrollo',
      icon: 'line-chart',
      path: '/rrhh/desempeno',
      matchPrefix: false,
    },
    {
      title: 'Reportes e Indicadores',
      icon: 'pie-chart',
      path: '/rrhh/reportes',
      matchPrefix: false,
    },
  ];

  isActive(item: any): boolean {
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
}
