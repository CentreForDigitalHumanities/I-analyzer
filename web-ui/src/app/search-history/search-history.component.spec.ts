import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MultiSelectModule } from 'primeng/primeng';

import * as corpus from '../../mock-data/corpus';
import { ApiService, SearchService, QueryService, UserService } from '../services/index';
import { ApiServiceMock } from '../services/api.service.mock';
import { SearchServiceMock } from '../services/search.service.mock';
import { UserServiceMock } from '../services/user.service.mock';
import { HistoryQueryDisplayComponent, SearchHistoryComponent } from './index';


describe('SearchHistoryComponent', () => {
    let component: SearchHistoryComponent;
    let fixture: ComponentFixture<SearchHistoryComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, MultiSelectModule],
            declarations: [HistoryQueryDisplayComponent, SearchHistoryComponent],
            providers: [
                {
                    provide: ApiService, useValue: new ApiServiceMock({
                        'search_history': { queries: [] }
                    })
                },
                QueryService,
                {
                    provide: SearchService, useValue: new SearchServiceMock()
                },
                {
                    provide: Router, useValue: new RouterMock()
                },
                {
                    provide: UserService, useValue: new UserServiceMock()
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SearchHistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});

class RouterMock {

}
