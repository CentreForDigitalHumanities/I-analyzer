import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { DocumentViewComponent } from './document-view/document-view.component';
import { DocumentPageComponent } from './document-page/document-page.component';
import { ImageViewModule } from '../image-view/image-view.module';
import { SearchRelevanceComponent } from '../search';
import { CorpusModule } from '../corpus/corpus.module';
import { TagModule } from '../tag/tag.module';
import { DocumentPopupComponent } from './document-popup/document-popup.component';
import { DialogModule } from 'primeng/dialog';
import { DocumentPreviewComponent } from './document-preview/document-preview.component';
import { EntityLegendComponent } from './entity-legend/entity-legend.component';
import { EntityToggleComponent } from './entity-toggle/entity-toggle.component';
import { MetadataFieldComponent } from './metadata-field/metadata-field.component';
import { ContentFieldPreviewComponent } from './content-field-preview/content-field-preview.component';
import { KeywordPipe } from './pipes/keyword.pipe';
import { ElasticsearchHighlightPipe } from './pipes/elasticsearch-highlight.pipe';
import { GeoDataPipe } from './pipes/geo-data.pipe';
import { EntityPipe } from './pipes/entity.pipe';
import { ParagraphPipe } from './pipes/paragraph.pipe';
import { SnippetPipe } from './pipes/snippet.pipe';
import { ContentFieldComponent } from './content-field/content-field.component';
import { ElasticSearchService } from '@services';

@NgModule({
    declarations: [
        DocumentViewComponent,
        DocumentPageComponent,
        SearchRelevanceComponent,
        DocumentPopupComponent,
        DocumentPreviewComponent,
        EntityLegendComponent,
        EntityToggleComponent,
        MetadataFieldComponent,
        ElasticsearchHighlightPipe,
        EntityPipe,
        GeoDataPipe,
        ParagraphPipe,
        SnippetPipe,
        ContentFieldPreviewComponent,
        KeywordPipe,
        ContentFieldComponent,
    ],
    imports: [
        DialogModule,
        CorpusModule,
        SharedModule,
        ImageViewModule,
        TagModule,
    ], exports: [
        DocumentPreviewComponent,
        DocumentPageComponent,
        DocumentPopupComponent,
    ],
    providers: [
        ElasticSearchService,
    ]
})
export class DocumentModule { }
