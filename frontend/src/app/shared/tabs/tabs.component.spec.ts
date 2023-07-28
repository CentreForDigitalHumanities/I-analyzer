import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabsComponent } from './tabs.component';
import { commonTestBed } from '../../common-test-bed';

describe('TabsComponent', () => {
    let component: TabsComponent;
    let fixture: ComponentFixture<TabsComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TabsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
