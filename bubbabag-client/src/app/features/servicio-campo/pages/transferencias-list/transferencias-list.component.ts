import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transferencias-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 32px; opacity: 0.6; font-size: 16px;">
      🚚 Despachos y Transferencias — Próximamente
    </div>
  `,
})
export class TransferenciasListComponent {}
