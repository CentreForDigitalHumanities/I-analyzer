import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { ApiService } from '../services/index';

@Component({
  selector: 'ia-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
    public submitted: boolean;
    public resetSucceeded: boolean;
    public isLoading: boolean;

    constructor(private apiService: ApiService) { }

    ngOnInit() {
    }

    reset(resetForm: NgForm) {
        this.submitted = true;
        let password = resetForm.value.password;
        this.isLoading = true;
        this.apiService.resetPassword({password: password}).then( result => {
            this.resetSucceeded = result.success;
            this.isLoading = false;
        }).catch( () => {
            // no current user found, log out user
            this.resetSucceeded = false;
            this.isLoading = false;
            this.apiService.logout();
        });
    }
    

}
