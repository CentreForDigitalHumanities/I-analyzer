import { BehaviorSubject } from 'rxjs';
import { BooleanFilterData, Corpus, CorpusField, SearchFilter } from '../app/models';

const mockFilterData: BooleanFilterData = {
    checked: false,
    filterType: 'BooleanFilter',
};

const mockFilter: SearchFilter<BooleanFilterData> = {
    fieldName: 'great_field',
    description: 'Use this filter to decide whether or not this field is great',
    currentData: mockFilterData,
    defaultData: mockFilterData,
    useAsFilter: true,
};

const mockField: CorpusField = {
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

export const mockCorpus: Corpus = {
    name: 'test1',
    serverName: 'default',
    index: 'test1',
    doctype: 'article',
    title: 'Test corpus',
    description: 'This corpus is for mocking',
    minDate: new Date(),
    maxDate: new Date(),
    image: 'test.jpg',
    scan_image_type: 'pdf',
    allow_image_download: false,
    word_models_present: false,
    fields: [mockField]
};

export class CorpusServiceMock {
    private currentCorpusSubject = new BehaviorSubject<Corpus>(mockCorpus);
    public currentCorpus = this.currentCorpusSubject.asObservable();

    public get(refresh=false): Promise<Corpus[]> {
        return Promise.resolve([mockCorpus]);
    }

    public set(corpusName: 'test1'): Promise<boolean> {
        return Promise.resolve(true);
    }
}
