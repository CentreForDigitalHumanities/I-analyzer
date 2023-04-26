import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import * as moment from 'moment';

import {
    Corpus,
    CorpusField,
    DocumentContext,
    SearchFilter,
    SearchFilterData,
} from '../models/index';
import { ApiRetryService } from './api-retry.service';
import { AuthService } from './auth.service';
import { findByName } from '../utils/utils';

@Injectable()
export class CorpusService {
    private currentCorpusSubject = new BehaviorSubject<Corpus | undefined>(
        undefined
    );

    public currentCorpus = this.currentCorpusSubject.asObservable();

    public corporaPromise: Promise<Corpus[]>;

    constructor(
        private apiRetryService: ApiRetryService,
        private authService: AuthService
    ) {
        this.parseField = this.parseField.bind(this);
    }

    /**
     * Sets a corpus and returns a boolean indicating whether the corpus exists and is accessible.
     *
     * @param corpusName Name of the corpus
     */
    public set(corpusName: string): Promise<boolean> {
        if (
            this.currentCorpusSubject.value &&
            this.currentCorpusSubject.value.name === corpusName
        ) {
            // no need to retrieve the corpus again if nothing changed
            return Promise.resolve(true);
        }
        return this.get().then((all) => {
            const corpus = findByName(all, corpusName);
            if (!corpus) {
                return false;
            } else {
                this.currentCorpusSubject.next(corpus);
                return true;
            }
        });
    }

    /**
     * retrieve the available corpora
     *
     * @param refresh if `true`, forces the corpus list to be requested from the backend
     * regardless of whether a list of corpora has already been loaded.
     * @returns Promise object with list of all corpora
     */
    public get(refresh = false): Promise<Corpus[]> {
        if (!refresh && this.corporaPromise) {
            return this.corporaPromise;
        } else {
            this.corporaPromise = this.apiRetryService
                .requireLogin((api) => api.corpus().toPromise())
                .then((data) => this.parseCorpusList(data));
            return this.corporaPromise;
        }
    }

    private async parseCorpusList(data: any): Promise<Corpus[]> {
        return data.map(this.parseCorpusItem);
    }

    private parseCorpusItem = (data: any): Corpus => {
        const allFields: CorpusField[] = data.fields.map(this.parseField);
        return new Corpus(
            data.server_name,
            data.name,
            data.title,
            data.description,
            data.es_index,
            allFields,
            this.parseDate(data.min_date),
            this.parseDate(data.max_date),
            data.image,
            data.scan_image_type,
            data.allow_image_download,
            data.word_models_present,
            data.languages,
            data.category,
            data.description_page,
            this.parseDocumentContext(data.document_context, allFields),
        );
    };

    private parseField = (data: any): CorpusField => ({
        description: data.description,
        displayName: data.display_name || data.name,
        displayType: data.display_type || data['es_mapping']?.type,
        resultsOverview: data.results_overview,
        csvCore: data.csv_core,
        searchFieldCore: data.search_field_core,
        visualizations: data.visualizations,
        visualizationSort: data.visualization_sort,
        multiFields: data['es_mapping']?.fields
            ? Object.keys(data['es_mapping'].fields)
            : undefined,
        hidden: data.hidden,
        sortable: data.sortable,
        primarySort: data.primary_sort,
        searchable: data.searchable,
        downloadable: data.downloadable,
        name: data.name,
        searchFilter: data['search_filter']
            ? this.parseSearchFilter(data['search_filter'], data['name'])
            : null,
        mappingType: data.es_mapping?.type,
    });

    private parseSearchFilter(
        filter: any,
        fieldName: string
    ): SearchFilter<SearchFilterData> {
        let defaultData: any;
        switch (filter.name) {
            case 'BooleanFilter':
                defaultData = {
                    filterType: filter.name,
                    checked: false,
                };
                break;
            case 'MultipleChoiceFilter':
                defaultData = {
                    filterType: filter.name,
                    optionCount: filter.option_count,
                    selected: [],
                };
                break;
            case 'RangeFilter':
                defaultData = {
                    filterType: filter.name,
                    min: filter.lower,
                    max: filter.upper,
                };
                break;
            case 'DateFilter':
                defaultData = {
                    filterType: filter.name,
                    min: this.formatDate(new Date(filter.lower)),
                    max: this.formatDate(new Date(filter.upper)),
                };
                break;
        }
        return {
            fieldName,
            description: filter.description,
            useAsFilter: false,
            defaultData,
            currentData: defaultData,
        };
    }

    private parseDate(date: any): Date {
        // months are zero-based!
        return new Date(
            date.year,
            date.month - 1,
            date.day,
            date.hour,
            date.minute
        );
    }

    /**
     * Return a string of the form 0123-04-25.
     */
    private formatDate(date: Date): string {
        return moment(date).format().slice(0, 10);
    }

    private parseDocumentContext(
        data: {
            context_fields: string[] | null;
            sort_field: string | null;
            context_display_name: string | null;
            sort_direction: 'string' | null;
        },
        allFields: CorpusField[]
    ): DocumentContext {
        if (!data || !data.context_fields) {
            return undefined;
        }

        const contextFields = allFields.filter((field) =>
            data.context_fields.includes(field.name)
        );

        if (!contextFields) {
            return undefined;
        }

        const sortField = allFields.find(
            (field) => field.name === data.sort_field
        );
        const displayName = data.context_display_name || contextFields[0].name;
        const sortDirection = (data.sort_direction as 'asc' | 'desc') || 'asc';

        return {
            contextFields,
            sortField,
            displayName,
            sortDirection,
        };
    }
}
