import { Corpus, SortBy } from '../models';

export const sortByDefault = (corpus: Corpus): SortBy =>
    corpus.fields.find(field => field.primarySort) || 'relevance';

export const sortDirectionFromBoolean = (sortAscending: boolean): 'asc'|'desc' =>
    sortAscending ? 'asc' : 'desc';
