import { Corpus, CorpusField, SortBy } from '../models';

/** get the default sortBy for a corpus */
export const sortByDefault = (corpus: Corpus): CorpusField|'relevance' =>
    corpus.fields.find(field => field.primarySort) || 'relevance';

export const sortDirectionFromBoolean = (sortAscending: boolean): 'asc'|'desc' =>
    sortAscending ? 'asc' : 'desc';
