import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagOverviewComponent } from './tag-overview.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiRetryService } from '../../services';
import { RouterTestingModule } from '@angular/router/testing';

describe('TagOverviewComponent', () => {
    let component: TagOverviewComponent;
    let fixture: ComponentFixture<TagOverviewComponent>;

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
