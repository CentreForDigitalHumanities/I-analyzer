import { Injectable } from '@angular/core';

import { saveAs } from 'file-saver';

//geimporeerd
//import { Corpus, CorpusField, Query, QueryModel, SearchFilterData, searchFilterDataToParam, SearchResults, AggregateResult, AggregateQueryFeedback } from '../models/index';
//import { UserService } from './user.service';


@Injectable()
export class DownloadService {

    constructor(
        //private queryService: QueryService,
        //private userService: UserService,

    ) { 

    }

    /**
     * Downloads the given tabular data as a CSV file.
     * @param filename Filename to present to the user downloading the file.
     * @param values The rows and cells containing the data to download.
     * @param header The column names to place at the beginning of the file.
     * @param separator Cell separator to use.
     */

    // public async downloadCsv(queryModel: QueryModel, corpus: Corpus){
    //     let user = await this.userService.getCurrentUser();
    //     let query = new Query(queryModel, corpus.name, user.id);
    //     console.log(query)
    // }


    //even hernoemd
    public downloadCsv(filename: string, values: string[][], header: string[], separator = ','): void {
        const newline = '\n';

        let headerRow = header.map(value => this.csvCell(value, separator)).join(separator) + newline;
        let rows: string[] = [headerRow];

        for (let row of values) {
            rows.push(row.map(cell => this.csvCell(cell, separator)).join(separator) + newline);
        }

        saveAs(new Blob(rows, { type: "text/csv;charset=utf-8" }), filename);
    }

    public csvCell(value: string, separator: string) {
        // escape "
        let escaped = value.indexOf('"') >= 0 ? `${value.replace(/"/g, '""')}` : value;

        // values containing the separator, " or newlines should be surrounded with "
        return new RegExp(`["\n${separator}]`).test(escaped) ? `"${escaped}"` : escaped;
    }
}
