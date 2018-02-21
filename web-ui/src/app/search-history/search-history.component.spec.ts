import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchHistoryComponent } from './search-history.component';
import { DisplayFilterPipe } from './display-filter.pipe';
import { DisplayQueryTextPipe } from './display-query-text.pipe';
import { UserService, QueryService, ApiService } from '../services/index';
import { UserServiceMock } from '../services/user.service.mock';
import { ApiServiceMock } from '../services/api.service.mock';

describe('SearchHistoryComponent', () => {
    let component: SearchHistoryComponent;
    let fixture: ComponentFixture<SearchHistoryComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ DisplayFilterPipe, DisplayQueryTextPipe, SearchHistoryComponent ],
            providers: [
                QueryService,
                { 
                    provide: ApiService, useValue: new ApiServiceMock()
                },
                { 
                    provide: UserService, useValue: new UserServiceMock()
                }
            ]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchHistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
