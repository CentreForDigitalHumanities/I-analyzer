import { mockCorpus, mockCorpus3, mockField, mockFieldDate, mockFieldMultipleChoice } from '../../mock-data/corpus';
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
        potentialFilter.filter.set(true);

        expect(query.activeFilters.length).toBe(1);
        potentialFilter.toggle();
        expect(query.activeFilters.length).toBe(0);
        potentialFilter.toggle();
        expect(query.activeFilters.length).toBe(1);
    });

    it('should deactivate when a date filter resets', () => {
        const field = mockFieldDate;
        const query = new QueryModel(mockCorpus3);
        const potentialFilter = new PotentialFilter(field, query);

        potentialFilter.filter.setToValue('Jan 1 1850');
        potentialFilter.activate();
        expect(query.activeFilters.length).toBe(1);

        potentialFilter.filter.reset();
        expect(query.activeFilters.length).toBe(0);
    });

    it('should deactivate when a multiple choice filter resets', () => {
        const field = mockFieldMultipleChoice;
        const query = new QueryModel(mockCorpus3);
        const potentialFilter = new PotentialFilter(field, query);

        potentialFilter.filter.setToValue('test');
        potentialFilter.activate();
        expect(query.activeFilters.length).toBe(1);

        potentialFilter.filter.set([]);
        expect(query.activeFilters.length).toBe(0);
    });
});
