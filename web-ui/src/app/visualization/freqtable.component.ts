import { Input, Component, OnInit, OnChanges, ElementRef, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { TitleCasePipe } from '@angular/common';

import * as d3 from 'd3';
import * as _ from "lodash";


@Component({
    selector: 'ia-freqtable',
    templateUrl: './freqtable2.component.html',
    styleUrls: ['./freqtable.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FreqtableComponent implements OnChanges {
    @Input('searchData')
    public searchData: {
        key: any,
        doc_count: number,
        key_as_string?: string
    }[];
    @Input() public visualizedField;
    @Input() public chartElement;
    @Input() public asPercent;

    public tableData: FreqtableComponent['searchData'] & {
        doc_count_fraction: number
    }[];

    constructor(private titlecasepipe: TitleCasePipe) { }

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
        d3.selectAll('svg').remove();
        // calculate percentage data
        let total_doc_count = this.searchData.reduce((s, f) => s + f.doc_count, 0);
        this.tableData = this.searchData.map(item => ({ ...item, doc_count_fraction: item.doc_count / total_doc_count }))
    }
}

type KeyFrequencyPair = {
    key: string;
    doc_count: number;
    key_as_string?: string;
}
