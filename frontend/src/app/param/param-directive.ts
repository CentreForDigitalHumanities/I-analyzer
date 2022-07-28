import { Directive, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
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

    public setParams(route) {
        this.router.navigate(
            ['.'],
            { relativeTo: this.route,
            queryParams: route,
            queryParamsHandling: 'merge'
            },
        );
        // const url = this.router.serializeUrl(
        //     this.router.createUrlTree(
        //         ['.'],
        //         { relativeTo: this.route,
        //         queryParams: route,
        //         queryParamsHandling: 'merge'
        //         },
        //     )
        // );
        // if (this.router.url !== url) {
        //     this.router.navigateByUrl(url);
        // }
    }
}
