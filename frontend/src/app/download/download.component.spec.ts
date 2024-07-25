import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { mockCorpus, mockField, mockField2 } from '../../mock-data/corpus';
import { commonTestBed } from '../common-test-bed';
import { QueryModel } from '../models';

import { DownloadComponent } from './download.component';
import { SimpleChange } from '@angular/core';

describe('DownloadComponent', () => {
    let component: DownloadComponent;
    let fixture: ComponentFixture<DownloadComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DownloadComponent);
        component = fixture.componentInstance;
        component.corpus = mockCorpus;
        component.queryModel = new QueryModel(mockCorpus);
        component.ngOnChanges({
            queryModel: new SimpleChange(undefined, component.queryModel, true)
         });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should respond to field selection', () => {
        // Start with a single field
        expect(component['getColumnNames']()).toEqual(['great_field', 'speech']);

        // Deselect all
        component.selectedCsvFields = [];
        expect(component['getColumnNames']()).toEqual([]);

        // Select two
        component.selectedCsvFields = [mockField, mockField2];
        const expected_fields = ['great_field', 'speech'];
        expect(component['getColumnNames']()).toEqual(expected_fields);
    });
});
