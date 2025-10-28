import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataFormComponent } from './data-form.component';
import { commonTestBed } from 'app/common-test-bed';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import { ApiService } from '@services';
import { CorpusDefinition } from '@models/corpus-definition';

describe('DataFormComponent', () => {
    let apiService: ApiService;
    let corpusDefinitionService: CorpusDefinitionService;
    let component: DataFormComponent;
    let fixture: ComponentFixture<DataFormComponent>;

    beforeEach(async () => {
        commonTestBed().testingModule.compileComponents();
        apiService = TestBed.inject(ApiService);
        corpusDefinitionService = TestBed.inject(CorpusDefinitionService);
        corpusDefinitionService.setCorpus(new CorpusDefinition(apiService, 1));

        fixture = TestBed.createComponent(DataFormComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
