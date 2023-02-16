import { Injectable } from '@angular/core';

import { QueryModel } from '../models';
import { ParamService } from './param.service';

@Injectable()
export class ChartOptionsService {

    constructor(private paramService: ParamService) { }

    getChartHeader(chartType: string, corpusName: string, queryModel?: QueryModel, visualizationOptions?: string) {
        let subtitle = [
            `Searched corpus: ${corpusName}`
        ]
        if (queryModel.queryText) {
            subtitle.push(`Query: ${queryModel.queryText}`);
        }
        const fields = this.representFields(queryModel);
        if (fields) {
            subtitle.push(`Searched in fields: ${fields}`);
        }
        const filters = this.representFilters(queryModel);
        if (filters) {
            subtitle.push(`Search filters: ${filters}`);
        }
        if (visualizationOptions) {
            subtitle.push(`Visualization options: ${visualizationOptions}`)
        }

        return {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: chartType,
                align: 'center',
            },
            subtitle: {
                display: true,
                text: subtitle,
                align: 'start',
                padding: {
                    bottom: 20
                }
            },
        }

    }

    private representFields(queryModel: QueryModel): string {
        return queryModel.fields ? `${queryModel.fields.join(',')}` : ``
    }

    private representFilters(queryModel: QueryModel): string {
        if (queryModel.filters) {
            return queryModel.filters.map(filter => {
                const params = this.paramService.searchFilterDataToParam(filter);
                const fieldInfo = `${filter.fieldName}=`
                return fieldInfo.concat(`${decodeURIComponent(params)}`)
            }).join('& ')
        }
    }
}
