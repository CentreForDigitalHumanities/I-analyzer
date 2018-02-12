import { Injectable } from "@angular/core";

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class ManualService {
    private behavior = new BehaviorSubject<PageManualEvent>({ show: false });
    public pageEvent = this.behavior.asObservable();

    public closePage() {
        this.behavior.next({ show: false });
    }

    public showPage(identifier: string) {
        // TODO: in a multilingual application this would need to be modified
        this.behavior.next({
            path: `assets/manual/nl-NL/${identifier}.md`,
            show: true
        });
    }
}

type PageManualEvent =
    {
        path: string,
        show: true
    } | {
        show: false
    }
