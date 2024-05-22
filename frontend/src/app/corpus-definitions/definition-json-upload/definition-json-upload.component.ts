import { Component, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, Observable, Subject, from, of } from 'rxjs';
import { catchError, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { actionIcons } from '../../shared/icons';

@Component({
    selector: 'ia-definition-json-upload',
    templateUrl: './definition-json-upload.component.html',
    styleUrls: ['./definition-json-upload.component.scss']
})
export class DefinitionJsonUploadComponent implements OnChanges, OnDestroy {
    @Input() reset: Observable<void>;
    @Output() upload = new Subject<any>();

    actionIcons = actionIcons;

    file$: BehaviorSubject<File|undefined> = new BehaviorSubject(undefined);
    data$: Observable<any>;
    error$ = new Subject<Error>();

    private inputChange$ = new Subject<void>();
    private destroy$ = new Subject<void>();

    constructor() {
        this.data$ = this.file$.pipe(
            takeUntil(this.destroy$),
            tap(() => this.error$.next(undefined)),
            filter(_.negate(_.isUndefined)),
            switchMap(file =>
                from(
                    file.text().then(text => JSON.parse(text))
                ).pipe(catchError((err: Error) => {
                    this.error$.next(err);
                    console.log(err.message);
                    return of(undefined);
                }))
            ),
        );

        this.data$.subscribe(data => {
            this.upload.next(data);
        });
    }

    ngOnChanges() {
        this.inputChange$.next();
        this.reset?.pipe(
            takeUntil(this.inputChange$),
            takeUntil(this.destroy$),
        ).subscribe(() => this.file$.next(undefined));
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.inputChange$.complete();
        this.destroy$.complete();
    }

    onJSONUpload(event: InputEvent) {
        const files: File[] = event.target['files'];
        const file = files ? _.first(files) : undefined;
        this.file$.next(file);
    }
}
