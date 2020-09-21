import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { commonTestBed } from '../common-test-bed';

import { VisualizationComponent } from './visualization.component';

describe('VisualizationComponent', () => {
    let component: VisualizationComponent;
    let fixture: ComponentFixture<VisualizationComponent>;

    beforeEach(async(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VisualizationComponent);
        component = fixture.componentInstance;
        component.corpus = <any>{
            fields: [{
                displayName: 'Test Field', name: 'test_field'
            }]
        };
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    afterAll(() => {
        fixture.destroy();
    });
});
