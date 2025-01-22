import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadSampleComponent } from './upload-sample.component';
import { commonTestBed } from 'app/common-test-bed';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import { ApiService } from '@services';
import { CorpusDefinition } from '@models/corpus-definition';

describe('UploadSampleComponent', () => {
    let apiService: ApiService;
    let corpusDefinitionService: CorpusDefinitionService;
    let component: UploadSampleComponent;
    let fixture: ComponentFixture<UploadSampleComponent>;

    beforeEach(async () => {
        commonTestBed().testingModule.compileComponents();
        apiService = TestBed.inject(ApiService);
        corpusDefinitionService = TestBed.inject(CorpusDefinitionService);
        corpusDefinitionService.setCorpus(new CorpusDefinition(apiService, 1));

        fixture = TestBed.createComponent(UploadSampleComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
    });


    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
