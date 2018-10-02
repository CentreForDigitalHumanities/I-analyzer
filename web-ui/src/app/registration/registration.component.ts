import { Component, OnInit, OnDestroy } from '@angular/core';
//import { NgForm } from '@angular/forms';  

import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
//http://www.advancesharp.com/blog/1225/angular-5-form-validation-easiest-way
//https://angular.io/guide/forms



@Component({
  selector: 'ia-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit, OnDestroy {
  private returnUrl: string;
  public firstname: string;
  public lastname: string;
  public email: string;
  public password: string;
  public isLoading: boolean;
  public isWrong: boolean;
  private success:boolean;
  private error=false;
  private firstname_result;
  private lastname_result;
  private email_result;
  

  constructor(private userService: UserService, private activatedRoute: ActivatedRoute, private router: Router, private title: Title) {
    console.log(this);
    this.title.setTitle('I-Analyzer');
    UserService.loginActivated = true;

  }

  ngOnInit() {
    // get return url from route parameters or default to '/'
    //this.returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || '/';
  }
  ngOnDestroy(){  
    UserService.loginActivated = false;
  }

  //op scherm in template object tonen: {{object | json}}
  register(){
  this.userService.register(this.firstname, this.lastname, this.email, this.password ).then(result => {
          //als result leeg is, bv als 500 error in de api, foutmelding in html template tonen
          if (!result) {
            this.success=false;
            this.error=true;
                  }
          else {
              if(result.success) {
                  this.success=true;
                  this.firstname_result=result.firstname;
                  this.lastname_result=result.lastname;
                  this.email_result=result.email;

                }
                else{
                  this.error=true;
                }
          }

    });
  }

}
