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
            total: 2
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
            hidden: false
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

