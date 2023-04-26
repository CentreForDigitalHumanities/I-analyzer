import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CorpusFilterComponent } from './corpus-filter.component';
import { commonTestBed } from 'src/app/common-test-bed';

describe('CorpusFilterComponent', () => {
    let component: CorpusFilterComponent;
    let fixture: ComponentFixture<CorpusFilterComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CorpusFilterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
