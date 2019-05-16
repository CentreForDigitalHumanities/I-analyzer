import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { ApiService } from '../services/index';

@Component({
  selector: 'ia-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
    public resetSucceeded: boolean;

    public isModalActive: boolean = false;

    constructor(private apiService: ApiService) { }

    ngOnInit() {
    }

    reset(resetForm: NgForm) {
        let password = resetForm.value.password;
        this.apiService.resetPassword(password).then( result => {
            this.resetSucceeded = result.success;
        });
    }
    

}
