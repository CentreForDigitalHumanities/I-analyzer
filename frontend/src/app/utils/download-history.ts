import { Corpus, Download, QueryModel } from '../models';
import { APIQuery } from '../models/search-requests';
import { apiQueryToQueryModel } from './es-query';
import * as _ from 'lodash';

export const downloadQueryModel = (download: Download, corpus: Corpus): QueryModel =>
    _.first(downloadQueryModels(download, corpus));

export const downloadQueryModels = (download: Download, corpus: Corpus): QueryModel[] => {
    const queries = (_.isArray(download.parameters) ? download.parameters : [download.parameters]) as APIQuery[];
    return queries.map(query => apiQueryToQueryModel(query, corpus));
};
