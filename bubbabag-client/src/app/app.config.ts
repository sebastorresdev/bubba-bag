import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { NZ_I18N, es_ES } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
import {
  AppstoreOutline,
  LogoutOutline,
  TeamOutline,
  ShoppingCartOutline,
  DatabaseOutline,
  UserOutline,
  DollarOutline,
  ShopOutline,
  BarChartOutline,
  SettingOutline,
  ArrowRightOutline,
  SunOutline,
  MoonOutline,
  ClockCircleOutline,
  CalendarOutline,
  UserAddOutline,
  SolutionOutline,
  LineChartOutline,
  PieChartOutline,
  HomeOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  SearchOutline,
  LockOutline,
  DashboardOutline,
  ArrowLeftOutline,
  CheckOutline,
  MailOutline,
  PhoneOutline,
  UserDeleteOutline,
  ReloadOutline,
  FilterOutline,
  ExclamationCircleOutline,
} from '@ant-design/icons-angular/icons';
import { provideNzDateFnsAdapter } from 'ng-zorro-antd/core/time';

registerLocaleData(es);

const icons = [
  AppstoreOutline,
  LogoutOutline,
  TeamOutline,
  ShoppingCartOutline,
  DatabaseOutline,
  UserOutline,
  DollarOutline,
  ShopOutline,
  BarChartOutline,
  SettingOutline,
  ArrowRightOutline,
  SunOutline,
  MoonOutline,
  ClockCircleOutline,
  CalendarOutline,
  UserAddOutline,
  SolutionOutline,
  LineChartOutline,
  PieChartOutline,
  HomeOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  SearchOutline,
  LockOutline,
  DashboardOutline,
  ArrowLeftOutline,
  CheckOutline,
  MailOutline,
  PhoneOutline,
  UserDeleteOutline,
  ReloadOutline,
  FilterOutline,
  ExclamationCircleOutline,
];

const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#B2E160',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    provideNzConfig(ngZorroConfig),
    provideNzIcons(icons),
    { provide: NZ_I18N, useValue: es_ES },
    provideNzDateFnsAdapter(),
  ],
};
