import { Component, inject, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NavigationService } from '../../core/services/navigation.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDividerModule } from 'ng-zorro-antd/divider';

export interface DashboardAppCard {
  id: string;
  name: string;
  shortCode: string;
  category: 'operaciones' | 'gestion' | 'sistema';
  categoryLabel: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  route: string;
  isReady: boolean;
  statusText?: string;
  requiredRoles: string[];
  quickLinks: { label: string; route: string }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzTooltipModule,
    NzCardModule,
    NzAvatarModule,
    NzTagModule,
    NzInputModule,
    NzBadgeModule,
    NzDropdownModule,
    NzMenuModule,
    NzDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="d365-hub-root">
      <!-- Top Suite Bar (100% idéntico al Layout Principal Dynamics 365) -->
      <header class="erp-suite-bar">
        <div class="erp-suite-bar-brand">
          <button nz-button nzType="text" title="Centro de Aplicaciones" class="erp-waffle-btn">
            <nz-icon nzType="appstore" />
          </button>
          <span class="erp-brand-title" (click)="clearFilters()">BubbaBag ERP</span>
          <span class="erp-brand-sep">|</span>
          <span class="erp-module-title">Centro de Aplicaciones</span>
        </div>

        <div class="erp-suite-bar-search">
          <nz-input-wrapper>
            <span nzInputPrefix>
              <nz-icon nzType="search" />
            </span>
            <input
              type="text"
              nz-input
              nzSize="small"
              placeholder="Buscar aplicaciones, módulos o funciones..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            />
          </nz-input-wrapper>
        </div>

        <div class="erp-suite-bar-actions">
          <!-- Toggle Modo Oscuro / Claro -->
          <button
            nz-button
            nzType="text"
            class="erp-tool-btn"
            nz-tooltip
            [nzTooltipTitle]="themeService.isDarkMode() ? 'Modo Claro' : 'Modo Oscuro'"
            (click)="themeService.toggleTheme()"
          >
            <nz-icon [nzType]="themeService.isDarkMode() ? 'sun' : 'moon'" />
          </button>

          <nz-divider nzType="vertical"></nz-divider>

          <!-- Menú de Usuario con Dropdown idéntico al layout -->
          <a
            nz-dropdown
            [nzDropdownMenu]="userMenu"
            nzTrigger="click"
            nzPlacement="bottomRight"
            class="erp-user-dropdown-btn"
          >
            <nz-avatar
              [nzText]="userInitials()"
              nzSize="small"
              class="erp-user-avatar"
            />
            <span class="erp-user-name">{{ currentUser()?.nombreCompleto || 'Usuario' }}</span>
            <nz-icon nzType="down" />
          </a>

