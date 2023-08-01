import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CorpusSelectionComponent } from './corpus-selection.component';
import { CorpusSelectorComponent } from './corpus-selector/corpus-selector.component';
import { CorpusFilterComponent } from './corpus-filter/corpus-filter.component';



@NgModule({
    declarations: [
        CorpusFilterComponent,
        CorpusSelectionComponent,
        CorpusSelectorComponent,
    ],
    imports: [
        SharedModule,
    ],
    exports: [
        CorpusSelectionComponent,
    ]
})
export class CorpusSelectionModule { }
