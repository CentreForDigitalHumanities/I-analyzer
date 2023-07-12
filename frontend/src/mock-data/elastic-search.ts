import { FoundDocument } from '../app/models';
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
}
