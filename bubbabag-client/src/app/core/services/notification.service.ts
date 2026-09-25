import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';

export interface ToastOptions {
  duration?: number;
  description?: string;
  linkText?: string;
  linkAction?: () => void;
  nzDuration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toast = inject(ToastService);

  /**
   * Notificación de éxito en la esquina superior derecha (Estilo Dynamics 365)
   */
  success(message: string, descriptionOrOptions?: string | ToastOptions, options?: ToastOptions): void {
    const desc = typeof descriptionOrOptions === 'string' ? descriptionOrOptions : descriptionOrOptions?.description;
    const dur = typeof descriptionOrOptions === 'object' ? (descriptionOrOptions.duration ?? descriptionOrOptions.nzDuration) : (options?.duration ?? options?.nzDuration);
    const content = desc ? `${message} - ${desc}` : message;
    this.toast.success(content, { nzDuration: dur ?? 4000 });
  }

  /**
   * Notificación informativa
   */
  info(message: string, description?: string, optionsOrDuration?: number | ToastOptions): void {
    const dur = typeof optionsOrDuration === 'number' ? optionsOrDuration : (optionsOrDuration?.duration ?? optionsOrDuration?.nzDuration);
    const content = description ? `${message} - ${description}` : message;
    this.toast.info(content, { nzDuration: dur ?? 4000 });
  }

  /**
   * Notificación de advertencia
   */
  warning(message: string, description?: string, optionsOrDuration?: number | ToastOptions): void {
    const dur = typeof optionsOrDuration === 'number' ? optionsOrDuration : (optionsOrDuration?.duration ?? optionsOrDuration?.nzDuration);
    const content = description ? `${message} - ${description}` : message;
    this.toast.warning(content, { nzDuration: dur ?? 5000 });
  }

  /**
   * Notificación de error
   */
  error(message: string, description?: string, optionsOrDuration?: number | ToastOptions): void {
    const dur = typeof optionsOrDuration === 'number' ? optionsOrDuration : (optionsOrDuration?.duration ?? optionsOrDuration?.nzDuration);
    const content = description ? `${message} - ${description}` : message;
    this.toast.error(content, { nzDuration: dur ?? 6000 });
  }
}

// Shim compatibility for legacy NzNotificationService injections
@Injectable({
  providedIn: 'root',
  useExisting: NotificationService,
})
export class NzNotificationService extends NotificationService {}

