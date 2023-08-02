import { convertToParamMap } from '@angular/router';
import { mockCorpus3, mockField3 } from '../../mock-data/corpus';
import { SortConfiguration } from './sort';

describe('SortConfiguration', () => {
    let sort: SortConfiguration;

    beforeEach(() => {
        sort = new SortConfiguration(mockCorpus3);
    });

    it('should set the default state', () => {
        expect(sort.sortBy.value).toBe(undefined);
        expect(sort.sortDirection.value).toBe('desc');
        expect(sort.isDefault).toBe(true);
    });

    it('should convert to parameters', () => {
        sort.setSortBy(mockField3);
        sort.setSortDirection('asc');

        const param = sort.toRouteParam();

        // now initialise from the parameter
        sort = new SortConfiguration(mockCorpus3, convertToParamMap(param));

        expect(sort.sortBy.value).toEqual(mockField3);
        expect(sort.sortDirection.value).toBe('asc');
    });
});
