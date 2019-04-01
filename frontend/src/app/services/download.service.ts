import { Injectable } from '@angular/core';

import { saveAs } from 'file-saver';
import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';
import { LogService } from './log.service';
import { Corpus, CorpusField, QueryModel } from '../models/index';

@Injectable()
export class DownloadService {

    constructor(
        private apiService: ApiService,
        private elasticSearchService: ElasticSearchService,
        private logService: LogService
    ) {

    }

    /**
     * download csv via api service. In backend csv is saved, link sent to user per email
     */
    public async download(corpus: Corpus, queryModel: QueryModel, fields: CorpusField[], requestedResults: number): Promise<boolean> {
        let esQuery = this.elasticSearchService.makeEsQuery(queryModel); //to create elastic search query
        let result = await this.apiService.download({'corpus': corpus.name, 'es_query': esQuery, 'fields': fields.map( field => field.name ), 'size': requestedResults });
        if (result.success!==undefined) {
            return result.success;
        }
        else {
            let filename = result.headers.filename;
            saveAs(result.body, filename);
            return true;
        }
    }

    public async downloadTask(corpus: Corpus, queryModel: QueryModel, fields: CorpusField[]){
    /**
     * Downloads the given tabular data as a CSV file.
     * @param filename Filename to present to the user downloading the file.
     * @param values The rows and cells containing the data to download.
     * @param header The column names to place at the beginning of the file.
     * @param separator Cell separator to use.
     */

    }
    
}
