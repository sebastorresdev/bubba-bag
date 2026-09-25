import { Component, Input, Output, EventEmitter, ContentChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nz-tab',
  standalone: true,
  imports: [CommonModule],
  template: `<div *ngIf="active" class="py-4"><ng-content></ng-content></div>`,
})
export class NzTabComponent {
  @Input() nzTitle?: any;
  active: boolean = false;
}

@Component({
  selector: 'nz-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      <div class="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-800">
        <button
          *ngFor="let tab of tabs; let i = index"
          type="button"
          (click)="selectTab(i)"
          [class.border-primary-600]="nzSelectedIndex === i"
          [class.text-primary-600]="nzSelectedIndex === i"
          [class.dark:text-primary-400]="nzSelectedIndex === i"
          [class.font-semibold]="nzSelectedIndex === i"
          class="py-2.5 px-3 text-xs border-b-2 border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
        >
          {{ tab.nzTitle }}
        </button>
      </div>
      <ng-content></ng-content>
    </div>
  `,
})
export class NzTabsComponent {
  @Input() nzSelectedIndex: number = 0;
  @Input() nzAnimated: boolean = false;
  @Output() nzSelectedIndexChange = new EventEmitter<number>();
  @ContentChildren(NzTabComponent) tabs!: QueryList<NzTabComponent>;

  selectTab(index: number): void {
    this.nzSelectedIndex = index;
    this.nzSelectedIndexChange.emit(index);
    if (this.tabs) {
      this.tabs.forEach((tab, i) => (tab.active = i === index));
    }
  }

  ngAfterContentInit(): void {
    if (this.tabs) {
      this.tabs.forEach((tab, i) => (tab.active = i === this.nzSelectedIndex));
    }
  }
}

export const NzTabsModule = [NzTabsComponent, NzTabComponent];
