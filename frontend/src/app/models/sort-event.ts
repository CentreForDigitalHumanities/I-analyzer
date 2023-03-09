import { CorpusField } from './corpus';

export interface SortEvent {
    ascending: boolean;
    field: CorpusField | undefined;
}

export type SortBy = CorpusField | 'relevance' | 'default';
export type SortDirection = 'asc'|'desc';
