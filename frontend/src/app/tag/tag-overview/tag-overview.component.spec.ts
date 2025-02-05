import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TagOverviewComponent } from './tag-overview.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiRetryService } from '@services';
import { RouterTestingModule } from '@angular/router/testing';
import { commonTestBed } from '../../common-test-bed';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('TagOverviewComponent', () => {
    let component: TagOverviewComponent;
    let fixture: ComponentFixture<TagOverviewComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    declarations: [TagOverviewComponent],
    imports: [RouterTestingModule],
    providers: [ApiRetryService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
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
