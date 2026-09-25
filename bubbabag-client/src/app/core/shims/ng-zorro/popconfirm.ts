import { Directive, Input, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[nz-popconfirm]',
  standalone: true,
})
export class NzPopconfirmDirective {
  @Input() nzPopconfirmTitle?: string;
  @Input() nzOkText?: string;
  @Input() nzCancelText?: string;
  @Input() nzOkDanger?: boolean;
  @Output() nzOnConfirm = new EventEmitter<void>();
  @Output() nzOnCancel = new EventEmitter<void>();
}

export const NzPopconfirmModule = [NzPopconfirmDirective];
