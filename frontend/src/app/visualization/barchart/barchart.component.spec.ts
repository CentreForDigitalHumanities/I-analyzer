import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ApiService, ApiRetryService, ElasticSearchService, LogService, QueryService, SearchService, UserService, DialogService } from '../../services/index';
import { ApiServiceMock } from '../../../mock-data/api';
import { ElasticSearchServiceMock } from '../../../mock-data/elastic-search';
import { UserServiceMock } from '../../../mock-data/user';
import { DialogServiceMock } from '../../../mock-data/dialog';
import { BarChartComponent } from './barchart.component';

describe('BarchartComponent', () => {
    let component: BarChartComponent<any>;
    let fixture: ComponentFixture<BarChartComponent<any>>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule],
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
                },
                { provide: DialogService, useClass: DialogServiceMock },
            ],
            declarations: [BarChartComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BarChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
