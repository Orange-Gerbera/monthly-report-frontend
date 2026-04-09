/**
 * Project: Orange Gerbera
 * -----------------------------------------------------------------------------
 * Copyright (c) 2024-2026 Tai Naoyuki & Kagoshima Takuho.
 * All rights reserved.
 * 
 * This software and any associated documentation are the intellectual property
 * of Tai Naoyuki & Kagoshima Takuho.
 * 
 * Unauthorized copying, use, or distribution of this software,
 * in whole or in part, is strictly prohibited.
 * -----------------------------------------------------------------------------
 */

import { ApplicationConfig, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { appRoutes } from './app.routes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { apiInterceptor } from './core/api.interceptor';

import { registerLocaleData } from '@angular/common';
import localeJa from '@angular/common/locales/ja';
import { LucideAngularModule } from 'lucide-angular';
import { customIcons } from './core/icons';

registerLocaleData(localeJa);

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(LucideAngularModule.pick(customIcons)),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([apiInterceptor])), provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'ja-JP' },
  ],
};
