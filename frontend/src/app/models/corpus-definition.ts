export interface APICorpusField {
    name: string;
    display_name: string;
    description: string;
    type: 'text-content'|'text_metadata'|'url'|'integer'|'float'|'date'|'boolean'|'geo_point';
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
    id?: number;
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
