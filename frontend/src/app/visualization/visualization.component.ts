import {
    Component,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
} from '@angular/core';
import * as _ from 'lodash';
import { Corpus, CorpusField, QueryModel } from '@models/index';
import { actionIcons, visualizationIcons } from '@shared/icons';
import { RouterStoreService } from '../store/router-store.service';
import {
    VisualizationOption,
    VisualizationSelector,
} from '@models/visualization-selector';
import { Observable, Subject, merge } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'ia-visualization',
    templateUrl: './visualization.component.html',
    styleUrls: ['./visualization.component.scss'],
    standalone: false
})
export class VisualizationComponent implements OnChanges, OnDestroy {
    @Input() public corpus: Corpus;
    @Input() public queryModel: QueryModel;

    selector: VisualizationSelector;


    public freqtable = false;

    public manualPages = {
        ngram: 'ngrams',
        wordcloud: 'wordcloud',
        resultscount: 'numberofresults',
        termfrequency: 'termfrequency',
    };

    actionIcons = actionIcons;
    visualizationIcons = visualizationIcons;

    public palette: string[];

    error$: Observable<string|undefined>;

    private errorInChild$ = new Subject<string>();

    constructor(
        private routerStoreService: RouterStoreService,
    ) {
    }

    get manualPage(): string {
        if (this.visualizationType) {
            return this.manualPages[this.visualizationType];
        }
    }

    get visualizationType(): string {
        return this.selector.state$.value.name;
    }

    get visualizedField(): CorpusField {
        return this.selector.state$.value.field;
    }

    get chartElementId(): string {
        if (
            this.visualizationType === 'resultscount' ||
            this.visualizationType === 'termfrequency'
        ) {
            return 'barchart';
        }
        if (this.visualizationType === 'ngram') {
            return 'chart';
        }
        if (this.visualizationType === 'wordcloud') {
            return 'wordcloud_div';
        }
    }

    get imageFileName(): string {
        if (this.visualizationType && this.corpus && this.visualizedField) {
            return `${this.visualizationType}_${this.corpus.name}_${this.visualizedField.name}.png`;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.queryModel || changes.corpus) {
            this.selector = new VisualizationSelector(this.routerStoreService, this.queryModel);

            const errorReset$ = this.selector.state$.pipe(
                map(_.constant(undefined))
            );
            this.error$ = merge(errorReset$, this.errorInChild$);
        }
    }

    ngOnDestroy(): void {
        this.selector?.complete();
    }

    setVisualizationType(selection: VisualizationOption) {
        this.selector.setVisualizationType(selection.name);
    }

    setVisualizedField(selectedField: CorpusField) {
        this.selector.setVisualizedField(selectedField);
    }

    setErrorMessage(message: string) {
        this.errorInChild$.next(message);
    }
}
