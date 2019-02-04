import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';

@Component({
  selector: 'ia-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss']
})
export class PrivacyComponent implements OnInit {

  constructor() { 
    //fix for redirecting users who are not logged in, if false, the user is redirected to the login page
    UserService.loginActivated = true;

  }

  ngOnInit() {
  }

}
