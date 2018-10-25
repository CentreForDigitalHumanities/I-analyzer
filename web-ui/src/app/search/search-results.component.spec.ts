import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogModule } from 'primeng/primeng';

import * as corpus from '../../mock-data/corpus';
import { CorpusField } from '../models/index';
import { ApiService, ApiRetryService, DataService, ElasticSearchService, HighlightService, LogService, QueryService, SearchService, UserService } from '../services';
import { ApiServiceMock } from '../services/api.service.mock';
import { ElasticSearchServiceMock } from '../services/elastic-search.service.mock';
import { UserServiceMock } from '../services/user.service.mock';

import { HighlightPipe } from './highlight.pipe';
import { SearchRelevanceComponent } from './search-relevance.component';
import { SearchResultsComponent } from './search-results.component';


describe('Search Results Component', () => {
    let component: SearchResultsComponent;
    let fixture: ComponentFixture<SearchResultsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HighlightPipe, SearchRelevanceComponent, SearchResultsComponent],
            imports: [DialogModule],
            providers: [
                {
                    provide: ApiService, useValue: new ApiServiceMock({
                        ['corpus']: corpus.MockCorpusResponse
                    })
                },
                ApiRetryService,
                {
                    provide: ElasticSearchService, useValue: new ElasticSearchServiceMock()
                },
                DataService,
                HighlightService,
                LogService,
                QueryService,
                SearchService,
                {
                    provide: UserService, useValue: new UserServiceMock()
                }]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchResultsComponent);
        let fields = ['a', 'b', 'c'].map(createField);
        component = fixture.componentInstance;
        component.results = {
            completed: true,
            fields,
            documents: [createDocument({
                'a': '1',
                'b': '2',
                'c': 'Hide-and-seek!'
            }, '1', 1, 1),
            createDocument({
                'a': '3',
                'b': '4',
                'c': 'Wally is here'
            }, '2', 0.5, 2)],
            retrieved: 2,
            total: 2,
            queryModel: {
                queryText: '',
                filters: []
            }
        };
        component.corpus = <any>{
            fields
        };

        fixture.detectChanges();
    });

    function createField(name: string): CorpusField {
        return {
            name,
            displayName: name,
            description: 'Description',
            displayType: 'text',
            searchFilter: null,
            hidden: false,
            sortable: true,
            searchable: false,
        };
    }

    function createDocument(fieldValues: { [name: string]: string }, id: string, relevance: number, position) {
        return { id, relevance, fieldValues, position };
    }

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should render result', async () => {
        await fixture.whenStable();
        let compiled = fixture.debugElement.nativeElement;
        expect(compiled.innerHTML).toContain('Wally is here');
    });
});

