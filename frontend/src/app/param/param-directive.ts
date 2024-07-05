import { Directive, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';

import { ParamService } from '../services';

@Directive()
export abstract class ParamDirective implements OnDestroy, OnInit {

    public queryParamMap: Subscription;
    private paramSubscription: Subscription;
    abstract nullableParameters: string[];

    constructor(
        public route: ActivatedRoute,
        private router: Router,
        private paramService: ParamService
    ) {
        this.paramSubscription = this.paramService.bufferedParams.subscribe( params => {
            if (params.length) {
                const newParams = Object.assign({}, ...params.map(f => f));
                this.router.navigate(
                    ['.'],
                    {
                      queryParams: newParams,
                      queryParamsHandling: 'merge',
                      relativeTo: this.route
                    }
                );
            }
        });
    }

    async ngOnInit(): Promise<void> {
        await this.initialize();
        this.queryParamMap = this.route.queryParamMap.subscribe( params => {
            this.setStateFromParams(params);
        });
    }

    ngOnDestroy(): void {
        this.queryParamMap.unsubscribe();
        this.paramSubscription.unsubscribe();
        const toNull = Object.assign({}, ...this.nullableParameters.map(f => ({[f]: null})));
        this.setParams(
            toNull
        );
        this.teardown();
    }

    public setParams(params: Params) {
        this.paramService.setParams(params);
    }

    abstract initialize();

    abstract teardown();

    abstract setStateFromParams(params: ParamMap);
}
