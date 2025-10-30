import { CorpusField, QueryModel } from '@models';

/** Whether the query contains a prefix term
 *
 * The term frequency graph requires more resources for prefix terms so these should use
 * a smaller sample size. This implementation is oversimplified and will create false
 * positives, mostly when `*` is used in invalid positions. However, it's not a major
 * issue if the sample size is lower than it could be.
 */
export const hasPrefixTerm = (queryText: string): boolean =>
    /\*/.test(queryText);


export const mainContentFields = (query: QueryModel): CorpusField[] =>
    query.corpus.fields.filter(
        (field) => field.searchable && field.displayType === 'text_content'
    );
