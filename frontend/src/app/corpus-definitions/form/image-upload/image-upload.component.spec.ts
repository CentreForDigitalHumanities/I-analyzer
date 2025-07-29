import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageUploadComponent } from './image-upload.component';
import { ApiService } from '@services';
import { ApiServiceMock } from 'mock-data/api';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import { CorpusDefinition } from '@models/corpus-definition';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';
import { FormFeedbackComponent } from '../form-feedback/form-feedback.component';
import { SharedModule } from '@shared/shared.module';

describe('ImageUploadComponent', () => {
    let component: ImageUploadComponent;
    let fixture: ComponentFixture<ImageUploadComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ImageUploadComponent,
                FormFeedbackComponent,
            ],
            imports: [SharedModule],
            providers: [
                CorpusDefinitionService,
                SlugifyPipe,
                { provide: ApiService, useClass: ApiServiceMock },
            ]
        })
            .compileComponents();

        const apiService = TestBed.inject(ApiService);
        const definitionService = TestBed.inject(CorpusDefinitionService);
        const corpus = new CorpusDefinition(apiService, 1);
        definitionService.setCorpus(corpus);

        fixture = TestBed.createComponent(ImageUploadComponent);
        component = fixture.componentInstance;
        component.corpus = corpus;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
