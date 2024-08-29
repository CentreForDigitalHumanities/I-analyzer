import { TestBed } from '@angular/core/testing';
import { ApiService } from '@services';
import { CorpusDefinition } from './corpus-definition';
import { ApiServiceMock } from '../../mock-data/api';
import { mockCorpusDefinition } from '../../mock-data/corpus-definition';
import * as _ from 'lodash';


describe('CorpusDefinition', () => {
    let apiService: ApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: ApiService, useClass: ApiServiceMock }
            ]
        });
        apiService = TestBed.inject(ApiService);
    });

    it('should create for an existing corpus', () => {
        const corpus = new CorpusDefinition(apiService, 1);
        expect(corpus).toBeTruthy();
        expect(corpus.id).toBe(1);
    });

    it('should create for a new corpus', () => {
        const corpus = new CorpusDefinition(apiService);
        expect(corpus).toBeTruthy();
        expect(corpus.id).toBeUndefined();
    });

    it('should save updates', () => {
        const createSpy = spyOn(apiService, 'createCorpus').and.callThrough();
        const updateSpy = spyOn(apiService, 'updateCorpus').and.callThrough();

        const corpus = new CorpusDefinition(apiService);
        corpus.definition = mockCorpusDefinition;
        corpus.save();

        expect(createSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy).not.toHaveBeenCalled();
        expect(corpus.id).toBeDefined();

        const newDefinition = _.set(_.cloneDeep(mockCorpusDefinition), ['meta', 'title'], 'Different title');
        corpus.setFromDefinition(newDefinition);
        corpus.save();

        expect(createSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(corpus.definition.meta.title).toBe('Different title');
    });
});
