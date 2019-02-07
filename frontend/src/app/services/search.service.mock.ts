import { AggregateQueryFeedback, Corpus, QueryModel } from '../models/index';

export class SearchServiceMock {
    public async aggregateSearch(corpus: Corpus, queryModel: QueryModel, aggregator: string): Promise<AggregateQueryFeedback> {
        return {
            completed: false,
            aggregations: {
                aggregator: [{
                    key: '1999',
                    doc_count: 200
                }, {
                    key: '2000',
                    doc_count: 300
                }, {
                    key: '2001',
                    doc_count: 400
                }]
            }
        };
    }
    public async getRelatedWords(){
        
    }
}
