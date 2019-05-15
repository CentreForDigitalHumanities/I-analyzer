import { Component, OnInit } from '@angular/core';
import { DialogService, UserService } from '../services/index';
import { Dialog } from 'primeng/primeng';

@Component({
  selector: 'ia-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss']
})
export class PrivacyComponent implements OnInit {

  constructor(private dialogService: DialogService) { 
    //fix for redirecting users who are not logged in, if false, the user is redirected to the login page
    UserService.loginActivated = true;

  }

  ngOnInit() {
      this.dialogService.getManualPage('privacy');
  }

}
