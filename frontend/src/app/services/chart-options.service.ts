import { Injectable, Type } from '@angular/core';

import { QueryModel, searchFilterDataToParam } from '../models';

@Injectable()
export class ChartOptionsService {

    constructor() { }

    getChartHeader(chartType: string,  corpusName: string, queries?: string, queryModel?: QueryModel, visualizationOptions?: string) {
        let subtitle = [
            `Searched corpus: ${corpusName}`
        ]
        if (queries) {
            subtitle.push(`Query: ${queries}`);
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
                const params = searchFilterDataToParam(filter);
                const fieldInfo = `${filter.fieldName}=`
                if (typeof(params) !== 'string') {
                    return fieldInfo.concat(`${params.map(m => decodeURIComponent(m)).join(',')}`)
                } else {
                    return fieldInfo.concat(`${decodeURIComponent(params)}`)
                }
            }).join('& ')
        }
    }
}
