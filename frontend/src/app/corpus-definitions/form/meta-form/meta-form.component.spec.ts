import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaFormComponent } from './meta-form.component';
import { ApiService } from '@services';
import { CorpusDefinition } from '@models/corpus-definition';
import { mockCorpusDefinition } from 'mock-data/corpus-definition';
import { commonTestBed } from 'app/common-test-bed';

describe('MetaFormComponent', () => {
    let component: MetaFormComponent;
    let fixture: ComponentFixture<MetaFormComponent>;
    let apiService: ApiService;

    beforeEach(async () => {
        commonTestBed().testingModule.compileComponents();
        apiService = TestBed.inject(ApiService);
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
