import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.setDarkMode(true);
    } else {
      this.setDarkMode(false);
    }
  }

  toggleTheme() {
    this.setDarkMode(!this.isDarkMode());
    console.log(this.isDarkMode());
  }

  setDarkMode(isDark: boolean) {
    this.isDarkMode.set(isDark);
    const darkThemeId = 'ng-zorro-theme-dark';
    let link = document.getElementById(darkThemeId) as HTMLLinkElement | null;

    // Desactivar temporalmente todas las transiciones para evitar saltos o efectos visuales extraños
    document.documentElement.classList.add('theme-switching');

    if (isDark) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-theme');

      if (!link) {
        link = document.createElement('link');
        link.id = darkThemeId;
        link.rel = 'stylesheet';
        link.href = '/themes/ng-zorro-antd.dark.min.css';
        document.head.appendChild(link);
      } else {
        link.disabled = false;
      }
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-theme');

      if (link) {
        link.remove();
      }
    }

    // Restaurar transiciones fluidas en el siguiente repintado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('theme-switching');
      });
    });
  }
}

