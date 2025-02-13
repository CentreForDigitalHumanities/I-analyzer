import { inject } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { MatomoModule, MatomoRouterInterceptorFn, MatomoRouterModule, MatomoTracker } from 'ngx-matomo-client';

const removeQueryParams = (url: string) => url.replace(/\?.+$/, '');

const removeQueryParamsInterceptor: MatomoRouterInterceptorFn = (event: NavigationEnd) => {
    const tracker = inject(MatomoTracker);

    tracker.setReferrerUrl('');
    tracker.setCustomUrl(removeQueryParams(event.urlAfterRedirects));
}

export interface MatomoConfig {
    siteId: string;
    url: string;
}

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
