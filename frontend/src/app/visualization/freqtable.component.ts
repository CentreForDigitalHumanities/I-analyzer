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

    factorColumns: { label: string, headerIndex?: number }[];
    wideFormatColumn: number;

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        this.checkWideFormat();

        this.formatData();
    }

    checkWideFormat(): void {
        if (this.headers && this.headers.find(header => header.isFactor)) {
            const names = this.headers.map((header, index) => ({
                label: `Group by ${header.label}`,
                headerIndex: index,
            }));
            this.factorColumns = names;
        } else {
            this.factorColumns = undefined;
        }
    }

    setWideFormat(column): void {
        this.wideFormatColumn = column ? column.headerIndex : undefined;
        this.formatData();
    }

    formatData() {
        let filteredData: any[];
        if (this.requiredColumn && this.data) {
            filteredData = this.data.filter(row => row[this.requiredColumn]);
        } else {
            filteredData = this.data;
        }

        if (this.wideFormatColumn !== undefined) {
            const [headers, data] = this.transformWideFormat(this.wideFormatColumn, filteredData);
            this.formattedHeaders = headers;
            this.formattedData = data;
        } else {
            this.formattedHeaders = this.headers;
            this.formattedData = this.data;
        }
    }

    transformWideFormat(headerIndex: number, data: any[]): [freqTableHeaders, any[]] {
        const mainFactor = this.headers[headerIndex];

        const mainFactorValues = _.uniqBy(
            data.map(row => row[mainFactor.key]),
            value => this.formatValue(value, mainFactor)
        );

        const newHeaders = this.wideFormatHeaders(mainFactor, mainFactorValues);

        // other factors
        const factorColumns = newHeaders.filter(header => header.isFactor);

        const newData = _.uniqBy(
            data,
            row => {
                const factorValues = factorColumns.map(column => this.getValue(row, column));
                return _.join(factorValues, '/');
            }
        );

        mainFactorValues.forEach(factorValue => {
            const filteredData = data.filter(row => row[mainFactor.key] === factorValue);

            newData.forEach(newRow => {
                this.headers.forEach(header => {
                    if (! header.isFactor) {
                        const key = this.wideFormatColumnKey(header, mainFactor, factorValue);

                        const rowData = filteredData.find(row =>
                            _.every(
                                factorColumns,
                                factor => _.isEqual(row[factor.key], newRow[factor.key])
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
            `${header.label} (${factor.label} = ${this.formatValue(factorValue, factor)})`;

        const otherHeaders = this.headers.filter((header, index) => header.key !== mainFactor.key);
        const newHeaders: freqTableHeaders = _.flatMap(otherHeaders, header => {
            if (header.isFactor) {
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

    parseTableData(): string[] {
        const data = this.data.map(row => {
            const values = this.headers.map(col => this.getValue(row, col, true));
            return  `${_.join(values, ',')}\n`;
        });
        data.unshift(`${_.join(this.headers.map(col => col.label), ',')}\n`);
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
