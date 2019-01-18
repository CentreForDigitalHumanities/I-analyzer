import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ApiService } from './api.service'

@Injectable()
export class PdfService {

  constructor(private http: HttpClient, private apiService: ApiService) { }

  public get_source_pdf(corpus_index: string, image_path: string, page: number): Promise<any> {
    return this.apiService.sourcePdf({ corpus_index, image_path, page })
  }

  public download_pdf(corpus_index: string, filepath: string): Promise<any> {
    return this.apiService.downloadPdf({ corpus_index, filepath })
  }

}
