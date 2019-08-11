import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { ApiService, UserService } from '../services/index';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'ia-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
    public submitted: boolean;
    public resetSucceeded: boolean;
    public isLoading: boolean;
    public message: string;

    private token: string;

    constructor(private apiService: ApiService, private activatedRoute: ActivatedRoute, private router: Router, private userService: UserService) { }

    ngOnInit() {
        this.activatedRoute.params.subscribe( params => {
            this.token = params['token'];
        })
    }

    reset(resetForm: NgForm) {
        this.submitted = true;
        let password = resetForm.value.password;
        this.isLoading = true;
        this.apiService.resetPassword({password: password, token: this.token}).then( result => {
            this.resetSucceeded = result.success;
            this.isLoading = false;
            if (this.resetSucceeded === false) {
                this.message = result.message;
                setTimeout(() => this.userService.showLogin(), 3000);
            }
            else {
                this.userService.login(result.username, password).then( () => {
                    setTimeout(() => this.router.navigate(['/home']), 1500);
                })
            }
        });
    }
    

}
