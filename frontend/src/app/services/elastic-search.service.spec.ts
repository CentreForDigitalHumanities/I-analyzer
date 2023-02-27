import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ElasticSearchService } from './elastic-search.service';
import { Corpus, DateFilterData, QueryModel, SearchFilter } from '../models';


const dateFilter: SearchFilter<DateFilterData> = {
    fieldName: 'date',
    description: '',
    useAsFilter: true,
    defaultData: {
        filterType: 'DateFilter',
        min: '1099-01-01',
        max: '1300-12-31'
    },
    currentData: {
        filterType: 'DateFilter',
        min: '1111-01-01',
        max: '1299-12-31'
    }
};

const mockCorpus: Corpus = {
    serverName: '',
    name: 'mock-corpus',
    title: 'Mock Corpus',
    description: '',
    index: 'mock-corpus',
    minDate: new Date('1800-01-01'),
    maxDate: new Date('1900-01-01'),
    image: 'image.jpeg',
    scan_image_type: undefined,
    allow_image_download: true,
    word_models_present: false,
    fields: [
        {
            name: 'content',
            displayName: 'Content',
            description: '',
            displayType: 'text_content',
            hidden: false,
            sortable: false,
            primarySort: false,
            searchable: true,
            downloadable: true,
            searchFilter: undefined,
            mappingType: 'text',
        },
        {
            name: 'date',
            displayName: 'Date',
            description: '',
            displayType: 'date',
            hidden: false,
            sortable: true,
            primarySort: false,
            searchable: false,
            downloadable: true,
            searchFilter: dateFilter,
            mappingType: 'date'
        }
    ],
};

describe('ElasticSearchService', () => {
    let service: ElasticSearchService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ElasticSearchService,
            ],
            imports: [ HttpClientTestingModule ]
        });
        service = TestBed.inject(ElasticSearchService);
    });

    it('should be created',() => {
        expect(service).toBeTruthy();
    });

    it('should convert between EsQuery and QueryModel types', () => {

        const querymodels: QueryModel[] = [
            {
                queryText: 'test'
            },
            {
                queryText: 'test',
                filters: [ dateFilter ]
            }
        ];

        querymodels.forEach(queryModel => {
            const esQuery = service.makeEsQuery(queryModel);
            const restoredQueryModel = service.esQueryToQueryModel(esQuery, mockCorpus);
            expect(restoredQueryModel).toEqual(queryModel);
        });
    });
});
