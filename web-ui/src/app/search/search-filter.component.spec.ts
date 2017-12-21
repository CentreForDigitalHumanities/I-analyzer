import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CalendarModule, CheckboxModule, SelectButtonModule, SliderModule, MultiSelectModule } from 'primeng/primeng';

import { SearchFilterComponent } from './search-filter.component';

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
            declarations: [SearchFilterComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchFilterComponent);
        component = fixture.componentInstance;
        component.field = {
            description: 'test',
            displayName: 'Test',
            displayType: 'boolean',
            hidden: false,
            name: 'name',
            searchFilter: {
                description: 'description',
                falseText: 'FALSE',
                trueText: 'TRUE',
                name: 'BooleanFilter'
            }
        };
        component.enabled = true;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
