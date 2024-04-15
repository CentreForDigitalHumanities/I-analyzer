import { CorpusField } from './corpus';

interface EsTermsAggregator {
    terms: {
        field: string;
        size?: number;
        min_doc_count?: number;
    };
}

interface EsDateHistogramAggregator {
    date_histogram: {
        field: string;
        calendar_interval?: string;
    };
}

interface EsMinAggregator {
    min: {
        field: string;
    };
}

interface EsMaxAggregator {
    max: {
        field: string;
    };
}

export type EsAggregator = EsTermsAggregator | EsDateHistogramAggregator | EsMinAggregator | EsMaxAggregator;

export abstract class Aggregator<Result> {
    abstract aggName: string;

    constructor(protected field: CorpusField) {
    }

    get name(): string {
        return `${this.aggName}_${this.field.name}`;
    }

    abstract toEsAggregator(): EsAggregator;

    abstract parseEsResult(data: any): Result;
}

export interface TermsResult {
    key: string;
    doc_count: number;
}

export class TermsAggregator extends Aggregator<TermsResult[]> {
    aggName = 'terms';

    constructor(
        field: CorpusField,
        private maxSize?: number,
        private minDocCount?: number
    ) {
        super(field);
    }

    toEsAggregator(): EsTermsAggregator {
        return {
            terms: {
                field: this.field.name,
                size: this.maxSize,
                min_doc_count: this.minDocCount,
            }
        };
    }

    parseEsResult(data: any): TermsResult[] {
        return data.buckets as TermsResult[];
    }
}

export interface DateHistogramResult {
    key: number;
    key_as_string: string;
    doc_count: number;
}

export class DateHistogramAggregator extends Aggregator<DateHistogramResult[]> {
    aggName = 'date_histogram';

    constructor(
        field: CorpusField,
        private timeInterval?: string,
    ) {
        super(field);
    }

    toEsAggregator(): EsDateHistogramAggregator {
        return {
            date_histogram: {
                field: this.field.name,
                calendar_interval: this.timeInterval,
            }
        };
    }

    parseEsResult(data: any): DateHistogramResult[] {
        return data.buckets as DateHistogramResult[];
    }
}


export class MinAggregator extends Aggregator<number> {
    aggName = 'min';

    toEsAggregator(): EsMinAggregator {
        return {
            min: { field: this.field.name }
        };
    }

    parseEsResult(data: any): number {
        return data.value as number;
    }
}

export class MaxAggregator extends Aggregator<number> {
    aggName = 'max';

    toEsAggregator(): EsMaxAggregator {
        return {
            max: { field: this.field.name }
        };
    }

    parseEsResult(data: any): number {
        return data.value as number;
    }
}
