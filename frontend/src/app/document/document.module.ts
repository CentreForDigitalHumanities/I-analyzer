import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DocumentViewComponent } from '../document-view/document-view.component';
import { DocumentPageComponent } from '../document-page/document-page.component';
import { ImageViewModule } from '../image-view/image-view.module';
import { SearchRelevanceComponent } from '../search';
import { CorpusModule } from '../corpus-header/corpus.module';
import { TagModule } from '../tag/tag.module';
import { DocumentPopupComponent } from './document-popup/document-popup.component';



@NgModule({
    declarations: [
        DocumentViewComponent,
        DocumentPageComponent,
        SearchRelevanceComponent,
        DocumentPopupComponent,
    ],
    imports: [
        CorpusModule,
        SharedModule,
        ImageViewModule,
        TagModule,
    ], exports: [
        DocumentViewComponent,
        DocumentPageComponent,
        SearchRelevanceComponent,
    ]
})
export class DocumentModule { }
