import { Component, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, Observable, Subject, from, of } from 'rxjs';
import { catchError, filter, map, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { actionIcons } from '@shared/icons';
import { ApiService } from '@services';
import { ValidationError, Validator } from 'jsonschema';

@Component({
    selector: 'ia-definition-json-upload',
    templateUrl: './definition-json-upload.component.html',
    styleUrls: ['./definition-json-upload.component.scss'],
    standalone: false
})
export class DefinitionJsonUploadComponent implements OnChanges, OnDestroy {
    @Input() reset: Observable<void>;
    @Output() upload = new Subject<any>();

    actionIcons = actionIcons;

    schema$ = this.apiService.corpusSchema();
    file$: BehaviorSubject<File|undefined> = new BehaviorSubject(undefined);
    data$: Observable<any>;
    error$ = new Subject<{message: string}>();
    validationErrors$ = new BehaviorSubject<ValidationError[]>([]);

    private inputChange$ = new Subject<void>();
    private destroy$ = new Subject<void>();

    constructor(
        private apiService: ApiService,
    ) {
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

        this.data$.pipe(
            withLatestFrom(this.schema$),
            filter(([data, schema]) => this.validate(data, schema)),
            map(_.first),
        ).subscribe(data => {
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
        this.validationErrors$.complete();
        this.destroy$.next();
        this.inputChange$.complete();
        this.destroy$.complete();
    }

    onJSONUpload(event: InputEvent) {
        const files: File[] = event.target['files'];
        const file = files ? _.first(files) : undefined;
        this.file$.next(file);
    }

    validate(data, schema) {
        const validator = new Validator();
        const result = validator.validate(data, schema);
        this.validationErrors$.next(result.errors);
        return !result.errors.length;
    }
}
