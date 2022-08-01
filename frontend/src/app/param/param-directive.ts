import { Directive, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Directive()
export abstract class ParamDirective implements OnDestroy, OnInit {

    protected queryParamMap: Subscription;

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

    abstract setStateFromParams(params: ParamMap);

    public setParams(params: Params) {
        this.router.navigate(
            ['.'],
            { relativeTo: this.route,
            queryParams: params,
            queryParamsHandling: 'merge'
            },
        );
    }
}
