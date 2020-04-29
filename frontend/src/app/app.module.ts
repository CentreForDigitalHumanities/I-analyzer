import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, Injector, APP_INITIALIZER } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { HttpClient, HttpClientModule } from '@angular/common/http'
import { HttpClientXsrfModule } from '@angular/common/http'
import { RouterModule, Routes } from '@angular/router';

import { NgxMdModule } from 'ngx-md';
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
import { BarChartComponent } from './visualization/barchart.component';
import { TimelineComponent } from './visualization/timeline.component';
import { WordcloudComponent } from './visualization/wordcloud.component';
import { VisualizationComponent } from './visualization/visualization.component';
import { FreqtableComponent } from './visualization/freqtable.component';
import { SearchHistoryComponent, QueryFiltersComponent, QueryTextPipe } from './search-history/index';
import { SelectFieldComponent } from './select-field/select-field.component';
import { RegistrationComponent } from './registration/registration.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { RelatedWordsComponent } from './visualization/related-words.component';
import { DialogComponent } from './dialog/dialog.component';
import { DownloadComponent } from './download/download.component';
import { TermFrequencyComponent } from './visualization/term-frequency.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { RequestResetComponent } from './reset-password/request-reset.component';
import { PaginationComponent } from './pagination/pagination.component';
import { BooleanFilterComponent, FilterManagerComponent, MultipleChoiceFilterComponent, DateFilterComponent, RangeFilterComponent } from './filter/index';
import { ErrorComponent } from './error/error.component';
import { DocumentViewComponent } from './document-view/document-view.component';
import { ImageNavigationComponent, ImageViewComponent, ScanImageComponent, ScanPdfComponent } from './image-view';
import { EpigraphyComponent } from './epigraphy/epigraphy.component';
import { ArchaeologyComponent } from './archaeology/archaeology.component';
import { ConservationComponent } from './conservation/conservation.component';
import { EducationComponent } from './education/education.component';
import { AboutComponent } from './about/about.component';


const appRoutes: Routes = [
    {
        path: 'about',
        component: AboutComponent
    },
    {
        path: 'archaeology',
        component: ArchaeologyComponent
    },
    {
        path: 'conservation',
        component: ConservationComponent
    },
    {
        path: 'education',
        component: EducationComponent
    },
    {
        path: 'epigraphy',
        component: EpigraphyComponent,
    },
    {
        path: 'epigraphy/search/:corpus',
        component: SearchComponent,
        canActivate: [CorpusGuard, LoggedOnGuard]
    },
    {
        path: 'epigraphy/manual/:identifier',
        component: ManualComponent
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
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    }
]

export const declarations: any[] = [
    AboutComponent,
    AppComponent,
    ArchaeologyComponent,
    BalloonDirective,
    BarChartComponent,
    // BaseFilterComponent,
    BooleanFilterComponent,
    ConservationComponent,
    CorpusSelectionComponent,
    DateFilterComponent,
    DialogComponent,
    DocumentViewComponent,
    DownloadComponent,
    DropdownComponent,
    EducationComponent,
    ErrorComponent,
    EpigraphyComponent,
    FilterManagerComponent,
    FreqtableComponent,
    HomeComponent,
    HighlightPipe,
    ImageViewComponent,
    ImageNavigationComponent,
    ManualComponent,
    ManualNavigationComponent,
    MenuComponent,
    MultipleChoiceFilterComponent,
    NotificationsComponent,
    QueryFiltersComponent,
    QueryTextPipe,
    PaginationComponent,
    PrivacyComponent,
    RangeFilterComponent,
    RegistrationComponent,
    RelatedWordsComponent,
    ResetPasswordComponent,
    RequestResetComponent,
    ScanPdfComponent,
    ScrollToDirective,
    SearchComponent,
    SearchHistoryComponent,
    SearchRelevanceComponent,
    SearchResultsComponent,
    SearchSortingComponent,
    LoginComponent,
    ScrollToDirective,
    ScanImageComponent,
    BarChartComponent,
    VisualizationComponent,
    WordcloudComponent,
    TimelineComponent,
    RelatedWordsComponent,
    DocumentViewComponent,
    SearchHistoryComponent,
    SelectFieldComponent,
    TermFrequencyComponent,
    TimelineComponent,
    VisualizationComponent,
    WordcloudComponent,
];

export const imports: any[] = [
    BrowserAnimationsModule,
    BrowserModule,
    CalendarModule,
    ChartModule,
    CheckboxModule,
    CommonModule,
    ConfirmDialogModule,
    DialogModule,
    DropdownModule,
    FormsModule,
    HttpModule,
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
    RouterModule.forRoot(appRoutes),
    SharedModule,
    SliderModule,
    TableModule,
    TabViewModule,
]

export const providers: any[] = [
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
    CookieService
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
