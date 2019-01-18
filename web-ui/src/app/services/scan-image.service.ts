import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ApiService } from './api.service'

@Injectable()
export class ScanImageService {

  constructor(private http: HttpClient, private apiService: ApiService) { }

  public get_scan_image(corpus_index: string, page: number | null, image_path: string): Promise<any> {
    let url = '/api/get_scan_image/' + corpus_index + '/' + page + '/' + image_path
    return this.http.get(url, { responseType: 'arraybuffer' }).toPromise();
  }

  public get_source_pdf(corpus_index: string, image_path: string, page: number): Promise<any> {
    return this.apiService.sourcePdf({ corpus_index, image_path, page })
  }

  public download_pdf(corpus_index: string, filepath: string): Promise<any> {
    return this.apiService.downloadPdf({ corpus_index, filepath })
  }

}
