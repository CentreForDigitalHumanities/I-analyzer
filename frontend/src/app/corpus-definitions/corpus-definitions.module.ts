import { NgModule } from '@angular/core';
import { DefinitionsOverviewComponent } from './definitions-overview/definitions-overview.component';
import { SharedModule } from '../shared/shared.module';
import { CreateDefinitionComponent } from './create-definition/create-definition.component';
import { EditDefinitionComponent } from './edit-definition/edit-definition.component';



@NgModule({
    declarations: [
        CreateDefinitionComponent,
        DefinitionsOverviewComponent,
        EditDefinitionComponent,
    ],
    exports: [
        CreateDefinitionComponent,
        DefinitionsOverviewComponent,
        EditDefinitionComponent,
    ],
    imports: [
        SharedModule
    ]
})
export class CorpusDefinitionsModule { }
