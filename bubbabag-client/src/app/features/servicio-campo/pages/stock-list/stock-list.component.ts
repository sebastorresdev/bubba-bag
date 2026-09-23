import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 32px; opacity: 0.6; font-size: 16px;">
      📊 Control de Existencias (Stock) — Próximamente
    </div>
  `,
})
export class StockListComponent {}
