import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { NgForm } from '@angular/Forms';
import { RegisteredUser} from '../models/user';

@Component({
  selector: 'ia-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})

export class RegistrationComponent implements OnInit, OnDestroy {
  private returnUrl: string;
  public isLoading: boolean;
  public isWrong: boolean;
  private success: boolean;
  private errormessage: string;
  private errortype: string;
  private registration_succeded = false;
  private isModalActive: boolean = false;
  private registeredUser;

  constructor(private userService: UserService, private activatedRoute: ActivatedRoute, private router: Router, private title: Title) {
    //fix for redirecting users who are not logged in, if false, the user is redirected to the login page
    UserService.loginActivated = true;
  }

  ngOnInit() {
   
  }
  ngOnDestroy() {
    UserService.loginActivated = false;
  }


  toggleModal() {
    this.isModalActive = !this.isModalActive;
  }

  register(signupForm: NgForm) {

    this.userService.register( signupForm.value.username, signupForm.value.email, signupForm.value.password).then(registeredUser => {
      this.registeredUser=registeredUser;

        if (registeredUser.success!=true ) {
          this.errormessage=registeredUser.errormessage;
          this.errortype=registeredUser.errortype;
        }
        else { 
          this.registration_succeded = true;
        }
    });
  }

}
