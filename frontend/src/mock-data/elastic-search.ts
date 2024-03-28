import { FoundDocument, NamedEntitiesResult, SearchResults } from '../app/models';
import { makeDocument } from './constructor-helpers';

export class ElasticSearchServiceMock {
    /**
     * Clear ES's scroll ID to free ES resources
     */
    public clearScroll() {
    }

    getDocumentById(): Promise<FoundDocument> {
        return Promise.resolve(makeDocument({content: 'Hello world!'}));
    }

    loadResults(): Promise<SearchResults> {
        return Promise.resolve({
            total: {
                relation: 'eq',
                value: 1
            },
            documents: [makeDocument({content: 'Hello world!'})]
        });
    }

}
