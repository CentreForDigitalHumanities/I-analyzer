import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import * as _ from 'lodash';

@Component({
    selector: 'ia-request-reset',
    templateUrl: './request-reset.component.html',
    styleUrls: ['./request-reset.component.scss'],
})
export class RequestResetComponent implements OnInit {
    public email: string;
    public success: boolean;
    public showMessage: boolean;
    public message: string;

    constructor(private authService: AuthService, private router: Router) {}

    ngOnInit() {}

    requestReset(requestResetForm: NgForm) {
        const email: string = requestResetForm.value.email;
        this.authService.requestResetPassword(email).subscribe(
            (res) => this.handleSuccess(res),
            (err) => this.handleError(err)
        );
    }

    disableNotification() {
        this.showMessage = false;
    }

    handleSuccess(response) {
        this.success = true;
        this.message = response.detail;
        this.showMessage = true;
    }

    handleError(response: HttpErrorResponse) {
        this.success = false;
        this.message = _.join(_.values(response.error), ',');
        this.showMessage = true;
    }
}
