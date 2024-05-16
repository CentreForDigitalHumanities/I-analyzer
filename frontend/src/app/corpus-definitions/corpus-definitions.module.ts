import { NgModule } from '@angular/core';
import { DefinitionsOverviewComponent } from './definitions-overview/definitions-overview.component';
import { SharedModule } from '../shared/shared.module';
import { CreateDefinitionComponent } from './create-definition/create-definition.component';



@NgModule({
    declarations: [
        CreateDefinitionComponent,
        DefinitionsOverviewComponent,
    ],
    exports: [
        CreateDefinitionComponent,
        DefinitionsOverviewComponent,
    ],
    imports: [
        SharedModule
    ]
})
export class CorpusDefinitionsModule { }
