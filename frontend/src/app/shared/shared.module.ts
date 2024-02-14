import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { BalloonDirective } from '../balloon.directive';
import { DatePickerComponent } from '../corpus-selection/corpus-filter/date-picker/date-picker.component';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { ErrorComponent } from '../error/error.component';
import { ScrollToDirective } from '../scroll-to.directive';
import { HighlightPipe } from '../search';
import { TabPanelDirective } from './tabs/tab-panel.directive';
import { TabsComponent } from './tabs/tabs.component';

@NgModule({
    declarations: [
        DropdownComponent,
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
        TableModule,
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        CommonModule,
        FormsModule,
        CalendarModule,
        TableModule,
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
