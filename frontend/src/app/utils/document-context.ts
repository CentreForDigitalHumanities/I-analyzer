import { contextFilterFromField, Corpus, FoundDocument } from '../models';
import { omitNullParameters, searchFiltersToParams, sortSettingsToParams } from './params';

export const makeContextParams = (document: FoundDocument, corpus: Corpus): any => {
    const contextSpec = corpus.documentContext;

    const queryText = null;

    const contextFields = contextSpec.contextFields;

    contextFields.forEach(field => {
        field.searchFilter = contextFilterFromField(field, document.fieldValues[field.name]);
    });

    const filterParams = searchFiltersToParams(contextFields);
    const sortParams = sortSettingsToParams(
        contextSpec.sortField,
        contextSpec.sortDirection
    );

    const params = { query: queryText,  ...filterParams, ...sortParams };
    return omitNullParameters(params);
};
