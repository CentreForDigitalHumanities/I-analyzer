import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { DataService, SearchService } from '../services/index';
import { BarChartComponent } from './barchart.component';

describe('BarchartComponent', () => {
    let component: BarChartComponent;
    let fixture: ComponentFixture<BarChartComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule],
            providers: [DataService, SearchService],
            declarations: [BarChartComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BarChartComponent);
        component = fixture.componentInstance;
        component.chartElement = document.createElement('div');
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
