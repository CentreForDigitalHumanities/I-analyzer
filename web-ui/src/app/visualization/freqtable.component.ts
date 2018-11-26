import { Input, Component, OnChanges, OnDestroy, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Subscription }   from 'rxjs';

import * as d3 from 'd3';
import * as _ from "lodash";
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
        key: any,
        doc_count: number,
        key_as_string?: string,
        // x0 and x1 are information for drawing in d3, added by d3.histogram
        x0?: Date,
        x1?: Date
    }[];
    @Input() public visualizedField;
    @Input() public asPercent;

    public defaultSort: string = "doc_count";
    public defaultSortOrder: string = "-1"

    public tableData: FreqtableComponent['searchData'] & {
        doc_count_fraction: number
    }[];

    public subscription: Subscription;

    constructor(private titlecasepipe: TitleCasePipe, private dataService: DataService) {
        this.subscription = this.dataService.timelineData$.subscribe(results => {
            this.searchData = results;
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.searchData && this.visualizedField) {
            // date fields are returned with keys containing identifiers by elasticsearch
            // replace with string representation, contained in 'key_as_string' field
            if ('key_as_string' in this.searchData[0]) {
                this.searchData.forEach(cat => cat.key = cat.key_as_string)
            }
            this.createTable();
        }
    }

    createTable() {
        //clear the canvas
        d3.selectAll('svg').remove();
        //set default sort to key for date-type fields, frequency for all others
        if ('key_as_string' in this.searchData[0]) {
            this.defaultSort = "key";
        }
        // data coming in from timeline component has a slightly different format
        else if('x0' in this.searchData[0]) {
            this.searchData.map(d => d.key = moment(d[0].date).format("YYYY-MM-DD"));
            this.defaultSort = "key";
        }
        else {
            this.defaultSort = "doc_count";
        }
        // calculate percentage data
        let total_doc_count = this.searchData.reduce((s, f) => s + f.doc_count, 0);
        this.tableData = this.searchData.map(item => ({ ...item, doc_count_fraction: item.doc_count / total_doc_count }))
    }
}
