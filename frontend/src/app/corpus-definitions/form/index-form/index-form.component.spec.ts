import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexFormComponent } from './index-form.component';
import { SharedModule } from '@shared/shared.module';
import { ApiServiceMock } from 'mock-data/api';


describe('IndexFormComponent', () => {
    let component: IndexFormComponent;
    let fixture: ComponentFixture<IndexFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [IndexFormComponent],
            imports: [SharedModule],
            providers: [ApiServiceMock]
        }).compileComponents();

        fixture = TestBed.createComponent(IndexFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
