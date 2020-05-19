import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestBed } from '../common-test-bed';

import { CorpusField } from '../models/index';

import { SearchResultsComponent } from './search-results.component';


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
            total: {
                value: 2,
                relation: 'gte'
            }
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

