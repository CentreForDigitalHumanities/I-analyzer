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


@NgModule({
    declarations: [
        DropdownComponent,
        DatePickerComponent,
        ErrorComponent,
        BalloonDirective,
        HighlightPipe,
        ScrollToDirective,
    ],
    exports: [
        DropdownComponent,
        DatePickerComponent,
        ErrorComponent,
        ScrollToDirective,
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        BalloonDirective,
        HighlightPipe,
    ],
    imports: [
        CommonModule,
        FormsModule,
        CalendarModule,
        FontAwesomeModule,
    ]
})
export class SharedModule { }
