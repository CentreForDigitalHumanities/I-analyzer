import { mockFieldMultipleChoice, mockFieldDate } from '../../mock-data/corpus';
import { DateFilter, MultipleChoiceFilter } from './search-filter';

describe('DateFilter', () => {
    const field = mockFieldDate;
    let filter: DateFilter;

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

    it('should convert to string', () => {
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
        const esFilter = filter.toEsFilter();
        expect(esFilter).toEqual({
            range: {
                date: {
                    gte: '1800-01-01',
                    lte: '1899-12-31',
                    format: 'yyyy-MM-dd'
                }
            }
        });
    });

    it('should parse an elasticsearch filter', () => {
        const esFilter = filter.toEsFilter();
        expect(filter.dataFromEsFilter(esFilter)).toEqual(filter.currentData);
    });
});

describe('MultipleChoiceFilter', () => {
    const field = mockFieldMultipleChoice;
    let filter: MultipleChoiceFilter;

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
        filter.data.next(['a', 'b', 'value with spaces']);
        expect(filter.dataFromString(filter.dataToString(filter.currentData)))
            .toEqual(filter.currentData);
    });

    it('should convert values to valid URI components', () => {
        filter.data.next(['a long value']);
        expect(filter.dataToString(filter.currentData)).not.toContain(' ');
    });

    it('should set data from a value', () => {
        const value = 'a great value';
        filter.setToValue(value);
        expect(filter.currentData).toEqual([value]);
    });

    it('should convert to an elasticsearch filter', () => {
        filter.data.next(['wow!', 'a great selection!']);
        const esFilter = filter.toEsFilter();
        expect(esFilter).toEqual({
            terms: {
                greater_field: ['wow!', 'a great selection!']
            }
        });
    });

    it('should parse an elasticsearch filter', () => {
        const esFilter = filter.toEsFilter();
        expect(filter.dataFromEsFilter(esFilter)).toEqual(filter.currentData);
    });
});
