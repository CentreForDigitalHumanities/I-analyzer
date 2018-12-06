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

    // public getPdfSrc(url) {
    //     this.http.get(url, { responseType: 'arraybuffer' })
    //         .subscribe((file: ArrayBuffer) => {
    //             this.pdfSrc = new Uint8Array(file);
    //         })
    // }

    public imgSrc: any;

    // public pdfSrc: any;

    @Input()
    public fields: CorpusField[] = [];

    @Input()
    public document: FoundDocument;

    @Input()
    public query: string;

    @Input()
    public corpus: Corpus;

    public pdfURL: string;

    constructor(private scanImageService: ScanImageService) { }

    ngOnInit() {
        // console.log(this.corpus)
        // this.pdfURL = "/api/get_source_image/" + this.corpus + "/Financials/AA_2007_00978/AA_2007_00978_00001.pdf"
        // this.pdfSrc = this.getPdfSrc(this.pdfURL)
        // this.pdfSrc = Promise.resolve(pdfservice.getpdf(arg1, arg2))

        this.imgSrc = Promise.resolve(this.scanImageService.get_scan_image('times', 0, 'C:/paadje'))


    }

    ngOnChange() {
        // this.pdfSrc = this.getPdfSrc(this.pdfURL)
    }
}
