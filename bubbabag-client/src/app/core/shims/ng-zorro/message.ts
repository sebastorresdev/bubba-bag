import { Injectable, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Injectable({
  providedIn: 'root',
})
export class NzMessageService {
  private toast = inject(ToastService);

  success(content: string, options?: any): void {
    this.toast.success(content, options);
  }

  error(content: string, options?: any): void {
    this.toast.error(content, options);
  }

  warning(content: string, options?: any): void {
    this.toast.warning(content, options);
  }

  info(content: string, options?: any): void {
    this.toast.info(content, options);
  }

  loading(content: string, options?: any): any {
    return { messageId: 'shim' };
  }

  remove(id?: string): void {}
}

export class NzMessageModule {}
