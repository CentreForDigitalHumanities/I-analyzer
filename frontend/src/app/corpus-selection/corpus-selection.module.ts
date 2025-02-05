import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { CorpusSelectionComponent } from './corpus-selection.component';
import { CorpusSelectorComponent } from './corpus-selector/corpus-selector.component';
import { CorpusFilterComponent } from './corpus-filter/corpus-filter.component';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
    declarations: [
        CorpusFilterComponent,
        CorpusSelectionComponent,
        CorpusSelectorComponent,
    ],
    imports: [
        SharedModule,
        ReactiveFormsModule,
    ],
    exports: [
        CorpusSelectionComponent,
    ]
})
export class CorpusSelectionModule { }
