import { Corpus, FoundDocument, QueryModel } from '../app/models';
import { EsQuery } from '../app/services';

export class ElasticSearchServiceMock {
    /**
     * Clear ES's scroll ID to free ES resources
     */
    public clearScroll() {
    }

    getDocumentById(): Promise<FoundDocument> {
        return Promise.resolve({
            id: '0',
            relevance: null,
            fieldValues: {
                content: 'Hello world!'
            }
        });
    }
}
