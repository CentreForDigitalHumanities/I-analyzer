import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'ia-request-reset',
  templateUrl: './request-reset.component.html',
  styleUrls: ['./request-reset.component.scss']
})
export class RequestResetComponent implements OnInit {
    public email: string;

    public isValidEmail: boolean = true;
    constructor() { }

    ngOnInit() {
    }

    requestReset(requestResetForm: NgForm) {
        let email: string = requestResetForm.value.email;
    }

}
