import { Input, Component, OnInit, OnChanges, ElementRef, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { TitleCasePipe } from '@angular/common';

import * as d3 from 'd3';
import * as _ from "lodash";
import { TableBody } from '../../../node_modules/primeng/primeng';

@Component({
    selector: 'ia-freqtable',
    templateUrl: './freqtable.component.html',
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

    public percentData: {
        key: any,
        doc_count: number,
        key_as_string?: string
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
        this.percentData = _.cloneDeep(this.searchData);

        var total = 0;
        for (let bin of this.percentData) {
            total += bin.doc_count;
        }
        this.percentData.map(function (e) {
            e.doc_count = (e.doc_count / total);
            return e;
        });

    }
}

type KeyFrequencyPair = {
    key: string;
    doc_count: number;
    key_as_string?: string;
}
