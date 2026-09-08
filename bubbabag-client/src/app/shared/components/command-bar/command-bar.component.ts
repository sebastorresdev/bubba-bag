import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { CommandBarItem } from './command-bar.model';

@Component({
  selector: 'app-command-bar',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzDropdownModule,
  ],
  templateUrl: './command-bar.component.html',
  styleUrl: './command-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandBarComponent {
  /** Elementos alineados a la izquierda (acciones de negocio principales) */
  @Input() items: CommandBarItem[] = [];

  /** Elementos alineados a la derecha (actualizar, configuración, filtros globales) */
  @Input() farItems: CommandBarItem[] = [];

  /** Mostrar botón de retroceder (flecha izquierda) */
  @Input() showBack = false;

  /** Título contextual opcional si la barra lo incluye */
  @Input() title?: string;

  /** Evento disparado al hacer clic en el botón atrás */
  @Output() back = new EventEmitter<void>();

  /** Evento disparado al hacer clic en cualquier comando */
  @Output() itemClick = new EventEmitter<CommandBarItem>();

  onItemClick(item: CommandBarItem): void {
    if (item.disabled || item.isDivider) {
      return;
    }
    if (item.execute) {
      item.execute(item);
    }
    this.itemClick.emit(item);
  }

  onBackClick(): void {
    this.back.emit();
  }

  getIconColor(item: CommandBarItem): string | null {
    if (item.disabled) return null;
    if (item.iconColor) return item.iconColor;
    if (item.danger) return '#d13438';
    if (item.primary) return '#0078d4';

    switch (item.icon) {
      case 'plus':
      case 'save':
      case 'edit':
      case 'reload':
      case 'filter':
      case 'search':
        return '#0078d4';
      case 'check':
      case 'check-circle':
      case 'file-excel':
        return '#107c41';
      case 'delete':
      case 'user-delete':
        return '#d13438';
      case 'close':
        return '#605e5c';
      default:
        return null;
    }
  }
}
