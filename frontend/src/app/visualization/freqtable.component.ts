import { Input, Component, OnChanges, OnDestroy, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';
import * as moment from 'moment';
import { saveAs } from 'file-saver';

@Component({
    selector: 'ia-freqtable',
    templateUrl: './freqtable.component.html',
    styleUrls: ['./freqtable.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FreqtableComponent implements OnChanges {
    @Input() headers: { key: string, label: string, transform?: (any) => string }[];
    @Input() data: any[];
    @Input() name: string; // name for CSV file
    @Input() defaultSort: string; // default field for sorting
    @Input() requiredField: string; // field required to include row in web view

    public defaultSortOrder = '-1';
    filteredData: any[];

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.requiredField && this.data) {
            this.filteredData = this.data.filter(row => row[this.requiredField]);
        } else {
            this.filteredData = this.data;
        }
    }

    parseTableData() {
        const data = this.data.map(row => {
            const values = this.headers.map(col => row[col.key]);
            return  `${_.join(values, ';')}\n`;
        });
        data.unshift(`${_.join(this.headers.map(col => col.label), ',')}\n`);
        return data;
    }

    downloadTable() {
        const data = this.parseTableData();
        const blob = new Blob(data, { type: `text/csv;charset=utf-8`, endings: 'native' });
        const filename = this.name + '.csv';
        saveAs(blob, filename);
    }
}
