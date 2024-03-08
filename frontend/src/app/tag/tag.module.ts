import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { TagSelectComponent } from './tag-select/tag-select.component';
import { DocumentTagsComponent } from './document-tags/document-tags.component';
import { TagOverviewComponent } from './tag-overview/tag-overview.component';



@NgModule({
    declarations: [
        DocumentTagsComponent,
        TagSelectComponent,
        TagOverviewComponent,
    ],
    imports: [SharedModule],
    exports: [DocumentTagsComponent],
})
export class TagModule {}
