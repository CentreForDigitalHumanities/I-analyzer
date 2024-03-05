import { Component } from '@angular/core';

import { environment } from '../../environments/environment';

@Component({
    selector: 'ia-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
    environment = environment;
    logos: {url: string; path: string; alt: string}[] = environment.logos;

    constructor() { }

}
