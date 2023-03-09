import { ParamMap } from '@angular/router';
import { Corpus, CorpusField, SortBy, SortDirection } from '../models';
import * as _ from 'lodash';

/** omit keys that mapp to null */
export const omitNullParameters = (params: {[key: string]: any}): {[key: string]: any} => {
    const nullKeys = _.keys(params).filter(key => params[key] === null);
    return _.omit(params, nullKeys);
};

export const queryFromParams = (params: ParamMap): string =>
    params.get('query');

export const searchFieldsFromParams = (params: ParamMap, corpus: Corpus): CorpusField[] => {
    if (params.has('fields')) {
        const fieldNames = params.get('fields').split(',');
        return corpus.fields.filter(field => fieldNames.includes(field.name));
    }
};

export const highlightFromParams = (params: ParamMap): number =>
    Number(params.get('highlight'));

// sort

export const sortSettingsToParams = (sortBy: SortBy, direction: SortDirection): {sort?: string} => {
    let sortByName: string;
    if (sortBy === 'default') {
        return {};
    } else if (sortBy === 'relevance') {
        sortByName = sortBy;
    } else {
        sortByName = sortBy.name;
    }
    return { sort: `${sortByName},${direction}` };
};

export const sortSettingsFromParams = (params: ParamMap, corpusFields: CorpusField[]): [SortBy, SortDirection] => {
    let sortBy: SortBy;
    let sortAscending = true;
    if (params.has('sort')) {
        const [sortParam, ascParam] = params.get('sort').split(',');
        sortAscending = ascParam === 'asc';
        if ( sortParam === 'relevance' ) {
            return [sortParam, sortAscending ? 'asc' : 'desc'];
        }
        sortBy = corpusFields.find(field => field.name === sortParam);
    } else {
        sortBy = 'default';
    }
    return [
        sortBy,
        sortAscending ? 'asc' : 'desc'
    ];
};

