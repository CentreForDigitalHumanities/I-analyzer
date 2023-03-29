import { ParamMap } from '@angular/router';
import { CorpusField } from '../models';
import { findByName } from './utils';

export const queryFromParams = (params: ParamMap): string =>
    params.get('query');

export const searchFieldsFromParams = (params: ParamMap): string[] | null => {
    if (params.has('fields')) {
        const selectedSearchFields = params.get('fields').split(',');
        return selectedSearchFields;
    }
};

export const highlightFromParams = (params: ParamMap): number =>
    Number(params.get('highlight'));

// sort

export const sortSettingsToParams = (sortBy: CorpusField, direction: string): {sort: string} => {
    const fieldName = sortBy !== undefined ? sortBy.name : 'relevance';
    return {sort:`${fieldName},${direction}`};
};

export const sortSettingsFromParams = (params: ParamMap, corpusFields: CorpusField[]): {field: CorpusField; ascending: boolean} => {
    let sortField: CorpusField;
    let sortAscending = true;
    if (params.has('sort')) {
        const [sortParam, ascParam] = params.get('sort').split(',');
        sortAscending = ascParam === 'asc';
        if ( sortParam === 'relevance' ) {
            return {
                field: undefined,
                ascending: sortAscending
            };
        }
        sortField = findByName(corpusFields, sortParam);
    } else {
        sortField = corpusFields.find(field => field.primarySort);
    }
    return {
        field: sortField,
        ascending: sortAscending
    };
};

