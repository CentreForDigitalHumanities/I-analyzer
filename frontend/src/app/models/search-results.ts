import { CorpusField } from './corpus';
import { FoundDocument } from './found-document';

export type SearchResults = {
    fields?: CorpusField[],
    documents: FoundDocument[],
    total: {
        value: number,
        relation: string
    }
};

export type ResultOverview = {
    queryText: string,
    resultsCount: number
}

export type AggregateQueryFeedback = {
    completed: boolean,
    aggregations: AggregateData
}

export type AggregateFrequencyResults = {
    success: boolean,
    message?: string,
    data?: AggregateResult[];
}

export type AggregateResult = {
    key: string,
    doc_count: number,
    relative_doc_count?: number;
    match_count?: number,
    token_count?: number,
    total_doc_count?: number,
    matches_by_token_count?: number;
    matches_by_doc_count?: number;
    key_as_string?: string
}


export type DateFrequencyPair = {
    date: Date;
    doc_count: number;
};

export type DateResult = {
    date: Date,
    doc_count: number,
    relative_doc_count?: number;
    match_count?: number,
    token_count?: number,
    total_doc_count?: number,
    matches_by_token_count?: number;
    matches_by_doc_count?: number;
}

export type AggregateData = {
    [fieldName: string]: AggregateResult[]
}

export type WordSimilarity = {
    key: string,
    similarity: number
}

export type RelatedWordsResults = {
    similar_words_all: {
        [word: string]: WordSimilarity[]
    },
    similar_words_subsets: {
        [word: string]: number[]
    },
    time_points: string[]
}

export type NgramResults = {
    words: {
        label: string,
        data: number[],
    }[],
    time_points: string[],
};

export type WordInModelResult = {
    exists: true
} | {
    exists: false,
    similar_keys: string[],
};

export type QueryFeedback = {
    status: 'not in model'|'success'|'error',
    similarTerms?: string[],
};
