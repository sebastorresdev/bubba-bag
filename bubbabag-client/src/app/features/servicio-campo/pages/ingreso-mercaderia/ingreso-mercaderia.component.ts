import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ingreso-mercaderia',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 32px; opacity: 0.6; font-size: 16px;">
      📥 Ingresos y Guías de Remisión — Próximamente
    </div>
  `,
})
export class IngresoMercaderiaComponent {}
