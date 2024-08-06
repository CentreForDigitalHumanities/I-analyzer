import { TestBed } from '@angular/core/testing';

import { CorpusDefinitionService } from './corpus-definition.service';

describe('CorpusDefinitionServiceService', () => {
    let service: CorpusDefinitionService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CorpusDefinitionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
