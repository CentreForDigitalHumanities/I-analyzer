import { Component, Injectable } from '@angular/core';
import { actionIcons, formIcons } from '../../shared/icons';
import { BehaviorSubject, Observable, Subject, combineLatest, from, merge, of } from 'rxjs';
import { APICorpusDefinition, APIEditableCorpus } from '../../models/corpus-definition';
import { ApiService } from '../../services';
import { ActivatedRoute } from '@angular/router';
import {
    catchError, filter, map, shareReplay, startWith, switchAll, switchMap, switchMapTo,
    take, withLatestFrom
} from 'rxjs/operators';
import * as _ from 'lodash';


@Injectable()
class EditDefinitionService {
    data$: Observable<APIEditableCorpus>;
    error$ = new Subject<any>();
    loading$: Observable<boolean>;

    id$: Observable<number>;

    private initialData$: Observable<APIEditableCorpus>;
    private updatedData$: Observable<APIEditableCorpus>;

    private updates$ = new Subject<APIEditableCorpus>();

    constructor(private route: ActivatedRoute, private apiService: ApiService) {
        this.id$ = this.route.params.pipe(
            map(params => params['corpusID'])
        );

        this.initialData$ = this.id$.pipe(
            switchMap(id => this.apiService.corpusDefinition(id).pipe(
                shareReplay(1)
            )),
            catchError(err => {
                this.error$.next(err);
                return of(undefined);
            }),
        );

        this.updatedData$ = combineLatest([this.id$, this.updates$]).pipe(
            switchMap(([id, data]) => this.apiService.updateCorpus(id, data)),
            catchError(err => {
                this.error$.next(err);
                return of(undefined);
            }),
            filter(_.negate(_.isUndefined)),
        );

        this.data$ = merge(this.initialData$, this.updatedData$);

        this.loading$ = merge(
            this.updates$.pipe(map(_.constant(true))),
            this.data$.pipe(map(_.constant(false))),
            this.error$.pipe(map(_.constant(false)))
        ).pipe(
            startWith(true)
        );
    }

    update(data: APIEditableCorpus) {
        this.updates$.next(data);
    }
}


@Component({
    selector: 'ia-edit-definition',
    templateUrl: './edit-definition.component.html',
    styleUrls: ['./edit-definition.component.scss'],
    providers: [EditDefinitionService],
})
export class EditDefinitionComponent {
    actionIcons = actionIcons;
    formIcons = formIcons;

    corpus$: Observable<APIEditableCorpus>;
    uploadData$: Subject<any> = new Subject();
    uploadResult$: Observable<APIEditableCorpus>;
    corpusToSubmit$: Observable<APIEditableCorpus|undefined>;
    reset$: Subject<void> = new Subject();

    private submit$: Subject<void> = new Subject();

    constructor(
        private editDefinitionService: EditDefinitionService,
    ) {
        this.uploadResult$ = this.uploadData$.pipe(
            filter(_.negate(_.isUndefined)),
            withLatestFrom(this.editDefinitionService.data$),
            map(([data, corpus]) => this.mergeUploadedData(corpus, data)),
        );

        this.corpusToSubmit$ = merge(
            this.editDefinitionService.data$.pipe(map(_.constant(undefined))),
            this.reset$,
            this.uploadResult$
        ).pipe(
            shareReplay(1)
        );

        this.corpus$ = merge(
            this.editDefinitionService.data$,
            this.corpusToSubmit$.pipe(filter(_.negate(_.isUndefined))),
        );

        this.submit$.pipe(
            switchMapTo(this.corpusToSubmit$),
            take(1),
        ).subscribe(data => this.editDefinitionService.update(data));
    }

    downloadJSON(definition: APICorpusDefinition) {
        const content = JSON.stringify(definition, undefined, 4);
        const blob = new Blob([content], { type: `text/csv;charset=utf-8`, endings: 'native' });
        const filename = definition.name + '.json';
        saveAs(blob, filename);
    }

    onJSONUpload(data: any) {
        this.uploadData$.next(data);
    }

    submit() {
        this.submit$.next();
    }

    reset() {
        this.reset$.next();
    }

    private mergeUploadedData(corpus: APIEditableCorpus, data: any): APIEditableCorpus {
        _.set(corpus, 'definition', data);
        return corpus;
    }
}
