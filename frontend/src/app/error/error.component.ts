import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ia-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {
    @Input() public showError: ShowError;

    constructor() { }

    ngOnInit() {
    }

}

export type ShowError = {
    date: string,
    href: string,
    message: string
}
