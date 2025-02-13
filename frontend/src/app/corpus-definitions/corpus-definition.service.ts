import { Injectable, OnDestroy } from '@angular/core';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';
import * as _ from 'lodash';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject, combineLatest, filter, forkJoin, merge, Observable, of, Subject, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';
import {
    APICorpusDefinitionField,
    CorpusDefinition,
    Delimiter,
} from '../models/corpus-definition';
import { CorpusDocumentationPage, CorpusDocumentationPageSubmitData } from '@models';
import { ApiService } from '@services';
import { EditablePage } from './form/documentation-form/editable-page';

@Injectable()
export class CorpusDefinitionService implements OnDestroy {
    corpus$ = new BehaviorSubject<CorpusDefinition | undefined>(undefined);

    documentation$: Observable<CorpusDocumentationPage[]>;

    destroy$ = new Subject<void>();

    steps$ = new BehaviorSubject<MenuItem[]>([
        { label: 'Corpus information' },
        { label: 'Sample data', disabled: true },
        { label: 'Define fields', disabled: true },
        { label: 'Add documentation', disabled: true }
    ]);
    activeStep$ = new BehaviorSubject<number>(0);

    private documentationUpdated$ = new Subject<void>();

    constructor(
        private slugify: SlugifyPipe,
        private apiService: ApiService,
    ) {
        this.corpus$
            .pipe(takeUntil(this.destroy$), filter(_.negate(_.isUndefined)))
            .subscribe({
                next: (corpus) =>
                    corpus.definitionUpdated$
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => this.setSteps(this.corpus$.value),
                        }),
            });

        this.documentation$ = merge(this.corpus$, this.documentationUpdated$).pipe(
            withLatestFrom(this.corpus$),
            switchMap(([_, corpus]) =>
                this.apiService.corpusDocumentationPages(corpus.definition.name)
            ),
            takeUntil(this.destroy$),
        );
    }

    ngOnDestroy(): void {
        this.documentationUpdated$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    public toggleStepDisabled(stepIndex: number) {
        const newValue = _.cloneDeep(this.steps$.value);
        newValue[stepIndex].disabled = !newValue[stepIndex].disabled;
        this.steps$.next(newValue);
    }

    public activateStep(index: number) {
        this.activeStep$.next(index);
    }

    public setCorpus(corpus: CorpusDefinition) {
        this.corpus$.next(corpus);
    }

    public setDelimiter(delimiter: Delimiter): void {
        let sourceDataOpts = this.corpus$.value.definition.source_data.options;
        if (
            _.isUndefined(sourceDataOpts) ||
            sourceDataOpts.delimiter !== delimiter
        ) {
            let updatedCorpus = _.cloneDeep(this.corpus$.value);
            updatedCorpus.definition.source_data.options = {
                delimiter: delimiter,
            };
            this.updateCorpus(updatedCorpus);
        }
    }

    public setFields(fields: APICorpusDefinitionField[]) {
        let updatedCorpus = _.cloneDeep(this.corpus$.value);
        updatedCorpus.definition.fields = fields;
        this.updateCorpus(updatedCorpus);
    }

    public makeDefaultField(
        dtype: APICorpusDefinitionField['type'] | 'text',
        colName: string
    ): APICorpusDefinitionField {
        let field: Partial<APICorpusDefinitionField> = {
            name: this.slugify.transform(colName),
            display_name: colName,
            description: '',
            type: dtype == 'text' ? 'text_metadata' : dtype,
            extract: {
                column: colName,
            },
        };
        switch (dtype) {
            case 'boolean':
            case 'float':
            case 'integer': {
                field.options = {
                    search: false,
                    filter: 'show',
                    preview: false,
                    visualize: true,
                    sort: false,
                    hidden: false,
                };
            }
            case 'date': {
                field.options = {
                    search: false,
                    filter: 'show',
                    preview: true,
                    visualize: true,
                    sort: true,
                    hidden: false,
                };
            }
            case 'text': {
                field.options = {
                    search: true,
                    filter: 'show',
                    preview: false,
                    visualize: false,
                    sort: false,
                    hidden: false,
                };
            }
        }
        return field as APICorpusDefinitionField;
    }

    public updateDocumentationPage(
        page: EditablePage,
        data: CorpusDocumentationPage[]
    ) {
        const stored = data.find(p => p.type == page.category.title);
        if (stored) {
            page.id = stored.id;
            page.content = stored.content_template;
        } else {
            page.id = undefined;
            page.content = '';
        }
    }

    public saveDocumentationPages(pages: EditablePage[]): Observable<any[]> {
        return forkJoin(
            pages.map(page => this.saveDocumentationPage(page))
        ).pipe(
            tap(() => this.documentationUpdated$.next())
        );
    }

    private saveDocumentationPage(
        page: EditablePage,
    ): Observable<any> {
        const data: CorpusDocumentationPageSubmitData = {
            content_template: page.content,
            type: page.category.title,
            corpus: page.corpusName,
        };
        if (page.id && page.content.length) {
            return this.apiService.updateCorpusDocumentationPage(page.id, data)
        } else if (page.content.length) {
            return this.apiService.createCorpusDocumentationPage(data);
        } else if (page.id) {
            return this.apiService.deleteCorpusDocumentationPage(page.id);
        } else {
            return of(undefined);
        }
    }

    private updateCorpus(updatedCorpus: CorpusDefinition) {
        this.setCorpus(updatedCorpus);
        this.corpus$.value.save();
    }

    private setSteps(corpus: CorpusDefinition) {
        if (!_.isEmpty(corpus?.definition?.fields)) {
            const newValue = this.steps$.value.map((step) => ({
                ...step,
                disabled: false,
            }));
            this.steps$.next(_.cloneDeep(newValue));
        }
    }
}
