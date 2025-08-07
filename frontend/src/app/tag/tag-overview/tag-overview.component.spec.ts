import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagOverviewComponent } from './tag-overview.component';
import { ApiService, CorpusService } from '@services';
import { SharedModule } from '@shared/shared.module';
import { ApiServiceMock } from 'mock-data/api';
import { CorpusServiceMock } from 'mock-data/corpus';

describe('TagOverviewComponent', () => {
    let component: TagOverviewComponent;
    let fixture: ComponentFixture<TagOverviewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TagOverviewComponent],
            imports: [SharedModule],
            providers: [
                { provide: ApiService, useClass: ApiServiceMock },
                { provide: CorpusService, useClass: CorpusServiceMock },
            ]
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
