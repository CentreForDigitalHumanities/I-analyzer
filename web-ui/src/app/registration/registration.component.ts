import { Component, OnInit, OnDestroy } from '@angular/core'; 
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import {NgForm} from '@angular/Forms';


//https://code.tutsplus.com/tutorials/introduction-to-forms-in-angular-4-template-driven-forms--cms-29766

@Component({
  selector: 'ia-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})


export class RegistrationComponent implements OnInit, OnDestroy {
  private returnUrl: string;
  public isLoading: boolean;
  public isWrong: boolean;
  private success:boolean;
  private error=false;
  private firstname_result;
  private lastname_result;
  private email_result;
  private errormessage: string;
  private registration_succeded=false;
  private isModalActive: boolean=false;

  constructor(private userService: UserService, private activatedRoute: ActivatedRoute, private router: Router, private title: Title ) {
    this.title.setTitle('I-Analyzer');
    UserService.loginActivated = true;

  }

  ngOnInit() {
   
  }
  ngOnDestroy(){  
     UserService.loginActivated = false;
  }

  //op scherm in template object tonen: {{object | json}}

  toggleModal() {
    this.isModalActive = !this.isModalActive;
  }


  register(signupForm:NgForm){

    this.userService.register(signupForm.value.firstname, signupForm.value.lastname, signupForm.value.email, signupForm.value.password).then(result => {
              
      if (!result) { //dit gebeurt als er of nog geen request is geweest, of er is geen respons, dat is onduidelijk. hier ook variabele zetten dat hij al gestuurd is
        this.success=false;
        this.error=true;// het rode errorscherm tonen, want er is iets misgegaan met request.
        console.log(this.error);
                      }
      else {
        this.success=result.success;
        this.errormessage=result.errormessage;
        console.log(result.errormessage);

          if(result.success) { //als er nu wel een result is, maar result.success is false, blijft registration_succeded =false, en wordt aanmeldscherm getoond
             this.registration_succeded=true;
              this.firstname_result=result.firstname;
              this.lastname_result=result.lastname;
              this.email_result=result.email;
                    }
            else{
                      //this.error=true;
                      //console.log(result.errormessage);
                    }
              }
        });
      }


}
