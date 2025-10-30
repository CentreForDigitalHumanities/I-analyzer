import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { QueryModel } from '@models';

import { commonTestBed } from '../../common-test-bed';

import { HistogramComponent } from './histogram.component';
import { corpusFactory, keywordFieldFactory } from '../../../mock-data/corpus';
import { SimpleChange } from '@angular/core';

describe('HistogramCompoment', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;

        const corpus = corpusFactory();
        component.queryModel = new QueryModel(corpus);
        component.visualizedField = corpus.fields.find(field => field.mappingType == 'keyword');
        component.ngOnChanges({
            queryModel: new SimpleChange(undefined, component.queryModel, true)
        });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });


    it('should filter text fields', () => {
        const corpus = corpusFactory();
        corpus.fields[0] = keywordFieldFactory(true);

        component.frequencyMeasure = 'documents';

        const query1 = new QueryModel(corpus);
        query1.setQueryText('test');

        const query2 = new QueryModel(corpus);
        query2.setParams({
            queryText: 'test',
            searchFields: corpus.fields.slice(0, 2),
        });

        const queries = [ query1, query2 ];

        queries.forEach(query => {
            const newQuery = component.selectSearchFields(query);
            expect(newQuery.searchFields).toEqual(query.searchFields);
        });

        component.frequencyMeasure = 'tokens';

        queries.forEach(query => {
            const newQuery = component.selectSearchFields(query);
            expect(newQuery.searchFields).toEqual([corpus.fields[1]]);
        });
    });

});
