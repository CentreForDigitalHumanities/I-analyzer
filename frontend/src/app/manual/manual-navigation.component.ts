
import { combineLatest, BehaviorSubject, Subject } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { DialogService, ManualPageMetaData, HighlightService } from '../services';

@Component({
    selector: 'ia-manual-navigation',
    templateUrl: './manual-navigation.component.html',
    styleUrls: ['./manual-navigation.component.scss']
})
export class ManualNavigationComponent implements OnInit {
    private manifest = new Subject<ManualPageMetaData[]>();
    private filterTextSubject = new BehaviorSubject<string>('');
    public filtered = combineLatest(
        this.manifest,
        this.filterTextSubject,
        (manifest, filterText) => Array.from(this.filter(manifest, filterText)));

    public set filterText(value: string) {
        this.filterTextSubject.next(value);
    }

    public get filterText() {
        return this.filterTextSubject.value;
    }

    /**
     * The text to use for highlighting the search results. This differs from the filter text, because additional wildcards are added
     */
    public highlightText: string | undefined;

    constructor(private highlightService: HighlightService, private dialogService: DialogService) {
    }

    async ngOnInit() {
        this.manifest.next(await this.dialogService.getManifest());
    }

    private *filter(pages: ManualPageMetaData[], filter: string): Iterable<ManualPageMetaData> {
        if (filter.trim().length == 0) {
            filter = '*';
        }

        // make all terms a wildcard search
        const parts = filter.split(' ').filter(part => part.length).map(part => part.slice(-1) != '*' ? `*${part}*` : part);
        this.highlightText = filter = parts.join(' ');

        // this is a massively over-engineered filter, but as we have this function already anyway: why not?
        // and at least it will be consistent with the highlights which also uses this expression
        const expressions = parts.map(part => this.highlightService.getQueryExpression(part));

        for (const page of pages) {
            let isMatch = true;
            for (const expression of expressions) {
                expression.lastIndex = 0;
                if (!expression.test(page.title)) {
                    isMatch = false;
                    break;
                }
            }

            if (isMatch) {
                yield page;
            }
        }
    }
}
