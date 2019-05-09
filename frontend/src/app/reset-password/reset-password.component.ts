import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'ia-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

    public isLoading: boolean;
    public reset_succeeded: boolean;
    public error = false;

    public isModalActive: boolean = false;

    constructor() { }

    ngOnInit() {
    }

    reset(resetForm: NgForm) {

    }
    

}
