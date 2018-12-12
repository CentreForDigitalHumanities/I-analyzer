import { Component, OnChanges, OnInit, Input, ViewChild, SimpleChanges } from '@angular/core';
import { Corpus, FoundDocument } from '../models/index';
import { HttpClient } from '@angular/common/http';
import { ScanImageService } from '../services';
import { PdfViewerComponent } from 'ng2-pdf-viewer';

@Component({
    selector: 'ia-pdf-view',
    templateUrl: './pdf-view.component.html',
    styleUrls: ['./pdf-view.component.scss']
})
export class PdfViewComponent implements OnChanges, OnInit {
    @ViewChild(PdfViewerComponent)

    private pdfComponent: PdfViewerComponent;

    @Input()
    public corpus: Corpus;

    @Input()
    public document: FoundDocument;

    @Input()
    public query: string;

    public pdfSrc: ArrayBuffer;

    public page: number = 3;

    public totalPages: number;

    public isLoaded: boolean = false;

    public pageArray: number[];

    get_pdf() {
        this.scanImageService.get_scan_image(
            this.corpus.index,
            this.document.fieldValues.page_number - 1, //0-indexed pdf
            this.document.fieldValues.image_path).then(
                results => {
                    this.pdfSrc = results;
                })
    }

    afterLoadComplete(pdfData: any) {
        this.totalPages = pdfData.numPages;
        this.pageArray = Array.from(Array(pdfData.numPages)).map((x, i) => i + 1);
        this.isLoaded = true;
    }

    nextPage() {
        this.page++;
    }

    prevPage() {
        this.page--;
    }

    setPage(pageNr: number) {
        this.page = pageNr;
    }

    public textLayerRendered(e: CustomEvent, querytext: string) {
        console.log(this.page)
        this.pdfComponent.pdfFindController.executeCommand('find', {
            caseSensitive: false, findPrevious: true, highlightAll: true, phraseSearch: true,
            query: querytext

        });
        console.log(this.page)
    }

    constructor(private scanImageService: ScanImageService, private http: HttpClient) { }

    ngOnInit() {
        // this.get_pdf();
    }

    ngOnChanges(changes: SimpleChanges) {
        this.get_pdf();
        // console.log('onChange')
        // console.log(changes)
        // if (changes.document.previousValue) {
        //     console.log('docChange')
        //     this.isLoaded = false;
        //     this.page = 3;
        //     this.get_pdf();
    }
}

}
