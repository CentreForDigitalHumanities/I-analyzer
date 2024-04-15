import { CorpusField } from './corpus';

interface EsTermsAggregator {
    terms: {
        field: string;
        size?: number;
        min_doc_count?: number;
    };
}

export type EsAggregator = EsTermsAggregator;

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
