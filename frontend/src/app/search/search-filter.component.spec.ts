import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CalendarModule, CheckboxModule, SelectButtonModule, SliderModule, MultiSelectModule } from 'primeng/primeng';

import { SearchFilterComponent } from './search-filter.component';
import { BalloonDirective } from '../balloon.directive';
import { DataService } from '../services/index';
import { BooleanFilterData, SearchFilterData } from '../models';

describe('SearchFilterComponent', () => {
    let component: SearchFilterComponent;
    let fixture: ComponentFixture<SearchFilterComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                CalendarModule,
                CheckboxModule,
                FormsModule,
                SelectButtonModule,
                SliderModule,
                MultiSelectModule
            ],
            providers: [DataService],
            declarations: [SearchFilterComponent, BalloonDirective],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchFilterComponent);
        component = fixture.componentInstance;
        let mockData: SearchFilterData = {
            filterType: 'BooleanFilter',
            checked: true
        }
        component.field = {
            description: 'test',
            displayName: 'Test',
            displayType: 'boolean',
            hidden: false,
            sortable: true,
            searchable: false,
            downloadable: true,
            name: 'name',
            searchFilter: {
                fieldName: 'isWaldo',
                description: 'description',
                useAsFilter: true,
                defaultData: mockData,
                currentData: mockData
            }
        };
        component.useAsFilter = true;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
