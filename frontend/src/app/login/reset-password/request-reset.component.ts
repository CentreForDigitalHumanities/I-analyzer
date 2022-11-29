import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../services/api.service';

@Component({
  selector: 'ia-request-reset',
  templateUrl: './request-reset.component.html',
  styleUrls: ['./request-reset.component.scss']
})
export class RequestResetComponent implements OnInit {
    public email: string;
    public success: boolean;
    public showMessage: boolean;
    public message: string;

    constructor(private apiService: ApiService, private router: Router) {
    }

    ngOnInit() {
    }

    requestReset(requestResetForm: NgForm) {
        let email: string = requestResetForm.value.email;
        this.apiService.requestReset({email: email}).then( response => {
            this.success = response.success;
            this.message = response.message;
            this.showMessage = true;
        });
    }

    disableNotification() {
        this.showMessage = false;
    }

}
