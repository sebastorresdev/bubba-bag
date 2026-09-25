import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  content: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<ToastItem[]>([]);

  success(content: string, options?: { nzDuration?: number }): void {
    this.show('success', content, options?.nzDuration ?? 3500);
  }

  error(content: string, options?: { nzDuration?: number }): void {
    this.show('error', content, options?.nzDuration ?? 4000);
  }

  warning(content: string, options?: { nzDuration?: number }): void {
    this.show('warning', content, options?.nzDuration ?? 3500);
  }

  info(content: string, options?: { nzDuration?: number }): void {
    this.show('info', content, options?.nzDuration ?? 3500);
  }

  private show(type: ToastItem['type'], content: string, duration: number): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastItem = { id, type, content, duration };

    this.toasts.update((current) => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}

// Compatibilidad retroactiva con componentes que inyectaban NzMessageService
@Injectable({
  providedIn: 'root',
  useExisting: ToastService,
})
export class NzMessageService extends ToastService {}
