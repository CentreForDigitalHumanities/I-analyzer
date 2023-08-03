import { Injectable } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { bufferTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ParamService {

  private currentParams =  new BehaviorSubject<Params>({});
  private buffer: Subscription;

  constructor(private router: Router) {
    this.buffer = this.currentParams.pipe(bufferTime(100)).subscribe( params => {
      if (params.length) {
        const newParams = Object.assign({}, ...params.map(f => f));
        console.log(newParams);
        this.router.navigate(
          [this.router.url],
          {
            queryParams: newParams,
            queryParamsHandling: 'merge',
          }
        );
      }
    });
  }

  setParams(params: Params) {
    this.currentParams.next(params);
  }
}
