import { Injectable } from '@angular/core';

import { saveAs } from 'file-saver';
import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';
import { Corpus, CorpusField, QueryModel } from '../models/index';

@Injectable()
export class DownloadService {

    constructor(
        private apiService: ApiService,
        private elasticSearchService: ElasticSearchService
    ) {

    }

    /**
     * download csv directly via api service.
     */
    public async download(corpus: Corpus, queryModel: QueryModel, fields: CorpusField[], requestedResults: number): Promise<string | void> {
        let esQuery = this.elasticSearchService.makeEsQuery(queryModel); //to create elastic search query
        return this.apiService.download({'corpus': corpus.name, 'es_query': esQuery, 'fields': fields.map( field => field.name ), 'size': requestedResults }).then( result => {
            if (result.status === 200) {
                let filename = result.headers.filename;
                saveAs(result.body, filename);
                return("success");
            }  
        }).catch( error => {
            throw new Error(error.headers.message[0]);          
        });
    }

    public async downloadTask(corpus: Corpus, queryModel: QueryModel, fields: CorpusField[]){
    /**
     * Downloads the given tabular data as a CSV file on the backend.
     * Link to CSV is sent to user per email
     * @param corpus Corpus to be queried for constructing the file.
     * @param queryModel QueryModel for which download is requested. 
     * @param fields The fields to appear as columns in the csv.
     */
    let esQuery = this.elasticSearchService.makeEsQuery(queryModel); //to create elastic search query
    return this.apiService.downloadTask({'corpus': corpus.name, 'es_query': esQuery, 'fields': fields.map( field => field.name ) }).then( result => {
        return result;
    }).catch( error => {
        throw new Error(error.headers.message[0]);
    })
    }
    
}
