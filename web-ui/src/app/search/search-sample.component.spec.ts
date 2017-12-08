import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CorpusField } from '../models/corpus';
import { HighlightService } from '../services/highlight.service';
import { HighlightPipe } from './highlight-pipe';
import { SearchRelevanceComponent } from './search-relevance.component';
import { SearchSampleComponent } from './search-sample.component';

describe('SearchSampleComponent', () => {
    let component: SearchSampleComponent;
    let fixture: ComponentFixture<SearchSampleComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HighlightPipe, SearchRelevanceComponent, SearchSampleComponent],
            providers: [HighlightService]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchSampleComponent);
        component = fixture.componentInstance;
        let hits: { [key: string]: string }[] = [];
        component.sample = {
            fields: ['a', 'b'].map(createField),
            hits: [createHit({ 'a': '1', 'b': '2' }, '1', 1),
            createHit({ 'a': '3', 'b': '4' }, '2', 0.5)],
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

    function createHit(values: { [name: string]: string }, id: string, relevance: number) {
        return Object.assign({ id, relevance }, values);
    }

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});

