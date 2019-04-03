import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Observable } from 'rxjs';

import { CalendarModule, CheckboxModule, DialogModule, DropdownModule, SelectButtonModule, SliderModule, MultiSelectModule, TabViewModule, ConfirmDialogModule } from 'primeng/primeng';
import { ChartModule } from 'primeng/chart'
import { TableModule } from 'primeng/table';

import * as corpus from '../../mock-data/corpus';
import { ApiService, ApiRetryService, CorpusService, DataService, DialogService, ElasticSearchService, LogService, QueryService, SearchService, SessionService, UserService, NotificationService } from '../services/index';
import { ApiServiceMock } from '../services/api.service.mock';
import { ElasticSearchServiceMock } from '../services/elastic-search.service.mock';
import { DialogServiceMock } from '../services/dialog.service.mock';

import { HighlightPipe } from './highlight.pipe';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { SearchComponent } from './search.component';
import { SearchFilterComponent } from './search-filter.component';
import { SearchRelevanceComponent } from './search-relevance.component';
import { SearchResultsComponent } from './search-results.component';
import { SearchSortingComponent } from './search-sorting.component';
import { SelectFieldComponent } from './select-field.component';
import { DownloadComponent } from './download.component';

import { BalloonDirective } from '../balloon.directive';
import { DocumentViewComponent } from '../document-view/document-view.component';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { BarChartComponent } from '../visualization/barchart.component';
import { RelatedWordsComponent } from '../visualization/related-words.component';
import { TimelineComponent } from '../visualization/timeline.component';
import { WordcloudComponent } from '../visualization/wordcloud.component';
import { FreqtableComponent } from '../visualization/freqtable.component';
import { VisualizationComponent } from '../visualization/visualization.component';
import { UserServiceMock } from '../services/user.service.mock';
import { ScanPdfComponent } from '../document-view/scan-pdf.component'


describe('SearchComponent', () => {
    let component: SearchComponent;
    let fixture: ComponentFixture<SearchComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [BalloonDirective, BarChartComponent, DownloadComponent, FreqtableComponent, HighlightPipe, DocumentViewComponent, DropdownComponent, ScanPdfComponent, PdfViewerComponent, RelatedWordsComponent, SearchComponent, SearchFilterComponent, SearchRelevanceComponent, SearchResultsComponent, SearchSortingComponent, SelectFieldComponent, TimelineComponent, VisualizationComponent, WordcloudComponent],
            imports: [ChartModule, FormsModule, CalendarModule, CheckboxModule, ConfirmDialogModule, DropdownModule, DialogModule, SelectButtonModule, SliderModule, MultiSelectModule, TabViewModule, TableModule, RouterTestingModule.withRoutes([])],
            providers: [
                ApiRetryService,
                CorpusService,
                {
                    provide: ApiService, useValue: new ApiServiceMock({
                        ['corpus']: corpus.MockCorpusResponse
                    })
                },
                DataService,
                {
                    provide: ElasticSearchService, useValue: new ElasticSearchServiceMock()
                },
                LogService,
                {
                    provide: DialogService, useClass: DialogServiceMock
                },
                NotificationService,
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
