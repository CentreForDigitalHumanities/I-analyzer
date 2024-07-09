import { CorpusField } from './corpus';

export type SortBy = CorpusField | undefined;
export type SortDirection = 'asc'|'desc';

export type SortState = [SortBy, SortDirection];
