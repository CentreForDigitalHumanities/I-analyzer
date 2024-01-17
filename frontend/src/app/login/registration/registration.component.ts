import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import * as _ from 'lodash';
import { userIcons } from '../../shared/icons';

interface RegisterErrors {
    non_field_errors?: string[];
    email?: string[];
    username?: string[];
    password1?: string[];
    password2?: string[];
}

type RegisterErrorResponse = Omit<HttpErrorResponse, 'error'> & {
    error: RegisterErrors;
};

@Component({
    selector: 'ia-registration',
    templateUrl: './registration.component.html',
    styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnInit, OnDestroy {
    public username: string;
    public email: string;

    public isLoading: boolean;

    public registrationSucceeded: boolean;
    public serverError = false;

    public isModalActive = false;

    public errors: RegisterErrors;

    userIcons = userIcons;

    private destroy$ = new Subject<boolean>();

    constructor(private authService: AuthService) {}

    ngOnInit() {}
    ngOnDestroy() {
        this.destroy$.next(true);
    }

    toggleModal() {
        this.isModalActive = !this.isModalActive;
    }

    register(signupForm: NgForm) {
        const username: string = signupForm.value.username;
        const email: string = signupForm.value.email;
        this.isLoading = true;

        this.authService
            .register(
                username,
                email,
                signupForm.value.password,
                signupForm.value.passwordconfirm
            )
            .pipe(takeUntil(this.destroy$))
            .subscribe(
                () => this.handleSuccess(username, email),
                (error) => this.handleErrors(error)
            );
    }

    handleSuccess(username, email) {
        this.registrationSucceeded = true;
        this.username = username;
        this.email = email;
        this.isLoading = false;
    }

    handleErrors(errorResponse: RegisterErrorResponse) {
        this.isLoading = false;
        if (errorResponse.status === 400) {
            this.errors = errorResponse.error;
        } else {
            this.serverError = true;
        }
    }
}

