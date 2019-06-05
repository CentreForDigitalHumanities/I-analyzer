import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { Observable } from 'rxjs';

import { SharedModule, DropdownModule } from 'primeng/primeng';
import { ChartModule } from 'primeng/chart'
import { TableModule } from 'primeng/table';

import { BarChartComponent } from './barchart.component';
import { WordcloudComponent } from './wordcloud.component';
import { FreqtableComponent } from './freqtable.component'
import { TimelineComponent } from './timeline.component';
import { RelatedWordsComponent } from './related-words.component';
import { VisualizationComponent } from './visualization.component';
import { ApiService, ApiRetryService, ElasticSearchService, LogService, QueryService, SearchService, UserService } from '../services/index';
import { ApiServiceMock } from '../services/api.service.mock';
import { ElasticSearchServiceMock } from '../services/elastic-search.service.mock';
import { UserServiceMock } from '../services/user.service.mock';
import { TermFrequencyComponent } from './term-frequency.component';

describe('VisualizationComponent', () => {
    let component: VisualizationComponent;
    let fixture: ComponentFixture<VisualizationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, ChartModule, SharedModule, DropdownModule, TableModule],
            declarations: [BarChartComponent, FreqtableComponent, RelatedWordsComponent, TermFrequencyComponent, TimelineComponent, WordcloudComponent, VisualizationComponent],
            providers: [
                {

                    provide: ApiService, useValue: new ApiServiceMock()
                },
                ApiRetryService,
                {
                    provide: ElasticSearchService, useValue: new ElasticSearchServiceMock()
                },
                LogService,
                QueryService,
                SearchService,
                {
                    provide: UserService, useValue: new UserServiceMock()
                }
            ],
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
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
    
    afterAll(() => {
        fixture.destroy();
    });
});