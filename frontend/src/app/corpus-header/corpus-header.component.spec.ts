import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { commonTestBed } from '../common-test-bed';

import { CorpusHeaderComponent } from './corpus-header.component';

describe('CorpusHeaderComponent', () => {
    let component: CorpusHeaderComponent;
    let fixture: ComponentFixture<CorpusHeaderComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CorpusHeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
