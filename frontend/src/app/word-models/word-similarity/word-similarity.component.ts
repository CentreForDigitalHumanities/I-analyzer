import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Chart, ChartData } from 'chart.js';
import { Corpus, WordSimilarityResults } from '../../models';
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

    comparisonTerms: string[] = ['duitsland'];

    @Output() error = new EventEmitter();
    @Output() isLoading = new EventEmitter<boolean>();

    chartData: ChartData<'line'>;
    chart: Chart;

    constructor(private searchService: SearchService) { }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes.queryText || changes.corpus) && this.comparisonTerms.length) {
            this.getData();
        }
    }

    updateComparisonTerms(terms: string[]) {
        this.comparisonTerms = terms;
        this.getData();
    }

    getData(): void {
        Promise.all(this.comparisonTerms.map(term =>
            this.searchService.getWordSimilarity(this.queryText, term, this.corpus.name)
        )).then(this.onDataLoaded.bind(this));
    }

    onDataLoaded(data: WordSimilarityResults): void {
        console.log(data);
    }

}
