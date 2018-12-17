import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Injectable()
export class DialogService {
  public behavior = new BehaviorSubject<DialogEvent>({ status: 'hide' });
  public dialogEvent = this.behavior.asObservable();

  constructor() { }

}

export type DialogEvent =
  {
    status: 'loading'
  } | {
    status: 'show',
    identifier: string,
    title: string,
    html: SafeHtml
    footer: {
      routerLink: string[],
      buttonLabel: string
    }
  } | {
    status: 'hide'
  }
