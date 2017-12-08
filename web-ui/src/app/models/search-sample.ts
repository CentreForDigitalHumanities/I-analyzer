import { NgIterable } from '@angular/core';
import { CorpusField } from './corpus';
import { Hit } from '../services/elastic-search.service';
export type SearchSample = {
    fields: CorpusField[],
    hits: NgIterable<Hit>,
    total: number
}
