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
import { HttpClient, HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { ResourceHandlerHttpClient, ResourceModule } from '@ngx-resource/handler-ngx-http';
import { ResourceHandler } from '@ngx-resource/core';
import { RouterModule } from '@angular/router';

// AoT requires an exported function for factories
export const resourceHandlerFactory = (http: HttpClient) =>
    new ResourceHandlerHttpClient(http);



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
        // shared components
        DropdownComponent,
        DatePickerComponent,
        ErrorComponent,
        ScrollToDirective,

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
        ResourceModule,
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
        ResourceModule.forRoot({
            handler: {
                provide: ResourceHandler,
                useFactory: resourceHandlerFactory,
                deps: [HttpClient],
            },
        }),
        RouterModule,
    ]
})
export class SharedModule { }
