import { CorpusField } from './corpus';
import { DateFilter } from './search-filter';

describe('DateFilter', () => {
    const mockField: CorpusField = {
        name: 'date',
        displayName: 'Date',
        description: '',
        displayType: 'date',
        hidden: false,
        sortable: true,
        primarySort: false,
        searchable: false,
        downloadable: true,
        searchFilter: {
            fieldName: 'date',
            description: '',
            useAsFilter: true,
            currentData: {
                filterType: 'DateFilter',
                min: '1800-01-01',
                max: '1899-12-31'
            },
            defaultData: {
                filterType: 'DateFilter',
                min: '1800-01-01',
                max: '1899-12-31'
            }
        },
        mappingType: 'date',
    };

    it('should create', () => {
        const filter = new DateFilter(mockField);
        expect(filter).toBeTruthy();
        expect(filter.currentData).toEqual({
            min: new Date(Date.parse('Jan 01 1800')),
            max: new Date(Date.parse('Dec 31 1899'))
        });
    });

    it('should convert to string', () => {
        const filter = new DateFilter(mockField);
        const dataAsString = filter.dataToString(filter.currentData);
        expect(filter.dataFromString(dataAsString)).toEqual(filter.currentData);
    });

    it('should set data from a value', () => {
        const filter = new DateFilter(mockField);
        const date = new Date(Date.parse('Jan 01 1850'));
        filter.setToValue(date);
        expect(filter.currentData).toEqual({
            min: date,
            max: date,
        });
    });

    it('should convert to an elasticsearch filter', () => {
        const filter = new DateFilter(mockField);
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
});
