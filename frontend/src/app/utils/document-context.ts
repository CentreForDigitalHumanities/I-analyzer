import { Params } from '@angular/router';
import { Corpus, FoundDocument, QueryModel } from '../models';
import { PageResultsParameters } from '@models/page-results';
import { omitNullParameters, pageResultsParametersToParams } from './params';

const documentContextQuery = (corpus: Corpus, document: FoundDocument): [QueryModel, PageResultsParameters] => {
    const queryModel = new QueryModel(corpus);

    const spec = corpus.documentContext;

    spec.contextFields.forEach(field => {
        const filter = field.makeSearchFilter();
        filter.setToValue(document.fieldValue(field));
        queryModel.addFilter(filter);
    });

    const resultsParams: PageResultsParameters = {
        sort: [spec.sortField, spec.sortDirection],
        from: 0,
        size: 20
    };

    return [queryModel, resultsParams];
};

export const makeContextParams = (document: FoundDocument, corpus: Corpus): Params => {
    const [queryModel, pageResultsParams] = documentContextQuery(corpus, document);
    const params = {
        ...queryModel.toQueryParams(),
        ...pageResultsParametersToParams(pageResultsParams, corpus),
    };
    return omitNullParameters(params);
};

