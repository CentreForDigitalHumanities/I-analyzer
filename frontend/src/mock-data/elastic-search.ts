import { FoundDocument, SearchResults } from '../app/models';

const mockDocumentResult = {
    id: '0',
    relevance: null,
    fieldValues: {
        content: 'Hello world!'
    }
};

export class ElasticSearchServiceMock {
    /**
     * Clear ES's scroll ID to free ES resources
     */
    public clearScroll() {
    }

    getDocumentById(): Promise<FoundDocument> {
        return Promise.resolve(mockDocumentResult);
    }

    search(): Promise<SearchResults> {
        return Promise.resolve({
            total: {
                relation: 'eq',
                value: 1
            },
            documents: [mockDocumentResult]
        });
    }
}
