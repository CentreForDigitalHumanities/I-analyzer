import { Injectable } from '@angular/core';

import { saveAs } from 'file-saver';

@Injectable()
export class DownloadService {

    constructor() { }

    /**
     * Downloads the given tabular data as a CSV file.
     * @param filename Filename to present to the user downloading the file.
     * @param values The rows and cells containing the data to download.
     * @param header The column names to place at the beginning of the file.
     * @param separator Cell separator to use.
     */
    public downloadCsv(filename: string, values: string[][], header: string[], separator = ','): void {
        const newline = '\n';

        let headerRow = header.map(value => this.csvCell(value, separator)).join(separator) + newline;
        let rows: string[] = [headerRow];

        for (let row of values) {
            rows.push(row.map(cell => this.csvCell(cell, separator)).join(',') + newline);
        }

        saveAs(new Blob(rows, { type: "text/csv;charset=utf-8" }), filename);
    }

    private csvCell(value: string, separator: string) {
        // escape "
        let escaped = value.indexOf('"') >= 0 ? `"${value.replace('"', '""')}"` : value;

        // values containing the separator, should be surrounded with "
        return escaped.indexOf(separator) >= 0 ? `"${escaped}"` : escaped;
    }
}
