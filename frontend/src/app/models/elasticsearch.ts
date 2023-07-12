// FILTERS

export interface EsDateFilter {
    range: {
        [field: string]: {
            gte: string;
            lte: string;
            format: 'yyyy-MM-dd';
        };
    };
}

export interface EsTermFilter<T extends string|boolean = any> {
    term: {
        [field: string]: T;
    };
}

export interface EsTermsFilter {
    terms: {
        [field: string]: string[];
    };
}

export type EsBooleanFilter = EsTermFilter<boolean>;

export interface EsRangeFilter {
    range: {
        [field: string]: {
            gte: number;
            lte: number;
        };
    };
}

export type EsFilter = EsDateFilter | EsTermFilter | EsTermsFilter | EsBooleanFilter | EsRangeFilter;

// QUERIES

export interface BooleanQuery {
    'bool': {
        must: EsSearchClause;
        filter: EsFilter[];
    };
}

export interface MatchAll {
    match_all: Record<string, never>;
}

export interface SimpleQueryString {
    simple_query_string: {
        query: string;
        fields?: string[];
        lenient: true;
        default_operator: 'or';
    };
}

export type EsSearchClause = MatchAll | SimpleQueryString;

export interface FieldValues { [fieldName: string]: any };
export interface HighlightResult { [fieldName: string]: string[] }

export interface SearchHit {
    _id: string;
    _score: number;
    _source: FieldValues;
    highlight?: HighlightResult;
}
