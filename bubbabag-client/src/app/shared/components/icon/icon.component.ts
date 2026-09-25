import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'plus'
  | 'edit'
  | 'save'
  | 'reload'
  | 'check'
  | 'close'
  | 'trash'
  | 'search'
  | 'filter'
  | 'columns'
  | 'folder'
  | 'box'
  | 'sun'
  | 'moon'
  | 'settings'
  | 'help'
  | 'grid'
  | 'more-vertical'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'excel'
  | 'arrow-left'
  | 'menu'
  | 'user'
  | 'users'
  | 'tag'
  | 'info'
  | 'alert'
  | 'calendar'
  | 'clock'
  | 'file-text'
  | 'wrench'
  | 'truck'
  | 'database'
  | 'undo'
  | 'star'
  | 'layers';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [class]="svgClass"
    >
      <ng-container [ngSwitch]="name">
        <!-- plus -->
        <ng-container *ngSwitchCase="'plus'">
          <path d="M5 12h14M12 5v14"/>
        </ng-container>

        <!-- edit -->
        <ng-container *ngSwitchCase="'edit'">
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
        </ng-container>

        <!-- save -->
        <ng-container *ngSwitchCase="'save'">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </ng-container>

        <!-- reload -->
        <ng-container *ngSwitchCase="'reload'">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M16 16h5v5"/>
        </ng-container>

        <!-- check -->
        <ng-container *ngSwitchCase="'check'">
          <polyline points="20 6 9 17 4 12"/>
        </ng-container>

        <!-- close -->
        <ng-container *ngSwitchCase="'close'">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </ng-container>

        <!-- trash -->
        <ng-container *ngSwitchCase="'trash'">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </ng-container>

        <!-- search -->
        <ng-container *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </ng-container>

        <!-- filter -->
        <ng-container *ngSwitchCase="'filter'">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </ng-container>

        <!-- columns -->
        <ng-container *ngSwitchCase="'columns'">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M12 3v18"/>
        </ng-container>

        <!-- folder -->
        <ng-container *ngSwitchCase="'folder'">
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
        </ng-container>

        <!-- box -->
        <ng-container *ngSwitchCase="'box'">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
          <path d="m3.3 7 8.7 5 8.7-5"/>
          <path d="M12 22V12"/>
        </ng-container>

        <!-- sun -->
        <ng-container *ngSwitchCase="'sun'">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </ng-container>

        <!-- moon -->
        <ng-container *ngSwitchCase="'moon'">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </ng-container>

        <!-- settings -->
        <ng-container *ngSwitchCase="'settings'">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </ng-container>

        <!-- help -->
        <ng-container *ngSwitchCase="'help'">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </ng-container>

        <!-- grid -->
        <ng-container *ngSwitchCase="'grid'">
          <rect width="7" height="7" x="3" y="3" rx="1"/>
          <rect width="7" height="7" x="14" y="3" rx="1"/>
          <rect width="7" height="7" x="14" y="14" rx="1"/>
          <rect width="7" height="7" x="3" y="14" rx="1"/>
        </ng-container>

        <!-- more-vertical -->
        <ng-container *ngSwitchCase="'more-vertical'">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="12" cy="5" r="1"/>
          <circle cx="12" cy="19" r="1"/>
        </ng-container>

        <!-- chevron-down -->
        <ng-container *ngSwitchCase="'chevron-down'">
          <polyline points="6 9 12 15 18 9"/>
        </ng-container>

        <!-- chevron-right -->
        <ng-container *ngSwitchCase="'chevron-right'">
          <polyline points="9 18 15 12 9 6"/>
        </ng-container>

        <!-- chevron-left -->
        <ng-container *ngSwitchCase="'chevron-left'">
          <polyline points="15 18 9 12 15 6"/>
        </ng-container>

        <!-- excel -->
        <ng-container *ngSwitchCase="'excel'">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M8 13l3 4M11 13l-3 4"/>
        </ng-container>

        <!-- arrow-left -->
        <ng-container *ngSwitchCase="'arrow-left'">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </ng-container>

        <!-- menu -->
        <ng-container *ngSwitchCase="'menu'">
          <line x1="4" y1="12" x2="20" y2="12"/>
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="4" y1="18" x2="20" y2="18"/>
        </ng-container>

        <!-- user -->
        <ng-container *ngSwitchCase="'user'">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </ng-container>

        <!-- users -->
        <ng-container *ngSwitchCase="'users'">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </ng-container>

        <!-- tag -->
        <ng-container *ngSwitchCase="'tag'">
          <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
          <circle cx="7" cy="7" r=".5" fill="currentColor"/>
        </ng-container>

        <!-- info -->
        <ng-container *ngSwitchCase="'info'">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </ng-container>

        <!-- alert -->
        <ng-container *ngSwitchCase="'alert'">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </ng-container>

        <!-- calendar -->
        <ng-container *ngSwitchCase="'calendar'">
          <rect width="18" height="18" x="3" y="4" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </ng-container>

        <!-- clock -->
        <ng-container *ngSwitchCase="'clock'">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </ng-container>

        <!-- file-text -->
        <ng-container *ngSwitchCase="'file-text'">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
          <path d="M10 9H8"/>
          <path d="M16 13H8"/>
          <path d="M16 17H8"/>
        </ng-container>

        <!-- wrench -->
        <ng-container *ngSwitchCase="'wrench'">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </ng-container>

        <!-- truck -->
        <ng-container *ngSwitchCase="'truck'">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10Z"/>
          <circle cx="7" cy="18" r="2"/>
          <circle cx="17" cy="18" r="2"/>
        </ng-container>

        <!-- database -->
        <ng-container *ngSwitchCase="'database'">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
        </ng-container>

        <!-- undo -->
        <ng-container *ngSwitchCase="'undo'">
          <path d="M3 7v6h6"/>
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
        </ng-container>

        <!-- star -->
        <ng-container *ngSwitchCase="'star'">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </ng-container>

        <!-- layers -->
        <ng-container *ngSwitchCase="'layers'">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </ng-container>
      </ng-container>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppIconComponent {
  @Input() name: IconName = 'info';
  @Input() size: number | string = 16;
  @Input() svgClass: string = '';
}
