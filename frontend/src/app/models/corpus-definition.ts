import * as _ from 'lodash';
import { ApiService } from '@services';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, share } from 'rxjs/operators';

export type Delimiter = ',' | ';' | '\t';

export interface CorpusDataFile {
    id?: number;
    corpusID: number;
    file: File | string;
    original_filename?: string;
    is_sample: boolean;
    created?: Date;
    confirmed: boolean;
    csv_info: DataFileInfo;
}

export interface DataFileInfo {
    n_rows: number;
    fields: [Pick<APICorpusDefinitionField, 'name' | 'type'>];
    delimiter: Delimiter;
}

export interface APICorpusDefinitionField {
    name: string;
    display_name: string;
    description: string;
    type:
        | 'text_content'
        | 'text_metadata'
        | 'url'
        | 'integer'
        | 'float'
        | 'date'
        | 'boolean'
        | 'geo_point';
    options: {
        search: boolean;
        filter: 'show' | 'hide' | 'none';
        preview: boolean;
        visualize: boolean;
        sort: boolean;
        hidden: boolean;
    };
    language?: string;
    extract: {
        column: string;
    };
}

export interface APICorpusDefinition {
    name: string;
    meta: {
        title: string;
        category?: string;
        description?: string;
        languages?: string[];
        date_range?: {
            min: number;
            max: number;
        };
    };
    source_data: {
        type: 'csv';
        options?: {
            delimiter?: Delimiter;
        };
    };
    fields: APICorpusDefinitionField[];
    options?: {
        language_field?: string;
        document_context?: {
            context_fields: string[];
            context_display_name: string;
            sort?: {
                field: string;
                ascending: boolean;
            };
        };
        default_sort?: {
            field: string;
            ascending: boolean;
        };
    };
    documentation?: {
        general?: string,
        citation?: string,
        license?: string,
    }
}

export interface APIEditableCorpus {
    id?: number;
    active: boolean;
    definition: APICorpusDefinition;
    has_image?: boolean;
    has_confirmed_datafile?: boolean;
}

export class CorpusDefinition {
    active = false;
    hasImage = false;
    hasConfirmedDataFile: boolean;
    loading$ = new BehaviorSubject<boolean>(true);

    definition: APICorpusDefinition;

    definitionUpdated$ = this.loading$.pipe(filter((val) => !val));

    constructor(private apiService: ApiService, public id?: number) {
        if (this.id) {
            this.apiService
                .corpusDefinition(this.id)
                .subscribe((result) => this.setFromAPIData(result));
        } else {
            this.loading$.next(false);
        }
    }

    /** update the corpus state from a JSON definition */
    setFromDefinition(definition: APICorpusDefinition) {
        this.definition = definition;
    }

    /** return the JSON definition for the corpus state */
    toDefinition(): APICorpusDefinition {
        return this.definition;
    }

    /** whether the corpus definition contains all data necessary for saving */
    isComplete() {
        return !_.isUndefined(this.definition);
    }

    /** save the corpus state in the database */
    save(): Observable<APIEditableCorpus> {
        this.loading$.next(true);
        const data = this.toAPIData();
        const request$ = this.id
            ? this.apiService.updateCorpus(this.id, data)
            : this.apiService.createCorpus(data);
        const result$ = request$.pipe(share());
        result$.subscribe((result) => this.setFromAPIData(result));
        return result$;
    }

    private toAPIData(): APIEditableCorpus {
        return {
            id: this.id,
            active: this.active,
            definition: this.toDefinition(),
        };
    }

    private setFromAPIData(result: APIEditableCorpus) {
        this.id = result.id;
        this.active = result.active;
        this.setFromDefinition(result.definition);
        this.hasImage = result.has_image;
        this.hasConfirmedDataFile = result.has_confirmed_datafile;

        // do not edit properties AFTER this !!!
        this.loading$.next(false);
    }
};

export const FIELD_TYPE_OPTIONS: {
    label: string;
    value: APICorpusDefinitionField['type'];
    helpText: string;
    hasLanguage?: boolean;
}[] = [
    {
        label: 'text (content)',
        value: 'text_content',
        helpText:
            'Main document text. Can consist of multiple paragraphs. Can be used to search.',
        hasLanguage: true,
    },
    {
        label: 'text (metadata)',
        value: 'text_metadata',
        helpText:
            'Metadata text. Limited to a single paragraph. Can be used to filter and/or search.',
        hasLanguage: true,
    },
    {
        label: 'number (integer)',
        value: 'integer',
        helpText: 'This field contains whole numbers',
    },
    {
        label: 'number (decimal)',
        value: 'float',
        helpText: 'This field contains numbers with (optional) decimals',
    },
    {
        label: 'date',
        value: 'date',
        helpText: 'This field contains dates.',
    },
    {
        label: 'boolean',
        value: 'boolean',
        helpText: 'This field contains true/false values.',
    },
    {
        label: 'url',
        value: 'url',
        helpText: 'This field contains URLs',
    },
];
