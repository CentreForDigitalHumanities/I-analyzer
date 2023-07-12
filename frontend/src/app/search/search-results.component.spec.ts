import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import * as _ from 'lodash';
import { mockCorpus, mockField } from '../../mock-data/corpus';
import { commonTestBed } from '../common-test-bed';

import { CorpusField, FoundDocument, QueryModel } from '../models/index';

import { SearchResultsComponent } from './search-results.component';
import { makeDocument } from '../../mock-data/constructor-helpers';


describe('Search Results Component', () => {
    let component: SearchResultsComponent;
    let fixture: ComponentFixture<SearchResultsComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchResultsComponent);
        const fields = ['a', 'b', 'c'].map(createField);
        component = fixture.componentInstance;
        component.results = {
            fields,
            documents: [makeDocument({
                a: '1',
                b: '2',
                c: 'Hide-and-seek!'
            }, '1', 1,
            {
                c: ['Where is <span>Wally?</span>', 'I cannot find <span>Wally</span> anywhere!']
            }),
            makeDocument({
                a: '3',
                b: '4',
                c: 'Wally is here'
            }, '2', 0.5)],
            total: {
                value: 2,
                relation: 'gte'
            }
        };
        component.corpus = _.merge(mockCorpus, fields);
        component.fromIndex = 0;
        component.resultsPerPage = 20;
        const query = new QueryModel(component.corpus);
        query.setQueryText('wally');
        query.setHighlight(10);
        component.queryModel = query;
        fixture.detectChanges();
    });

    const createField = (name: string): CorpusField => {
        const field = _.cloneDeep(mockField);
        field.name = name;
        return field;
    };

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should render result', async () => {
        await fixture.whenStable();
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.innerHTML).toContain('Wally is here');
    });
});

