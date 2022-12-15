import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ia-highlight-selector',
  templateUrl: './highlight-selector.component.html',
  styleUrls: ['./highlight-selector.component.scss']
})
export class HighlightSelectorComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  @Input()
  public highlight: number;

  @Output()
  public onChange = new EventEmitter<number>();

  updateHighlightSize(event) {
    this.onChange.next(event.target.value);
  }

}
