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

export type EsAggregator = EsTermsAggregator | EsDateHistogramAggregator;

export abstract class Aggregator {
    name: string;

    abstract toEsAggregator(): EsAggregator;
}

export class TermsAggregator extends Aggregator {
    constructor(
        private field: CorpusField,
        private maxSize?: number,
        private minDocCount?: number
    ) {
        super();
        this.name = field.name;
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
}

export class DateHistogramAggregator extends Aggregator {
    constructor(
        private field: CorpusField,
        private timeInterval?: string,
    ) {
        super();
        this.name = field.name;
    }

    toEsAggregator(): EsDateHistogramAggregator {
        return {
            date_histogram: {
                field: this.field.name,
                calendar_interval: this.timeInterval,
            }
        };
    }
}
