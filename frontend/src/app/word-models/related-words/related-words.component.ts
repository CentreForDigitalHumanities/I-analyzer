import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Corpus, WordSimilarity } from '../../models';
import { WordmodelsService } from '../../services/index';
import * as _ from 'lodash';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { showLoading } from '../../utils/utils';
import { BehaviorSubject } from 'rxjs';

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
    @Output() isLoading = new BehaviorSubject<boolean>(false);

    neighbours = 5;

    timeIntervals: string[] = [];
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
        showLoading(this.isLoading, this.getTotalData());
    }

    getTotalData(): Promise<void> {
        return this.wordModelsService.getRelatedWords(this.queryText, this.corpus.name, this.neighbours)
            .then(results => {
                this.totalData = results.similarities_over_time;
                this.timeIntervals = results.time_points;
                this.zoomedInData = results.similarities_over_time_local_top_n;
            })
            .catch(this.onError.bind(this));
    }

    onError(error) {
        this.totalData = undefined;
        this.zoomedInData = undefined;
        this.error.emit(error);

    }

}
