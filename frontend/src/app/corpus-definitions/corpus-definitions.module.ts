import { NgModule } from '@angular/core';
import { DefinitionsOverviewComponent } from './definitions-overview/definitions-overview.component';
import { SharedModule } from '../shared/shared.module';
import { CreateDefinitionComponent } from './create-definition/create-definition.component';
import { EditDefinitionComponent } from './edit-definition/edit-definition.component';
import { DefinitionJsonUploadComponent } from './definition-json-upload/definition-json-upload.component';



@NgModule({
    declarations: [
        CreateDefinitionComponent,
        DefinitionsOverviewComponent,
        EditDefinitionComponent,
        DefinitionJsonUploadComponent,
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
