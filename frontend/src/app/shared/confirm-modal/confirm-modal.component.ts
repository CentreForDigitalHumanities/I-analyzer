import { Component, Input, OnDestroy, Output } from '@angular/core';
import { BehaviorSubject, of, Subject } from 'rxjs';

@Component({
    selector: 'ia-confirm-modal',
    standalone: false,
    templateUrl: './confirm-modal.component.html',
    styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent implements OnDestroy {
    @Input({required: true}) actionText: string;
    @Input() icon: any;
    @Output() result = new Subject<any>();

    confirmAction$ = new BehaviorSubject<any>(undefined);
    loading$ = new BehaviorSubject<boolean>(false);

    @Input() handleAsync = (...args: any) => of(args);

    ngOnDestroy(): void {
        this.confirmAction$.complete();
        this.loading$.complete();
        this.result.complete();
    }

    open(...args: any) {
        this.confirmAction$.next(args);
    }

    confirm(...args: any) {
        this.confirmAction$.next(undefined);

        this.handleAsync(args).subscribe(res =>
            this.result.next(res)
        );
    }

    cancel() {
        this.confirmAction$.next(undefined);
    }
}
