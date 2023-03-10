import * as _ from 'lodash';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { CorpusField } from './corpus';
import { EsBooleanFilter, EsDateFilter, EsFilter, EsTermsFilter, EsRangeFilter, EsTermFilter } from './elasticsearch';
import { BooleanFilterOptions, DateFilterOptions, FilterOptions, MultipleChoiceFilterOptions,
    RangeFilterOptions } from './search-filter-options';

abstract class AbstractSearchFilter<FilterData, EsFilterType extends EsFilter> {
	corpusField: CorpusField;
	defaultData: FilterData;
	data: BehaviorSubject<FilterData>;

	constructor(corpusField: CorpusField) {
		this.corpusField = corpusField;
		this.defaultData = this.makeDefaultData(corpusField.filterOptions);
		this.data = new BehaviorSubject<FilterData>(this.defaultData);
	}

    get currentData() {
		return this.data?.value;
	}

	reset() {
		this.data.next(this.defaultData);
	}

    /**
     * set value based on route parameter
     */
    setFromParam(param: string): void {
        this.data.next(this.dataFromString(param));
    }

    /**
     * filter for one specific value (used to find documents from
     * the same day, page, publication, etc. as a specific document)
     */
    setToValue(value: any) {
        this.data.next(this.dataFromValue(value));
    }

    toRouteParam(): {[param: string]: any} {
        return {
            [this.corpusField.name]: this.dataToString(this.currentData)
        };
    }

	abstract makeDefaultData(filterOptions: FilterOptions): FilterData;

	abstract dataFromValue(value: any): FilterData;

	abstract dataFromString(value: string): FilterData;

	abstract dataToString(data: FilterData): string;

	/**
	 * export as filter specification in elasticsearch query language
	 */
	abstract toEsFilter(): EsFilterType;

    abstract dataFromEsFilter(esFilter: EsFilterType): FilterData;
}

interface DateFilterData {
	min: Date;
	max: Date;
}

export class DateFilter extends AbstractSearchFilter<DateFilterData, EsDateFilter> {
	makeDefaultData(filterOptions: DateFilterOptions) {
		return {
			min: this.parseDate(filterOptions.lower),
			max: this.parseDate(filterOptions.upper)
		};
	}

	dataFromValue(value: Date) {
		return {
			min: value,
			max: value,
		};
	}

	dataFromString(value: string) {
		const [minString, maxString] = parseMinMax(value.split(','));
		return {
			min: this.parseDate(minString),
			max: this.parseDate(maxString),
		};
	}

	dataToString(data: DateFilterData) {
		const min = this.formatDate(data.min);
		const max = this.formatDate(data.max);
		return `${min}:${max}`;
	}

	toEsFilter(): EsDateFilter {
		return {
			range: {
				[this.corpusField.name]: {
					gte: this.formatDate(this.currentData.min),
					lte: this.formatDate(this.currentData.max),
					format: 'yyyy-MM-dd'
				}
			}
		};
	}

    dataFromEsFilter(esFilter: EsDateFilter): DateFilterData {
        const data = _.first(_.values(esFilter.range));
        const min = this.parseDate(data.gte);
        const max = this.parseDate(data.lte);
        return { min, max };
    }

	private formatDate(date: Date): string {
		return moment(date).format('YYYY-MM-DD');
	}

    private parseDate(dateString: string): Date {
        return moment(dateString, 'YYYY-MM-DD').toDate();
    }
}

export class BooleanFilter extends AbstractSearchFilter<boolean, EsBooleanFilter> {

    makeDefaultData(filterOptions: BooleanFilterOptions) {
        return false;
    }

    dataFromValue(value: any): boolean {
        return value as boolean;
    }

    dataFromString(value: string): boolean {
        return value === 'true';
	}

    dataToString(data: boolean): string {
        return data.toString();
    }

    toEsFilter(): EsBooleanFilter {
        return {
            term: {
                [this.corpusField.name]: this.currentData
            }
        };
    }

    dataFromEsFilter(esFilter: EsBooleanFilter): boolean {
        const data = _.first(_.values(esFilter.term));
        return data;
    }
}

type MultipleChoiceFilterData = string[];

export class MultipleChoiceFilter extends AbstractSearchFilter<MultipleChoiceFilterData, EsTermsFilter> {
    makeDefaultData(filterOptions: MultipleChoiceFilterOptions): MultipleChoiceFilterData {
        return [];
    }

    dataFromValue(value: any): MultipleChoiceFilterData {
        return [value.toString()];
    }

    dataFromString(value: string): MultipleChoiceFilterData {
        return value.split(',');
    }

    dataToString(data: MultipleChoiceFilterData): string {
        return data.join(',');
    }

    toEsFilter(): EsTermsFilter {
        return {
            terms: {
                [this.corpusField.name]: this.currentData
            }
        };
    }

    dataFromEsFilter(esFilter: EsTermsFilter): MultipleChoiceFilterData {
        return _.first(_.values(esFilter.terms));
    }
}

interface RangeFilterData {
    min: number;
    max: number;
}

export class RangeFilter extends AbstractSearchFilter<RangeFilterData, EsRangeFilter> {
    makeDefaultData(filterOptions: RangeFilterOptions): RangeFilterData {
        return {
			min: filterOptions.lower,
			max: filterOptions.upper
		};
    }

    dataFromValue(value: number): RangeFilterData {
        return { min: value, max: value };
    }

    dataFromString(value: string): RangeFilterData {
        const [minString, maxString] = parseMinMax(value.split(','));
        return {
            min: parseFloat(minString),
            max: parseFloat(maxString)
        };
    }

    dataToString(data: RangeFilterData): string {
        return `${data.min},${data.max}`;
    }

    toEsFilter(): EsRangeFilter {
        return {
            range: {
                [this.corpusField.name]: {
                    gte: this.currentData.min,
                    lte: this.currentData.max,
                }
            }
        };
    }

    dataFromEsFilter(esFilter: EsRangeFilter): RangeFilterData {
        const data = _.first(_.values(esFilter.range));
        const min = data.gte;
        const max = data.lte;
        return { min, max };
    }
}

export class AdHocFilter extends AbstractSearchFilter<any, EsTermFilter> {
    makeDefaultData(filterOptions: FilterOptions) {}

    dataFromValue(value: any) {
        return value;
    }

    dataFromString(value: string) {
        return value;
    }

    dataToString(data: any): string {
        return data.toString();
    }

    toEsFilter(): EsTermFilter {
        return {
            term: {
                [this.corpusField.name]: this.currentData
            }
        };
    }

    dataFromEsFilter(esFilter: EsTermFilter): string {
        const data = _.first(_.values(esFilter.term));
        return data;
    }
}

const parseMinMax = (value: string[]): [string, string] => {
    const term = value[0];
    if (term.split(':').length === 2) {
        return term.split(':') as [string, string];
    } else if (value.length === 1) {
        return [term, term];
    } else {
        return [value[0], value[1]];
    }
};

export type SearchFilter = DateFilter | MultipleChoiceFilter | RangeFilter | BooleanFilter | AdHocFilter;
