import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';
import { Corpus, SearchFilterData, SearchSample } from '../models/index';


@Injectable()
export class SearchService {
    private results = new Subject<Array<Hit>>();

    // Observable string streams
    results$ = this.results.asObservable();

    constructor(private apiService: ApiService, private elasticSearchService: ElasticSearchService) { }

    public async search(corpus: Corpus, query: string = '', fields: string[] = [], filters: SearchFilterData[] = []): Promise<SearchSample> {
        let result = await this.elasticSearchService.search(corpus, query, fields, filters);

        let records = result.table;
        // let fields = result.fieldNames;
        let hits = records.map((record) => {
            let hit: Hit = {};
            for (let i = 0; i < fields.length; i++) {
                hit[fields[i]] = record[i];
            }
            return hit;
        });

        return <SearchSample>{
            total: result.total,
            fields,
            hits
        };
    }

    public async searchAsCsv(corpus: Corpus, query: string = '', fields: string[] = [], filters: SearchFilterData[] = []): Promise<boolean> {
        // TODO: maybe this should a specific log structure?
        let queryModel = this.elasticSearchService.makeQuery(query, filters);

        /**
         * Wrap an iterator such that its completion or abortion get logged to the database.
         * @param rows
         */
        let loggedIterator = function* (rows: IterableIterator<string[]>) {
            let totalTransferred = 0;
            try {
                for (let row in rows) {
                    totalTransferred++;
                    yield row;
                }
                // TODO: this depends on proper date/time settings on the client
                queryModel.completed = new Date();
            } catch (error) {
                queryModel.aborted = true;
                console.error(error);
            }
            queryModel.transferred = totalTransferred;
        }

        // Perform the search and obtain output stream
        // Log the query to the database
        // q = models.Query(query=str(query),
        //                  corpus_name=corpus_name, user=current_user)
        // models.db.session.add(q)
        // models.db.session.commit()
        // TODO: logging.info('Requested CSV for query: {}'.format(query))
        // TODO: wrap this in an object to represent the current state
        let rows = await new Promise<string[]>((resolve, reject) => {
            let rows: string[] = [];
            this.elasticSearchService.executeIterate(corpus, queryModel, 10000 /* TODO: current_user.download_limit */).map(
                document => this.elasticSearchService.documentRow(document, fields))
                .subscribe(
                row => {
                    rows.push(row.join(','));
                },
                (error) => reject(error),
                () => resolve(rows));
        });

        // TODO: actually show this file
        new Blob(rows, {});
        return true;
    }

    public searchForVisualization(corpusName: string, query: string = '', fields: string[] = [], filters: SearchFilterData[] = []): Promise<boolean> {
        // search n results for visualization
        let n = 10000;
        return this.apiService.search()
            .then(result => {
                let table = result.table;
                let records = table;
                let fields: string[] = records[0];
                let hits: Hit[] = [];
                for (let i = 1; i < records.length; i++) {
                    let hit: Hit = {};
                    for (let j = 0; j < fields.length; j++) {
                        hit[fields[j]] = records[i][j];
                    }
                    hits.push(hit);

                }

                this.results.next(hits);

                return true;
            });
    }

    private mapIterator = function*<T, TOut>(iterator: IterableIterator<T>, mapper: (value: T) => TOut) {
        while (true) {
            let result = iterator.next();
            if (result.done) {
                break;
            }
            yield mapper(result.value);
        }
    }
}

type Hit = { [fieldName: string]: string };
