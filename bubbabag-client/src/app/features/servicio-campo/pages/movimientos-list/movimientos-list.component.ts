import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-movimientos-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 32px; opacity: 0.6; font-size: 16px;">
      📋 Kardex de Movimientos — Próximamente
    </div>
  `,
})
export class MovimientosListComponent {}
