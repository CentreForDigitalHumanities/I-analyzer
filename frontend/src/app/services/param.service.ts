import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { bufferTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ParamService {
  /**
   * Provides a subject for query parameter changes
   * Buffers updates in the bufferedParams Observable, subscribed to by ParamDirective
   */

  public bufferedParams = new Observable<Params[]>();
  private currentParams =  new BehaviorSubject<Params>({});

  constructor() {
    this.bufferedParams = this.currentParams.pipe(bufferTime(500));
  }

  setParams(params: Params) {
    this.currentParams.next(params);
  }
}
