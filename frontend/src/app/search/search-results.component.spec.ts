import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { DialogModule } from 'primeng/primeng';

import { commonTestBed } from '../common-test-bed';

import * as corpus from '../../mock-data/corpus';
import { CorpusField } from '../models/index';
import { ApiService, ApiRetryService, DataService, ElasticSearchService, HighlightService, LogService, QueryService, SearchService, UserService } from '../services';
import { ApiServiceMock } from '../../mock-data/api';
import { ElasticSearchServiceMock } from '../../mock-data/elastic-search';
import { UserServiceMock } from '../../mock-data/user';

import { HighlightPipe } from './highlight.pipe';
import { PaginationComponent } from './pagination.component';
import { SearchRelevanceComponent } from './search-relevance.component';
import { SearchResultsComponent } from './search-results.component';
import { HttpClientModule } from '@angular/common/http';
import { componentRefresh } from '@angular/core/src/render3/instructions';


describe('Search Results Component', () => {
    let component: SearchResultsComponent;
    let fixture: ComponentFixture<SearchResultsComponent>;

    beforeEach(async(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchResultsComponent);
        let fields = ['a', 'b', 'c'].map(createField);
        component = fixture.componentInstance;
        component.results = {
            fields,
            documents: [createDocument({
                'a': '1',
                'b': '2',
                'c': 'Hide-and-seek!'
            }, '1', 1),
            createDocument({
                'a': '3',
                'b': '4',
                'c': 'Wally is here'
            }, '2', 0.5)],
            total: 2
        };
        component.corpus = <any>{
            fields
        };
        component.fromIndex = 0;
        component.resultsPerPage = 20;
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
            downloadable: true,
        };
    }

    function createDocument(fieldValues: { [name: string]: string }, id: string, relevance: number) {
        return { id, relevance, fieldValues };
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

