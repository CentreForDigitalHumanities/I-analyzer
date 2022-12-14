import { EsQuery, EsQuerySorted } from '../services';
import { CorpusField } from './corpus';
import { FoundDocument } from './found-document';
import { AggregateTermFrequencyParameters, DateTermFrequencyParameters } from './visualization';

export interface SearchResults {
    fields?: CorpusField[];
    documents: FoundDocument[];
    total: {
        value: number;
        relation: string;
    };
}

export interface ResultOverview {
    queryText: string;
    resultsCount: number;
};

export interface AggregateQueryFeedback {
    completed: boolean;
    aggregations: AggregateData;
};

export interface AggregateFrequencyResults {
    success: boolean;
    message?: string;
    data?: AggregateResult[];
};

export interface AggregateResult {
    key: string;
    doc_count: number;
    key_as_string?: string;
};


export interface DateFrequencyPair {
    date: Date;
    doc_count: number;
}

export interface DateResult {
    date: Date;
    doc_count: number;
};

export interface AggregateData {
    [fieldName: string]: AggregateResult[];
};

export interface WordSimilarity {
    key: string;
    similarity: number;
    time?: string;
};

export interface RelatedWordsResults {
    total_similarities: WordSimilarity[];
    similarities_over_time: WordSimilarity[];
    time_points: string[];
    similarities_over_time_local_top_n: WordSimilarity[][];
};

export interface NgramResults {
    words: {
        label: string;
        data: number[];
    }[];
    time_points: string[];
}

export type WordInModelResult = {
    exists: true;
} | {
    exists: false;
    similar_keys: string[];
};

export interface QueryFeedback {
    status: 'not in model'|'success'|'error'|'multiple words'|'empty';
    similarTerms?: string[];
}

export type TaskResult = { success: false; message: string } | { success: true; task_ids: string[] };

export interface ResultsDownloadParameters {
    corpus: string;
    es_query: EsQuery | EsQuerySorted;
    fields: string[];
    route: string;
}

export type LimitedResultsDownloadParameters = ResultsDownloadParameters & { size: number } & DownloadOptions;

export type DownloadType = 'search_results' | 'aggregate_term_frequency' | 'date_term_frequency';
export type DownloadStatus = 'done' | 'working' | 'error';
export type DownloadParameters = DateTermFrequencyParameters[] | AggregateTermFrequencyParameters[] | ResultsDownloadParameters;

export interface PendingDownload {
    download_type: DownloadType;
};

export interface Download {
    id: number;
    started: Date;
    completed?: Date;
    download_type: DownloadType;
    corpus: string;
    parameters: string;
    filename?: string;
    status: DownloadStatus;
}

export interface DownloadOptions {
    encoding: 'utf-8'|'utf-16';
}
