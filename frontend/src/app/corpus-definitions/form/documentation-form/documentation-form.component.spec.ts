import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentationFormComponent } from './documentation-form.component';
import { SharedModule } from '@shared/shared.module';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import { ApiService } from '@services';
import { ApiServiceMock } from 'mock-data/api';
import { CorpusDefinition } from '@models/corpus-definition';

describe('DocumentationFormComponent', () => {
    let component: DocumentationFormComponent;
    let fixture: ComponentFixture<DocumentationFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DocumentationFormComponent],
            imports: [SharedModule],
            providers: [
                CorpusDefinitionService,
                { provide: ApiService, useClass: ApiServiceMock },
            ]

        })
            .compileComponents();

        const apiService = TestBed.inject(ApiService);
        const definitionService = TestBed.inject(CorpusDefinitionService);
        const corpus = new CorpusDefinition(apiService, 1);
        definitionService.setCorpus(corpus);

        fixture = TestBed.createComponent(DocumentationFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
