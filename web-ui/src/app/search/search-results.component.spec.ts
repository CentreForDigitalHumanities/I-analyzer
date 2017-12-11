import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CorpusField } from '../models/corpus';
import { HighlightService } from '../services/highlight.service';
import { HighlightPipe } from './highlight-pipe';
import { SearchRelevanceComponent } from './search-relevance.component';
import { SearchResultsComponent } from './search-results.component';

describe('Search Results Component', () => {
    let component: SearchResultsComponent;
    let fixture: ComponentFixture<SearchResultsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HighlightPipe, SearchRelevanceComponent, SearchResultsComponent],
            providers: [HighlightService]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchResultsComponent);
        component = fixture.componentInstance;
        let hits: { [key: string]: string }[] = [];
        component.results = {
            completed: true,
            fields: ['a', 'b'].map(createField),
            documents: [createDocument({ 'a': '1', 'b': '2' }, '1', 1),
            createDocument({ 'a': '3', 'b': '4' }, '2', 0.5)],
            retrieved: 2,
            total: 2
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
            hidden: false
        };
    }

    function createDocument(fieldValues: { [name: string]: string }, id: string, relevance: number) {
        return { id, relevance, fieldValues };
    }

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});

