import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Http, HttpModule, Response } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { CalendarModule, MultiSelectModule, SliderModule, MenuModule, DialogModule, CheckboxModule } from 'primeng/primeng';
import { RestHandler, IRestRequest, IRestResponse } from 'rest-core';
import { RestHandlerHttp, RestModule } from 'rest-ngx-http';

import { ApiService, ConfigService, CorpusService, ElasticSearchService, HighlightService, SearchService, SessionService, UserService, LogService, QueryService } from './services/index';

import { AppComponent } from './app.component';
import { CorpusSelectionComponent } from './corpus-selection/corpus-selection.component';
import { HomeComponent } from './home/home.component';
import { HighlightPipe, SearchComponent, SearchFilterComponent, SearchSampleComponent } from './search/index';
import { MenuComponent } from './menu/menu.component';
import { LoggedOnGuard } from './logged-on.guard';
import { LoginComponent } from './login/login.component';
import { ScrollToDirective } from './scroll-to.directive';
import { BarChartComponent } from './visualization/barchart.component';
import { VisualizationComponent } from './visualization/visualization.component';

const appRoutes: Routes = [
    {
        path: 'search/:corpus',
        component: SearchComponent,
        canActivate: [LoggedOnGuard]
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [LoggedOnGuard]
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'visual',
        //component: VisualizationComponent
        component: BarChartComponent
    }
]
@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        CorpusSelectionComponent,
        HighlightPipe,
        SearchComponent,
        SearchFilterComponent,
        SearchSampleComponent,
        MenuComponent,
        LoginComponent,
        ScrollToDirective,
        BarChartComponent,
        VisualizationComponent,
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        CalendarModule,
        CommonModule,
        FormsModule,
        HttpModule,
        RouterModule.forRoot(appRoutes),
        MultiSelectModule,
        SliderModule,
        MenuModule,
        DialogModule,
        CheckboxModule,
        RestModule.forRoot({
            handler: { provide: RestHandler, useFactory: (restHandlerFactory), deps: [Http] }
        })
    ],
    providers: [ApiService, CorpusService, ConfigService, ElasticSearchService, HighlightService, LogService, QueryService, SearchService, SessionService, UserService, LoggedOnGuard],
    bootstrap: [AppComponent]
})
export class AppModule { }

// AoT requires an exported function for factories
export function restHandlerFactory(http: Http) {
    return new RestHandlerSession(http);
}

/**
 * Rest handler which will emit an event when the session expired.
 */
class RestHandlerSession extends RestHandlerHttp {
    constructor(http: Http) {
        super(http);
    }

    public handleResponse(req: IRestRequest, response: Response): IRestResponse {
        if (!response.ok && response.status == 401) {
            SessionService.markExpired();
        }

        return super.handleResponse(req, response);
    }
}
