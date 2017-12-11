import { NgIterable } from '@angular/core';
import { CorpusField } from './corpus';
import { Hit } from '../services/elastic-search.service';
export type SearchResults = {
    fields: CorpusField[],
    hits: NgIterable<Hit>,
    total: number
}
