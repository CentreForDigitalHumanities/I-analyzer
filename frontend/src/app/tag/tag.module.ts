import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { TagSelectComponent } from './tag-select/tag-select.component';
import { DocumentTagsComponent } from './document-tags/document-tags.component';
import { DropdownModule } from 'primeng/dropdown';



@NgModule({
    declarations: [DocumentTagsComponent, TagSelectComponent],
    imports: [SharedModule, DropdownModule],
    exports: [DocumentTagsComponent],
})
export class TagModule {}
