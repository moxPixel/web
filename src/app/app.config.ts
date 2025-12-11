import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, inject, provideEnvironmentInitializer } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { PageLoaderService } from './services/page-loader.service';
import { PageLoaderInlineService } from './services/page-loader-inline.service';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthApiService } from './services/api/auth-api.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Initialiser le loader avant le bootstrap de l'app
    provideEnvironmentInitializer(() => {
      const pageLoaderService = inject(PageLoaderService);
      const pageLoaderInline = inject(PageLoaderInlineService);
      const authService = inject(AuthApiService);
      
      // Démarrer le préchargement
      pageLoaderService.initialize().catch((error) => {
        console.warn('[AppConfig] loader initialize failed', error);
      });
      
      // Initialiser l'authentification depuis le token stocké
      authService.initFromStorage();
    })
  ]
};
