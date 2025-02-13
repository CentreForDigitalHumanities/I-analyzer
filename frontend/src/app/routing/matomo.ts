import { inject } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { MatomoModule, MatomoRouterInterceptorFn, MatomoRouterModule, MatomoTracker } from 'ngx-matomo-client';

const removeQueryParams = (url: string) => url.replace(/\?.+$/, '');

/**
 * Interceptor to remove information about query parameters from the URL.
 *
 * Updates the tracked URL to remove query parameters, since those describe detailed
 * user behaviour.
 *
 * Also removes the referrer URL, which would also contain query parameters. There does
 * not seem to be a way to get the referrer URL in this scope, so it is removed instead
 * of cleaned.
 */
const removeQueryParamsInterceptor: MatomoRouterInterceptorFn = (event: NavigationEnd) => {
    const tracker = inject(MatomoTracker);

    tracker.setReferrerUrl('');
    tracker.setCustomUrl(removeQueryParams(event.urlAfterRedirects));
}

export interface MatomoConfig {
    siteId: string;
    url: string;
}

/**
 * Module imports required for Matomo integration.
 *
 * @param config Environment configuration for matomo.
 * @returns Array of modules that should be added to the `imports` of the `AppModule`
 */
export const matomoImports = (config: MatomoConfig) => {
    return [
        MatomoModule.forRoot({
            siteId: config['siteId'],
            trackerUrl: config['url'],
            acceptDoNotTrack: true,
        }),
        MatomoRouterModule.forRoot({
            interceptors: [removeQueryParamsInterceptor],
        }),
    ];
}
