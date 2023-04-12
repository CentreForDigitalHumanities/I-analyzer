import { AggregateQueryFeedback, Corpus, CorpusField, QueryModel, SearchFilter, SearchFilterData } from '../app/models/index';

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
    public async getRelatedWords() {}

    createQueryModel(
        queryText: string = '', fields: string[] | null = null, filters: SearchFilter<SearchFilterData>[] = [],
        sortField: CorpusField = null, sortAscending = false, highlight: number = null
    ): QueryModel {
        const model: QueryModel = {
            queryText,
            filters,
            sortBy: sortField ? sortField.name : undefined,
            sortAscending
        };
        if (fields) {
            model.fields = fields;
        }
        if (highlight) {
            model.highlight = highlight;
        }
        return model;
    }
}
