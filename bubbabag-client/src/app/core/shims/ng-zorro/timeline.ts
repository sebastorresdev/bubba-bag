import { Component, Input } from '@angular/core';

@Component({
  selector: 'nz-timeline-item',
  standalone: true,
  template: `<div class="py-2"><ng-content></ng-content></div>`,
})
export class NzTimelineItemComponent {
  @Input() nzColor?: string;
}

@Component({
  selector: 'nz-timeline',
  standalone: true,
  template: `<div class="space-y-2"><ng-content></ng-content></div>`,
})
export class NzTimelineComponent {}

export const NzTimelineModule = [NzTimelineComponent, NzTimelineItemComponent];
