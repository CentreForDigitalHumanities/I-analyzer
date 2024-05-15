import { NgModule } from '@angular/core';
import { DefinitionsOverviewComponent } from './definitions-overview/definitions-overview.component';
import { SharedModule } from '../shared/shared.module';



@NgModule({
    declarations: [
        DefinitionsOverviewComponent
    ],
    exports: [
        DefinitionsOverviewComponent,
    ],
    imports: [
        SharedModule
    ]
})
export class CorpusDefinitionsModule { }
