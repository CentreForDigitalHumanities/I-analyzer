import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { LoginComponent } from './login.component';
import { PrivacyComponent } from '../privacy/privacy.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { RequestResetComponent } from './reset-password/request-reset.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { RegistrationComponent } from './registration/registration.component';




@NgModule({
    declarations: [
        LoginComponent,
        PrivacyComponent,
        RegistrationComponent,
        RequestResetComponent,
        ResetPasswordComponent,
        VerifyEmailComponent,
    ],
    imports: [
        SharedModule
    ],
    exports: [
        LoginComponent,
        PrivacyComponent,
        RegistrationComponent,
        RequestResetComponent,
        ResetPasswordComponent,
        VerifyEmailComponent,
    ]
})
export class LoginModule { }
