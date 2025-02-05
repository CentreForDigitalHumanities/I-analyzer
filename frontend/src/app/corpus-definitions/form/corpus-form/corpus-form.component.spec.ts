import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorpusFormComponent } from './corpus-form.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CorpusFormComponent', () => {
    let component: CorpusFormComponent;
    let fixture: ComponentFixture<CorpusFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    declarations: [CorpusFormComponent],
    imports: [RouterTestingModule],
    providers: [SlugifyPipe, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

        fixture = TestBed.createComponent(CorpusFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
