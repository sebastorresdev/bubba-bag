import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NzIconModule, NzButtonModule, NzTooltipModule, NzCardModule, NzAvatarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="dashboard-layout">
      <!-- Top Navigation Header -->
      <header class="dashboard-header">
        <div class="dashboard-brand">
          <div class="dashboard-brand-icon">
            <nz-icon nzType="appstore" nzTheme="outline" />
          </div>
          <span class="dashboard-brand-title">BubbaBag ERP</span>
        </div>

        <div class="dashboard-actions">
          <div class="dashboard-user">
            <nz-avatar nzIcon="user" nzSize="small" />
            <span class="dashboard-user-name">Admin</span>
          </div>

          <button
            nz-button
            nzType="text"
            nzShape="circle"
            nz-tooltip
            [nzTooltipTitle]="themeService.isDarkMode() ? 'Modo Claro' : 'Modo Oscuro'"
            (click)="themeService.toggleTheme()"
          >
            <nz-icon [nzType]="themeService.isDarkMode() ? 'sun' : 'moon'" />
          </button>

          <button
            nz-button
            nzType="text"
            nzShape="circle"
            nz-tooltip
            nzTooltipTitle="Cerrar Sesión"
            (click)="logout()"
          >
            <nz-icon nzType="logout" />
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="dashboard-content">
        <div class="dashboard-intro">
          <h1 class="dashboard-title">Bienvenido al Panel de Control</h1>
          <p class="dashboard-subtitle">Selecciona un módulo para comenzar a trabajar.</p>
        </div>

        <div class="dashboard-grid">
          @for (module of modules; track module.id) {
            <nz-card
              nzHoverable
              [nzBordered]="true"
              class="dashboard-card"
              (click)="goToModule(module.name)"
            >
              <div class="dashboard-card-inner">
                <div class="dashboard-card-icon">
                  <nz-icon [nzType]="module.icon" nzTheme="outline" />
                </div>
                <h2 class="dashboard-card-name">{{ module.name }}</h2>
                <p class="dashboard-card-desc">{{ module.description }}</p>

                <div class="dashboard-card-action">
                  <span>Entrar al módulo</span>
                  <nz-icon nzType="arrow-right" />
                </div>
              </div>
            </nz-card>
          }
        </div>
      </main>
    </div>
  `,
  styles: `
    .dashboard-layout {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .dashboard-header {
      height: 56px;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(140, 140, 140, 0.2);
    }
    .dashboard-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .dashboard-brand-icon {
      font-size: 22px;
      display: flex;
      align-items: center;
    }
    .dashboard-brand-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .dashboard-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .dashboard-user {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      font-size: 14px;
    }
    .dashboard-content {
      flex: 1;
      padding: 32px 24px;
      max-width: 1280px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
    .dashboard-intro {
      margin-bottom: 32px;
    }
    .dashboard-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .dashboard-subtitle {
      font-size: 15px;
      opacity: 0.75;
      margin: 0;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .dashboard-card {
      cursor: pointer;
      height: 100%;
    }
    .dashboard-card-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .dashboard-card-icon {
      font-size: 28px;
      margin-bottom: 12px;
      display: flex;
    }
    .dashboard-card-name {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .dashboard-card-desc {
      font-size: 13px;
      opacity: 0.75;
      flex: 1;
      line-height: 1.5;
      margin: 0;
    }
    .dashboard-card-action {
      margin-top: 16px;
      display: flex;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
      gap: 6px;
    }
  `,
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);

  modules = [
    {
      id: 1,
      name: 'Recursos Humanos',
      icon: 'team',
      description: 'Gestión de empleados, control de asistencia, nómina y permisos.',
    },
    {
      id: 2,
      name: 'Ventas POS',
      icon: 'shopping-cart',
      description: 'Caja rápida, facturación electrónica y control de turnos.',
    },
    {
      id: 3,
      name: 'Inventario',
      icon: 'database',
      description: 'Control de stock de productos, ingresos, salidas y mermas.',
    },
    {
      id: 4,
      name: 'CRM y Clientes',
      icon: 'user',
      description: 'Base de datos de clientes, historial de compras y fidelización.',
    },
    {
      id: 5,
      name: 'Finanzas',
      icon: 'dollar',
      description: 'Cuentas por cobrar, cuentas por pagar y flujo de caja.',
    },
    {
      id: 6,
      name: 'Compras',
      icon: 'shop',
      description: 'Gestión de proveedores, órdenes de compra y recepción.',
    },
    {
      id: 7,
      name: 'Reportes',
      icon: 'bar-chart',
      description: 'Analíticas del negocio, rentabilidad y ventas por período.',
    },
    {
      id: 8,
      name: 'Configuración',
      icon: 'setting',
      description: 'Ajustes del sistema, usuarios, roles y preferencias.',
    },
  ];

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToModule(moduleName: string) {
    if (moduleName === 'Recursos Humanos') {
      this.router.navigate(['/rrhh/empleados']);
    }
  }
}
