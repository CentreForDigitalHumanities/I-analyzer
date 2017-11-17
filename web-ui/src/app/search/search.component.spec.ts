import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Observable } from 'rxjs';

import { CalendarModule, SelectButtonModule, SliderModule } from 'primeng/primeng';

import * as corpus from '../../mock-data/corpus';
import { ApiService, CorpusService, ElasticSearchService, LogService, QueryService, SearchService, SessionService, UserService } from '../services/index';
import { ApiServiceMock } from '../services/api.service.mock';
import { ElasticSearchServiceMock } from '../services/elastic-search.service.mock';

import { HighlightPipe } from './highlight-pipe';
import { SearchComponent } from './search.component';
import { SearchFilterComponent } from './search-filter.component';
import { SearchSampleComponent } from './search-sample.component';

import { VisualizationComponent } from '../visualization/visualization.component';

describe('SearchComponent', () => {
    let component: SearchComponent;
    let fixture: ComponentFixture<SearchComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HighlightPipe, SearchComponent, SearchFilterComponent, SearchSampleComponent, VisualizationComponent],
            imports: [FormsModule, CalendarModule, SelectButtonModule, SliderModule, RouterTestingModule.withRoutes([])],
            providers: [
                CorpusService,
                {
                    provide: ApiService, useValue: new ApiServiceMock({
                        ['corpus']: corpus.foo
                    })
                },
                {
                    provide: ElasticSearchService, useValue: new ElasticSearchServiceMock()
                },
                LogService,
                QueryService,
                SearchService,
                {
                    provide: ActivatedRoute, useValue: {
                        params: Observable.of({ corpus: 'test1' })
                    }
                },
                SessionService,
                UserService]
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
