import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { commonTestBed } from '../common-test-bed';

import { SearchComponent } from './search.component';


describe('SearchComponent', () => {
    let component: SearchComponent;
    let fixture: ComponentFixture<SearchComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    xit('should show download controls for authenticated user', async () => {
        /** TODO: the fixture in this test never becomes stable. This is probably caused by
         * `setStateFromParams` changing the `showVisualization` variable,
         * which is needed for rendering.
         */
        await fixture.whenStable();
        expect(fixture.debugElement.query(By.css('ia-download'))).toBeTruthy();
    });
});