          <nz-dropdown-menu #userMenu="nzDropdownMenu">
            <ul nz-menu class="d365-menu-dropdown">
              <li nz-menu-item disabled class="d365-user-profile-header">
                <div class="d365-profile-info">
                  <div class="d365-profile-name">{{ currentUser()?.nombreCompleto }}</div>
                  <div class="d365-profile-email">{{ currentUser()?.email }}</div>
                  <div class="d365-profile-role">{{ userRoleLabel() }}</div>
                </div>
              </li>
              <li nz-menu-divider></li>
              <li nz-menu-item (click)="themeService.toggleTheme()">
                <nz-icon [nzType]="themeService.isDarkMode() ? 'sun' : 'moon'" />
                <span>{{ themeService.isDarkMode() ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro' }}</span>
              </li>
              <li nz-menu-divider></li>
              <li nz-menu-item nzDanger (click)="logout()">
                <nz-icon nzType="logout" />
                <span>Cerrar Sesión</span>
              </li>
            </ul>
          </nz-dropdown-menu>
        </div>
      </header>

      <!-- Contenedor Principal con Scroll Suave -->
      <div class="d365-hub-body">
        <!-- Hero Banner Corporativo -->
        <section class="d365-hub-hero">
          <div class="d365-hero-main">
            <div class="d365-hero-badge">
              <span class="d365-badge-dot"></span>
              <span>Portal Empresarial BubbaBag</span>
            </div>
            <h1 class="d365-hero-title">
              Hola, <span class="d365-highlight-name">{{ userFirstName() }}</span>
            </h1>
            <p class="d365-hero-subtitle">
              Selecciona una aplicación de negocio asignada a tu perfil para gestionar tus operaciones.
            </p>
          </div>

          <!-- Filtros Rápidos por Categoría -->
          <div class="d365-category-tabs">
            <button
              type="button"
              class="d365-tab-chip"
              [class.active]="selectedCategory() === 'all'"
              (click)="selectedCategory.set('all')"
            >
              Todas ({{ visibleModules().length }})
            </button>
            <button
              type="button"
              class="d365-tab-chip"
              [class.active]="selectedCategory() === 'gestion'"
              (click)="selectedCategory.set('gestion')"
            >
              Gestión & Talento
            </button>
            <button
              type="button"
              class="d365-tab-chip"
              [class.active]="selectedCategory() === 'operaciones'"
              (click)="selectedCategory.set('operaciones')"
            >
              Operaciones & Finanzas
            </button>
            <button
              type="button"
              class="d365-tab-chip"
              [class.active]="selectedCategory() === 'sistema'"
              (click)="selectedCategory.set('sistema')"
            >
              Configuración & Sistema
            </button>
          </div>
        </section>

        <!-- Grid de Aplicaciones Dinámico -->
        <main class="d365-hub-grid-wrapper">
          @if (filteredModules().length > 0) {
            <div class="d365-apps-grid">
              @for (app of filteredModules(); track app.id) {
                <div
                  class="d365-app-card"
                  [class.is-ready]="app.isReady"
                  (click)="handleCardClick(app)"
                  role="button"
                  tabindex="0"
                >
                  <!-- Franja superior de acento de color D365 -->
                  <div class="d365-card-accent" [style.background-color]="app.color"></div>

                  <div class="d365-card-header">
                    <div
                      class="d365-card-icon-box"
                      [style.color]="app.color"
                      [style.background-color]="app.bgColor"
                    >
                      <nz-icon [nzType]="app.icon" />
                    </div>

                    <div class="d365-card-badges">
                      <span class="d365-category-tag">{{ app.categoryLabel }}</span>
                      @if (app.isReady) {
                        <span class="d365-status-tag ready">Activo</span>
                      } @else {
                        <span class="d365-status-tag planned">Próximo</span>
                      }
                    </div>
                  </div>

                  <div class="d365-card-body">
                    <h2 class="d365-card-title">{{ app.name }}</h2>
                    <p class="d365-card-desc">{{ app.description }}</p>

                    <!-- Enlaces rápidos directos -->
                    @if (app.quickLinks.length > 0) {
                      <div class="d365-quicklinks">
                        <span class="d365-quicklinks-title">Accesos rápidos:</span>
                        <div class="d365-quicklinks-list">
                          @for (link of app.quickLinks; track link.route) {
                            <a
                              class="d365-quicklink-item"
                              (click)="$event.stopPropagation(); navigateTo(link.route)"
                            >
                              {{ link.label }}
                            </a>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <div class="d365-card-footer">
                    <div class="d365-card-cta">
                      @if (app.isReady) {
                        <span class="d365-cta-text">Abrir aplicación</span>
                        <nz-icon nzType="arrow-right" class="d365-cta-icon" />
                      } @else {
                        <span class="d365-cta-text-muted">En implementación</span>
                        <nz-icon nzType="clock-circle" class="d365-cta-icon-muted" />
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="d365-no-results">
              <nz-icon nzType="search" class="d365-no-results-icon" />
              <h3>No se encontraron aplicaciones</h3>
              <p>No hay módulos que coincidan con "{{ searchQuery() }}" o con la categoría seleccionada.</p>
              <button nz-button nzType="default" (click)="clearFilters()">
                Limpiar búsqueda y filtros
              </button>
            </div>
          }
        </main>

        <!-- Footer Corporativo -->
        <footer class="d365-hub-footer">
          <div class="d365-footer-left">
            <span>BubbaBag ERP &copy; {{ currentYear }} &bull; Arquitectura Corporativa Dynamics 365</span>
          </div>
          <div class="d365-footer-right">
            <span class="d365-footer-status">
              <span class="d365-online-bullet"></span>
              Servicios en línea activos
            </span>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        width: 100%;
        overflow: hidden;
        background-color: #f5f5f5;
        color: #242424;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      }

      :host-context([data-theme='dark']),
      :host-context(.dark-theme) {
        background-color: #141414 !important;
        color: #f5f5f5 !important;
      }

      /* Variables Dinámicas para Light / Dark Mode */
      .d365-hub-root {
        --d365-bg-canvas: #f5f5f5;
        --d365-bg-card: #ffffff;
        --d365-border-subtle: #edebe9;
        --d365-border-hover: #c7c6c4;
        --d365-text-primary: #1b1b1b;
        --d365-text-secondary: #605e5c;
        --d365-text-muted: #8a8886;
        --d365-suite-bg: #001529;
        --d365-suite-color: #ffffff;
        --d365-accent-blue: #0f6cbd;
        --d365-shadow-card: 0 1.6px 3.6px 0 rgba(0, 0, 0, 0.08), 0 0.3px 0.9px 0 rgba(0, 0, 0, 0.05);
        --d365-shadow-hover: 0 6.4px 14.4px 0 rgba(0, 0, 0, 0.12), 0 1.2px 3.6px 0 rgba(0, 0, 0, 0.08);

        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
        background-color: var(--d365-bg-canvas);
      }

      :host-context([data-theme='dark']) .d365-hub-root,
      :host-context(.dark-theme) .d365-hub-root {
        --d365-bg-canvas: #141414;
        --d365-bg-card: #1f1f1f;
        --d365-border-subtle: #303030;
        --d365-border-hover: #434343;
        --d365-text-primary: #f5f5f5;
        --d365-text-secondary: #a6a6a6;
        --d365-text-muted: #737373;
        --d365-suite-bg: #141414;
        --d365-suite-color: #f5f5f5;
        --d365-accent-blue: #2886de;
        --d365-shadow-card: 0 2px 8px rgba(0, 0, 0, 0.45);
        --d365-shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.65);
      }

      /* -------------------------------------------------------------
         Suite Bar Superior (Usa las clases globales de layout.css)
         ------------------------------------------------------------- */


      /* -------------------------------------------------------------
         Cuerpo / Contenido con Scroll
         ------------------------------------------------------------- */
      .d365-hub-body {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        scroll-behavior: smooth;
        background-color: var(--d365-bg-canvas);
      }

      /* Hero Section */
      .d365-hub-hero {
        background: linear-gradient(180deg, var(--d365-bg-card) 0%, var(--d365-bg-canvas) 100%);
        border-bottom: 1px solid var(--d365-border-subtle);
        padding: 32px 36px 20px 36px;
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
      }

      .d365-hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--d365-accent-blue);
        background-color: rgba(15, 108, 189, 0.08);
        padding: 3px 10px;
        border-radius: 12px;
        margin-bottom: 12px;
      }

      .d365-badge-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--d365-accent-blue);
      }

      .d365-hero-title {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.5px;
        margin: 0 0 6px 0;
        color: var(--d365-text-primary);
      }

      .d365-highlight-name {
        color: var(--d365-accent-blue);
      }

      .d365-hero-subtitle {
        font-size: 14px;
        color: var(--d365-text-secondary);
        margin: 0 0 24px 0;
        max-width: 650px;
        line-height: 1.5;
      }

      /* Tabs de Filtro de Categoría */
      .d365-category-tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .d365-tab-chip {
        border: 1px solid var(--d365-border-subtle);
        background-color: var(--d365-bg-card);
        color: var(--d365-text-secondary);
        font-size: 13px;
        font-weight: 600;
        padding: 6px 14px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .d365-tab-chip:hover {
        border-color: var(--d365-border-hover);
        color: var(--d365-text-primary);
      }

      .d365-tab-chip.active {
        background-color: var(--d365-accent-blue);
        border-color: var(--d365-accent-blue);
        color: #ffffff;
      }

      /* -------------------------------------------------------------
         Grid de Aplicaciones
         ------------------------------------------------------------- */
      .d365-hub-grid-wrapper {
        flex: 1;
        padding: 28px 36px 40px 36px;
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
      }

      .d365-apps-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
        gap: 20px;
      }

      .d365-app-card {
        background-color: var(--d365-bg-card);
        border: 1px solid var(--d365-border-subtle);
        border-radius: 8px;
        box-shadow: var(--d365-shadow-card);
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
      }

      .d365-app-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--d365-shadow-hover);
        border-color: var(--d365-border-hover);
      }

      .d365-card-accent {
        height: 4px;
        width: 100%;
        flex-shrink: 0;
      }

      .d365-card-header {
        padding: 20px 20px 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .d365-card-icon-box {
        width: 46px;
        height: 46px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
      }

      .d365-card-badges {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .d365-category-tag {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--d365-text-muted);
      }

      .d365-status-tag {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 10px;
      }

      .d365-status-tag.ready {
        background-color: rgba(16, 124, 65, 0.1);
        color: #107c41;
      }

      .d365-status-tag.planned {
        background-color: rgba(138, 136, 134, 0.12);
        color: var(--d365-text-muted);
      }

      .d365-card-body {
        padding: 0 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .d365-card-title {
        font-size: 17px;
        font-weight: 700;
        color: var(--d365-text-primary);
        margin: 0 0 6px 0;
        letter-spacing: -0.2px;
      }

      .d365-card-desc {
        font-size: 13px;
        line-height: 1.5;
        color: var(--d365-text-secondary);
        margin: 0 0 16px 0;
        flex: 1;
      }

      .d365-quicklinks {
        border-top: 1px dashed var(--d365-border-subtle);
        padding-top: 10px;
        margin-bottom: 12px;
      }

      .d365-quicklinks-title {
        font-size: 11px;
        font-weight: 600;
        color: var(--d365-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.3px;
        display: block;
        margin-bottom: 6px;
      }

      .d365-quicklinks-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .d365-quicklink-item {
        font-size: 12px;
        color: var(--d365-accent-blue);
        background-color: rgba(15, 108, 189, 0.06);
        padding: 3px 8px;
        border-radius: 4px;
        text-decoration: none;
        transition: background-color 0.15s;
        cursor: pointer;
      }

      .d365-quicklink-item:hover {
        background-color: rgba(15, 108, 189, 0.15);
        text-decoration: underline;
      }

      .d365-card-footer {
        padding: 12px 20px;
        border-top: 1px solid var(--d365-border-subtle);
        background-color: rgba(0, 0, 0, 0.01);
      }

      .d365-card-cta {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .d365-cta-text {
        font-size: 13px;
        font-weight: 600;
        color: var(--d365-accent-blue);
      }

      .d365-cta-icon {
        font-size: 13px;
        color: var(--d365-accent-blue);
        transition: transform 0.15s ease;
      }

      .d365-app-card:hover .d365-cta-icon {
        transform: translateX(4px);
      }

      .d365-cta-text-muted {
        font-size: 12px;
        color: var(--d365-text-muted);
        font-weight: 500;
      }

      .d365-cta-icon-muted {
        font-size: 12px;
        color: var(--d365-text-muted);
      }

      /* No results */
      .d365-no-results {
        text-align: center;
        padding: 60px 20px;
        background-color: var(--d365-bg-card);
        border: 1px dashed var(--d365-border-subtle);
        border-radius: 8px;
      }

      .d365-no-results-icon {
        font-size: 44px;
        color: var(--d365-text-muted);
        margin-bottom: 16px;
      }

      .d365-no-results h3 {
        font-size: 18px;
        color: var(--d365-text-primary);
        margin: 0 0 8px 0;
      }

      .d365-no-results p {
        font-size: 14px;
        color: var(--d365-text-secondary);
        margin: 0 0 20px 0;
      }

      /* Footer */
      .d365-hub-footer {
        border-top: 1px solid var(--d365-border-subtle);
        padding: 16px 36px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: var(--d365-text-muted);
        background-color: var(--d365-bg-card);
        flex-shrink: 0;
      }

      .d365-footer-status {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .d365-online-bullet {
        width: 8px;
        height: 8px;
        background-color: #107c41;
        border-radius: 50%;
        display: inline-block;
      }

      .d365-user-profile-header {
        padding: 12px 16px !important;
        cursor: default !important;
      }

      .d365-profile-name {
        font-weight: 700;
        font-size: 14px;
        color: var(--d365-text-primary);
      }

      .d365-profile-email {
        font-size: 12px;
        color: var(--d365-text-muted);
      }

      .d365-profile-role {
        display: inline-block;
        margin-top: 4px;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        background-color: rgba(15, 108, 189, 0.1);
        color: var(--d365-accent-blue);
      }

      /* -------------------------------------------------------------
         Responsive Media Queries
         ------------------------------------------------------------- */
      @media (max-width: 992px) {
        .d365-suite-sub,
        .d365-suite-sep {
          display: none;
        }

        .d365-suite-search {
          max-width: 320px;
          margin: 0 12px;
        }

        .d365-hub-hero,
        .d365-hub-grid-wrapper,
        .d365-hub-footer {
          padding-left: 20px;
          padding-right: 20px;
        }
      }

      @media (max-width: 768px) {
        .d365-suite-search {
          display: none;
        }

        .d365-user-name,
        .d365-user-arrow {
          display: none;
        }

        .d365-hero-title {
          font-size: 22px;
        }

        .d365-apps-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .d365-hub-footer {
          flex-direction: column;
          gap: 8px;
          text-align: center;
        }
      }

      @media (max-width: 480px) {
        .d365-hub-hero {
          padding: 20px 16px 16px 16px;
        }

        .d365-hub-grid-wrapper {
          padding: 16px;
        }

        .d365-category-tabs {
          overflow-x: auto;
          white-space: nowrap;
          padding-bottom: 6px;
        }
      }
    `,
  ],
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);
  navService = inject(NavigationService);

  readonly currentUser = this.authService.currentUser;
  readonly userInitials = computed(() => this.authService.getUserInitials());
  readonly currentYear = new Date().getFullYear();

  readonly userFirstName = computed(() => {
    const fullName = this.currentUser()?.nombreCompleto || 'Usuario';
    return fullName.split(' ')[0];
  });

  readonly userRoleLabel = computed(() => {
    const roles = this.currentUser()?.roles || [];
    if (roles.includes('SuperAdmin')) return 'Super Administrador';
    if (roles.includes('Gerencia')) return 'Gerencia General';
    if (roles.includes('RrhhAdmin')) return 'Administrador RRHH';
    return roles[0] || 'Colaborador';
  });

  // Estado reactivo de búsqueda y filtros
  searchQuery = signal<string>('');
  selectedCategory = signal<'all' | 'operaciones' | 'gestion' | 'sistema'>('all');

  // Catálogo completo de aplicaciones de negocio con estilo Dynamics 365
  readonly allApps: DashboardAppCard[] = [
    {
      id: 'rrhh',
      name: 'Recursos Humanos',
      shortCode: 'RH',
      category: 'gestion',
      categoryLabel: 'Talento & Personas',
      description: 'Gestión integral de colaboradores, reclutamiento, legajos, estructura organizacional y nómina.',
      icon: 'team',
      color: '#0078d4',
      bgColor: 'rgba(0, 120, 212, 0.1)',
      route: '/rrhh/empleados',
      isReady: true,
      requiredRoles: ['SuperAdmin', 'Gerencia', 'RrhhAdmin', 'RrhhAsistente'],
      quickLinks: [
        { label: 'Colaboradores', route: '/rrhh/empleados' },
        { label: 'Nuevo Empleado', route: '/rrhh/empleados/nuevo' },
        { label: 'Departamentos', route: '/rrhh/departamentos' },
      ],
    },
    {
      id: 'configuracion',
      name: 'Configuración y Accesos',
      shortCode: 'CF',
      category: 'sistema',
      categoryLabel: 'Administración',
      description: 'Control de seguridad, auditoría, gestión de cuentas de usuario, roles y permisos de la plataforma.',
      icon: 'setting',
      color: '#5c2d91',
      bgColor: 'rgba(92, 45, 145, 0.1)',
      route: '/configuracion/usuarios',
      isReady: true,
      requiredRoles: ['SuperAdmin', 'Gerencia'],
      quickLinks: [
        { label: 'Usuarios', route: '/configuracion/usuarios' },
        { label: 'Nuevo Usuario', route: '/configuracion/usuarios/nuevo' },
      ],
    },
    {
      id: 'ventas',
      name: 'Centro de Ventas & POS',
      shortCode: 'VT',
      category: 'operaciones',
      categoryLabel: 'Comercial',
      description: 'Punto de venta en caja rápida, facturación electrónica, catálogo comercial y pedidos.',
      icon: 'shopping-cart',
      color: '#107c41',
      bgColor: 'rgba(16, 124, 65, 0.1)',
      route: '/ventas',
      isReady: false,
      requiredRoles: ['SuperAdmin', 'Gerencia', 'VentasAdmin'],
      quickLinks: [
        { label: 'Punto de Venta', route: '/ventas/pos' },
        { label: 'Facturación', route: '/ventas/facturacion' },
      ],
    },
    {
      id: 'inventario',
      name: 'Inventario y Almacén',
      shortCode: 'IN',
      category: 'operaciones',
      categoryLabel: 'Logística',
      description: 'Control multialmacén de stock, transferencias, kardex, mermas e ingresos de mercadería.',
      icon: 'database',
      color: '#d83b01',
      bgColor: 'rgba(216, 59, 1, 0.1)',
      route: '/inventario',
      isReady: false,
      requiredRoles: ['SuperAdmin', 'Gerencia', 'InventarioAdmin'],
      quickLinks: [
        { label: 'Control de Stock', route: '/inventario/stock' },
        { label: 'Catálogo Artículos', route: '/inventario/productos' },
      ],
    },
    {
      id: 'crm',
      name: 'CRM y Clientes',
      shortCode: 'CR',
      category: 'gestion',
      categoryLabel: 'Fidelización',
      description: 'Directorio 360° de clientes, segmentación comercial, historial de compras y puntos BubbaBag.',
      icon: 'user',
      color: '#008272',
      bgColor: 'rgba(0, 130, 114, 0.1)',
      route: '/crm',
      isReady: false,
      requiredRoles: ['SuperAdmin', 'Gerencia'],
      quickLinks: [{ label: 'Directorio Clientes', route: '/crm/clientes' }],
    },
    {
      id: 'finanzas',
      name: 'Finanzas y Tesorería',
      shortCode: 'FN',
      category: 'operaciones',
      categoryLabel: 'Contabilidad',
      description: 'Flujo de caja proyectado, cuentas por cobrar, cuentas por pagar y conciliación bancaria.',
      icon: 'dollar',
      color: '#004e8c',
      bgColor: 'rgba(0, 78, 140, 0.1)',
      route: '/finanzas',
      isReady: false,
      requiredRoles: ['SuperAdmin', 'Gerencia', 'FinanzasAdmin'],
      quickLinks: [
        { label: 'Flujo de Caja', route: '/finanzas/flujo' },
        { label: 'Cuentas por Cobrar', route: '/finanzas/cobrar' },
      ],
    },
    {
      id: 'reportes',
      name: 'Analítica y Reportes',
      shortCode: 'RP',
      category: 'gestion',
      categoryLabel: 'Business Intelligence',
      description: 'Tableros ejecutivos, métricas clave de desempeño (KPIs), reportes exportables y auditoría.',
      icon: 'bar-chart',
      color: '#b146c2',
      bgColor: 'rgba(177, 70, 194, 0.1)',
      route: '/reportes',
      isReady: false,
      requiredRoles: ['SuperAdmin', 'Gerencia'],
      quickLinks: [{ label: 'Dashboard Ejecutivo', route: '/reportes/ejecutivo' }],
    },
  ];

  // Filtro por roles del usuario conectado
  readonly visibleModules = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    if (this.authService.isSuperAdmin()) return this.allApps;

    return this.allApps.filter((app) => {
      if (!app.requiredRoles || app.requiredRoles.length === 0) return true;
      return app.requiredRoles.some((r) => user.roles.includes(r));
    });
  });

  // Filtro reactivo por búsqueda y categoría seleccionada
  readonly filteredModules = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();
    let list = this.visibleModules();

    if (cat !== 'all') {
      list = list.filter((app) => app.category === cat);
    }

    if (query) {
      list = list.filter(
        (app) =>
          app.name.toLowerCase().includes(query) ||
          app.description.toLowerCase().includes(query) ||
          app.categoryLabel.toLowerCase().includes(query) ||
          app.quickLinks.some((l) => l.label.toLowerCase().includes(query))
      );
    }

    return list;
  });

  handleCardClick(app: DashboardAppCard) {
    if (app.isReady) {
      this.navigateTo(app.route);
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

