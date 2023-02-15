import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'ia-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})

export class RegistrationComponent implements OnInit, OnDestroy {
  public username: string;
  public email: string;

  public isValidUsername = true;
  public isValidEmail = true;

  public isLoading: boolean;

  public registration_succeeded: boolean;
  public error = false;

  public isModalActive = false;

  constructor(private userService: UserService) {
    //fix for redirecting users who are not logged in, if false, the user is redirected to the login page
    // UserService.loginActivated = true;
  }

  ngOnInit() {

  }
  ngOnDestroy() {
    // UserService.loginActivated = false;
  }


  toggleModal() {
    this.isModalActive = !this.isModalActive;
  }

  register(signupForm: NgForm) {
    const username: string = signupForm.value.username;
    const email: string = signupForm.value.email;

    this.userService.register(username, email, signupForm.value.password).then(result => {
      if (result.success) {
        this.registration_succeeded = true;
        this.username = username;
        this.email = email;
      } else {
        this.isValidUsername = result.is_valid_username;
        this.isValidEmail = result.is_valid_email;

        // if input is valid an error occured
        if (result.is_valid_email && result.is_valid_username) {
          this.error = true;
        }
      }
    });
  }
}
