import { TestBed } from '@angular/core/testing';

import { CorpusDefinitionService } from './corpus-definition.service';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';
import { ApiService } from '@services';
import { ApiServiceMock } from 'mock-data/api';

describe('CorpusDefinitionService', () => {
    let service: CorpusDefinitionService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                CorpusDefinitionService, SlugifyPipe,
                { provide: ApiService, useClass: ApiServiceMock },
            ],
        });
        service = TestBed.inject(CorpusDefinitionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
