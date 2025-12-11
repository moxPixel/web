import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { appConfig } from './app/app.config';
import { App } from './app/app';

// Enregistrer les données de locale pour fr-FR (utilisé par CurrencyPipe, DatePipe, etc.)
registerLocaleData(localeFr);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
