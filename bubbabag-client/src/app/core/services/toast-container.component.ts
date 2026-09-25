import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastItem } from './toast.service';
import { AppIconComponent } from '../../shared/components/icon';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="fixed top-14 right-5 z-[9999] flex flex-col items-end gap-2 pointer-events-none max-w-md w-full">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded shadow-lg border text-sm font-medium transition-all transform duration-200 animate-in fade-in slide-in-from-top-2 bg-white dark:bg-neutral-900"
          [ngClass]="{
            'border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200': toast.type === 'success',
            'border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200': toast.type === 'error',
            'border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200': toast.type === 'warning',
            'border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200': toast.type === 'info'
          }"
        >
          @switch (toast.type) {
            @case ('success') {
              <app-icon name="check" [size]="16" svgClass="text-emerald-600 dark:text-emerald-400 shrink-0" />
            }
            @case ('error') {
              <app-icon name="close" [size]="16" svgClass="text-rose-600 dark:text-rose-400 shrink-0" />
            }
            @case ('warning') {
              <app-icon name="alert" [size]="16" svgClass="text-amber-600 dark:text-amber-400 shrink-0" />
            }
            @default {
              <app-icon name="info" [size]="16" svgClass="text-blue-600 dark:text-blue-400 shrink-0" />
            }
          }
          <span class="flex-1 leading-snug">{{ toast.content }}</span>
          <button
            type="button"
            (click)="toastService.remove(toast.id)"
            class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
          >
            <app-icon name="close" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
