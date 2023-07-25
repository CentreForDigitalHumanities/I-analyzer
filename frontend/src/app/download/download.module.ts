import { NgModule } from '@angular/core';
import { DownloadComponent } from './download.component';
import { DownloadOptionsComponent } from './download-options/download-options.component';
import { DownloadService } from '../services';
import { SelectFieldComponent } from '../select-field/select-field.component';
import { MultiSelectModule } from 'primeng/multiselect';
import { SharedModule } from '../shared/shared.module';



@NgModule({
    providers: [
        DownloadService,
    ],
    declarations: [
        DownloadComponent,
        DownloadOptionsComponent,
        SelectFieldComponent,
    ],
    imports: [
        SharedModule,
        MultiSelectModule,
    ],
    exports: [
        DownloadComponent,
        DownloadOptionsComponent,
        SelectFieldComponent,
    ]
})
export class DownloadModule { }
