import { TestBed } from '@angular/core/testing';

import { CorpusDefinitionService } from './corpus-definition.service';

describe('CorpusDefinitionService', () => {
    let service: CorpusDefinitionService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CorpusDefinitionService],
        });
        service = TestBed.inject(CorpusDefinitionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
