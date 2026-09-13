# Estándar de Diseño de Formularios Dynamics 365 (d365-form-guidelines)

Esta regla es de **cumplimiento obligatorio** para todos los formularios de creación y edición (CRUD) en el frontend (`bubbabag-client`), incluyendo Clientes, Colaboradores, Usuarios y futuros módulos (Proveedores, Facturación, etc.).

---

## 1. Reutilización de la Hoja Maestra Global (`src/styles/d365-form.css`)

**NUNCA reescribir 300+ líneas de CSS en los archivos `.component.css` de cada formulario.**
Todos los estilos de estructura, cabecera, KPIs, pestañas y tarjetas están centralizados globalmente en `src/styles/d365-form.css`. El `.component.css` de una página debe contener únicamente reglas específicas de ese módulo.

---

## 2. Paleta de Colores Obligatoria

| Elemento | Tema Claro | Tema Oscuro | Variable CSS / Token |
| :--- | :--- | :--- | :--- |
| **Fondo de la Vista / Página** | `#f0f2f5` | `#000000` | `--d365-page-bg` |
| **Cabecera de Registro (`.d365-record-header`)** | `#ffffff` | `#141414` | `--d365-header-bg` |
| **Barra Adhesiva de Pestañas (`.ant-tabs-nav`)** | `#f8f9fa` | `#1a1a1a` | `--d365-tabs-bg` |
| **Línea Divisoria Inferior de Pestañas** | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.12)` | `--d365-border-tab-line` |
| **Fondo de Tarjetas (`.d365-card`)** | `#ffffff` | `#1f1f1f` | `--d365-card-bg` |
| **Píldora Activa (Estado)** | `rgba(16, 124, 65, 0.12)` texto `#107c41` | `rgba(16, 124, 65, 0.25)` texto `#6ccb5f` | `--d365-pill-active-*` |

> [!CAUTION]
> **PROHIBIDO** poner `#f8f9fa` como fondo general de la página. El fondo de página de todo el ERP es `#f0f2f5`.
> El color `#f8f9fa` se reserva **exclusivamente** para la barra horizontal de pestañas (tabs nav).

---

## 3. Estructura HTML Requerida

Todo formulario CRUD debe seguir estrictamente esta jerarquía:

