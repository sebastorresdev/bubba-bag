import { Component, Input, Output, EventEmitter, Directive } from '@angular/core';
import { CommonModule } from '@angular/common';

@Directive({
  selector: '[nzDrawerContent]',
  standalone: true,
})
export class NzDrawerContentDirective {}

@Component({
  selector: 'nz-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="nzVisible" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" (click)="close()">
      <div class="fixed inset-y-0 right-0 max-w-full pl-10 flex" (click)="$event.stopPropagation()">
        <div class="w-screen max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col p-6">
          <div class="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <h3 class="text-sm font-semibold">{{ nzTitle }}</h3>
            <button type="button" (click)="close()" class="p-1 text-neutral-400 hover:text-neutral-600">✕</button>
          </div>
          <div class="flex-1 overflow-y-auto py-4">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class NzDrawerComponent {
  @Input() nzVisible: boolean = false;
  @Input() nzTitle?: any;
  @Input() nzWidth?: any;
  @Input() nzPlacement: string = 'right';
  @Input() nzFooter?: any;
  @Input() nzClosable: boolean | string = true;
  @Output() nzVisibleChange = new EventEmitter<boolean>();
  @Output() nzOnClose = new EventEmitter<any>();

  close(): void {
    this.nzVisible = false;
    this.nzVisibleChange.emit(false);
    this.nzOnClose.emit();
  }
}

export const NzDrawerModule = [NzDrawerComponent, NzDrawerContentDirective];
