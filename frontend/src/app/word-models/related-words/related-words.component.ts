import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Chart, ChartData, ChartOptions, Filler, TooltipItem } from 'chart.js';
import { Corpus, freqTableHeaders, QueryModel, WordSimilarity } from '../../models';
import { selectColor } from '../../visualization/select-color';
import { DialogService, SearchService } from '../../services/index';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';

@Component({
    selector: 'ia-related-words',
    templateUrl: './related-words.component.html',
    styleUrls: ['./related-words.component.scss']
})
export class RelatedWordsComponent implements OnChanges {
    @Input() queryText: string;
    @Input() corpus: Corpus;
    @Input() asTable: boolean;
    @Input() palette: string[];

    @Output() error = new EventEmitter();
    @Output() isLoading = new EventEmitter<boolean>();

    timeIntervals: string[] = [];
    totalSimilarities: WordSimilarity[]; // similarities over all time periods
    totalData: WordSimilarity[]; // similarities of overall nearest neighbours per time period
    zoomedInData: WordSimilarity[][]; // data when focusing on a single time interval: shows nearest neighbours from that period

    constructor(private dialogService: DialogService, private searchService: SearchService) { }

    ngOnChanges() {
        this.error.emit({message: undefined});
        this.getData();
    }

    getData(): void {
        this.showLoading(this.getTotalData().then(this.getZoomedInData.bind(this)));
    }

    /** execute a process with loading spinner */
    async showLoading(promise): Promise<any> {
        this.isLoading.next(true);
        const result = await promise;
        this.isLoading.next(false);
        return result;
    }

    getTotalData(): Promise<void> {
        return this.searchService.getRelatedWords(this.queryText, this.corpus.name)
            .then(results => {
                this.totalSimilarities = results.total_similarities;
                this.totalData = results.similarities_over_time;
                this.timeIntervals = results.time_points;
            })
            .catch(this.onError.bind(this));
    }

    async getZoomedInData(): Promise<void> {
        const resultsPerTime: Promise<WordSimilarity[]>[] = this.timeIntervals.map(this.getTimeData.bind(this));
        Promise.all(resultsPerTime)
            .then(results => this.zoomedInData = results)
            .catch(error => this.onError(error));
    }

    getTimeData(time: string): Promise<WordSimilarity[]> {
        return this.searchService.getRelatedWordsTimeInterval(this.queryText, this.corpus.name, time);
    }

    onError(error) {
        this.totalData = undefined;
        this.zoomedInData = undefined;
        this.error.emit(error);

    }

}
