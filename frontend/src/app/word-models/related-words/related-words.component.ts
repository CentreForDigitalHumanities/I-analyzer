import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Corpus, WordSimilarity } from '../../models';
import { WordmodelsService } from '../../services/index';
import * as _ from 'lodash';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

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

    neighbours = 5;

    timeIntervals: string[] = [];
    totalSimilarities: WordSimilarity[]; // similarities over all time periods
    totalData: WordSimilarity[]; // similarities of overall nearest neighbours per time period
    zoomedInData: WordSimilarity[][]; // data when focusing on a single time interval: shows nearest neighbours from that period

    faCheck = faCheck;

    constructor(private wordModelsService: WordmodelsService) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.corpus || changes.queryText) {
            this.getData();
        }
    }

    getData(): void {
        this.showLoading(this.getTotalData());
    }


    /** execute a process with loading spinner */
    async showLoading(promise): Promise<any> {
        this.isLoading.next(true);
        const result = await promise;
        this.isLoading.next(false);
        return result;
    }

    getTotalData(): Promise<void> {
        return this.wordModelsService.getRelatedWords(this.queryText, this.corpus.name, this.neighbours)
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
        return this.wordModelsService.getRelatedWordsTimeInterval(this.queryText, this.corpus.name, time, this.neighbours);
    }

    onError(error) {
        this.totalData = undefined;
        this.zoomedInData = undefined;
        this.error.emit(error);

    }

}
