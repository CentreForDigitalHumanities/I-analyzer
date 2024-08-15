import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
    APICorpusDefinition,
    APICorpusDefinitionField,
    CorpusDefinition,
} from '../models/corpus-definition';
import { MenuItem } from 'primeng/api';
import * as _ from 'lodash';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';

@Injectable()
export class CorpusDefinitionService {
    corpus$ = new BehaviorSubject<CorpusDefinition | undefined>(undefined);

    steps$ = new BehaviorSubject<MenuItem[]>([
        { label: 'Corpus information' },
        { label: 'Sample data', disabled: true },
        { label: 'Define fields', disabled: true },
    ]);
    activeStep$ = new BehaviorSubject<number>(0);

    constructor(private slugify: SlugifyPipe) {}

    public toggleStep(stepIndex: number) {
        const newValue = this.steps$.value;
        newValue[stepIndex].disabled = !newValue[stepIndex].disabled;
        this.steps$.next(_.cloneDeep(newValue));
    }

    public activateStep(index: number) {
        this.activeStep$.next(index);
    }

    public setCorpus(corpus: CorpusDefinition) {
        this.corpus$.next(corpus);
    }

    public setDelimiter(
        delimiter: APICorpusDefinition['source_data']['options']['delimiter']
    ): void {
        let sourceDataOpts = this.corpus$.value.definition.source_data.options;
        if (
            _.isUndefined(sourceDataOpts) ||
            sourceDataOpts.delimiter !== delimiter
        ) {
            let updatedCorpus = _.clone(this.corpus$.value);
            updatedCorpus.definition.source_data.options = {
                delimiter: delimiter,
            };
            this.updateCorpus(updatedCorpus);
        }
    }

    public setFields(fields: APICorpusDefinitionField[]) {
        let updatedCorpus = _.clone(this.corpus$.value);
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

    private updateCorpus(updatedCorpus: CorpusDefinition) {
        this.setCorpus(updatedCorpus);
        this.corpus$.value.save();
    }
}
