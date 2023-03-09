import { BehaviorSubject } from 'rxjs';
import { CorpusField } from './corpus';
import { EsFilter } from './elasticsearch';

abstract class SearchFilter<FilterData> {
	corpusField: CorpusField;
	defaultData: FilterData;
	data: BehaviorSubject<FilterData>;

	constructor(corpusField: CorpusField) {
		this.corpusField = corpusField;
		this.defaultData = this.makeDefaultData(corpusField.searchFilter);
		this.data = new BehaviorSubject<FilterData>(this.defaultData);
	}

    get currentData() {
		return this.data?.value;
	}

	reset() {
		this.data.next(this.defaultData);
	}

	abstract makeDefaultData(filterDefinition): FilterData;

	/**
	 * filter for one specific value (used to find documents from
	 * the same day, page, publication, etc. as a specific document)
	 */
	abstract setToValue(value: any): void;

	/**
	 * set value based on route parameter
	 */
	abstract setFromParam(param: string): void;

	abstract toRouteParam(): {[param: string]: any};

	/**
	 * export as filter specification in elasticsearch query language
	 */
	abstract toEsFilter(): EsFilter;
}
