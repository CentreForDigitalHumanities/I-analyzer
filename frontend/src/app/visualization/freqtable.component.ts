import { Input, Component, OnChanges, OnDestroy, ViewEncapsulation } from '@angular/core';
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
    @Input() public visualizedField;
    @Input() public normalizer: string;

    public defaultSort = 'doc_count';
    public defaultSortOrder = '-1';

    constructor() { }

    ngOnChanges() {
        if (this.headers && this.data) {
            if ("visualizationSort" in this.visualizedField) {
                this.defaultSort = this.visualizedField.visualizationSort;
            } else {
                this.defaultSort = "doc_count";
            }
        }
    }

    parseTableData() {
        const data = this.data.map(row => {
            const values = this.headers.map(col => row[col.key]);
            return  `${_.join(values, ',')}\n`;
        });
        data.unshift(`${_.join(this.headers.map(col => col.label), ',')}\n`);
        return data;
    }

    downloadTable() {
        const data = this.parseTableData();
        const blob = new Blob(data, { type: `text/csv;charset=utf-8`, endings: 'native' });
        const filename = this.visualizedField.name + '.csv';
        saveAs(blob, filename);
    }

}