```html
<!-- 1. Command Bar Superior con botón Volver -->
<app-command-bar
  [items]="commandBarItems"
  [farItems]="commandBarFarItems"
  [showBack]="true"
  (back)="volver()"
></app-command-bar>

<div class="d365-form-view">
  <!-- 2. Cabecera de Registro Fija -->
  <div class="d365-record-header">
    <div class="record-header-main">
      <div class="record-avatar-container">
        <nz-avatar [nzText]="getIniciales(nombreEnFormulario)" [nzSize]="56" class="record-avatar"></nz-avatar>
      </div>

      <div class="record-title-block">
        <!-- TÍTULO DINÁMICO REACTIVO -->
        <h1 class="record-title">{{ nombreEnFormulario }}</h1>

        <!-- Metadatos con divisores verticales -->
        <div class="record-metadata-row">
          <span class="record-code-tag">{{ form.get('codigo')?.value || 'NUEVO' }}</span>
          <nz-divider nzType="vertical" />
          <span>{{ form.get('subtitulo')?.value }}</span>
        </div>

        <!-- Acciones Rápidas (Iconos discretos mail / phone) -->
        <div class="record-quick-actions">
          @if (email) {
            <a [href]="'mailto:' + email" class="quick-action-icon" [title]="email"><nz-icon nzType="mail" /></a>
          } @else {
            <span class="quick-action-icon disabled"><nz-icon nzType="mail" /></span>
          }
        </div>
      </div>
    </div>

    <!-- 3. Indicadores Métricos a la Derecha (KPIs) -->
    <div class="record-header-metrics">
      <div class="metric-item">
        <span class="metric-label">ESTADO</span>
        <span class="kpi-value-pill" [class.pill-active]="form.get('activo')?.value" [class.pill-inactive]="!form.get('activo')?.value">
          {{ form.get('activo')?.value ? 'ACTIVO' : 'INACTIVO' }}
        </span>
      </div>

      <div class="metric-divider"></div>

      <div class="metric-item">
        <span class="metric-label">TIPO / FLAG</span>
        <span class="kpi-value-badge" [class.badge-enabled]="form.get('esFlag')?.value">
          {{ form.get('esFlag')?.value ? 'HABILITADO' : 'NO' }}
        </span>
      </div>
    </div>
  </div>

  <!-- 4. Contenedor de Formulario con Scroll Propio y Pestañas -->
  <form nz-form [formGroup]="form" nzLayout="vertical" class="d365-form-container">
    <nz-tabs [(nzSelectedIndex)]="selectedTabIndex" [nzAnimated]="false" class="d365-form-tabs">
      <nz-tab [nzTitle]="tabGeneralTitle">
        <ng-template #tabGeneralTitle>
          <span class="tab-label">
            <nz-icon nzType="user" />
            <span>General</span>
          </span>
        </ng-template>

        <!-- 5. Tarjetas Apiladas (Una arriba, otra abajo) -->
        <div class="d365-tab-grid">
          <nz-card [nzBordered]="true" class="d365-card" [nzTitle]="cardTitle">
            <ng-template #cardTitle>
              <div class="card-header-content">
                <nz-icon nzType="idcard" class="card-header-icon" />
                <span>Información Principal</span>
              </div>
            </ng-template>

            <div class="card-form-grid-3">
              <!-- nz-form-item campos -->
            </div>
          </nz-card>
        </div>
      </nz-tab>
    </nz-tabs>
  </form>
</div>
```

---

## 4. Reglas de Lógica TypeScript del Formulario

### Título Dinámico Reactivo en Tiempo Real
- El título de la cabecera **DEBE cambiar en tiempo real** conforme el usuario teclea el nombre o razón social.
- **Implementación obligatoria**:
  1. Definir un getter en el componente:
     ```typescript
     get nombreEnFormulario(): string {
       const nombres = this.form?.get('nombres')?.value?.trim() || '';
       const apellidos = this.form?.get('apellidos')?.value?.trim() || '';
       const completo = `${nombres} ${apellidos}`.trim();
       if (completo) return completo;
       return this.isEdit ? 'Entidad' : 'Nueva Entidad';
     }
     ```
  2. En `initForm()` suscribirse a `valueChanges` para refrescar la detección de cambios en cada pulsación:
     ```typescript
     this.form.valueChanges.subscribe(() => {
       this.cdr.markForCheck();
     });
     ```

### Registro de Íconos de NG-ZORRO
- Todos los íconos usados en pestañas y cabeceras de tarjeta (ej. `EnvironmentOutline`, `IdcardOutline`, `SolutionOutline`, `DollarOutline`) **DEBEN ser importados y registrados** en `bubbabag-client/src/app/app.icons.ts`.

---

## 5. Prohibiciones Expresas

1. ❌ **NO usar puntos sueltos (`status-dot`) para el estado**: Siempre usar la cápsula `.kpi-value-pill` con texto en MAYÚSCULAS (`ACTIVO`, `CESADO`, etc.).
2. ❌ **NO usar títulos estáticos** (`isEdit ? ... : 'Nuevo Cliente'`). El título siempre debe ser reactivo al getter dinámico.
3. ❌ **NO usar grids de 2 tarjetas lado a lado**: Las tarjetas deben estar apiladas verticalmente con `.d365-tab-grid` (una arriba y otra abajo). Los campos dentro de la tarjeta sí se distribuyen en columnas con `.card-form-grid-3` o `.card-form-grid-2`.
4. ❌ **NO usar botones primarios con fondo de color en la Command Bar**: La Command Bar usa botones de tipo texto plano.
