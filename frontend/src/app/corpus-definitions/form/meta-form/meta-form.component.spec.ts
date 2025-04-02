import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaFormComponent } from './meta-form.component';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';
import { SharedModule } from '@shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { CorpusDefinition } from '@models/corpus-definition';
import { mockCorpusDefinition } from 'mock-data/corpus-definition';
import { ApiService } from '@services';


describe('MetaFormComponent', () => {
    let component: MetaFormComponent;
    let fixture: ComponentFixture<MetaFormComponent>;
    let apiService: ApiService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MetaFormComponent],
            imports: [
                SharedModule,
                ReactiveFormsModule,
                MultiSelectModule,
            ],
            providers: [CorpusDefinitionService, SlugifyPipe],
        }).compileComponents();

        fixture = TestBed.createComponent(MetaFormComponent);
        component = fixture.componentInstance;
        const corpus = new CorpusDefinition(apiService);
        corpus.setFromDefinition(mockCorpusDefinition);
        component.corpus = corpus;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
