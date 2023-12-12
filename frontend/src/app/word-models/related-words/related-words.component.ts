import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

import { showLoading } from '../../utils/utils';
import { Corpus, WordSimilarity } from '../../models';
import { ParamService, WordmodelsService } from '../../services/index';
import { ParamDirective } from '../../param/param-directive';


@Component({
    selector: 'ia-related-words',
    templateUrl: './related-words.component.html',
    styleUrls: ['./related-words.component.scss'],
})
export class RelatedWordsComponent extends ParamDirective implements OnChanges {
    @Input() queryText: string;
    @Input() corpus: Corpus;
    @Input() asTable: boolean;
    @Input() palette: string[];

    @Output() relatedWordsError = new EventEmitter();
    @Output() isLoading = new BehaviorSubject<boolean>(false);

    neighbours = 5;

    timeIntervals: string[] = [];
    totalData: WordSimilarity[]; // similarities of overall nearest neighbours per time period
    zoomedInData: WordSimilarity[][]; // data when focusing on a single time interval: shows nearest neighbours from that period

    faCheck = faCheck;
    nullableParameters = ['neighbours'];

    constructor(
        route: ActivatedRoute,
        router: Router,
        paramService: ParamService,
        private wordModelsService: WordmodelsService
    ) {
        super(route, router, paramService);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.corpus || changes.queryText) {
            this.getData();
        }
    }

    initialize() {}

    teardown() {}

    setStateFromParams(params: Params) {
        this.neighbours = _.get(params, 'neighbours', 5);
    }

    getData(): void {
        this.setParams({ neighbours: this.neighbours });
        showLoading(this.isLoading, this.getTotalData());
    }

    getTotalData(): Promise<void> {
        return this.wordModelsService
            .getRelatedWords(this.queryText, this.corpus.name, this.neighbours)
            .then((results) => {
                this.totalData = results.similarities_over_time;
                this.timeIntervals = results.time_points;
                this.zoomedInData = results.similarities_over_time_local_top_n;
            })
            .catch(this.onError.bind(this));
    }

    onError(error) {
        this.totalData = undefined;
        this.zoomedInData = undefined;
        this.relatedWordsError.emit(error);
    }
}
