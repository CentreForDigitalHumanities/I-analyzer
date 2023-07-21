import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { PaginationComponent } from './pagination/pagination.component';
import { HighlightSelectorComponent } from './highlight-selector.component';
import { SearchResultsComponent } from './search-results.component';
import { SearchComponent } from './search.component';
import { DocumentModule } from '../document/document.module';
import { CorpusModule } from '../corpus-header/corpus.module';
import { SearchSortingComponent } from './search-sorting.component';
import { FilterModule } from '../filter/filter.module';
import { DownloadModule } from '../download/download.module';
import { DialogModule } from 'primeng/dialog';



@NgModule({
    declarations: [
        HighlightSelectorComponent,
        PaginationComponent,
        SearchComponent,
        SearchResultsComponent,
        SearchSortingComponent,
    ],
    imports: [
        DialogModule,
        CorpusModule,
        DocumentModule,
        DownloadModule,
        FilterModule,
        SharedModule,
    ],
    exports: [
        SearchComponent,
    ]
})
export class SearchModule { }
