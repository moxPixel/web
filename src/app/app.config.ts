import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, inject, provideEnvironmentInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { PageLoaderService } from './services/page-loader.service';
import { PageLoaderInlineService } from './services/page-loader-inline.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    // Initialiser le loader avant le bootstrap de l'app
    provideEnvironmentInitializer(() => {
      const pageLoaderService = inject(PageLoaderService);
      const pageLoaderInline = inject(PageLoaderInlineService);
      // Démarrer le préchargement
      pageLoaderService.initialize().catch((error) => {
        console.warn('[AppConfig] loader initialize failed', error);
      });
    })
  ]
};
