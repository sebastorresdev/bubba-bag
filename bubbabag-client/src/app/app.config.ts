import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideEnvironmentInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { NzConfig, NzConfigService, provideNzConfig } from 'ng-zorro-antd/core/config';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { NZ_I18N, es_ES } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
import { provideNzDateFnsAdapter } from 'ng-zorro-antd/core/time';
import { ICONS } from './app.icons';

registerLocaleData(es);

const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#0f6cbd', // Color primario global de acento (ej. Fluent Blue #0078d4, Emerald #107c41, etc.)
    errorColor: '#ff4d4f',
    warningColor: '#ffaa00',
    successColor: '#107c41',
    infoColor: '#0078d4',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor, errorInterceptor])),
    provideNzConfig(ngZorroConfig),
    provideEnvironmentInitializer(() => inject(NzConfigService)),
    provideNzIcons(ICONS),
    { provide: NZ_I18N, useValue: es_ES },
    provideNzDateFnsAdapter(),
  ],
};
