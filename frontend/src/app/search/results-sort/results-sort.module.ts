import { NgModule } from '@angular/core';
import { SearchSortingComponent } from './search-sorting.component';
import { SharedModule } from '../../shared/shared.module';



@NgModule({
    declarations: [
        SearchSortingComponent,
    ],
    imports: [
        SharedModule
    ],
    exports: [
        SearchSortingComponent,
    ]
})
export class ResultsSortModule { }
