import { Injectable, inject } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';

export interface ToastOptions {
  duration?: number;
  description?: string;
  linkText?: string;
  linkAction?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private nzNotification = inject(NzNotificationService);

  /**
   * Notificación de éxito en la esquina superior derecha (Estilo Dynamics 365)
   */
  success(message: string, descriptionOrOptions?: string | ToastOptions): void {
    const desc = typeof descriptionOrOptions === 'string' ? descriptionOrOptions : descriptionOrOptions?.description;
    const duration = typeof descriptionOrOptions === 'object' ? descriptionOrOptions.duration ?? 4000 : 4000;

    this.nzNotification.success(message, desc || '', {
      nzPlacement: 'topRight',
      nzDuration: duration,
      nzClass: 'd365-notification-toast d365-toast-success',
    });
  }

  /**
   * Notificación informativa en la esquina superior derecha
   */
  info(message: string, description?: string, duration: number = 4000): void {
    this.nzNotification.info(message, description || '', {
      nzPlacement: 'topRight',
      nzDuration: duration,
      nzClass: 'd365-notification-toast d365-toast-info',
    });
  }

  /**
   * Notificación de advertencia en la esquina superior derecha
   */
  warning(message: string, description?: string, duration: number = 5000): void {
    this.nzNotification.warning(message, description || '', {
      nzPlacement: 'topRight',
      nzDuration: duration,
      nzClass: 'd365-notification-toast d365-toast-warning',
    });
  }

  /**
   * Notificación de error en la esquina superior derecha
   */
  error(message: string, description?: string, duration: number = 6000): void {
    this.nzNotification.error(message, description || '', {
      nzPlacement: 'topRight',
      nzDuration: duration,
      nzClass: 'd365-notification-toast d365-toast-error',
    });
  }
}
