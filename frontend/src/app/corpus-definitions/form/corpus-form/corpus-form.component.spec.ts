import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorpusFormComponent } from './corpus-form.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { appRoutes } from 'app/app.module';

describe('CorpusFormComponent', () => {
    let component: CorpusFormComponent;
    let fixture: ComponentFixture<CorpusFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    declarations: [CorpusFormComponent],
    providers: [SlugifyPipe, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting(), provideRouter(appRoutes)]
}).compileComponents();

        fixture = TestBed.createComponent(CorpusFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
