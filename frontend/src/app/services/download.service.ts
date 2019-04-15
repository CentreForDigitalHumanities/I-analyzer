import { Injectable } from '@angular/core';

import { saveAs } from 'file-saver';
import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';
import { LogService } from './log.service';
import { Corpus, CorpusField, QueryModel } from '../models/index';
import { reject } from 'q';

@Injectable()
export class DownloadService {

    constructor(
        private apiService: ApiService,
        private elasticSearchService: ElasticSearchService
    ) {

    }

    /**
     * download csv via api service. In backend csv is saved, link sent to user per email
     */
    public async download(corpus: Corpus, queryModel: QueryModel, fields: CorpusField[], requestedResults: number): Promise<string | void> {
        let esQuery = this.elasticSearchService.makeEsQuery(queryModel); //to create elastic search query
        this.apiService.download({'corpus': corpus.name, 'es_query': esQuery, 'fields': fields.map( field => field.name ), 'size': requestedResults }).then( result => {
            let filename = result.headers.filename;
            saveAs(result.body, filename);
        }).catch( error => {
            return reject(error.headers.message[0]);
        })
    }

    public async downloadTask(corpus: Corpus, queryModel: QueryModel, fields: CorpusField[]){
    /**
     * Downloads the given tabular data as a CSV file on the backend.
     * @param corpus Corpus to be queried for constructing the file.
     * @param queryModel QueryModel for which download is requested. 
     * @param fields The fields to appear as columns in the csv.
     */
    let esQuery = this.elasticSearchService.makeEsQuery(queryModel); //to create elastic search query
    let result = await this.apiService.downloadTask({'corpus': corpus.name, 'es_query': esQuery, 'fields': fields.map( field => field.name ) });
    return result    

    }
    
}
