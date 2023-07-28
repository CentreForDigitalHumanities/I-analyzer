import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabPanelComponent } from './tab-panel.component';
import { commonTestBed } from 'src/app/common-test-bed';

describe('TabPanelComponent', () => {
    let component: TabPanelComponent;
    let fixture: ComponentFixture<TabPanelComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TabPanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
