import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { NgForm } from '@angular/Forms';

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
  private error = false;
  private firstname_result;
  private lastname_result;
  private email_result;
  private errormessage: string;
  private registration_succeded = false;
  private isModalActive: boolean = false;

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

    this.userService.register(signupForm.value.firstname, signupForm.value.lastname, signupForm.value.email, signupForm.value.password).then(result => {
      
      if (!result) { 
        this.success = false;
        this.error = true;
      }
      else {
        this.success = result.success;
        this.errormessage = result.errormessage;

        if (result.success) { 
          this.registration_succeded = true;
          this.firstname_result = result.firstname;
          this.lastname_result = result.lastname;
          this.email_result = result.email;
        }
      }
    });
  }


}
