import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class ScanImageService {

  constructor(private http: HttpClient) { }

  // public get_scan_image(corpus_index: string, page: number | null, image_path: string):
  //   Promise<any> {
  //   return this.apiService.get_scan_image({ corpus_index, page, image_path }).then(
  //     result => {
  //       console.log(result)
  //       return new Uint8Array(result.file);
  //     }
  //   )
  // }

  // public get_scan_image(corpus_index: string, page: number | null, image_path: string) {
  //   let url = '/api/get_scan_image/' + corpus_index + '/' + page + '/' + image_path
  //   let output
  //   this.http.get(url, { responseType: 'arraybuffer' })
  //     .subscribe((file: ArrayBuffer) => {
  //       output = new Uint8Array(file);
  //     })
  //   return output

  public get_scan_image(corpus_index: string, page: number | null, image_path: string): Promise<any> {
    let url = '/api/get_scan_image/' + corpus_index + '/' + page + '/' + image_path
    return this.http.get(url, { responseType: 'arraybuffer' }).toPromise();
  }






}
