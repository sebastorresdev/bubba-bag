import { Directive, Component, Injectable, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Directive({
  selector: '[nzModalContent]',
  standalone: true,
})
export class NzModalContentDirective {}

@Directive({
  selector: '[nzModalFooter]',
  standalone: true,
})
export class NzModalFooterDirective {}

@Directive({
  selector: '[nzModalTitle]',
  standalone: true,
})
export class NzModalTitleDirective {}

@Component({
  selector: 'nz-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="nzVisible" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div class="w-full max-w-lg rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6">
        <h3 *ngIf="nzTitle" class="text-base font-semibold mb-4 text-neutral-900 dark:text-neutral-100">{{ nzTitle }}</h3>
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class NzModalComponent {
  @Input() nzVisible: boolean = false;
  @Input() nzTitle?: any;
  @Input() nzWidth?: any;
  @Input() nzFooter?: any;
  @Input() nzContent?: any;
  @Input() nzMaskClosable: boolean | string = false;
  @Input() nzCentered?: boolean;
  @Input() nzOkText?: string;
  @Input() nzCancelText?: string;
  @Input() nzOkLoading: boolean = false;
  @Input() nzOkDanger: boolean = false;
  @Output() nzVisibleChange = new EventEmitter<boolean>();
  @Output() nzOnCancel = new EventEmitter<any>();
  @Output() nzOnOk = new EventEmitter<any>();
}

@Injectable({
  providedIn: 'root',
})
export class NzModalService {
  confirm(options: any): any {
    if (confirm(options.nzTitle || options.nzContent || '¿Confirmar?')) {
      if (options.nzOnOk) options.nzOnOk();
    }
    return { close: () => {}, destroy: () => {} };
  }

  warning(options: any): any {
    alert(options.nzTitle || options.nzContent || 'Advertencia');
    if (options.nzOnOk) options.nzOnOk();
    return { close: () => {}, destroy: () => {} };
  }

  info(options: any): any {
    alert(options.nzTitle || options.nzContent || 'Información');
    if (options.nzOnOk) options.nzOnOk();
    return { close: () => {}, destroy: () => {} };
  }

  error(options: any): any {
    alert(options.nzTitle || options.nzContent || 'Error');
    if (options.nzOnOk) options.nzOnOk();
    return { close: () => {}, destroy: () => {} };
  }

  success(options: any): any {
    alert(options.nzTitle || options.nzContent || 'Éxito');
    if (options.nzOnOk) options.nzOnOk();
    return { close: () => {}, destroy: () => {} };
  }

  create(options: any): any {
    return { close: () => {}, destroy: () => {} };
  }
}

export const NzModalModule = [
  NzModalComponent,
  NzModalContentDirective,
  NzModalFooterDirective,
  NzModalTitleDirective,
];
