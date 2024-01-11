import { convertToParamMap } from '@angular/router';
import { mockFieldMultipleChoice, mockFieldDate } from '../../mock-data/corpus';
import { EsDateFilter, EsTermsFilter } from './elasticsearch';
import { DateFilter, DateFilterData, MultipleChoiceFilter } from './field-filter';
import { of } from 'rxjs';
import { distinct } from 'rxjs/operators';

describe('SearchFilter', () => {
    // while these tests are ran on the DateFilter,
    // they test logic implemented in the abstract
    // SearchFilter class

    const field = mockFieldDate;
    let filter: DateFilter;
    const exampleData: DateFilterData = {
        min: new Date(Date.parse('Jan 01 1850')),
        max: new Date(Date.parse('Dec 31 1860'))
    };
    const isActive = () => filter.active.value;

    beforeEach(() => {
        filter = new DateFilter(field);
    });

    it('should toggle', () => {
        expect(isActive()).toBeFalse();

        // set some non-default data so the filter will not reject activation
        filter.set(exampleData);
        expect(isActive()).toBeTrue();

        filter.toggle();
        expect(isActive()).toBeFalse();
        filter.toggle();
        expect(isActive()).toBeTrue();

        filter.deactivate();
        expect(isActive()).toBeFalse();
        filter.activate();
        expect(isActive()).toBeTrue();
        filter.activate();
        expect(isActive()).toBeTrue();
    });

    it('should activate when value is set to non-default', () => {
        expect(isActive()).toBeFalse();

        filter.set(filter.defaultData);
        expect(isActive()).toBeFalse();

        filter.set(exampleData);
        expect(isActive()).toBeTrue();
    });

    it('should deactivate when reset', () => {
        filter.set(exampleData);
        expect(isActive()).toBeTrue();

        filter.reset();
        expect(isActive()).toBeFalse();
    });

    it('should ignore activation without data', () => {
        expect(isActive()).toBeFalse();

        filter.activate();
        expect(isActive()).toBeFalse();

        filter.toggle();
        expect(isActive()).toBeFalse();
    });

    it('should set from parameters', () => {
        filter.setFromParams(convertToParamMap({
            date: '1850-01-01:1860-01-01'
        }));

        expect(filter.active.value).toBeTrue();

        filter.setFromParams(convertToParamMap({
            query: 'test'
        }));

        expect(filter.active.value).toBeFalse();
    });

    it('should signal updates', () => {
        let updates = 0;
        filter.update.subscribe(() => updates += 1);

        filter.set(exampleData);
        expect(updates).toBe(1);

        filter.deactivate();
        expect(updates).toBe(2);

        filter.reset(); // this does not affect anything since the filter is inactive
        expect(updates).toBe(2);

    });
});

describe('DateFilter', () => {
    const field = mockFieldDate;
    let filter: DateFilter;
    const exampleData = {
        min: new Date(Date.parse('Jan 01 1850')),
        max: new Date(Date.parse('Dec 31 1860'))
    };

    beforeEach(() => {
        filter = new DateFilter(field);
    });

    it('should create', () => {
        expect(filter).toBeTruthy();
        expect(filter.currentData).toEqual(filter.defaultData);
        expect(filter.currentData).toEqual({
            min: new Date(Date.parse('Jan 01 1800')),
            max: new Date(Date.parse('Dec 31 1899'))
        });
    });

    it('should convert from and to string', () => {
        expect(filter.dataFromString(filter.dataToString(filter.currentData)))
            .toEqual(filter.currentData);
    });

    it('should set data from a value', () => {
        const date = new Date(Date.parse('Jan 01 1850'));
        filter.setToValue(date);
        expect(filter.currentData).toEqual({
            min: date,
            max: date,
        });
    });

    it('should convert to an elasticsearch filter', () => {
        filter.set(exampleData);
        const esFilter = filter.toEsFilter();
        expect(esFilter).toEqual({
            range: {
                date: {
                    gte: '1850-01-01',
                    lte: '1860-12-31',
                    format: 'yyyy-MM-dd',
                    relation: 'within',
                }
            }
        });
    });

    it('should parse an elasticsearch filter', () => {
        filter.set(exampleData);
        const esFilter = filter.toEsFilter();
        expect(filter.dataFromEsFilter(esFilter)).toEqual(filter.currentData);
    });
});

describe('MultipleChoiceFilter', () => {
    const field = mockFieldMultipleChoice;
    let filter: MultipleChoiceFilter;
    const exampleData = ['test'];

    beforeEach(() => {
        filter = new MultipleChoiceFilter(field);
    });

    it('should create', () => {
        expect(filter).toBeTruthy();
        expect(filter.currentData).toEqual(filter.defaultData);
        expect(filter.currentData).toEqual([]);
    });

    it('should convert to a string', () => {
        expect(filter.dataFromString(filter.dataToString(filter.currentData)))
            .toEqual(filter.currentData);

        // non-empty value
        filter.set(['a', 'b', 'value with spaces']);
        expect(filter.dataFromString(filter.dataToString(filter.currentData)))
            .toEqual(filter.currentData);
    });

    it('should convert values to valid URI components', () => {
        filter.set(['a long value']);
        expect(filter.dataToString(filter.currentData)).not.toContain(' ');
    });

    it('should set data from a value', () => {
        const value = 'a great value';
        filter.setToValue(value);
        expect(filter.currentData).toEqual([value]);
    });

    it('should convert to an elasticsearch filter', () => {
        filter.set(['wow!', 'a great selection!']);
        const esFilter = filter.toEsFilter();
        expect(esFilter).toEqual({
            terms: {
                greater_field: ['wow!', 'a great selection!']
            }
        });
    });

    it('should parse an elasticsearch filter', () => {
        filter.set(exampleData);
        const esFilter = filter.toEsFilter();
        expect(filter.dataFromEsFilter(esFilter)).toEqual(filter.currentData);
    });
});
