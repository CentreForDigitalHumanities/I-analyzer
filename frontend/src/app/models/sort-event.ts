import { CorpusField } from './corpus';

export interface SortEvent {
    ascending: boolean;
    field: CorpusField | undefined
}
