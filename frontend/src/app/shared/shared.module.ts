import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { DatePickerComponent } from '../corpus-selection/corpus-filter/date-picker/date-picker.component';
import { ErrorComponent } from '../error/error.component';
import { CalendarModule } from 'primeng/calendar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { BalloonDirective } from '../balloon.directive';
import { HighlightPipe } from '../search';
import { ScrollToDirective } from '../scroll-to.directive';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    HttpClient,
    HttpClientModule,
    HttpClientXsrfModule,
} from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { TabsComponent } from './tabs/tabs.component';
import { TabPanelDirective } from './tabs/tab-panel.directive';
import { DropdownItemDirective } from '../dropdown/dropdown-item.directive';

@NgModule({
    declarations: [
        DropdownComponent,
        DropdownItemDirective,
        DatePickerComponent,
        ErrorComponent,
        BalloonDirective,
        HighlightPipe,
        ScrollToDirective,
        TabsComponent,
        TabPanelDirective,
    ],
    exports: [
        // shared components
        DropdownComponent,
        DropdownItemDirective,
        DatePickerComponent,
        ErrorComponent,
        ScrollToDirective,
        TabsComponent,
        TabPanelDirective,

        // shared modules
        BrowserAnimationsModule,
        BrowserModule,
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        BalloonDirective,
        HighlightPipe,
        HttpClientModule,
        HttpClientXsrfModule,
        RouterModule,
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        CommonModule,
        FormsModule,
        CalendarModule,
        FontAwesomeModule,
        HttpClientModule,
        HttpClientXsrfModule.withOptions({
            cookieName: 'csrftoken',
            headerName: 'X-CSRFToken',
        }),
        RouterModule,
    ],
})
export class SharedModule {}
