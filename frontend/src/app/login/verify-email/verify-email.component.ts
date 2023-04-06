import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'ia-verify-email',
    templateUrl: './verify-email.component.html',
    styleUrls: ['./verify-email.component.scss'],
})
export class VerifyEmailComponent implements OnInit {
    public key: string;
    public success: boolean;
    public userDetails$: Observable<{ username: string; email: string }>;
    public errors$ = new Subject<HttpErrorResponse>();

    constructor(
        private activatedRoute: ActivatedRoute,
        private authService: AuthService
    ) {
        this.activatedRoute.paramMap.subscribe(
            (params) => (this.key = params.get('key'))
        );
    }

    ngOnInit(): void {
        this.userDetails$ = this.authService.keyInfo(this.key).pipe(
            catchError((err) => {
                this.errors$.next(err);
                return throwError(err);
            })
        );
    }

    confirm() {
        this.authService.verify(this.key).subscribe(
            () => this.handleSuccess(),
            (errorResponse) => this.errors$.next(errorResponse)
        );
    }

    handleSuccess() {
        this.success = true;
        setTimeout(() => this.authService.showLogin(), 3000);
    }
}
