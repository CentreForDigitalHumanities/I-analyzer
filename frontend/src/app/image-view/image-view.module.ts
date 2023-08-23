import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ImageNavigationComponent, ImageViewComponent, ScanImageComponent, ScanPdfComponent } from './index';
import { ApiService } from '../services';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PdfViewerModule } from 'ng2-pdf-viewer';



@NgModule({
    providers: [
        ApiService,
    ],
    declarations: [
        ImageNavigationComponent,
        ImageViewComponent,
        ScanImageComponent,
        ScanPdfComponent,
    ],
    exports: [
        ImageViewComponent,
    ],
    imports: [
        ConfirmDialogModule,
        SharedModule,
        PdfViewerModule,
    ]
})
export class ImageViewModule { }
