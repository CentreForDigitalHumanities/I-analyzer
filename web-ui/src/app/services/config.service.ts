import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

@Injectable()
export class ConfigService {
    private config: Promise<Config>;

    constructor(private http: Http) { }

    public get(): Promise<Config> {
        if (!this.config) {
            this.config = new Promise<Config>((resolve, reject) =>
                this.http.get('/assets/config.json')
                    .subscribe(response => resolve(response.json() as Config)));
        }
        return this.config;
    }
}

interface Config {
    apiUrl: string;
    adminUrl: string;
}
