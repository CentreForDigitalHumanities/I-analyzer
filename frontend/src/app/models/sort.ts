import {Params } from '@angular/router';
import { Corpus, CorpusField } from './corpus';
import * as _ from 'lodash';
import { findByName } from '../utils/utils';

export type SortBy = CorpusField | undefined;
export type SortDirection = 'asc'|'desc';

export type SortState = [SortBy, SortDirection];

export const sortStateFromParams = (corpus: Corpus, params?: Params): SortState => {
    if (params && 'sort' in params) {
        const [sortParam, ascParam] = params['sort'].split(',');

        let sortBy: SortBy;

        if ( sortParam === 'relevance' ) {
            sortBy = undefined;
        } else {
            sortBy = findByName(corpus.fields, sortParam);
        }

        const sortDirection: SortDirection = ascParam;

        return [sortBy, sortDirection];
    } else {
        return [undefined, 'desc'];
    }
};
