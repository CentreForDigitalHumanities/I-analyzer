import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientXsrfModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { NgxMdModule } from 'ngx-md';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
// import { SharedModule } from 'primeng/shared';
import { TabViewModule } from 'primeng/tabview';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChipsModule } from 'primeng/chips';
import { TableModule } from 'primeng/table';
import { ResourceHandler } from '@ngx-resource/core';
import { ResourceHandlerHttpClient, ResourceModule } from '@ngx-resource/handler-ngx-http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { CookieService } from 'ngx-cookie-service';

import { ApiService, ApiRetryService, ConfigService, CorpusService, DialogService, DownloadService,
    ElasticSearchService, HighlightService, NotificationService, SearchService, SessionService, UserService, LogService, QueryService } from './services/index';

import { AppComponent } from './app.component';
import { CorpusSelectionComponent } from './corpus-selection/corpus-selection.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import { HomeComponent } from './home/home.component';
import { HighlightPipe, SearchComponent, SearchRelevanceComponent, SearchResultsComponent, SearchSortingComponent } from './search/index';
import { ManualComponent } from './manual/manual.component';
import { ManualNavigationComponent } from './manual/manual-navigation.component';
import { MenuComponent } from './menu/menu.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { CorpusGuard } from './corpus.guard';
import { LoggedOnGuard } from './logged-on.guard';
import { LoginComponent } from './login/login.component';
import { BalloonDirective } from './balloon.directive';
import { ScrollToDirective } from './scroll-to.directive';
import { BarChartComponent } from './visualization/barchart/barchart.component';
import { TimelineComponent } from './visualization/barchart/timeline.component';
import { WordcloudComponent } from './visualization/wordcloud/wordcloud.component';
import { VisualizationComponent } from './visualization/visualization.component';
import { FreqtableComponent } from './visualization/freqtable.component';
import { SearchHistoryComponent, QueryFiltersComponent, QueryTextPipe } from './search-history/index';
import { SelectFieldComponent } from './select-field/select-field.component';
import { RegistrationComponent } from './registration/registration.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { RelatedWordsComponent } from './visualization/related-words/related-words.component';
import { DialogComponent } from './dialog/dialog.component';
import { DownloadComponent } from './download/download.component';
import { HistogramComponent } from './visualization/barchart/histogram.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { RequestResetComponent } from './reset-password/request-reset.component';
import { PaginationComponent } from './pagination/pagination.component';
import { BooleanFilterComponent, FilterManagerComponent, MultipleChoiceFilterComponent, DateFilterComponent, RangeFilterComponent } from './filter/index';
import { ErrorComponent } from './error/error.component';
import { DocumentViewComponent } from './document-view/document-view.component';
import { ImageNavigationComponent, ImageViewComponent, ScanImageComponent, ScanPdfComponent } from './image-view';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgramComponent } from './visualization/ngram/ngram.component';
import { barchartOptionsComponent } from './visualization/barchart/barchart-options.component';
import { PaletteSelectComponent } from './visualization/palette-select/palette-select.component';
import { AdHocFilterComponent } from './filter/ad-hoc-filter.component';
import { HighlightSelectorComponent } from './search/highlight-selector.component';
import { WordContextComponent } from './visualization/word-context/word-context.component';


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
        path: 'reset-password/:token',
        component: ResetPasswordComponent
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
];

export const declarations: any[] = [
    AppComponent,
    AdHocFilterComponent,
    BalloonDirective,
    BarChartComponent,
    BooleanFilterComponent,
    CorpusSelectionComponent,
    DateFilterComponent,
    DialogComponent,
    DocumentViewComponent,
    DownloadComponent,
    DropdownComponent,
    ErrorComponent,
    FilterManagerComponent,
    FreqtableComponent,
    HomeComponent,
    HighlightPipe,
    HistogramComponent,
    HighlightSelectorComponent,
    barchartOptionsComponent,
    ImageViewComponent,
    ImageNavigationComponent,
    LoginComponent,
    ManualComponent,
    ManualNavigationComponent,
    MenuComponent,
    MultipleChoiceFilterComponent,
    NgramComponent,
    NotificationsComponent,
    QueryFiltersComponent,
    QueryTextPipe,
    PaginationComponent,
    PaletteSelectComponent,
    PrivacyComponent,
    RangeFilterComponent,
    RegistrationComponent,
    RelatedWordsComponent,
    ResetPasswordComponent,
    RequestResetComponent,
    ScanImageComponent,
    ScanPdfComponent,
    ScrollToDirective,
    SearchComponent,
    SearchHistoryComponent,
    SearchRelevanceComponent,
    SearchResultsComponent,
    SearchSortingComponent,
    SelectFieldComponent,
    TimelineComponent,
    VisualizationComponent,
    WordcloudComponent,
    WordContextComponent,
];

export const imports: any[] = [
    BrowserAnimationsModule,
    BrowserModule,
    CalendarModule,
    ChartModule,
    CheckboxModule,
    ChipsModule,
    CommonModule,
    ConfirmDialogModule,
    DialogModule,
    DropdownModule,
    FormsModule,
    FontAwesomeModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
        cookieName: 'csrf_token',
        headerName: 'X-XSRF-Token'
    }),
    MenuModule,
    MultiSelectModule,
    NgxMdModule.forRoot(),
    PdfViewerModule,
    ResourceModule.forRoot({
        handler: { provide: ResourceHandler, useFactory: (resourceHandlerFactory), deps: [HttpClient] }
    }),
    RadioButtonModule,
    RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' }),
    // SharedModule,
    SliderModule,
    TableModule,
    TabViewModule,
];

export const providers: any[] = [
    ApiService,
    ApiRetryService,
    CorpusService,
    ConfigService,
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
        useFactory: initApp,
        deps: [ApiService],
        multi: true
    },
];

@NgModule({
    declarations,
    imports,
    providers,
    bootstrap: [AppComponent],
})
export class AppModule { }

// AoT requires an exported function for factories
export function resourceHandlerFactory(http: HttpClient) {
    return new ResourceHandlerHttpClient(http);
}

export function initApp(api: ApiService): Function {
    return (): Promise<any> => {
        return api.ensureCsrf();
    };
}
