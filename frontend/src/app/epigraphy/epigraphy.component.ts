import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'ia-epigraphy',
  templateUrl: './epigraphy.component.html',
  styleUrls: ['./epigraphy.component.scss']
})
export class EpigraphyComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

}
