import { SearchFilter } from '../app/models/search-filter';
import { AggregateQueryFeedback, Corpus, CorpusField, QueryModel } from '../app/models/index';

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
        corpus: Corpus,
        queryText: string = '', fields: CorpusField[] | null = null, filters: SearchFilter[] = [],
        sortField: CorpusField = null, sortAscending = false, highlight: number = null
    ): QueryModel {
        const model = new QueryModel(corpus);
        model.setQueryText(queryText);
        model.searchFields = fields;
        filters.forEach(model.addFilter);

        if (sortField) {
            model.sortBy = sortField;
            model.sortDirection = sortAscending ? 'asc' : 'desc';
        }

        model.highlightSize = highlight;

        return model;
    }
}
