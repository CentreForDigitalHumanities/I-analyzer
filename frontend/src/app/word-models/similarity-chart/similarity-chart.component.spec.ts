import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { commonTestBed } from '../../common-test-bed';

import { SimilarityChartComponent } from './similarity-chart.component';

describe('SimilarityChartComponent', () => {
    let component: SimilarityChartComponent;
    let fixture: ComponentFixture<SimilarityChartComponent>;


    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));


    beforeEach(() => {
        fixture = TestBed.createComponent(SimilarityChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
