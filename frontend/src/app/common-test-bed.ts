import { APP_INITIALIZER, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { declarations, imports, providers } from './app.module';

import { CookieService } from 'ngx-cookie-service';

import { ApiServiceMock } from '../mock-data/api';
import { DialogServiceMock } from '../mock-data/dialog';
import { ElasticSearchServiceMock } from '../mock-data/elastic-search';
import { MockCorpusResponse } from '../mock-data/corpus';
import { SearchServiceMock } from '../mock-data/search';
import { UserServiceMock } from '../mock-data/user';
import { ApiService, CorpusService, DialogService, ElasticSearchService, SearchService, UserService } from './services';

export function commonTestBed() {
    const filteredProviders = providers.filter(provider => !(
        provider in [ApiService, CorpusService, DialogService, ElasticSearchService, SearchService, UserService]));
    filteredProviders.push(
        {
            provide: ApiService, useValue: new ApiServiceMock({
                ['corpus']: MockCorpusResponse
            }),
        },
        {
            provide: APP_INITIALIZER,
            useFactory: csrfProviderFactory,
            deps: [Injector, ApiService, CookieService],
            multi: true
        },
        { 
            provide: DialogService, useClass: DialogServiceMock

        },
        {
            provide: ElasticSearchService, useValue: new ElasticSearchServiceMock()
        },
        {
            provide: Router, useValue: new RouterMock()
        },
        {
            provide: SearchService, useValue: new SearchServiceMock()
        },
        {
            provide: UserService, useValue: new UserServiceMock()
        },
    )

    return {
        testingModule: TestBed.configureTestingModule({
            declarations,
            imports,
            providers: filteredProviders
        })
    };
}

export function csrfProviderFactory(inject: Injector, provider: ApiService, cookieService: CookieService): Function {    
    return () => {        
        if (!cookieService.check('csrf_token')) { 
            provider.ensureCsrf().then(result => {                 
                if (!result || !result.success) {
                    throw new Error("CSRF token could not be collected.");
                }
            })
        }
    }
}

class RouterMock {}