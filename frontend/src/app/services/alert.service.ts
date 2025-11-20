import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';

export interface AlertConfig {
    message: string;
};


@Injectable({
  providedIn: 'root'
})
export class AlertService {
    alert$ = new Subject<AlertConfig>();
  constructor() { }
}
