import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TagOverviewComponent } from './tag-overview.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiRetryService } from '@services';
import { RouterTestingModule } from '@angular/router/testing';
import { commonTestBed } from '../../common-test-bed';

describe('TagOverviewComponent', () => {
    let component: TagOverviewComponent;
    let fixture: ComponentFixture<TagOverviewComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TagOverviewComponent],
            imports: [HttpClientTestingModule, RouterTestingModule],
            providers: [ApiRetryService],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TagOverviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
