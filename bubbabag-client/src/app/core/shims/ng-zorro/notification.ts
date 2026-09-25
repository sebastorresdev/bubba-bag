import { Injectable, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Injectable({
  providedIn: 'root',
})
export class NzNotificationService {
  private toast = inject(ToastService);

  success(title: string, content?: string, options?: any): void {
    this.toast.success(content ? `${title}: ${content}` : title, options);
  }

  error(title: string, content?: string, options?: any): void {
    this.toast.error(content ? `${title}: ${content}` : title, options);
  }

  warning(title: string, content?: string, options?: any): void {
    this.toast.warning(content ? `${title}: ${content}` : title, options);
  }

  info(title: string, content?: string, options?: any): void {
    this.toast.info(content ? `${title}: ${content}` : title, options);
  }
}

export class NzNotificationModule {}
