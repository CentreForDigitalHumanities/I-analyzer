import { Component, OnInit } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { DialogService, UserService } from '../services/index';

@Component({
  selector: 'ia-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss']
})
export class PrivacyComponent implements OnInit {
    public title: string | undefined;
    public manualHtml: SafeHtml | undefined;
    constructor(private dialogService: DialogService) { 
    //fix for redirecting users who are not logged in, if false, the user is redirected to the login page
        UserService.loginActivated = true;
    }

  ngOnInit() {
    this.dialogService.getManualPage('privacy').then( page => {
        this.manualHtml = page.html;
        this.title = page.title;
    });
  }

}
