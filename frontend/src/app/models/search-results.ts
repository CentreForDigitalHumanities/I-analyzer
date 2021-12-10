import { CorpusField } from './corpus';
import { FoundDocument } from './found-document';

export type SearchResults = {
    fields?: CorpusField[],
    documents: FoundDocument[],
    total: {
        value: number,
        relation: string
    }
}

export type ResultOverview = {
    queryText: string,
    resultsCount: number
}

export type AggregateQueryFeedback = {
    completed: boolean,
    aggregations: AggregateData
}

export type AggregateResult = {
    key: string,
    doc_count: number,
    match_count?: number,
    word_count?: number,
    key_as_string?: string
}


export type DateFrequencyPair = {
    date: Date;
    doc_count: number;
}

export type TimelineData = {
    data: DateFrequencyPair[];
    timeInterval: string;
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
        [word: string]: number[]
    }
    time_points: string[];
}
