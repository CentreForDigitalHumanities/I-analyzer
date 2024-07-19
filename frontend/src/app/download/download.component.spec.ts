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
        expect(component['getCsvFields']()).toEqual(mockCorpus.fields);

        // Deselect all
        component.selectCsvFields([]);
        expect(component['getCsvFields']()).toEqual([]);

        // Select two
        component.selectCsvFields([mockField, mockField2]);
        const expected_fields = [mockField, mockField2];
        expect(component['getCsvFields']()).toEqual(expected_fields);
        expect(component.selectedCsvFields).toEqual(expected_fields);
    });
});
