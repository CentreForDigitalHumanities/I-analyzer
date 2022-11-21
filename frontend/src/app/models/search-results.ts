import { EsQuery, EsQuerySorted } from '../services';
import { CorpusField } from './corpus';
import { FoundDocument } from './found-document';
import { AggregateTermFrequencyParameters, DateTermFrequencyParameters } from './visualization';

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
    doc_count: number
    key_as_string?: string
}


export type DateFrequencyPair = {
    date: Date;
    doc_count: number;
};

export type DateResult = {
    date: Date,
    doc_count: number,
}

export type AggregateData = {
    [fieldName: string]: AggregateResult[]
}

export type WordSimilarity = {
    key: string,
    similarity: number,
    time?: string,
}

export type RelatedWordsResults = {
    total_similarities: WordSimilarity[],
    similarities_over_time: WordSimilarity[],
    time_points: string[],
    similarities_over_time_local_top_n: WordSimilarity[][],
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
    status: 'not in model'|'success'|'error'|'multiple words'|'empty',
    similarTerms?: string[],
};

export type TaskResult = { success: false, message: string } | { success: true, task_id: string }

export type ResultsDownloadParameters = {
    corpus: string,
    es_query: EsQuery | EsQuerySorted,
    fields: string[],
    route: string,
};

export type LimitedResultsDownloadParameters = ResultsDownloadParameters & { size: number } & DownloadOptions;

export type DownloadType = 'search_results' | 'aggregate_term_frequency' | 'date_term_frequency'
export type DownloadStatus = 'done' | 'working' | 'error';
export type DownloadParameters = DateTermFrequencyParameters[] | AggregateTermFrequencyParameters[] | ResultsDownloadParameters;

export type PendingDownload = {
    download_type: DownloadType,
}

export type Download = {
    id: number,
    started: Date,
    completed?: Date,
    download_type: DownloadType,
    corpus: string,
    parameters: string,
    filename?: string,
    status: DownloadStatus,
};

export type DownloadOptions = {
    encoding: 'utf-8'|'utf-16';
};
