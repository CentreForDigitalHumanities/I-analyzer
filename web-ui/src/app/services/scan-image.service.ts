import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable()
export class ScanImageService {

  constructor(private apiService: ApiService) { }

  public get_scan_image(corpus_index: string, page: number | null, image_path: string):
    Promise<any> {
    return this.apiService.get_scan_image({ corpus_index, page, image_path }).then(
      result => {
        return new Uint8Array(result.file);
      }
    )
  }

}
