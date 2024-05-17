import { ApiService } from '../services';

export interface APICorpusField {
    name: string;
    display_name: string;
    description: string;
    type: 'text_content'|'text_metadata'|'url'|'integer'|'float'|'date'|'boolean'|'geo_point';
    options: {
        search: boolean;
        filter: 'show'|'hide'|'none';
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
        category: string;
        description: string;
        languages: string[];
        date_range: {
            min: string;
            max: string;
        };
    };
    source_data: {
        type: 'csv';
        options?: {
            delimiter?: ','|';'|'\t';
        };
    };
    fields: APICorpusField[];
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
};

export interface APIEditableCorpus {
    id?: number;
    active: boolean;
    definition: APICorpusDefinition;
};

export class CorpusDefinition {
    active = false;
    definition: APICorpusDefinition;

    constructor(private apiService: ApiService, public id?: number) {
        if (this.id) {
            this.apiService.corpusDefinition(this.id).subscribe(result =>
                this.setFromAPIData(result)
            );
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

    /** save the corpus state in the database */
    save(): void {
        const data = this.toAPIData();
        const request$ = this.id ?
            this.apiService.updateCorpus(this.id, data) :
            this.apiService.createCorpus(data);
        request$.subscribe(result => this.setFromAPIData(result));
    }

    private toAPIData(): APIEditableCorpus {
        return {
            id: this.id,
            active: this.active,
            definition: this.toDefinition()
        };
    }

    private setFromAPIData(result: APIEditableCorpus) {
        this.id = result.id;
        this.active = result.active;
        this.setFromDefinition(result.definition);
    }
}
