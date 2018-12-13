import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { SharedModule, DropdownModule } from 'primeng/primeng';
import { ChartModule } from 'primeng/chart'
import { TableModule } from 'primeng/table';

import { BarChartComponent } from './barchart.component';
import { WordcloudComponent } from './wordcloud.component';
import { FreqtableComponent } from './freqtable.component'
import { TimelineComponent } from './timeline.component';
import { RelatedWordsComponent } from './related-words.component';
import { VisualizationComponent } from './visualization.component';
import { ApiService, DataService, SearchService } from '../services/index';
import { ApiServiceMock } from '../services/api.service.mock';
import { AggregateQueryFeedback, Corpus, QueryModel } from '../models/index';

describe('VisualizationComponent', () => {
    let component: VisualizationComponent;
    let fixture: ComponentFixture<VisualizationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, ChartModule, SharedModule, DropdownModule, TableModule],
            declarations: [BarChartComponent, FreqtableComponent, RelatedWordsComponent, TimelineComponent, WordcloudComponent, VisualizationComponent],
            providers: [
                {
                    provide: SearchService,
                    useValue: new MockSearchService()
                },
                DataService, 
                { provide: ApiService, useValue: new ApiServiceMock() }]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VisualizationComponent);
        component = fixture.componentInstance;
        component.corpus = <any>{
            fields: [{
                displayName: 'Test Field', name: 'test_field'
            }]
        };
        component.searchResults = {
            completed: true,
            documents: [createDocument({
                'a': '1',
                'b': '2',
                'c': 'Hide-and-seek!'
            }, '1', 1, 1),
            createDocument({
                'a': '3',
                'b': '4',
                'c': 'Wally is here'
            }, '2', 0.5, 2)],
            retrieved: 2,
            total: 2,
            queryModel: {
                queryText: '',
                filters: []
            }};
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});

function createDocument(fieldValues: { [name: string]: string }, id: string, relevance: number, position) {
    return { id, relevance, fieldValues, position };
}


class MockSearchService {
    public async searchForVisualization(corpus: Corpus, queryModel: QueryModel, aggregator: string): Promise<AggregateQueryFeedback> {
        return {
            completed: false,
            aggregations: {
                aggregator: [{
                    key: '1999',
                    doc_count: 200
                }, {
                    key: '2000',
                    doc_count: 300
                }, {
                    key: '2001',
                    doc_count: 400
                }]
            }
        };
    }
}
