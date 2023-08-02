import { Directive, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { bufferTime, shareReplay } from 'rxjs/operators';
import { ParamService } from '../services';

@Directive()
export abstract class ParamDirective implements OnDestroy, OnInit {

    public queryParamMap: Subscription;

    private nextParams = new Subject<Params>();

    constructor(
        public route: ActivatedRoute,
        private router: Router,
        private paramService: ParamService
    ) {}

    async ngOnInit(): Promise<void> {
        await this.initialize();
        this.queryParamMap = this.route.queryParamMap.subscribe( params => {
            this.setStateFromParams(params);
        });
    }

    ngOnDestroy(): void {
        this.queryParamMap.unsubscribe();
        this.teardown();
    }

    abstract initialize();

    abstract teardown();

    abstract setStateFromParams(params: Params);

    public setParams(params: Params) {
        this.paramService.setParams(params);
    }
}
