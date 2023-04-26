import { BehaviorSubject } from 'rxjs';
import { findByName } from '../app/utils/utils';
import { BooleanFilterData, Corpus, CorpusField, SearchFilter } from '../app/models';

const mockFilterData: BooleanFilterData = {
    checked: false,
    filterType: 'BooleanFilter',
};

export const mockFilter: SearchFilter<BooleanFilterData> = {
    fieldName: 'great_field',
    description: 'Use this filter to decide whether or not this field is great',
    currentData: mockFilterData,
    defaultData: mockFilterData,
    useAsFilter: true,
};

export const mockField: CorpusField = {
    name: 'great_field',
    description: 'A really wonderful field',
    displayName: 'Greatest field',
    displayType: 'keyword',
    mappingType: 'keyword',
    hidden: false,
    sortable: false,
    primarySort: false,
    searchable: false,
    downloadable: false,
    searchFilter: mockFilter
};

export const mockField2: CorpusField = {
    name: 'speech',
    description: 'A content field',
    displayName: 'Speechiness',
    displayType: 'text',
    mappingType: 'text',
    hidden: false,
    sortable: false,
    primarySort: false,
    searchable: true,
    downloadable: true,
    searchFilter: null
};

export const mockField3: CorpusField = {
    name: 'ordering',
    description: 'A field which can be sorted on',
    displayName: 'Sort me',
    displayType: 'integer',
    mappingType: 'keyword',
    hidden: false,
    sortable: true,
    primarySort: false,
    searchable: false,
    downloadable: true,
    searchFilter: null
};

export const mockCorpus: Corpus = {
    name: 'test1',
    serverName: 'default',
    index: 'test1',
    title: 'Test corpus',
    description: 'This corpus is for mocking',
    minDate: new Date(),
    maxDate: new Date(),
    image: 'test.jpg',
    scan_image_type: 'pdf',
    allow_image_download: false,
    word_models_present: false,
    fields: [mockField],
    languages: ['English'],
    category: 'Tests'
};

export const mockCorpus2: Corpus = {
    name: 'test2',
    serverName: 'default',
    index: 'test2',
    title: 'Test corpus 2',
    description: 'This corpus is for mocking',
    minDate: new Date(),
    maxDate: new Date(),
    image: 'test.jpg',
    scan_image_type: 'pdf',
    allow_image_download: false,
    word_models_present: false,
    fields: [mockField2],
    languages: ['English'],
    category: 'Tests'
};

export class CorpusServiceMock {
    private currentCorpusSubject = new BehaviorSubject<Corpus>(mockCorpus);
    public currentCorpus = this.currentCorpusSubject.asObservable();

    public get(refresh=false): Promise<Corpus[]> {
        return Promise.resolve([mockCorpus, mockCorpus2]);
    }

    public set(corpusName='test1'): Promise<boolean> {
        return this.get().then(all => {
            const corpus = findByName(all, corpusName);
            if (!corpus) {
                return false;
            } else {
                this.currentCorpusSubject.next(corpus);
                return true;
            }
        });
    }

}
