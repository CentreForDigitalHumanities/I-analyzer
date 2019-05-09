import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'ia-request-reset',
  templateUrl: './request-reset.component.html',
  styleUrls: ['./request-reset.component.scss']
})
export class RequestResetComponent implements OnInit {
    public email: string;

    public isValidEmail: boolean = true;
    constructor(private apiService: ApiService) {
    }

    ngOnInit() {
    }

    requestReset(requestResetForm: NgForm) {
        let email: string = requestResetForm.value.email;
        this.apiService.requestReset({email: email}).then( response => {
            console.log(response);
        });
    }

}
