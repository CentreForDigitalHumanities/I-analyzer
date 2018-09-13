import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { SharedModule, DropdownModule } from 'primeng/primeng';

import { BarChartComponent } from './barchart.component';
import { WordcloudComponent } from './wordcloud.component';
import { FreqtableComponent } from './freqtable.component'
import { TimelineComponent } from './timeline.component';
import { VisualizationComponent } from './visualization.component';
import { ApiService, DataService, SearchService } from '../services/index';
import { ApiServiceMock } from '../services/api.service.mock';
import { SingleAggregateResults, Corpus, QueryModel } from '../models/index';

describe('VisualizationComponent', () => {
    let component: VisualizationComponent;
    let fixture: ComponentFixture<VisualizationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, SharedModule, DropdownModule],
            declarations: [BarChartComponent, FreqtableComponent, TimelineComponent, WordcloudComponent, VisualizationComponent],
            providers: [
                {
                    provide: SearchService,
                    useValue: new MockSearchService()
                }, 
                { provide: ApiService, useValue: new ApiServiceMock() },
            DataService]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VisualizationComponent);
        component = fixture.componentInstance;
        component.queryModel = {
            queryText: "Wally"
        }
        component.corpus = <any>{ visualize: ['test_field'] };

        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});

class MockSearchService {
    public async searchForVisualization(corpus: Corpus, queryModel: QueryModel, aggregator: string): Promise<SingleAggregateResults> {
        return {
            completed: false,
            aggregations: [{
                key: '1999',
                doc_count: 200
            }, {
                key: '2000',
                doc_count: 300
            }, {
                key: '2001',
                doc_count: 400
            }]
        };
    }
}
