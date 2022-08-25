import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Chart, ChartData } from 'chart.js';
import { Corpus } from '../../models';
import { SearchService } from '../../services';

@Component({
    selector: 'ia-word-similarity',
    templateUrl: './word-similarity.component.html',
    styleUrls: ['./word-similarity.component.scss']
})
export class WordSimilarityComponent implements OnChanges {
    @Input() queryText: string;
    @Input() corpus: Corpus;
    @Input() asTable: boolean;
    @Input() palette: string[];

    @Output() error = new EventEmitter();
    @Output() isLoading = new EventEmitter<boolean>();

    chartData: ChartData<'line'>;
    chart: Chart;

    constructor(private searchService: SearchService) { }

    ngOnChanges(changes: SimpleChanges): void {

    }
}
