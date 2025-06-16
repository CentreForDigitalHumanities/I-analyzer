import { Injectable } from '@angular/core';

import { saveAs } from 'file-saver';
import { ApiService } from './api.service';
import {
    Corpus,
    CorpusField,
    DownloadOptions,
    LimitedResultsDownloadParameters,
    QueryModel,
    SortState,
} from '@models/index';
import * as _ from 'lodash';
import { resultsParamsToAPIQuery } from '@utils/es-query';
import { PageResultsParameters } from '@models/page-results';

@Injectable()
export class DownloadService {
    constructor(
        private apiService: ApiService,
    ) {}

    /**
     * download csv directly via api service.
     */
    public async download(
        corpus: Corpus,
        queryModel: QueryModel,
        fieldNames: string[],
        requestedResults: number,
        route: string,
        sort: SortState,
        highlightFragmentSize: number|undefined,
        fileOptions: DownloadOptions
    ): Promise<string | void> {
        const resultsParameters: PageResultsParameters = {
            sort,
            highlight: highlightFragmentSize,
            from: 0,
            size: requestedResults,
        };
        const query = resultsParamsToAPIQuery(queryModel, resultsParameters);

        const parameters: LimitedResultsDownloadParameters = _.merge(
            {
                ...query,
                corpus: corpus.name,
                fields: fieldNames,
                route,
            },
            fileOptions
        );
        return this.apiService
            .download(parameters)
            .then((result) => {
                if (result.status === 200) {
                    const filename = this.getFileNameFromHttpResponse(result);
                    saveAs(result.body, filename);
                    return 'success';
                }
            })
            .catch((error) => {
                if (error.status === 429) {
                    throw new Error(
                        'Too many requests. Please try again later.'
                    );
                } else {
                    throw new Error(error.headers.message[0]);
                }

            });
    }

    /**
     * Downloads the given tabular data as a CSV file on the backend.
     * Link to CSV is sent to user per email
     *
     * @param corpus Corpus to be queried for constructing the file.
     * @param queryModel QueryModel for which download is requested.
     * @param fields The fields to appear as columns in the csv.
     */
    public async downloadTask(
        corpus: Corpus,
        queryModel: QueryModel,
        fields: string[],
        route: string,
        sort: SortState,
        highlightFragmentSize: number
    ) {
        const query = queryModel.toAPIQuery();
        return this.apiService.downloadTask({ corpus: corpus.name, ...query, fields, route })
            .then(result => result)
            .catch(error => {
                throw new Error(error.headers.message[0]);
            });
    }

    public retrieveFinishedDownload(id: number, options: DownloadOptions) {
        const parameters = _.merge({ id }, options);
        return this.apiService.csv(parameters);
    }

    private getFileNameFromHttpResponse = (httpResponse) => {
        const contentDispositionHeader = httpResponse.headers.get(
            'Content-Disposition'
        );
        const result = contentDispositionHeader
            .split(';')[1]
            .trim()
            .split('=')[1];
        return result.replace(/"/g, '');
    };
}
