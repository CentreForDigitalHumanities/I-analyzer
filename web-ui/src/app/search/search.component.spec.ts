import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Observable } from 'rxjs';

import { CalendarModule, CheckboxModule, DialogModule, SelectButtonModule, SliderModule, MultiSelectModule } from 'primeng/primeng';

import * as corpus from '../../mock-data/corpus';
import { ApiService, CorpusService, DownloadService, ElasticSearchService, LogService, QueryService, SearchService, SessionService, UserService } from '../services/index';
import { ApiServiceMock } from '../services/api.service.mock';
import { ElasticSearchServiceMock } from '../services/elastic-search.service.mock';

import { HighlightPipe } from './highlight.pipe';
import { SearchComponent } from './search.component';
import { SearchFilterComponent } from './search-filter.component';
import { SearchRelevanceComponent } from './search-relevance.component';
import { SearchResultsComponent } from './search-results.component';

import { DocumentViewComponent } from '../document-view/document-view.component';
import { BarChartComponent } from '../visualization/barchart.component';
import { VisualizationComponent } from '../visualization/visualization.component'
import { UserServiceMock } from '../services/user.service.mock';

describe('SearchComponent', () => {
    let component: SearchComponent;
    let fixture: ComponentFixture<SearchComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HighlightPipe, DocumentViewComponent, SearchComponent, SearchFilterComponent, SearchRelevanceComponent, SearchResultsComponent, VisualizationComponent, BarChartComponent],
            imports: [FormsModule, CalendarModule, CheckboxModule, DialogModule, SelectButtonModule, SliderModule, MultiSelectModule, RouterTestingModule.withRoutes([])],
            providers: [
                CorpusService,
                {
                    provide: ApiService, useValue: new ApiServiceMock({
                        ['corpus']: corpus.MockCorpusResponse
                    })
                },
                DownloadService,
                {
                    provide: ElasticSearchService, useValue: new ElasticSearchServiceMock()
                },
                LogService,
                QueryService,
                SearchService,
                {
                    provide: ActivatedRoute, useValue: {
                        paramMap: Observable.of(<{ corpus: corpus.MockCorpusName }>{ corpus: 'test1' }).map(convertToParamMap)
                    }
                },
                SessionService,
                {
                    provide: UserService, useValue: new UserServiceMock()
                },
                {
                    provide: Router, useValue: new RouterMock()
                }]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});

class RouterMock {

}
