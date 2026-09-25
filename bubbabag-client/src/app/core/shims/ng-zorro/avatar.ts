import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nz-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="rounded-full bg-primary-700 text-white font-bold flex items-center justify-center shrink-0"
      [style.width.px]="nzSize === 'small' ? 24 : (nzSize === 'large' ? 48 : (nzSize || 40))"
      [style.height.px]="nzSize === 'small' ? 24 : (nzSize === 'large' ? 48 : (nzSize || 40))"
      [style.font-size.px]="getFontSize()"
    >
      <img *ngIf="nzSrc" [src]="nzSrc" class="w-full h-full object-cover rounded-full" />
      <span *ngIf="!nzSrc">{{ nzText }}</span>
    </div>
  `,
})
export class NzAvatarComponent {
  @Input() nzSize: number | string = 40;
  @Input() nzText?: string;
  @Input() nzSrc?: string;
  @Input() nzIcon?: string;

  getFontSize(): number {
    if (typeof this.nzSize === 'number') return this.nzSize / 2.5;
    if (this.nzSize === 'small') return 11;
    if (this.nzSize === 'large') return 18;
    return 14;
  }
}

export const NzAvatarModule = [NzAvatarComponent];
