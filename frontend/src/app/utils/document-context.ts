import { Corpus, FoundDocument, QueryModel } from '../models';

const documentContextQuery = (corpus: Corpus, document: FoundDocument): QueryModel => {
    const queryModel = new QueryModel(corpus);

    const spec = corpus.documentContext;

    spec.contextFields.forEach(field => {
        const filter = field.makeSearchFilter();
        filter.setToValue(document.fieldValues[field.name]);
        queryModel.addFilter(filter);
    });

    queryModel.sortBy = spec.sortField || 'default';
    queryModel.sortDirection = spec.sortDirection;

    return queryModel;
};

export const makeContextParams = (document: FoundDocument, corpus: Corpus): any => {
    const queryModel = documentContextQuery(corpus, document);
    return queryModel.toQueryParams();
};

