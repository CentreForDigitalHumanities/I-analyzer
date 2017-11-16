import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ApiService } from './api.service';

@Injectable()
export class LogService {

    constructor(private apiService: ApiService) {
    }

    public error(msg: string): void {
        this.apiService.log({ msg, type: 'error' });
    }

    public info(msg: string): void {
        this.apiService.log({ msg, type: 'info' });
    }
}
