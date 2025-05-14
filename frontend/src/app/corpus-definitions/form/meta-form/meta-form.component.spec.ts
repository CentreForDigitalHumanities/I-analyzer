import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaFormComponent } from './meta-form.component';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SharedModule } from '@shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { ApiService } from '@services';
import { ApiServiceMock } from 'mock-data/api';
import { CorpusDefinition } from '@models/corpus-definition';
import { FormFeedbackComponent } from '../form-feedback/form-feedback.component';
import { DocumentationFormComponent } from '../documentation-form/documentation-form.component';


describe('MetaFormComponent', () => {
    let component: MetaFormComponent;
    let fixture: ComponentFixture<MetaFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                MetaFormComponent,
                ImageUploadComponent,
                DocumentationFormComponent,
                FormFeedbackComponent,
            ],
            imports: [
                SharedModule,
                ReactiveFormsModule,
                MultiSelectModule,
                HttpClientTestingModule,
            ],
            providers: [
                CorpusDefinitionService,
                SlugifyPipe,
                { provide: ApiService, useClass: ApiServiceMock },
            ],
        }).compileComponents();

        const apiService = TestBed.inject(ApiService);
        const definitionService = TestBed.inject(CorpusDefinitionService);
        const corpus = new CorpusDefinition(apiService, 1);
        definitionService.setCorpus(corpus);

        fixture = TestBed.createComponent(MetaFormComponent);
        component = fixture.componentInstance;
        component.corpus = corpus;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
