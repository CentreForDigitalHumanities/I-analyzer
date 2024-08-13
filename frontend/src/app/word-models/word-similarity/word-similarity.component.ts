import { Component, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { showLoading } from '@utils/utils';
import { Corpus, WordSimilarity } from '../../models';
import { WordmodelsService } from '../../services';

@Component({
    selector: 'ia-word-similarity',
    templateUrl: './word-similarity.component.html',
    styleUrls: ['./word-similarity.component.scss'],
})
export class WordSimilarityComponent implements OnChanges {
    @HostBinding('style.display') display = 'block'; // needed for loading spinner positioning

    @Input() queryText: string;
    @Input() corpus: Corpus;
    @Input() asTable: boolean;
    @Input() palette: string[];

    @Output() wordSimilarityError = new EventEmitter();

    isLoading$ = new BehaviorSubject<boolean>(false);

    comparisonTermLimit = Infinity;
    comparisonTerms: string[] = [];

    results: WordSimilarity[][];
    timeIntervals: string[];

    data: WordSimilarity[];

    constructor(private wordModelsService: WordmodelsService) {}

    @HostBinding('class.is-loading')
    get isLoading() {
        return this.isLoading$.value;
    }

    get tableFileName(): string {
        return `word similarity - ${this.queryText} - ${this.corpus?.title}`;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes.queryText || changes.corpus) &&
            this.comparisonTerms.length
        ) {
            this.getData();
        } else {
            if (this.results) {
                this.onDataLoaded(this.results);
            }
        }
    }

    updateComparisonTerms(terms: string[] = []) {
        this.comparisonTerms = terms;
        this.getData();
    }

    getData(): void {
        showLoading(
            this.isLoading$,
            Promise.all(
                this.comparisonTerms.map((term) =>
                    this.wordModelsService.getWordSimilarity(
                        this.queryText,
                        term,
                        this.corpus.name
                    )
                )
            )
        )
            .then(this.onDataLoaded.bind(this))
            .catch(this.onError.bind(this));
    }

    getTimePoints(points: WordSimilarity[]) {
        return points.map((point) => point.time);
    }

    onDataLoaded(data: WordSimilarity[][]): void {
        this.results = data;
        this.timeIntervals =
            data.length && data[0].length
                ? this.getTimePoints(data[0])
                : this.timeIntervals;
        this.data = _.flatten(this.results);
    }

    onError(error: { message: string }) {
        this.results = undefined;
        this.wordSimilarityError.emit(error.message);
    }
}
