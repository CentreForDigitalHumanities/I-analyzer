import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CorpusFormComponent } from './corpus-form.component';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';
import { StepsModule } from 'primeng/steps';
import { MetaFormComponent } from '../meta-form/meta-form.component';
import { FieldFormComponent } from '../field-form/field-form.component';
import { UploadSampleComponent } from '../upload-sample/upload-sample.component';
import { ApiService } from '@services';
import { ApiServiceMock } from 'mock-data/api';
import { SharedModule } from '@shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { FormFeedbackComponent } from '../form-feedback/form-feedback.component';
import { DocumentationFormComponent } from '../documentation-form/documentation-form.component';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MarkdownEditorComponent } from '../documentation-form/markdown-editor/markdown-editor.component';
import { QuillModule } from 'ngx-quill';

describe('CorpusFormComponent', () => {
    let component: CorpusFormComponent;
    let fixture: ComponentFixture<CorpusFormComponent>;

    const mockRoute = { snapshot: { params: {corpusID: 1} } };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                CorpusFormComponent,
                MetaFormComponent,
                FieldFormComponent,
                UploadSampleComponent,
                ImageUploadComponent,
                FormFeedbackComponent,
                DocumentationFormComponent,
                MarkdownEditorComponent,
            ],
            imports: [
                SharedModule,
                StepsModule,
                ReactiveFormsModule,
                AutoCompleteModule,
                QuillModule,
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
