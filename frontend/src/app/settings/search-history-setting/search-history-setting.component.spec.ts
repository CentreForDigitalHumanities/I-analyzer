import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SearchHistorySettingComponent } from './search-history-setting.component';
import { commonTestBed } from '../../common-test-bed';

describe('SearchHistorySettingComponent', () => {
    let component: SearchHistorySettingComponent;
    let fixture: ComponentFixture<SearchHistorySettingComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchHistorySettingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
