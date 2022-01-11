import { Input, Component, OnChanges, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';
import * as moment from 'moment';

import { DataService } from '../services/index';


@Component({
    selector: 'ia-freqtable',
    templateUrl: './freqtable.component.html',
    styleUrls: ['./freqtable.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FreqtableComponent implements OnChanges, OnDestroy {
    @Input('searchData')
    public searchData: {
        key?: string,
        date?: Date,
        doc_count?: number,
        similarity?: number
    }[];
    @Input() public visualizedField;
    @Input() public normalizer: string;

    public defaultSort = 'doc_count';
    public defaultSortOrder = '-1';
    public rightColumnName: string;

    public tableData: FreqtableComponent['searchData'] & {
        doc_count_fraction: number
    }[];

    public subscription: Subscription;

    constructor(private dataService: DataService) {
        this.subscription = this.dataService.timelineData$.subscribe(results => {
            if (results !== undefined) {
                let format: string;
                switch(results.timeInterval) {
                    case 'year':
                        format = "YYYY";
                        break
                    case 'month':
                        format = "MMMM YYYY";
                        break
                    default:
                        format = "YYYY-MM-DD";
                        break
                }
                this.searchData = results.data;
                this.searchData.map(d => d.key = moment(d.date).format(format));
                this.createTable();
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    ngOnChanges() {
        // set the name of the right column
        if (this.normalizer === 'percent' ) {
            this.rightColumnName = "Percent";
        } else if (this.visualizedField.name === "relatedwords") {
            this.rightColumnName = "Similarity";
        } else {
            this.rightColumnName = "Frequency";
        }

        if (this.searchData && this.visualizedField) {
            // date fields are returned with keys containing identifiers by elasticsearch
            // replace with string representation, contained in 'key_as_string' field
            if ("visualizationSort" in this.visualizedField) {
                this.defaultSort = this.visualizedField.visualizationSort;
            } else {
                this.defaultSort = "doc_count";
            }
            this.createTable();
        }
    }

    createTable() {
        //set default sort to key for date-type fields, frequency for all others
        
        // calculate percentage data
        let total_doc_count = this.searchData.reduce((s, f) => s + f.doc_count, 0);
        this.tableData = this.searchData.map(item => ({ ...item, doc_count_fraction: item.doc_count / total_doc_count }));
    }
}
