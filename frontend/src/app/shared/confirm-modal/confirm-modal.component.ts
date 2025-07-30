import { Component, Input, OnDestroy, Output } from '@angular/core';
import { showLoading } from '@utils/utils';
import { BehaviorSubject, lastValueFrom, of, Subject } from 'rxjs';

@Component({
    selector: 'ia-confirm-modal',
    standalone: false,
    templateUrl: './confirm-modal.component.html',
    styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent implements OnDestroy {
    @Input({required: true}) actionText: string;
    @Input() icon: any;
    @Input() actionButtonClass: string;
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

    confirm(args: any) {
        showLoading(
            this.loading$,
            lastValueFrom(this.handleAsync(...args)),
        ).then(res => {
            this.confirmAction$.next(undefined);
            this.result.next(res)
        });
    }

    cancel() {
        this.confirmAction$.next(undefined);
    }
}
