import { Input, Component, OnChanges, OnDestroy, ViewEncapsulation, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';
import { saveAs } from 'file-saver';
import { freqTableHeader, freqTableHeaders } from '../models';

@Component({
    selector: 'ia-freqtable',
    templateUrl: './freqtable.component.html',
    styleUrls: ['./freqtable.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FreqtableComponent implements OnChanges {
    @Input() headers: freqTableHeaders;
    @Input() data: any[];
    @Input() name: string; // name for CSV file
    @Input() defaultSort: string; // default field for sorting
    @Input() requiredColumn: string; // field required to include row in web view

    public defaultSortOrder = '-1';

    formattedHeaders: freqTableHeaders;
    formattedData: any[];

    wideFormatColumn: number;
    format: 'long'|'wide' = 'long';

    fullTableToggle: boolean = false;
    disableFullTable: boolean = false;


    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        this.checkWideFormat();
        this.checkFullTable();

        this.formatData();
    }

    checkWideFormat(): void {
        /** Checks whether wide format is available (i.e. whether there are
         * several queries) and assigns wideFormatColumn */

        if (this.headers && this.headers.find(header => header.isMainFactor)) {
            this.wideFormatColumn = _.range(this.headers.length)
                .find(index => this.headers[index].isMainFactor);
        } else {
            this.wideFormatColumn = undefined;
        }
    }

    checkFullTable(): void {
        /** Checks if there are several queries or if the Number of Results visualization
         * is selected. If so, it disables the full table switch.
         */
        if (this.headers && (this.headers.find(header => header.isMainFactor) ||
        this.headers.find(header => header.key == 'doc_count' && !header.isOptional))) {
            this.disableFullTable = true;
        } else {
            this.disableFullTable = false;
        }
    }

    setFormat(format: 'long'|'wide'): void {
        this.format = format;
        this.formatData();
    }

    toggleFullTable() {
        this.fullTableToggle = !this.fullTableToggle;
        this.formatData();
    }

    formatData() {
        /** Formats the data in default (long) format, wide format, or fulltable format */

        let filteredData: any[];
        if (this.requiredColumn && this.data) {
            filteredData = this.data.filter(row => row[this.requiredColumn]);
        } else {
            filteredData = this.data;
        }

        if (this.format === 'wide') {
            const [headers, data] = this.transformWideFormat(filteredData);
            this.formattedHeaders = headers;
            this.formattedData = data;
        } else if (this.fullTableToggle === true || this.headers == undefined) {  // also checks if no data is present to avoid error
            this.formattedHeaders = this.headers;
            this.formattedData = filteredData;
        } else {
            this.formattedHeaders = this.headers.filter(header => !header.isOptional);
            this.formattedData = filteredData;
        }
    }

    transformWideFormat(data: any[]): [freqTableHeaders, any[]] {
        /** changes the table to present different queries either alongside one another (wide)
        or one underneath the other (long) */

        const mainFactor = this.headers[this.wideFormatColumn];

        const mainFactorValues = _.uniqBy(
            data.map(row => row[mainFactor.key]),
            value => this.formatValue(value, mainFactor)
        );

        const newHeaders = this.wideFormatHeaders(mainFactor, mainFactorValues);

        // other factors
        const factorColumns = this.filterFactors(newHeaders);

        const newData = _.uniqBy(
            data,
            row => {
                const factorValues = factorColumns.map(column => this.getValue(row, column));
                return _.join(factorValues, '/');
            }
        );

        mainFactorValues.forEach(factorValue => {
            const filteredData = data.filter(row => this.getValue(row, mainFactor) === this.formatValue(factorValue, mainFactor));

            newData.forEach(newRow => {
                this.headers.forEach(header => {
                    if (! header.isSecondaryFactor) {
                        const key = this.wideFormatColumnKey(header, mainFactor, factorValue);

                        const rowData = filteredData.find(row =>
                            _.every(
                                factorColumns,
                                factor => this.getValue(row, factor) === this.getValue(newRow, factor)
                            )
                        );

                        if (rowData !== undefined) {
                            const value = rowData[header.key];
                            newRow[key] = value;
                        }
                    }
                });
            });
        });

        return [newHeaders, newData];
    }

    wideFormatHeaders(mainFactor: freqTableHeader, factorValues: any[]) {
        const newLabel = (header: freqTableHeader, factor: freqTableHeader, factorValue) =>
            `${header.label} (${this.formatValue(factorValue, factor)})`;

        const otherHeaders = this.headers.filter((header, index) => header.key !== mainFactor.key);
        const newHeaders: freqTableHeaders = _.flatMap(otherHeaders, header => {
            if (header.isSecondaryFactor) {
                // other factors are kept as-is
                return [header];
            } else {
                // for non-factor headers, make one column for each value of `mainFactor`
                return _.map(factorValues, value => (
                    {
                        label: newLabel(header, mainFactor, value),
                        key: this.wideFormatColumnKey(header, mainFactor, value),
                        format: header.format,
                        formatDownload: header.formatDownload,
                    } as freqTableHeader
                ));
            }
        });

        return newHeaders;
    }

    wideFormatColumnKey(header: freqTableHeader, mainFactor: freqTableHeader, mainFactorValue): string {
        return `${header.key}###${this.formatValue(mainFactorValue, mainFactor)}`;
    }

    filterFactors(headers: freqTableHeaders): freqTableHeaders {
        return headers.filter(header => header.isSecondaryFactor);
    }

    parseTableData(): string[] {
        const data = this.formattedData.map(row => {
            const values = this.formattedHeaders.map(col => this.getValue(row, col, true));
            return  `${_.join(values, ',')}\n`;
        });
        data.unshift(`${_.join(this.formattedHeaders.map(col => col.label), ',')}\n`);
        return data;
    }

    getValue(row, column: freqTableHeader, download = false) {
        return this.formatValue(row[column.key], column, download);
    }

    formatValue(value, column: freqTableHeader, download = false) {
        if (download && column.formatDownload) {
            return column.formatDownload(value);
        }
        if (column.format) {
            return column.format(value);
        }
        return value;
    }

    downloadTable() {
        const data = this.parseTableData();
        const blob = new Blob(data, { type: `text/csv;charset=utf-8`, endings: 'native' });
        const filename = this.name + '.csv';
        saveAs(blob, filename);
    }
}
