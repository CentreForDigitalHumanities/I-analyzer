import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DownloadHistoryComponent } from './download-history/download-history.component';
import { QueryFiltersComponent, QueryTextPipe, SearchHistoryComponent } from './search-history';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DownloadModule } from '../download/download.module';
import { DownloadService, QueryService } from '../services';




@NgModule({
    providers: [
        DownloadService,
        QueryService,
    ],
    declarations: [
        DownloadHistoryComponent,
        QueryFiltersComponent,
        QueryTextPipe,
        SearchHistoryComponent,
    ],
    imports: [
        DownloadModule,
        DropdownModule,
        SharedModule,
        TableModule,
    ],
    exports: [
        DownloadHistoryComponent,
        SearchHistoryComponent,
    ]
})
export class HistoryModule { }
