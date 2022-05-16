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
            const wideFormat = this.transformWideFormat(filteredData, this.wideFormatColumn);
            this.formattedHeaders = wideFormat[0];
            this.formattedData = wideFormat[1];
        } else {
            this.formattedHeaders = this.headers;
            this.formattedData = this.data;
        }
    }

    transformWideFormat(data: any[], headerIndex: number ): [freqTableHeaders, any[]] {
        const factor = this.headers[headerIndex];
        const values = _.uniq(data.map(row => row[factor.key]));

        const otherHeaders = this.headers.filter((header, index) => index !== headerIndex);
        const newHeaders: freqTableHeaders = _.flatMap(otherHeaders, header => {
            if (header.isFactor) {
                return [header];
            } else {
                return _.map(values, value => {
                    const formattedValue = factor.format ? factor.format(value) : value;
                    const label = `${header.label} (${factor.label} = ${formattedValue})`;
                    const newHeader: freqTableHeader = {
                        label,
                        key: `${header.key}_${formattedValue}`,
                        format: header.format,
                        formatDownload: header.formatDownload,
                    };
                    return newHeader;
                });
            }
        });

        const newData = [];

        console.log(newData);

        return [newHeaders, data];
    }

    parseTableData(): string[] {
        const data = this.data.map(row => {
            const values = this.headers.map(col => this.getValue(row, col));
            return  `${_.join(values, ',')}\n`;
        });
        data.unshift(`${_.join(this.headers.map(col => col.label), ',')}\n`);
        return data;
    }

    getValue(row, column: freqTableHeader) {
        if (column.formatDownload) {
            return column.formatDownload(row[column.key]);
        }
        if (column.format) {
            return column.format(row[column.key]);
        }
        return row[column.key];
    }

    downloadTable() {
        const data = this.parseTableData();
        const blob = new Blob(data, { type: `text/csv;charset=utf-8`, endings: 'native' });
        const filename = this.name + '.csv';
        saveAs(blob, filename);
    }
}
