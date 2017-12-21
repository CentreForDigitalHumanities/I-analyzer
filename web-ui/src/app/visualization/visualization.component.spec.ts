import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { SharedModule } from 'primeng/primeng';

import { BarChartComponent } from './barchart.component';
import { VisualizationComponent } from './visualization.component';
import { SearchService } from '../services/index';
import { Corpus } from '../models/index';
import { SearchQuery } from '../models/query';
import { AggregateResults } from '../models/search-results';

describe('VisualizationComponent', () => {
    let component: VisualizationComponent;
    let fixture: ComponentFixture<VisualizationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, SharedModule],
            declarations: [BarChartComponent, VisualizationComponent],
            providers: [{
                provide: SearchService,
                useValue: new MockSearchService()
            }]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VisualizationComponent);
        component = fixture.componentInstance;
        component.searchQuery = {
            aborted: false,
            completed: new Date(),
            query: { 'match_all': {} },
            transferred: 0
        }
        component.corpus = <any>{ visualize: ['test_field'] };

        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});

class MockSearchService {
    public async searchForVisualization(corpus: Corpus, queryModel: SearchQuery, aggregator: string): Promise<AggregateResults<string>> {
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
