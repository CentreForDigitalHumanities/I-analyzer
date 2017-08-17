import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { ApiService, ConfigService, CorpusService, SearchService, UserService } from './services/index';

import { AppComponent } from './app.component';
import { CorpusListComponent } from './corpus-list/corpus-list.component';
import { HomeComponent } from './home/home.component';
import { SearchComponent, SearchFilterComponent, SearchSampleComponent } from './search/index';
import { MenuComponent } from './menu/menu.component';
import { LoggedOnGuard } from './logged-on.guard';
import { LoginComponent } from './login/login.component';

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
    }
]
@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        CorpusListComponent,
        SearchComponent,
        SearchFilterComponent,
        SearchSampleComponent,
        MenuComponent,
        LoginComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forRoot(appRoutes),
        HttpModule,
        BrowserModule
    ],
    providers: [ApiService, CorpusService, ConfigService, SearchService, UserService, LoggedOnGuard],
    bootstrap: [AppComponent]
})
export class AppModule { }
