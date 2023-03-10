import { mockCorpus, mockField } from '../../mock-data/corpus';
import { PotentialFilter } from './filter-management';
import { QueryModel } from './query';

describe('PotentialFilter', () => {
    it('should create', () => {
        const field = mockField;
        const query = new QueryModel(mockCorpus);
        const potentialFilter = new PotentialFilter(field, query);
        expect(potentialFilter).toBeTruthy();
    });

    it('should toggle', () => {
        const field = mockField;
        const query = new QueryModel(mockCorpus);
        const potentialFilter = new PotentialFilter(field, query);

        expect(query.filters.length).toBe(0);
        potentialFilter.toggle();
        expect(query.filters.length).toBe(1);
        potentialFilter.toggle();
        expect(query.filters.length).toBe(0);
    });
});
