import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideEnvironmentInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DialogModule } from '@angular/cdk/dialog';
import { authInterceptor } from './core/http/auth-interceptor';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { UnsavedChanges } from './shared/ui/unsaved-changes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(DialogModule),
    provideEnvironmentInitializer(() => inject(UnsavedChanges)),
  ],
};
