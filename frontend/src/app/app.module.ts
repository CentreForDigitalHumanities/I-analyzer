import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { APP_BASE_HREF, TitleCasePipe } from '@angular/common';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientXsrfModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ResourceHandler } from '@ngx-resource/core';
import { ResourceHandlerHttpClient, ResourceModule } from '@ngx-resource/handler-ngx-http';
import { CookieService } from 'ngx-cookie-service';

import {
    ApiService, ApiRetryService, DownloadService,
    ElasticSearchService, HighlightService, SearchService,
    UserService, QueryService } from './services/index';

import { AppComponent } from './app.component';
import { AboutComponent } from './about/about.component';
import { CorpusSelectionComponent } from './corpus-selection/corpus-selection.component';
import { HomeComponent } from './home/home.component';
import { SearchComponent, SearchResultsComponent, SearchSortingComponent } from './search/index';
import { ManualComponent } from './manual/manual.component';
import { ManualNavigationComponent } from './manual/manual-navigation.component';
import { MenuComponent } from './menu/menu.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { CorpusGuard } from './corpus.guard';
import { LoggedOnGuard } from './logged-on.guard';
import { LoginComponent } from './login/login.component';
import { SearchHistoryComponent, } from './history/search-history/index';
import { RegistrationComponent } from './login/registration/registration.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { DialogComponent } from './dialog/dialog.component';
import { ResetPasswordComponent } from './login/reset-password/reset-password.component';
import { RequestResetComponent } from './login/reset-password/request-reset.component';
import { PaginationComponent } from './search/pagination/pagination.component';
import { HighlightSelectorComponent } from './search/highlight-selector.component';
import { WordModelsComponent } from './word-models/word-models.component';
import { WordmodelsService } from './services/wordmodels.service';
import { FooterComponent } from './footer/footer.component';
import { DownloadHistoryComponent } from './history/download-history/download-history.component';
import { VerifyEmailComponent } from './login/verify-email/verify-email.component';
import { DocumentPageComponent } from './document-page/document-page.component';
import { CorpusSelectorComponent } from './corpus-selection/corpus-selector/corpus-selector.component';
import { CorpusFilterComponent } from './corpus-selection/corpus-filter/corpus-filter.component';
import { CorpusInfoComponent } from './corpus-info/corpus-info.component';
import { SharedModule } from './shared/shared.module';
import { VisualizationModule } from './visualization/visualization.module';
import { FilterModule } from './filter/filter.module';
import { CorpusModule } from './corpus-header/corpus.module';
import { DocumentModule } from './document/document.module';
import { WordModelsModule } from './word-models/word-models.module';
import { HistoryModule } from './history/history.module';
import { DownloadModule } from './download/download.module';


export const appRoutes: Routes = [
    {
        path: 'search/:corpus',
        component: SearchComponent,
        canActivate: [CorpusGuard, LoggedOnGuard],
    },
    {
        path: 'word-models/:corpus',
        component: WordModelsComponent,
        canActivate: [CorpusGuard, LoggedOnGuard],
    },
    {
        path: 'info/:corpus',
        component: CorpusInfoComponent,
        canActivate: [CorpusGuard, LoggedOnGuard]
    },
    {
        path: 'document/:corpus/:id',
        component: DocumentPageComponent,
        canActivate: [CorpusGuard, LoggedOnGuard],
    },
    {
        path: 'login',
        component: LoginComponent,
    },
    {
        path: 'login/:activated',
        component: LoginComponent,
    },
    {
        path: 'registration',
        component: RegistrationComponent,
    },
    {
        path: 'reset',
        component: RequestResetComponent,
    },
    {
        path: 'reset-password/:uid/:token',
        component: ResetPasswordComponent,
    },
    {
        path: 'privacy',
        component: PrivacyComponent,
    },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [LoggedOnGuard],
    },
    {
        path: 'manual/:identifier',
        component: ManualComponent,
    },
    {
        path: 'about',
        component: AboutComponent,
    },
    {
        path: 'search-history',
        component: SearchHistoryComponent,
    },
    {
        path: 'download-history',
        component: DownloadHistoryComponent,
    },
    {
        path: 'confirm-email/:key',
        component: VerifyEmailComponent,
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
    },
];

export const declarations: any[] = [
    AppComponent,
    AboutComponent,
    CorpusFilterComponent,
    CorpusSelectionComponent,
    CorpusSelectorComponent,
    DialogComponent,
    FooterComponent,
    HomeComponent,
    HighlightSelectorComponent,
    LoginComponent,
    ManualComponent,
    ManualNavigationComponent,
    MenuComponent,
    NotificationsComponent,
    PaginationComponent,
    PrivacyComponent,
    RegistrationComponent,
    ResetPasswordComponent,
    RequestResetComponent,
    SearchComponent,
    SearchResultsComponent,
    SearchSortingComponent,
    VerifyEmailComponent,
];


export const imports: any[] = [
    CorpusModule,
    DownloadModule,
    DialogModule,
    DocumentModule,
    FilterModule,
    HistoryModule,
    MenuModule,
    SharedModule,
    TableModule,
    VisualizationModule,
    WordModelsModule,
    RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' }),
];

export const providers: any[] = [
    ApiService,
    ApiRetryService,
    DownloadService,
    ElasticSearchService,
    HighlightService,
    QueryService,
    SearchService,
    UserService,
    CorpusGuard,
    LoggedOnGuard,
    TitleCasePipe,
    CookieService,
    WordmodelsService,
    { provide: APP_BASE_HREF, useValue: '/' },
];

@NgModule({
    declarations,
    imports,
    providers,
    bootstrap: [AppComponent],
})
export class AppModule {}

