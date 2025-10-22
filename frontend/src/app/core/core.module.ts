import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { HomeComponent } from 'app/home/home.component';
import { MenuComponent } from 'app/menu/menu.component';
import { NotificationsComponent } from 'app/notifications/notifications.component';
import { MenuDropdownComponent } from 'app/menu/menu-dropdown/menu-dropdown.component';
import { FooterComponent } from 'app/footer/footer.component';
import { DialogComponent } from 'app/dialog/dialog.component';
import { CorpusSelectionModule } from 'app/corpus-selection/corpus-selection.module';


/** toplevel components such as the home page and navbar */
@NgModule({
    declarations: [
        DialogComponent,
        FooterComponent,
        HomeComponent,
        MenuComponent,
        MenuDropdownComponent,
        NotificationsComponent,
    ],
    imports: [
        SharedModule,
        CorpusSelectionModule,
    ],
    exports: [
        DialogComponent,
        FooterComponent,
        MenuComponent,
        NotificationsComponent,
    ]
})
export class CoreModule { }
