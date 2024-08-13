import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorpusFormComponent } from './corpus-form.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('CorpusFormComponent', () => {
    let component: CorpusFormComponent;
    let fixture: ComponentFixture<CorpusFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CorpusFormComponent],
            imports: [HttpClientTestingModule, RouterTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(CorpusFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
