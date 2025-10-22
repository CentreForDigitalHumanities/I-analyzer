import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '@services';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';
import { SharedModule } from '@shared/shared.module';
import { ApiServiceMock } from 'mock-data/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { StepsModule } from 'primeng/steps';
import { DataFormComponent } from '../data-form/data-form.component';
import { DocumentationFormComponent } from '../documentation-form/documentation-form.component';
import { FieldFormComponent } from '../field-form/field-form.component';
import { FormFeedbackComponent } from '../form-feedback/form-feedback.component';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { MetaFormComponent } from '../meta-form/meta-form.component';
import { CorpusFormComponent } from './corpus-form.component';

describe('CorpusFormComponent', () => {
    let component: CorpusFormComponent;
    let fixture: ComponentFixture<CorpusFormComponent>;

    const mockRoute = { snapshot: { params: { corpusID: 1 } } };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                CorpusFormComponent,
                MetaFormComponent,
                FieldFormComponent,
                DataFormComponent,
                ImageUploadComponent,
                FormFeedbackComponent,
                DocumentationFormComponent,
            ],
            imports: [
                SharedModule,
                StepsModule,
                ReactiveFormsModule,
                AutoCompleteModule,
            ],
            providers: [
                SlugifyPipe,
                { provide: ActivatedRoute, useValue: mockRoute },
                { provide: ApiService, useClass: ApiServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CorpusFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
