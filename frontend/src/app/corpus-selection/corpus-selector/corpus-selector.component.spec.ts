import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CorpusSelectorComponent } from './corpus-selector.component';
import { commonTestBed } from '../../common-test-bed';
import { mockCorpus } from '../../../mock-data/corpus';

describe('CorpusSelectorComponent', () => {
    let component: CorpusSelectorComponent;
    let fixture: ComponentFixture<CorpusSelectorComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CorpusSelectorComponent);
        component = fixture.componentInstance;
        component.corpus = mockCorpus;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
