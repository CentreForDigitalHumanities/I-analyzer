import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { ApiService, ConfigService, CorpusService } from './services/index';

import { AppComponent } from './app.component';
import { CorpusListComponent } from './corpus-list/corpus-list.component';
import { HomeComponent } from './home/home.component';

const appRoutes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    pathMatch: 'full'
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
    CorpusListComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forRoot(appRoutes),
    HttpModule,
    BrowserModule
  ],
  providers: [ApiService, CorpusService, ConfigService],
  bootstrap: [AppComponent]
})
export class AppModule { }
