import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { QueryModel } from '../../models';

import { commonTestBed } from '../../common-test-bed';

import { HistogramComponent } from './histogram.component';
import { mockCorpus3, mockField, mockField2 } from '../../../mock-data/corpus';

describe('HistogramCompoment', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });


    it('should filter text fields', () => {
        component.corpus = mockCorpus3;
        component.frequencyMeasure = 'documents';

        const query1 = new QueryModel(mockCorpus3);
        query1.setQueryText('test');

        const query2 = new QueryModel(mockCorpus3);
        query2.setQueryText('test');
        query2.searchFields = [mockField, mockField2];

        const cases = [
            {
                query: query1,
                searchFields: undefined,
            }, {
                query: query2,
                searchFields: [mockField, mockField2]
            }
        ];

        cases.forEach(testCase => {
            const newQuery = component.selectSearchFields(testCase.query);
            expect(newQuery.searchFields).toEqual(testCase.query.searchFields);
        });

        component.frequencyMeasure = 'tokens';

        cases.forEach(testCase => {
            const newQuery = component.selectSearchFields(testCase.query);
            expect(newQuery.searchFields).toEqual([mockField2]);
        });
    });

});
