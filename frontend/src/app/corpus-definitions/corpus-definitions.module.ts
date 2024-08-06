import { NgModule } from '@angular/core';
import { DefinitionsOverviewComponent } from './definitions-overview/definitions-overview.component';
import { SharedModule } from '../shared/shared.module';
import { CreateDefinitionComponent } from './create-definition/create-definition.component';
import { EditDefinitionComponent } from './edit-definition/edit-definition.component';
import { DefinitionJsonUploadComponent } from './definition-json-upload/definition-json-upload.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MetaFormComponent } from './form/meta-form/meta-form.component';
import { FieldFormComponent } from './form/field-form/field-form.component';
import { StepsModule } from 'primeng/steps';
import { CorpusFormComponent } from './form/corpus-form/corpus-form.component';

@NgModule({
    declarations: [
        CreateDefinitionComponent,
        DefinitionsOverviewComponent,
        EditDefinitionComponent,
        DefinitionJsonUploadComponent,
        MetaFormComponent,
        CorpusFormComponent,
    ],
    exports: [
        CreateDefinitionComponent,
        DefinitionsOverviewComponent,
        EditDefinitionComponent,
        CorpusFormComponent,
    ],
    imports: [
        SharedModule,
        ReactiveFormsModule,
        FieldFormComponent,
        StepsModule,
    ],
})
export class CorpusDefinitionsModule {}
