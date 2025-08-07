import { Injectable, OnDestroy } from '@angular/core';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';
import * as _ from 'lodash';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject, filter, Subject, takeUntil } from 'rxjs';
import {
    APICorpusDefinitionField,
    CorpusDefinition,
    Delimiter,
} from '../models/corpus-definition';


@Injectable()
export class CorpusDefinitionService implements OnDestroy {
    corpus$ = new BehaviorSubject<CorpusDefinition | undefined>(undefined);

    destroy$ = new Subject<void>();

    steps$ = new BehaviorSubject<MenuItem[]>([
        { label: 'Corpus information' },
        { label: 'Upload source data' },
        { label: 'Define fields' },
        { label: 'Index data' },
    ]);
    activeStep$ = new BehaviorSubject<number>(0);

    constructor(
        private slugify: SlugifyPipe,
    ) {
        this.corpus$
            .pipe(takeUntil(this.destroy$), filter(_.negate(_.isUndefined)))
            .subscribe({
                next: (corpus) => {
                    this.setSteps(corpus);
                    corpus.definitionUpdated$
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => this.setSteps(this.corpus$.value),
                        });
                },
            });
    }

    ngOnDestroy(): void {
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
        dtype: APICorpusDefinitionField['type'],
        colName: string
    ): APICorpusDefinitionField {
        let field: Partial<APICorpusDefinitionField> = {
            name: this.slugify.transform(colName),
            display_name: colName,
            description: '',
            type: dtype,
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
            case 'text_metadata': {
                field.options = {
                    search: true,
                    filter: 'show',
                    preview: false,
                    visualize: true,
                    sort: false,
                    hidden: false,
                };
            }
            case 'text_content': {
                field.options = {
                    search: true,
                    filter: 'none',
                    preview: true,
                    visualize: true,
                    sort: false,
                    hidden: false,
                };
            }
            case 'url': {
                field.options = {
                    search: true,
                    filter: 'none',
                    preview: false,
                    visualize: false,
                    sort: false,
                    hidden: false,
                };
            }
        }
        return field as APICorpusDefinitionField;
    }

    private updateCorpus(updatedCorpus: CorpusDefinition) {
        this.setCorpus(updatedCorpus);
        this.corpus$.value.save();
    }

    private metadataComplete(corpus: CorpusDefinition) {
        const meta = corpus.definition?.meta;

        if (!meta?.title.length) {
            return false;
        }
        if (!meta?.description?.length) {
            return false;
        }
        if (!meta?.date_range?.min || !meta?.date_range?.max) {
            return false;
        }
        return true;
    }

    private hasFields(corpus: CorpusDefinition) {
        return !_.isEmpty(corpus?.definition.fields);
    }

    private setSteps(corpus: CorpusDefinition) {
        let maxStep = Infinity;
        if (!this.metadataComplete(corpus)) {
            maxStep = 0;
        }
        else if (!this.hasFields(corpus)) {
            maxStep = 1;
        }

        const steps = this.steps$.value.map(
            (step, index) => ({
                ...step,
                disabled: index > maxStep,
            })
        );
        this.steps$.next(steps);
    }
}
