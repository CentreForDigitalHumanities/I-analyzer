import { Corpus, FoundDocument, QueryModel } from '../app/models';
import { EsQuery } from '../app/services';

export class ElasticSearchServiceMock {
    /**
     * Clear ES's scroll ID to free ES resources
     */
    public clearScroll() {
    }

    esQueryToQueryModel(query: EsQuery, corpus: Corpus): QueryModel {
        return {
            queryText: '',
            filters: []
        };
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
