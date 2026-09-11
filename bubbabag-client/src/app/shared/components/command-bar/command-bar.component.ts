import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { CommandBarItem } from './command-bar.model';

@Component({
  selector: 'app-command-bar',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    NzButtonModule,
    NzIconModule,
    NzDropdownModule,
    NzPopconfirmModule,
  ],
  templateUrl: './command-bar.component.html',
  styleUrl: './command-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandBarComponent {
  /** Elementos alineados a la izquierda (acciones principales) */
  @Input() items: CommandBarItem[] = [];

  /** Elementos alineados a la derecha (acciones secundarias, actualizar, etc.) */
  @Input() farItems: CommandBarItem[] = [];

  /** Mostrar botón de retroceder (flecha izquierda) */
  @Input() showBack = false;

  /** Título contextual opcional si la barra lo incluye */
  @Input() title?: string;

  /** Evento disparado al hacer clic en el botón atrás */
  @Output() back = new EventEmitter<void>();

  /** Evento disparado al hacer clic en cualquier comando */
  @Output() itemClick = new EventEmitter<CommandBarItem>();

  onItemClick(item: CommandBarItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (item.disabled || item.hidden || item.isDivider) {
      return;
    }
    if (item.action) {
      item.action(item);
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
    if (item.disabled) {
      return null;
    }

    // Si es un icono o acción de Excel o CSV, aplicar siempre el verde oficial de Excel (#107c41)
    if (
      item.icon === 'file-excel' ||
      item.key === 'csv' ||
      item.key?.includes('excel') ||
      item.key?.includes('csv')
    ) {
      return '#107c41';
    }

    if (item.iconColor) {
      switch (item.iconColor) {
        case 'primary':
          return '#0f6cbd';
        case 'success':
        case 'excel':
          return '#107c41';
        case 'danger':
          return '#d13438';
        case 'warning':
          return '#ffaa00';
        case 'purple':
        case 'save':
          return '#873999';
        case 'neutral':
          return '#605e5c';
        case 'default':
          return null;
        default:
          return item.iconColor;
      }
    }

    if (item.danger) {
      return '#d13438';
    }
    if (item.primary) {
      return '#0f6cbd';
    }

    return null;
  }
}
