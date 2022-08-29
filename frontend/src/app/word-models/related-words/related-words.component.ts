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
    zoomedinData: {
        [interval: string]: WordSimilarity[]
    } = {}; // data when focusing on a single time interval: shows nearest neighbours from that period

    constructor(private dialogService: DialogService, private searchService: SearchService) { }

    ngOnChanges() {
        this.error.emit(undefined);
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

    async getZoomedInData(): Promise<any> {
        Promise.all(this.timeIntervals.map(this.getTimeData.bind(this)));
    }

    getTimeData(time: string): Promise<any> {
        return this.searchService.getRelatedWordsTimeInterval(this.queryText, this.corpus.name, time)
            .then(result => this.zoomedinData[time] = result)
            .catch(error => this.onError(error));
    }

    onError(error) {
        this.totalData = undefined;
        this.zoomedinData = undefined;
        this.error.emit(error);

    }

}
