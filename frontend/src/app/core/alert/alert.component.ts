import { Component, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertConfig, AlertService } from '@services/alert.service';
import _ from 'lodash';
import { BehaviorSubject, filter, Subject, tap } from 'rxjs';

@Component({
    selector: 'ia-alert',
    standalone: false,
    templateUrl: './alert.component.html',
    styleUrl: './alert.component.scss',
})
export class AlertComponent {
    visible$ = new BehaviorSubject<boolean>(false);
    alertMessage$ = new BehaviorSubject<string | undefined>(undefined);

    constructor(
        private alertService: AlertService,
        private destroyRef: DestroyRef
    ) {
        this.alertService.alert$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter(_.negate(_.isUndefined))
            )
            .subscribe({
                next: (config: AlertConfig) => this.showAlert(config.message),
            });
    }

    showAlert(message: string): void {
        this.alertMessage$.next(message);
        this.visible$.next(true);
    }

    hideAlert(): void {
        this.visible$.next(false);
        this.alertMessage$.next(undefined);
    }
}
