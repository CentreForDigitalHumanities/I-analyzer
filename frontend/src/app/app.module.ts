import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, Injector, APP_INITIALIZER } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { HttpClient, HttpClientModule } from '@angular/common/http'
import { HttpClientXsrfModule } from '@angular/common/http'
import { RouterModule, Routes } from '@angular/router';

import { MarkdownModule } from 'ngx-md';
import { CalendarModule, ChartModule, DropdownModule, MultiSelectModule, SliderModule, MenuModule, DialogModule, CheckboxModule, SharedModule, TabViewModule, ConfirmDialogModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';
import { ResourceHandler } from '@ngx-resource/core';
import { ResourceHandlerHttpClient, ResourceModule } from '@ngx-resource/handler-ngx-http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { CookieService } from 'ngx-cookie-service';

import { ApiService, ApiRetryService, ConfigService, CorpusService, DataService, DialogService, DownloadService, ElasticSearchService, HighlightService, NotificationService, SearchService, SessionService, UserService, LogService, QueryService } from './services/index';

import { AppComponent } from './app.component';
import { CorpusSelectionComponent } from './corpus-selection/corpus-selection.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import { HomeComponent } from './home/home.component';
import { HighlightPipe, SearchComponent, SearchFilterComponent, SearchRelevanceComponent, SearchResultsComponent, SearchSortingComponent } from './search/index';
import { ManualComponent } from './manual/manual.component';
import { ManualNavigationComponent } from './manual/manual-navigation.component';
import { MenuComponent } from './menu/menu.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { CorpusGuard } from './corpus.guard';
import { LoggedOnGuard } from './logged-on.guard';
import { LoginComponent } from './login/login.component';
import { BalloonDirective } from './balloon.directive';
import { ScrollToDirective } from './scroll-to.directive';
import { BarChartComponent } from './visualization/barchart.component';
import { TimelineComponent } from './visualization/timeline.component';
import { WordcloudComponent } from './visualization/wordcloud.component';
import { VisualizationComponent } from './visualization/visualization.component';
import { FreqtableComponent } from './visualization/freqtable.component';
import { DocumentViewComponent } from './document-view/document-view.component';
import { SearchHistoryComponent, QueryFiltersComponent, QueryTextPipe } from './search-history/index';
import { SelectFieldComponent } from './search/select-field.component';
import { RegistrationComponent } from './registration/registration.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { RelatedWordsComponent } from './visualization/related-words.component';
import { ScanPdfComponent } from './document-view/scan-pdf.component';
import { DialogComponent } from './dialog/dialog.component';
import { DownloadComponent } from './search/download.component';
import { TermFrequencyComponent } from './visualization/term-frequency.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { RequestResetComponent } from './reset-password/request-reset.component';

const appRoutes: Routes = [
    {
        path: 'search/:corpus',
        component: SearchComponent,
        canActivate: [CorpusGuard, LoggedOnGuard]
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'login/:activated',
        component: LoginComponent
    },
    {
        path: 'registration',
        component: RegistrationComponent
    },
    {
        path: 'reset',
        component: RequestResetComponent
    },
    {
        path: 'reset-password',
        component: ResetPasswordComponent,
        canActivate: [LoggedOnGuard]
    },
    {
        path: 'privacy',
        component: PrivacyComponent
    },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [LoggedOnGuard]
    },
    {
        path: 'manual/:identifier',
        component: ManualComponent
    },
    {
        path: 'search-history',
        component: SearchHistoryComponent
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    }
]
@NgModule({
    declarations: [
        AppComponent,
        BalloonDirective,
        DropdownComponent,
        DialogComponent,
        HomeComponent,
        CorpusSelectionComponent,
        HighlightPipe,
        QueryTextPipe,
        SearchComponent,
        SearchFilterComponent,
        SearchRelevanceComponent,
        SearchResultsComponent,
        SearchSortingComponent,
        ManualComponent,
        ManualNavigationComponent,
        MenuComponent,
        NotificationsComponent,
        LoginComponent,
        ScrollToDirective,
        BarChartComponent,
        VisualizationComponent,
        WordcloudComponent,
        TimelineComponent,
        RelatedWordsComponent,
        DocumentViewComponent,
        SearchHistoryComponent,
        FreqtableComponent,
        SelectFieldComponent,
        RegistrationComponent,
        PrivacyComponent,
        RelatedWordsComponent,
        ScanPdfComponent,
        QueryFiltersComponent,
        DownloadComponent,
        TermFrequencyComponent,
        ResetPasswordComponent,
        RequestResetComponent
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        CalendarModule,
        CommonModule,
        ConfirmDialogModule,
        DropdownModule,
        FormsModule,
        HttpModule,
        HttpClientModule,
        HttpClientXsrfModule.withOptions({
            cookieName: 'csrf_token',
            headerName: 'X-XSRF-Token'
        }),
        RouterModule.forRoot(appRoutes),
        MarkdownModule,
        MultiSelectModule,
        SliderModule,
        MenuModule,
        DialogModule,
        ChartModule,
        CheckboxModule,
        SharedModule,
        TableModule,
        TabViewModule,
        ResourceModule.forRoot({
            handler: { provide: ResourceHandler, useFactory: (resourceHandlerFactory), deps: [HttpClient] }
        }),
        PdfViewerModule,
    ],
    providers: [
        ApiService,
        ApiRetryService,
        CorpusService,
        ConfigService,
        DataService,
        DialogService,
        DownloadService,
        ElasticSearchService,
        HighlightService,
        LogService,
        NotificationService,
        QueryService,
        SearchService,
        SessionService,
        UserService,
        CorpusGuard,
        LoggedOnGuard,
        TitleCasePipe,
        CookieService,
        {
            provide: APP_INITIALIZER,
            useFactory: csrfProviderFactory,
            deps: [Injector, ApiService, CookieService],
            multi: true
        }],
    bootstrap: [AppComponent]
})
export class AppModule { }

// AoT requires an exported function for factories
export function resourceHandlerFactory(http: HttpClient) {
    return new ResourceHandlerHttpClient(http);
}

export function csrfProviderFactory(injector: Injector, provider: ApiService, cookieService: CookieService): Function {    
    return () => {        
        if (!cookieService.check('csrf_token')) { 
            provider.ensureCsrf().then(result => {                 
                if (!result || !result.success) {
                    throw new Error("CSRF token could not be collected.");
                }
            })
        }
    }
}
