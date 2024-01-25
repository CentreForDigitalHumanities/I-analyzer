import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AdHocFilterComponent } from './ad-hoc-filter/ad-hoc-filter.component';
import { BooleanFilterComponent } from './boolean-filter/boolean-filter.component';
import { DateFilterComponent } from './date-filter/date-filter.component';
import { FilterManagerComponent } from './filter-manager.component';
import { MultipleChoiceFilterComponent } from './multiple-choice-filter/multiple-choice-filter.component';
import { RangeFilterComponent } from './range-filter/range-filter.component';
import { SearchService } from '../services';
import { SliderModule } from 'primeng/slider';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { FilterBoxComponent } from './filter-box/filter-box.component';




@NgModule({
    providers: [
        SearchService,
    ],
    declarations: [
        AdHocFilterComponent,
        BooleanFilterComponent,
        DateFilterComponent,
        FilterManagerComponent,
        MultipleChoiceFilterComponent,
        RangeFilterComponent,
        FilterBoxComponent,
    ],
    imports: [
        CheckboxModule,
        MultiSelectModule,
        SharedModule,
        SliderModule,
    ],
    exports: [
        FilterManagerComponent,
    ]
})
export class FilterModule { }
