import { Directive, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';

@Directive()
export abstract class ParamDirective implements OnDestroy, OnInit {

    public queryParamMap: Subscription;

    constructor(
        public route: ActivatedRoute,
        private router: Router
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

    public setParams(params: Params, guardParams=false) {
        if (guardParams) {
            this.guardParams(params);
        }
        this.router.navigate(
            ['.'],
            { relativeTo: this.route,
            queryParams: params,
            queryParamsHandling: 'merge'
            },
        );
    }

    /**
     * prevent overwriting existing params with default values
     * used for initialization
    **/
    private guardParams(newParams: Params) {
        const currentParams = this.route.snapshot.queryParamMap.keys;
        // return only new parameters that are not in the current parameters
        currentParams.forEach(
            paramName => delete newParams[paramName]
        );
    }
}
