import { Component, Input, OnInit } from '@angular/core';
import { CorpusField, FoundDocument, Corpus } from '../models/index';
import { HttpClient } from '@angular/common/http';

import { ScanImageService } from '../services/scan-image.service';

@Component({
    selector: 'document-view',
    templateUrl: './document-view.component.html',
    styleUrls: ['./document-view.component.scss']
})
export class DocumentViewComponent implements OnInit {
    public get contentFields() {
        return this.fields.filter(field => !field.hidden && field.displayType == 'text_content');
    }

    public get propertyFields() {
        return this.fields.filter(field => !field.hidden && field.displayType != 'text_content');
    }

    // @Input()
    public imgSrc: Uint8Array;

    // public pdfSrc: any;

    @Input()
    public fields: CorpusField[] = [];

    @Input()
    public document: FoundDocument;

    @Input()
    public query: string;

    @Input()
    public corpus: Corpus;


    constructor(private scanImageService: ScanImageService, private http: HttpClient) { }

    ngOnInit() {
        let url = "Financials/AA_2007_00978/AA_2007_00978_00001.pdf"

        this.scanImageService.get_scan_image(this.corpus.index, null, url).then(
            results => this.imgSrc = results
        )
        console.log(this.imgSrc)
    }

    ngOnChange() {
        // this.pdfSrc = this.getPdfSrc(this.pdfURL)
    }
}
