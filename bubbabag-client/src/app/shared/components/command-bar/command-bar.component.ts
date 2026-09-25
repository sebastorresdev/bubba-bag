import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkMenuModule } from '@angular/cdk/menu';
import { AppIconComponent, IconName } from '../icon';
import { CommandBarItem } from './command-bar.model';
export * from './command-bar.model';

@Component({
  selector: 'app-command-bar',
  standalone: true,
  imports: [CommonModule, CdkMenuModule, AppIconComponent],
  templateUrl: './command-bar.component.html',
  styleUrl: './command-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandBarComponent {
  @Input() items: CommandBarItem[] = [];
  @Input() farItems: CommandBarItem[] = [];
  @Input() showBack = false;
  @Input() title?: string;

  @Output() back = new EventEmitter<void>();
  @Output() itemClick = new EventEmitter<CommandBarItem>();

  onItemClick(item: CommandBarItem, event?: Event): void {
    if (event) event.stopPropagation();
    if (item.disabled || item.hidden || item.isDivider) return;
    if (item.action) item.action(item);
    if (item.execute) item.execute(item);
    this.itemClick.emit(item);
  }

  getIconName(icon?: string): IconName {
    if (!icon) return 'info';
    switch (icon) {
      case 'plus':
      case 'plus-circle':
        return 'plus';
      case 'edit':
      case 'form':
        return 'edit';
      case 'save':
        return 'save';
      case 'reload':
      case 'sync':
        return 'reload';
      case 'check':
      case 'check-circle':
        return 'check';
      case 'close':
      case 'close-circle':
      case 'stop':
        return 'close';
      case 'delete':
      case 'trash':
        return 'trash';
      case 'search':
        return 'search';
      case 'filter':
        return 'filter';
      case 'table':
      case 'columns':
      case 'bars':
        return 'columns';
      case 'folder':
        return 'folder';
      case 'file-excel':
        return 'excel';
      case 'setting':
      case 'settings':
        return 'settings';
      default:
        return 'info';
    }
  }

  getIconColorClass(color?: string, danger?: boolean): string {
    if (danger) return 'text-rose-600 dark:text-rose-400';
    if (!color) return 'text-neutral-600 dark:text-neutral-300';
    switch (color) {
      case 'primary':
        return 'text-blue-600 dark:text-blue-400';
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'danger':
        return 'text-rose-600 dark:text-rose-400';
      case 'purple':
        return 'text-purple-600 dark:text-purple-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-neutral-600 dark:text-neutral-300';
    }
  }
}
