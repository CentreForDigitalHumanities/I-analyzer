import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { SettingsComponent } from './settings.component';
import { SearchHistorySettingsComponent } from './search-history-settings/search-history-settings.component';
import { DeleteSearchHistoryComponent } from './search-history-settings/delete-search-history/delete-search-history.component';
import { ToggleSearchHistoryComponent } from './search-history-settings/toggle-search-history/toggle-search-history.component';



@NgModule({
    declarations: [
        DeleteSearchHistoryComponent,
        SearchHistorySettingsComponent,
        SettingsComponent,
        ToggleSearchHistoryComponent,
    ],
    imports: [
        SharedModule
    ], exports: [
        SettingsComponent,
    ]
})
export class SettingsModule { }
