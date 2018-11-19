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
  public username: string;
  public email: string;

  public isValidUsername: boolean = true;
  public isValidEmail: boolean = true;

  public isLoading: boolean;

  private registration_succeeded: boolean;
  private error = false;

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
    let username: string = signupForm.value.username;
    let email: string = signupForm.value.email;

    this.userService.register(username, email, signupForm.value.password).then(result => {
      if (result.success) { 
        this.registration_succeeded = true;
        this.username = username;
        this.email = email;
      }
      else {
        this.isValidUsername = result.is_valid_username;
        this.isValidEmail = result.is_valid_email;

        // if input is valid an error occured
        if (result.is_valid_email && result.is_valid_username) {
          this.error = true;
        }
      }
    })
  }
}
