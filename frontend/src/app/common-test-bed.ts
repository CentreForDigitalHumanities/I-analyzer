import { TestBed } from '@angular/core/testing';

import { declarations, imports, providers } from './app.module';

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
            provide: DialogService, useClass: DialogServiceMock

        },
        {
            provide: ElasticSearchService, useValue: new ElasticSearchServiceMock()
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