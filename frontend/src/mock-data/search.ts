import { PageResultsParameters } from '../app/models/page-results';
import { SearchFilter } from '../app/models/field-filter';
import { AggregateQueryFeedback, Corpus, CorpusField, FoundDocument, QueryModel, SearchResults } from '../app/models/index';
import { mockCorpus } from './corpus';
import { TagServiceMock } from './tag';
import { TagService } from '../app/services/tag.service';
import { Aggregator } from '../app/models/aggregation';

export class SearchServiceMock {
    public async aggregateSearch(corpus: Corpus, queryModel: QueryModel, aggregators: Aggregator[]): Promise<AggregateQueryFeedback> {
        const name = aggregators[0].name;
        return {
            completed: false,
            aggregations: {
                [name]: [{
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
        queryText: string = '', fields: CorpusField[] | null = null, filters: SearchFilter[] = []): QueryModel {
        const model = new QueryModel(corpus);
        model.setParams({
            queryText,
            searchFields: fields
        });
        filters.forEach(model.addFilter);

        return model;
    }

    loadResults(queryModel: QueryModel, resultsParams: PageResultsParameters): Promise<SearchResults> {
        const doc = new FoundDocument(
            new TagServiceMock() as unknown as TagService,
            mockCorpus,
            {
                _id: 'test_1',
                _score: 1.0,
                _source: {
                    great_field: 'test',
                    speech: 'This is a document!'
                },
            },
            1.0
        );
        return Promise.resolve({
            documents: [doc],
            total: { value: 1, relation: 'eq' }
        });
    }
}
