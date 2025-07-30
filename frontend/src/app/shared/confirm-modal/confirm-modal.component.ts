import { Component, ElementRef, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { showLoading } from '@utils/utils';
import { BehaviorSubject, lastValueFrom, of, Subject, timer } from 'rxjs';


/**
 * Component to create a confirmation modal
 *
 * Input parameters:
 * - `actionText` (required): short label for the action; used as the header and the
 *   text for the confirm button.
 * - `icon`: icon to show in the confirm button
 * - `actionButtonClass`: additional CSS class to add to the confirm button, e.g.
 *   `is-danger` for destructive actions. Default is `is-primary`.
 * - `handleAsync`: can be used to delay closing the modal after confirming while the
 *   action is being processed. This is a function that takes the action parameters
 *   as input, and returns an observable. The modal will show a loading spinner while
 *   this is running.
 *
 * Output:
 * - `result`: If you did not include a `handleAsync` function, this emits when the user
 *   confirms the action, with the action parameters as payload. If you included a
 *   `handleAsync` function, this emits when the action is handled, with the output as
 *   payload.
 *
 * Use projected content to provide the text of the modal.
 *
 * Call `open()` to open the modal. You can provide any arguments that are relevant in
 * context. You can use `args` to access arguments. You can do this with a `ViewChild`,
 * but typically the easiest way is with a template variable (see example below).
 *
 * Example usage:
 *
 * ```
 * <button (click)="confirm.open('something')">Do a thing</button>
 *
 * <ia-confirm-modal #confirm actionText="Do the thing">
 *    <p>
 *         Are you sure you want to do {{confirm.args[0]}}?
 *    </p>
 * </ia-confirm-modal>
 * ```
 *
 */
@Component({
    selector: 'ia-confirm-modal',
    standalone: false,
    templateUrl: './confirm-modal.component.html',
    styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent implements OnDestroy {
    @Input({required: true}) actionText: string;
    @Input() icon: any;
    @Input() actionButtonClass: string = 'is-primary';
    @Output() result = new Subject<any>();

    @ViewChild('modalTitle') title: ElementRef<HTMLElement>;

    confirmAction$ = new BehaviorSubject<any>(undefined);
    loading$ = new BehaviorSubject<boolean>(false);

    args: any; // for briefer notation, this provides the action arguments

    constructor() {
        this.confirmAction$.subscribe(args => this.args = args);
    }

    @Input() handleAsync = (...args: any) => of(args);

    ngOnDestroy(): void {
        this.confirmAction$.complete();
        this.loading$.complete();
        this.result.complete();
    }

    open(...args: any) {
        this.confirmAction$.next(args);
        setTimeout(() => this.title.nativeElement.focus());
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
