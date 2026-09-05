import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NzIconModule, NzButtonModule, NzTooltipModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      <header class="bg-primary text-gray-900 p-4 shadow-sm flex justify-between items-center border-b border-primary/20 dark:border-primary/10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-900 dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-inner">
            <nz-icon nzType="appstore" nzTheme="outline" class="text-xl leading-none" style="color: #B2E160;" />
          </div>
          <span class="text-2xl font-extrabold tracking-tight leading-none text-gray-900 flex items-center h-10">BubbaBag ERP</span>
        </div>

        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-800 text-primary flex items-center justify-center font-bold">
              A
            </div>
            <span class="font-semibold hidden sm:inline text-gray-900">Hola, Admin</span>
          </div>

          <button nz-button nzType="text" nzShape="circle" class="hover:bg-primary-hover flex items-center justify-center"
                  nz-tooltip nzTooltipTitle="Cambiar Tema" (click)="themeService.toggleTheme()">
            <nz-icon [nzType]="themeService.isDarkMode() ? 'sun' : 'moon'" nzTheme="outline" class="text-xl text-gray-900" />
          </button>

          <button nz-button nzType="text" nzShape="circle" class="hover:bg-primary-hover flex items-center justify-center"
                  nz-tooltip nzTooltipTitle="Cerrar Sesión" (click)="logout()">
            <nz-icon nzType="logout" nzTheme="outline" class="text-xl text-gray-900" />
          </button>
        </div>
      </header>

      <main class="grow p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white! mb-2">Bienvenido al Panel de Control</h2>
          <p class="text-gray-500 dark:text-gray-300! mt-2 text-lg">Selecciona un módulo para comenzar a trabajar.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (module of modules; track module.id) {
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-primary dark:hover:border-primary group flex flex-col h-full" (click)="goToModule(module.name)">
              <div class="w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-4 group-hover:bg-primary dark:group-hover:bg-gray-700/80 transition-colors">
                <nz-icon [nzType]="module.icon" nzTheme="outline" class="text-2xl text-gray-700 dark:text-gray-300! group-hover:text-gray-900! dark:group-hover:text-primary! transition-colors" />
              </div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white! mb-2 dark:group-hover:text-primary! transition-colors">{{ module.name }}</h3>
              <p class="text-gray-500 dark:text-gray-400! text-sm grow leading-relaxed">{{ module.description }}</p>

              <div class="mt-4 flex items-center text-sm font-semibold text-gray-900 dark:text-primary! opacity-0 group-hover:opacity-100 transition-opacity">
                Entrar al módulo <nz-icon nzType="arrow-right" class="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);

  modules = [
    { id: 1, name: 'Recursos Humanos', icon: 'team', description: 'Gestión de empleados, control de asistencia, nómina y permisos.' },
    { id: 2, name: 'Ventas POS', icon: 'shopping-cart', description: 'Caja rápida, facturación electrónica y control de turnos.' },
    { id: 3, name: 'Inventario', icon: 'database', description: 'Control de stock de productos, ingresos, salidas y mermas.' },
    { id: 4, name: 'CRM y Clientes', icon: 'user', description: 'Base de datos de clientes, historial de compras y fidelización.' },
    { id: 5, name: 'Finanzas', icon: 'dollar', description: 'Cuentas por cobrar, cuentas por pagar y flujo de caja.' },
    { id: 6, name: 'Compras', icon: 'shop', description: 'Gestión de proveedores, órdenes de compra y recepción.' },
    { id: 7, name: 'Reportes', icon: 'bar-chart', description: 'Analíticas del negocio, rentabilidad y ventas por período.' },
    { id: 8, name: 'Configuración', icon: 'setting', description: 'Ajustes del sistema, usuarios, roles y preferencias.' },
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
