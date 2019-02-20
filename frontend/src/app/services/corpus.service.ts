import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { ApiRetryService } from './api-retry.service';
import { UserService } from './user.service';
import { Corpus, CorpusField, SearchFilter } from '../models/corpus';
import { SearchFilterData } from '../models';
import { stringify } from '@angular/compiler/src/util';

@Injectable()
export class CorpusService {
    private currentCorpusSubject = new BehaviorSubject<Corpus | undefined>(undefined);

    public currentCorpus = this.currentCorpusSubject.asObservable();

    constructor(private apiRetryService: ApiRetryService, private userService: UserService) {
    }

    /**
     * Sets a corpus and returns a boolean indicating whether the corpus exists and is accessible.
     * @param corpusName Name of the corpus
     */
    public set(corpusName: string): Promise<boolean> {
        if (this.currentCorpusSubject.value && this.currentCorpusSubject.value.name == corpusName) {
            // no need to retrieve the corpus again if nothing changed
            return Promise.resolve(true);
        }
        return this.get().then(all => {
            let corpus = all.find(c => c.name == corpusName);
            if (!corpus) {
                return false;
            } else {
                this.currentCorpusSubject.next(corpus);
                return true;
            }
        })
    }

    public get(): Promise<Corpus[]> {
        return this.apiRetryService.requireLogin(api => api.corpus()).then(data => this.parseCorpusList(data));
    }

    private async parseCorpusList(data: any): Promise<Corpus[]> {
        let currentUser = await this.userService.getCurrentUser();
        let availableCorpora = Object.keys(data).filter(name => currentUser.canAccessCorpus(name));
        return availableCorpora.map(corpus => this.parseCorpusItem(corpus, data[corpus]));
    }

    private parseCorpusItem(name: string, data: any): Corpus {
        let allFields: CorpusField[] = data.fields.map(item => this.parseField(item));
        return new Corpus(
            data.server_name,
            name,
            data.title,
            data.description,
            data.es_doctype,
            data.es_index,
            allFields,
            this.parseDate(data.min_date),
            this.parseDate(data.max_date),
            data.image,
            data.scan_image_type,
            data.allow_image_download,
            data.word_models_present,
            data.description_page);
    }

    private parseField(data: any): CorpusField {
        return {
            description: data.description,
            displayName: data.display_name || data.name,
            displayType: data.display_type || data['es_mapping'].type,
            resultsOverview: data.results_overview,
            csvCore: data.csv_core,
            searchFieldCore: data.search_field_core,
            visualizationType: data.visualization_type,
            visualizationSort: data.visualization_sort,
            hidden: data.hidden,
            sortable: data.sortable,
            searchable: data.searchable,
            downloadable: data.downloadable,
            name: data.name,
            searchFilter: data['search_filter'] ? this.parseSearchFilter(data['search_filter'], data['name']) : null
        }
    }

    private parseSearchFilter(filter: any, fieldName: string): SearchFilter {
        let defaultData: any;
        switch (filter.name) {
            case 'BooleanFilter':
                defaultData = {
                    filterType: filter.name,
                    checked: false
                }
                break;
            case 'MultipleChoiceFilter':
                defaultData = {
                    filterType: filter.name,
                    options: filter.options,
                    selected: []
                }
                break;
            case 'RangeFilter':
                defaultData = {
                    filterType: filter.name,
                    min: filter.lower,
                    max: filter.upper
                }
                break;
            case 'DateFilter':
                defaultData = {
                    filterType: filter.name,
                    min: new Date(filter.lower),
                    max: new Date(filter.upper)
                }
                break;
        }
        return {
            fieldName: fieldName,
            description: filter.description,
            useAsFilter: false,
            defaultData: defaultData,
            currentData: defaultData
        }
    }

    private parseDate(date: any): Date {
        // months are zero-based!
        return new Date(date.year, date.month - 1, date.day, date.hour, date.minute);
    }
}
