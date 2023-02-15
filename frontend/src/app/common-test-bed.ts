import { APP_INITIALIZER, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';

import { CookieService } from 'ngx-cookie-service';

import { appRoutes, declarations, imports, providers } from './app.module';

import { ApiServiceMock } from '../mock-data/api';
import * as corpus from '../mock-data/corpus-response';
import { DialogServiceMock } from '../mock-data/dialog';
import { ElasticSearchServiceMock } from '../mock-data/elastic-search';
import { MockCorpusResponse } from '../mock-data/corpus-response';
import { SearchServiceMock } from '../mock-data/search';
import { mockUserResponse, UserServiceMock } from '../mock-data/user';
import { ApiService, CorpusService, DialogService, ElasticSearchService, QueryService, SearchService, UserService } from './services';
import { WordmodelsService } from './services/wordmodels.service';
import { WordmodelsServiceMock } from '../mock-data/wordmodels';
import { VisualizationService } from './services/visualization.service';
import { visualizationServiceMock } from '../mock-data/visualization';

export function commonTestBed() {
    const filteredImports = imports.filter(value => !(value in [HttpClientModule]));
    filteredImports.push(RouterTestingModule.withRoutes(appRoutes));
    const filteredProviders = providers.filter(provider => !(
        provider in [ApiService, CorpusService, DialogService, ElasticSearchService, SearchService, UserService]));
    filteredProviders.push(
        {
            provide: ApiService,
            useValue: new ApiServiceMock({
                ["corpus"]: MockCorpusResponse,
            }),
        },
        {
            provide: CorpusService,
        },
        {
            provide: DialogService,
            useClass: DialogServiceMock,
        },
        {
            provide: ElasticSearchService,
            useValue: new ElasticSearchServiceMock(),
        },
        {
            provide: ElementRef,
            useClass: MockElementRef,
        },
        {
            provide: SearchService,
            useValue: new SearchServiceMock(),
        },
        {
            provide: UserService,
            useValue: new UserServiceMock(),
        },
        {
            provide: WordmodelsService,
            useValue: new WordmodelsServiceMock(),
        },
        {
            provide: VisualizationService,
            useValue: new visualizationServiceMock(),
        }
    );

    return {
        testingModule: TestBed.configureTestingModule({
            declarations,
            imports: filteredImports,
            providers: filteredProviders
        })
    };
}

export class MockElementRef {
 nativeElement = {};
}
